// ─────────────────────────────────────────────────────────────────────────
// Google Sheets data store.
//
// Each form submission writes a row to a shared Google Sheet so we have
// a persistent, beautified, side-by-side view of every lead. Three tabs:
//
//   • Brands    - brand intake. Split into two sections side-by-side:
//                   left = brands wanting Embedded talent
//                   right = brands wanting Project delivery
//                   "Both" service writes to both sections so neither
//                   pipeline view is missing a lead.
//   • Creatives - embedded + projects pathway applications, same
//                   side-by-side split (Embedded left, Projects right).
//                   The old "creatives" form from the 3D splash overlay
//                   has the same field shape as General, so it routes
//                   to the General tab instead.
//   • General   - the standalone /contact form + the old creatives-page
//                   contact form.
//
// Each tab is auto-created on first use and styled the moment it's made:
// dark-ink section banners with gold-on-dark text, cream-coloured bold
// column headers, banded rows, frozen top two rows. The data area starts
// at row 3.
//
// Auth uses a Google Cloud service account whose credentials live in two
// env vars (GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY). The Sheet itself
// must be shared with the service account's email as an Editor.
// ─────────────────────────────────────────────────────────────────────────

import { google } from 'googleapis';

export type SheetsFormKind = 'brand' | 'embedded' | 'projects' | 'creatives' | 'general';

type TabName = 'Brands' | 'Creatives' | 'General';

type SectionDef = {
  name: string;             // shown on the dark banner row
  startCol: number;         // 0-indexed inclusive
  endCol: number;           // 0-indexed exclusive
  headers: readonly string[];
};

type TabLayout = {
  sections: SectionDef[];
  separatorCols: number[];  // 0-indexed columns left blank to look like a gutter
};

// Layout per tab. Each section is a horizontal block of columns; a thin
// blank gutter column between sections gives the side-by-side "two boxes"
// reading without us needing to draw a vertical rule.
const TAB_LAYOUTS: Record<TabName, TabLayout> = {
  Brands: {
    sections: [
      {
        name: 'EMBEDDED TALENT',
        startCol: 0,
        endCol: 7,
        headers: ['Date', 'Name', 'Email', 'Organisation', 'Roles', 'Timeline', 'Message'],
      },
      {
        name: 'PROJECT DELIVERY',
        startCol: 8,
        endCol: 15,
        headers: ['Date', 'Name', 'Email', 'Organisation', 'Roles', 'Timeline', 'Message'],
      },
    ],
    separatorCols: [7],
  },
  Creatives: {
    sections: [
      {
        name: 'EMBEDDED PATHWAY',
        startCol: 0,
        endCol: 7,
        headers: ['Date', 'Name', 'Email', 'Portfolio', 'Craft', 'Availability', 'About'],
      },
      {
        name: 'PROJECT-BASED PATHWAY',
        startCol: 8,
        endCol: 17,
        headers: ['Date', 'Name', 'Email', 'Portfolio', 'Day rate', 'Disciplines', 'Capacity', 'Project types', 'About'],
      },
    ],
    separatorCols: [7],
  },
  General: {
    sections: [
      {
        name: 'GENERAL CONTACT',
        startCol: 0,
        endCol: 5,
        headers: ['Date', 'Name', 'Email', 'I am a', 'Message'],
      },
    ],
    separatorCols: [],
  },
};

// Brand colours - lifted from app/globals.css so the Sheet feels like an
// extension of the site rather than a generic spreadsheet.
const INK = { red: 0.094, green: 0.078, blue: 0.043 };          // #181410
const GOLD = { red: 0.94, green: 0.776, blue: 0.451 };          // #f0c673
const CREAM_HEADER = { red: 0.969, green: 0.937, blue: 0.847 }; // #f7efd8
const ROW_LIGHT = { red: 1, green: 1, blue: 1 };
const ROW_DARK = { red: 0.984, green: 0.971, blue: 0.937 };     // #fbf8ef

// Module-scope caches keyed by tab name. Reset on cold start; each cache
// is idempotent so the worst-case after a cold restart is one extra API
// round trip per tab on the next submission.
const tabsCreated = new Set<TabName>();
const tabsBeautified = new Set<TabName>();
const tabGidCache = new Map<TabName, number>();

function getAuthClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;
  if (!clientEmail || !privateKeyRaw) {
    throw new Error('GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY is not set');
  }
  // Env files preserve `\n` as the two literal characters backslash-n.
  // PEM parsing needs real newlines, so convert before handing to auth.
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  return new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

// 0 -> "A", 25 -> "Z", 26 -> "AA", etc.
function colToA1(col: number): string {
  let s = '';
  let n = col;
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

// "22 May 2026, 14:30" in Singapore time - readable in the Sheet and
// stable across UTC/Asia transitions for the Beacon team.
function formatTimestamp(d: Date): string {
  const date = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Singapore',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Singapore',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
  return `${date}, ${time}`;
}

// Decide which tab / section(s) a submission lands in, and the row
// values for each section. A single submission can land in multiple
// sections - e.g. a brand picking "Both" services writes one row into
// the Embedded section and an identical one into the Projects section
// so neither pipeline view misses the lead.
type Destination = { tab: TabName; sectionIdx: number; row: string[] };

function buildDestinations(
  kind: SheetsFormKind,
  data: Record<string, string>,
  message?: string,
): Destination[] {
  const ts = formatTimestamp(new Date());

  if (kind === 'brand') {
    const service = (data.service || '').toLowerCase();
    const wantsProjects =
      service.includes('project') ||
      service.includes('production') ||
      service.includes('delivery');

    const row = [
      ts,
      data.name ?? '',
      data.email ?? '',
      data.organisation ?? '',
      data.roles ?? '',
      data.timeline ?? '',
      message ?? data.message ?? '',
    ];

    // Brand form is now strictly Embedded XOR Project delivery (the
    // "Both" option was removed). Unrecognised values fall to Embedded
    // so the lead is never dropped.
    return [{
      tab: 'Brands',
      sectionIdx: wantsProjects ? 1 : 0,
      row,
    }];
  }

  if (kind === 'embedded') {
    return [{
      tab: 'Creatives',
      sectionIdx: 0,
      row: [
        ts,
        data.name ?? '',
        data.email ?? '',
        data.portfolio ?? '',
        data.craft ?? '',
        data.availability ?? '',
        message ?? data.about ?? '',
      ],
    }];
  }

  if (kind === 'projects') {
    return [{
      tab: 'Creatives',
      sectionIdx: 1,
      row: [
        ts,
        data.name ?? '',
        data.email ?? '',
        data.portfolio ?? '',
        data.day_rate ?? '',
        data.disciplines ?? '',
        data.capacity ?? '',
        data.project_types ?? '',
        message ?? data.about ?? '',
      ],
    }];
  }

  // General + the old creatives-page contact form share the General tab.
  return [{
    tab: 'General',
    sectionIdx: 0,
    row: [
      ts,
      data.name ?? '',
      data.email ?? '',
      data.i_am_a ?? '',
      message ?? data.message ?? '',
    ],
  }];
}

/* Make sure the tab exists in the spreadsheet. Returns the sheet's gid
   and a flag indicating whether the tab was just created (so the caller
   can run the one-time beautification only on fresh tabs).

   Fast path: on warm requests where the tab + gid are already cached in
   module scope, skip the metadata round trip entirely. */
async function ensureTabExists(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  tab: TabName,
): Promise<{ sheetId: number; created: boolean }> {
  // Warm cache hit - no API call needed.
  if (tabsCreated.has(tab)) {
    const cachedId = tabGidCache.get(tab);
    if (cachedId !== undefined) {
      return { sheetId: cachedId, created: false };
    }
  }

  // Cold path: pull spreadsheet metadata to learn what tabs exist.
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets(properties(sheetId,title))',
  });

  for (const s of meta.data.sheets ?? []) {
    const title = s.properties?.title;
    const id = s.properties?.sheetId;
    if (typeof title === 'string' && typeof id === 'number') {
      tabGidCache.set(title as TabName, id);
    }
  }

  const existingId = tabGidCache.get(tab);
  if (existingId !== undefined) {
    tabsCreated.add(tab);
    // Existing tab from a prior session - assume it's already styled.
    tabsBeautified.add(tab);
    return { sheetId: existingId, created: false };
  }

  // Create the missing tab.
  const addResp = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: tab } } }],
    },
  });
  const newId = addResp.data.replies?.[0]?.addSheet?.properties?.sheetId;
  if (typeof newId !== 'number') {
    throw new Error(`Failed to create tab "${tab}"`);
  }
  tabGidCache.set(tab, newId);
  tabsCreated.add(tab);
  return { sheetId: newId, created: true };
}

