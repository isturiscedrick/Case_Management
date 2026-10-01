import Sidebar from "@/components/shared/Sidebar";
import { CasesProvider } from "@/context/CasesContext";
import { ToastProvider } from "@/components/shared/Toast";

export default function SystemLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <CasesProvider>
        <div className="flex h-screen w-full flex-col bg-[#F5F1E3] md:flex-row">
          <Sidebar />
          <main className="h-full min-w-0 flex-1 overflow-hidden pl-0 pt-14 md:pl-60 md:pt-0">
            {children}
          </main>
        </div>
      </CasesProvider>
    </ToastProvider>
  );
}