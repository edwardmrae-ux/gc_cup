import { checkAdminCookie } from "./actions";
import { AdminGate } from "./AdminGate";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const unlocked = await checkAdminCookie();
  return (
    <div>
      {unlocked ? (
        <>
          <AdminNav />
          {children}
        </>
      ) : (
        <AdminGate />
      )}
    </div>
  );
}