/* Apply the brand styling: dark section banners with gold serif titles,
   cream column-header strip, banded rows below, frozen top two rows,
   blank gutter column between sections. Run once per fresh tab. */
async function beautifyTab(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  tab: TabName,
  sheetId: number,
): Promise<void> {
  if (tabsBeautified.has(tab)) return;

  const layout = TAB_LAYOUTS[tab];
  const totalCols = Math.max(...layout.sections.map((s) => s.endCol));

  const requests: Array<Record<string, unknown>> = [];

  // Freeze the top two rows (banner + column headers) so they stay
  // pinned while the boss scrolls through submissions.
  requests.push({
    updateSheetProperties: {
      properties: { sheetId, gridProperties: { frozenRowCount: 2 } },
      fields: 'gridProperties.frozenRowCount',
    },
  });

  // Generous heights so the banner has presence and the headers breathe.
  requests.push({
    updateDimensionProperties: {
      range: { sheetId, dimension: 'ROWS', startIndex: 0, endIndex: 1 },
      properties: { pixelSize: 42 },
      fields: 'pixelSize',
    },
  });
  requests.push({
    updateDimensionProperties: {
      range: { sheetId, dimension: 'ROWS', startIndex: 1, endIndex: 2 },
      properties: { pixelSize: 30 },
      fields: 'pixelSize',
    },
  });

  // Make gutter columns narrow so the gap reads as a deliberate spacer
  // rather than a usable column.
  for (const sep of layout.separatorCols) {
    requests.push({
      updateDimensionProperties: {
        range: { sheetId, dimension: 'COLUMNS', startIndex: sep, endIndex: sep + 1 },
        properties: { pixelSize: 24 },
        fields: 'pixelSize',
      },
    });
  }

  for (const section of layout.sections) {
    // Section title: merge across the section's columns, dark fill,
    // gold serif text, centred.
    requests.push({
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: section.startCol,
          endColumnIndex: section.endCol,
        },
        mergeType: 'MERGE_ALL',
      },
    });
    requests.push({
      updateCells: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: section.startCol,
          endColumnIndex: section.startCol + 1,
        },
        rows: [
          {
            values: [
              {
                userEnteredValue: { stringValue: section.name },
                userEnteredFormat: {
                  backgroundColor: INK,
                  horizontalAlignment: 'CENTER',
                  verticalAlignment: 'MIDDLE',
                  textFormat: {
                    foregroundColor: GOLD,
                    bold: true,
                    fontSize: 12,
                    fontFamily: 'Cormorant Garamond',
                  },
                },
              },
            ],
          },
        ],
        fields: 'userEnteredValue,userEnteredFormat',
      },
    });

    // Column headers row: cream fill, bold dark text.
    requests.push({
      updateCells: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: 2,
          startColumnIndex: section.startCol,
          endColumnIndex: section.endCol,
        },
        rows: [
          {
            values: section.headers.map((h) => ({
              userEnteredValue: { stringValue: h },
              userEnteredFormat: {
                backgroundColor: CREAM_HEADER,
                horizontalAlignment: 'LEFT',
                verticalAlignment: 'MIDDLE',
                padding: { left: 8, right: 4, top: 4, bottom: 4 },
                textFormat: {
                  foregroundColor: INK,
                  bold: true,
                  fontSize: 10,
                  fontFamily: 'Inter',
                },
              },
            })),
          },
        ],
        fields: 'userEnteredValue,userEnteredFormat',
      },
    });

    // Box border around the section's banner + headers so it reads as
    // a unit. The data area below gets banded rows, no inner borders
    // (cleaner look).
    requests.push({
      updateBorders: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 2,
          startColumnIndex: section.startCol,
          endColumnIndex: section.endCol,
        },
        top: { style: 'SOLID', width: 1, color: INK },
        bottom: { style: 'SOLID', width: 1, color: INK },
        left: { style: 'SOLID', width: 1, color: INK },
        right: { style: 'SOLID', width: 1, color: INK },
      },
    });

    // Banded rows for the data area below the header.
    requests.push({
      addBanding: {
        bandedRange: {
          range: {
            sheetId,
            startRowIndex: 2,
            startColumnIndex: section.startCol,
            endColumnIndex: section.endCol,
          },
          rowProperties: {
            firstBandColor: ROW_LIGHT,
            secondBandColor: ROW_DARK,
          },
        },
      },
    });
  }

  // First pass at column widths - auto-resize so the headers fit. New
  // data rows that overflow can be re-fitted manually; we don't want to
  // pay the API cost on every submission.
  requests.push({
    autoResizeDimensions: {
      dimensions: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: totalCols },
    },
  });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests },
  });

  tabsBeautified.add(tab);
}

