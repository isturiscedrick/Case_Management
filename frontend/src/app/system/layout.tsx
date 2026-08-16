import Sidebar from "@/components/shared/Sidebar";
import { CasesProvider } from "@/context/CasesContext";

export default function SystemLayout({ children }: { children: React.ReactNode }) {
  return (
    <CasesProvider>
      <div className="min-h-screen w-full bg-[#F5F1E3]">
        <Sidebar />
        <main className="min-h-screen min-w-0 overflow-y-auto pl-60">{children}</main>
      </div>
    </CasesProvider>
  );
}