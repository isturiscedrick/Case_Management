import Sidebar from "@/components/cases/Sidebar";

export default function SystemLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#F7F5F0]">
      <Sidebar />
      <main className="min-h-screen min-w-0 overflow-y-auto pl-60">{children}</main>
    </div>
  );
}