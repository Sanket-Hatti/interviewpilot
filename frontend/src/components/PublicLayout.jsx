import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0b0f17] text-zinc-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white antialiased">
      <PublicNavbar />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
