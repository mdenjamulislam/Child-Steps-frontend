import RoleGuard from "@/components/RoleGuard";

export default function ParentDashboard() {
  return (
    <RoleGuard allowedRoles={["parent", "guardian"]}>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Parent Hub</h1>
        <p>Welcome to your child tracking dashboard.</p>
      </div>
    </RoleGuard>
  );
}
