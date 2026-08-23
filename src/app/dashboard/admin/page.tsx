import RoleGuard from "@/components/RoleGuard";

export default function AdminDashboard() {
  return (
    <RoleGuard allowedRoles={["super_admin", "admin", "manager", "staff"]}>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <p>Welcome to the system management console.</p>
      </div>
    </RoleGuard>
  );
}