/* Write the row at the next empty position within a specific section.
   Uses values.append with a column-scoped range - Google's API finds
   the last populated row in those columns and writes after it, in a
   single round trip. The parallel section to the right is untouched
   because it lives in a different column range with the gutter column
   between them keeping the tables separate. */
async function appendToSection(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  tab: TabName,
  sectionIdx: number,
  row: string[],
): Promise<void> {
  const layout = TAB_LAYOUTS[tab];
  const section = layout.sections[sectionIdx];

  const startA1 = colToA1(section.startCol);
  const endA1 = colToA1(section.endCol - 1);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    // Range starts at row 2 (the headers) so the API treats the section
    // as one contiguous table. OVERWRITE writes to the row after the
    // table's last filled row without shifting anything else.
    range: `${tab}!${startA1}2:${endA1}`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'OVERWRITE',
    requestBody: { values: [row] },
  });
}

/* Append one submission to the appropriate tab + section(s). Throws on
   any unrecoverable error - callers should treat the Sheets append as
   best-effort and not block the email pipeline on its outcome. */
export async function appendSubmissionToSheet(
  kind: SheetsFormKind,
  data: Record<string, string>,
  message?: string,
): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID is not set');
  }

  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const destinations = buildDestinations(kind, data, message);
  // Process unique tabs first - ensure existence + beautify - then write.
  const tabsTouched = Array.from(new Set(destinations.map((d) => d.tab)));

  // Parallelise the existence checks - they're independent per tab.
  await Promise.all(
    tabsTouched.map(async (tab) => {
      const { sheetId, created } = await ensureTabExists(sheets, spreadsheetId, tab);
      if (created) {
        try {
          await beautifyTab(sheets, spreadsheetId, tab, sheetId);
        } catch (err) {
          // Beautification is cosmetic; don't block the row write if the
          // styling call fails (most often a permission edge case).
          console.error(`[sheets] beautify failed for "${tab}"`, err);
        }
      }
    }),
  );

  // Parallelise the writes too. The "Both" case has two destinations
  // but they're on the same tab in different column ranges, so they
  // can safely run concurrently.
  await Promise.all(
    destinations.map((dest) =>
      appendToSection(sheets, spreadsheetId, dest.tab, dest.sectionIdx, dest.row),
    ),
  );
}

/* Build the public Sheet URL with the right tab pre-selected. The email
   uses this for the "View all submissions" CTA. We pick the tab the
   submission's first destination wrote to. */
const KIND_TO_TAB: Record<SheetsFormKind, TabName> = {
  brand: 'Brands',
  embedded: 'Creatives',
  projects: 'Creatives',
  creatives: 'General',
  general: 'General',
};

export async function getTabUrl(kind: SheetsFormKind): Promise<string | null> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) return null;

  const tab = KIND_TO_TAB[kind];
  let gid = tabGidCache.get(tab);

  if (gid === undefined) {
    try {
      const auth = getAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });
      const meta = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets(properties(sheetId,title))',
      });
      for (const s of meta.data.sheets ?? []) {
        const title = s.properties?.title;
        const id = s.properties?.sheetId;
        if (typeof title === 'string' && typeof id === 'number') {
          tabGidCache.set(title as TabName, id);
        }
      }
      gid = tabGidCache.get(tab);
    } catch {
      return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    }
  }

  if (gid === undefined) {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${gid}`;
}
