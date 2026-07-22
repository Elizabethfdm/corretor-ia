import { requireUser } from "@/server/policies/auth-policy";
import { Sidebar } from "@/features/dashboard/components/sidebar";
import { Header } from "@/features/dashboard/components/header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const isAdmin = user.role === "admin";

  return (
    <div className="flex flex-1">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex flex-1 flex-col">
        <Header name={user.name} email={user.email} isAdmin={isAdmin} />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
