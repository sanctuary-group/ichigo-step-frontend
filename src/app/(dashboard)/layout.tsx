import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { RequireAuth } from "@/components/auth/route-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Header />
          <main className="flex-1 min-h-0 flex flex-col">{children}</main>
        </div>
      </div>
    </RequireAuth>
  );
}
