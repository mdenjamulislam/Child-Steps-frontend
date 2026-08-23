import RoleGuard from "@/components/RoleGuard";

export default function TeacherDashboard() {
  return (
    <RoleGuard allowedRoles={["teacher"]}>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Teacher Hub</h1>
        <p>Welcome to the student academic log hub.</p>
      </div>
    </RoleGuard>
  );
}
