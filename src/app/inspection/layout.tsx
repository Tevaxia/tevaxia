export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1 className="sr-only">Inspection terrain TEGOVA EVS 2025</h1>
      {children}
    </>
  );
}
