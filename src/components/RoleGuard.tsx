import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, AppRole } from "@/hooks/useAuth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-muted-foreground">Memuat...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export function RequireRole({ roles, children }: { roles: AppRole[]; children: ReactNode }) {
  const { roles: userRoles, loading } = useAuth();
  if (loading) return <div className="p-8 text-muted-foreground">Memuat...</div>;
  if (!userRoles.some((r) => roles.includes(r))) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold">Akses ditolak</h2>
        <p className="text-muted-foreground">Anda tidak memiliki izin untuk halaman ini.</p>
      </div>
    );
  }
  return <>{children}</>;
}
