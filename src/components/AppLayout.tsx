import { ReactNode, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
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
  Menu,
  X,
  ChevronRight,
  Bell
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
  { to: "/admin/sekolah", label: "Sekolah", icon: School, roles: ["admin"] },
  { to: "/admin/tahun-ajaran", label: "Tahun Ajaran", icon: CalendarRange, roles: ["admin"] },
  { to: "/admin/kelas", label: "Kelas", icon: BookOpen, roles: ["admin"] },
  { to: "/admin/siswa", label: "Kelola Siswa", icon: Users, roles: ["admin"] },
  { to: "/admin/katalog", label: "Katalog Poin", icon: ListChecks, roles: ["admin"] },
  { to: "/admin/users", label: "Akses Pengguna", icon: UserCog, roles: ["admin"] },
  { to: "/admin/import", label: "Import Data", icon: FileSpreadsheet, roles: ["admin"] },
];

export default function AppLayout() {
  const { primaryRole, roles, signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const items = NAV.filter((n) => n.roles.some((r) => roles.includes(r)));

  const handleLogout = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const activeItem = items.find(it => it.to === location.pathname) || items[0];

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-slate-200 shadow-sm transition-all duration-300">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <GraduationCap className="text-white" size={26} />
            </div>
            <div className="min-w-0">
              <h2 className="font-black text-xl text-slate-900 tracking-tight">SiPoinSiswa</h2>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest truncate">
                {primaryRole?.replace("_", " ") ?? "Pengguna"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Menu Utama</p>
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === "/"}
              className={({ isActive }) =>
                cn(
                  "group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "text-slate-600 hover:bg-slate-50 hover:text-primary"
                )
              }
            >
              <div className="flex items-center gap-3">
                <it.icon size={20} className={cn("transition-colors", it.to === location.pathname ? "text-white" : "text-slate-400 group-hover:text-primary")} />
                {it.label}
              </div>
              <ChevronRight size={14} className={cn("opacity-0 transition-all", it.to === location.pathname ? "opacity-100 translate-x-0" : "group-hover:opacity-50 -translate-x-2")} />
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold uppercase">
                {user?.email?.charAt(0) || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.email}</p>
                <p className="text-[10px] text-slate-500">Sesi Aktif</p>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl" onClick={handleLogout}>
              <LogOut size={18} className="mr-2" />
              Keluar
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <Menu size={24} />
            </button>
            <div className="hidden lg:block">
              <h1 className="text-lg font-bold text-slate-900">{activeItem?.label}</h1>
              <p className="text-xs text-slate-500">Beranda / {activeItem?.label}</p>
            </div>
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="text-white" size={18} />
              </div>
              <span className="font-bold text-slate-900">SiPoin</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-primary transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-1" />
            <div className="flex items-center gap-3 lg:bg-slate-50 lg:pl-3 lg:pr-1 lg:py-1 rounded-full">
              <span className="hidden sm:block text-xs font-bold text-slate-700">{user?.email?.split("@")[0]}</span>
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold border-2 border-white shadow-sm">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Sidebar (Manual Overlay) */}
        <div className={cn(
          "fixed inset-0 z-50 lg:hidden transition-opacity duration-300",
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className={cn(
            "absolute inset-y-0 left-0 w-72 bg-white flex flex-col transition-transform duration-300 ease-in-out",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <GraduationCap className="text-white" size={22} />
                </div>
                <span className="font-bold text-slate-900">SiPoinSiswa</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {items.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.to === "/"}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      isActive ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50"
                    )
                  }
                >
                  <it.icon size={18} />
                  {it.label}
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-100">
              <Button variant="ghost" className="w-full justify-start text-rose-600" onClick={handleLogout}>
                <LogOut size={18} className="mr-2" /> Keluar
              </Button>
            </div>
          </aside>
        </div>

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}


