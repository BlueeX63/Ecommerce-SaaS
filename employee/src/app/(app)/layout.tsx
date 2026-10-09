import { redirect } from "next/navigation";
import { getEmployeeSession } from "@/lib/api";
import { EmployeeShell } from "@/components/EmployeeShell";

export default async function EmployeeAppLayout({ children }: { children: React.ReactNode }) {
  const session = await getEmployeeSession();
  if (!session?.isLoggedIn) redirect("/login");

  return (
    <EmployeeShell employeeName={session.employee.name} storeName={session.store.name} warehouseName={session.warehouse?.warehouse_name ?? "Warehouse"}>
      {children}
    </EmployeeShell>
  );
}
