// image-slot.js was loaded here originally, but /about and /contact route
// through CreativesClient → CreativesApp's destination overlay (which uses
// <image-slot>) without going through this layout. The script is now loaded
// globally in the root layout so every route that renders the overlay gets
// the custom element registered.
export default function CreativesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
