import { ReactNode } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  School,
  Settings,
  CalendarCheck,
  AlertTriangle,
  BookOpen,
  LogOut,
  ListChecks,
  CalendarRange,
  UserCog,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; roles: AppRole[] };

const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "guru_piket", "wali_kelas", "siswa"] },
  { to: "/pelanggaran", label: "Input Pelanggaran", icon: AlertTriangle, roles: ["admin", "guru_piket"] },
  { to: "/absensi", label: "Input Absensi", icon: CalendarCheck, roles: ["admin", "guru_piket"] },
  { to: "/siswa", label: "Data Siswa", icon: Users, roles: ["admin", "guru_piket", "wali_kelas"] },
  { to: "/kelas-saya", label: "Kelas Saya", icon: BookOpen, roles: ["wali_kelas"] },
  { to: "/saya", label: "Catatan Saya", icon: BookOpen, roles: ["siswa"] },
  { to: "/admin/sekolah", label: "Pengaturan Sekolah", icon: School, roles: ["admin"] },
  { to: "/admin/tahun-ajaran", label: "Tahun Ajaran", icon: CalendarRange, roles: ["admin"] },
  { to: "/admin/kelas", label: "Kelas", icon: BookOpen, roles: ["admin"] },
  { to: "/admin/siswa", label: "Kelola Siswa", icon: Users, roles: ["admin"] },
  { to: "/admin/katalog", label: "Katalog Pelanggaran", icon: ListChecks, roles: ["admin"] },
  { to: "/admin/users", label: "Pengguna & Peran", icon: UserCog, roles: ["admin"] },
  { to: "/admin/import", label: "Import Excel", icon: FileSpreadsheet, roles: ["admin"] },
];

export default function AppLayout() {
  const { primaryRole, roles, signOut, user } = useAuth();
  const navigate = useNavigate();

  const items = NAV.filter((n) => n.roles.some((r) => roles.includes(r)));

  const handleLogout = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="hidden md:flex w-64 flex-col bg-card border-r">
        <div className="p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--gradient-primary)] flex items-center justify-center">
              <GraduationCap className="text-primary-foreground" size={22} />
            </div>
            <div>
              <div className="font-bold text-foreground">SiPoinSiswa</div>
              <div className="text-xs text-muted-foreground capitalize">
                {primaryRole?.replace("_", " ") ?? "Pengguna"}
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-[var(--shadow-card)]"
                    : "text-foreground hover:bg-secondary"
                )
              }
            >
              <it.icon size={18} />
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t">
          <div className="text-xs text-muted-foreground px-3 pb-2 truncate">{user?.email}</div>
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut size={16} /> Keluar
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden flex items-center justify-between p-4 bg-card border-b">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[var(--gradient-primary)] flex items-center justify-center">
              <GraduationCap className="text-primary-foreground" size={18} />
            </div>
            <span className="font-bold">SiPoinSiswa</span>
          </div>
          <Button size="sm" variant="outline" onClick={handleLogout}>
            <LogOut size={14} />
          </Button>
        </header>
        {/* Mobile bottom nav */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-x-hidden">
          <Outlet />
        </main>
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t flex overflow-x-auto z-40">
          {items.slice(0, 5).map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex-1 min-w-[70px] flex flex-col items-center gap-1 py-2 text-[10px]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              <it.icon size={18} />
              <span className="truncate px-1">{it.label.split(" ")[0]}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
