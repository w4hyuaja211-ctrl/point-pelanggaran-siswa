import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Users, AlertTriangle, CalendarCheck, TrendingUp, Clock, Shield, Award, LayoutDashboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Stats {
  totalSiswa: number;
  totalPelanggaran: number;
  hadirHariIni: number;
  totalKelas: number;
}

interface Sekolah {
  nama_sekolah: string;
  kepala_sekolah: string;
}
interface TahunAjaran {
  nama: string;
  semester: string;
}

const Index = () => {
  const { primaryRole, user } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalSiswa: 0, totalPelanggaran: 0, hadirHariIni: 0, totalKelas: 0 });
  const [sekolah, setSekolah] = useState<Sekolah | null>(null);
  const [ta, setTa] = useState<TahunAjaran | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const wib = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta", hour12: false,
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).format(now);

  useEffect(() => {
    const load = async () => {
      const { data: sk } = await supabase.from("pengaturan_sekolah").select("nama_sekolah,kepala_sekolah").maybeSingle();
      setSekolah(sk);
      const { data: t } = await supabase.from("tahun_ajaran").select("nama,semester").eq("is_aktif", true).maybeSingle();
      setTa(t);

      const today = new Date().toISOString().slice(0, 10);
      const [siswa, plg, abs, kls] = await Promise.all([
        supabase.from("siswa").select("*", { count: "exact", head: true }),
        supabase.from("pelanggaran").select("*", { count: "exact", head: true }),
        supabase.from("absensi").select("*", { count: "exact", head: true }).eq("tanggal", today).eq("status", "hadir"),
        supabase.from("kelas").select("*", { count: "exact", head: true }),
      ]);
      setStats({
        totalSiswa: siswa.count ?? 0,
        totalPelanggaran: plg.count ?? 0,
        hadirHariIni: abs.count ?? 0,
        totalKelas: kls.count ?? 0,
      });
    };
    load();
  }, [user]);

  const cards = [
    { label: "Total Siswa", value: stats.totalSiswa, icon: Users, color: "from-blue-600 to-indigo-600", shadow: "shadow-blue-500/20" },
    { label: "Total Kelas", value: stats.totalKelas, icon: TrendingUp, color: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/20" },
    { label: "Pelanggaran", value: stats.totalPelanggaran, icon: AlertTriangle, color: "from-rose-500 to-red-600", shadow: "shadow-rose-500/20" },
    { label: "Hadir Hari Ini", value: stats.hadirHariIni, icon: CalendarCheck, color: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/20" },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-accent/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium uppercase tracking-wider">
              <Shield size={14} className="text-accent" />
              Sistem Manajemen Disiplin
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              {sekolah?.nama_sekolah ?? "SiPoinSiswa"}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-slate-400">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-accent" />
                <span className="text-sm font-medium">KS: {sekolah?.kepala_sekolah || "Belum diatur"}</span>
              </div>
              <div className="w-1 h-1 bg-slate-700 rounded-full hidden md:block" />
              <div className="flex items-center gap-2 font-mono text-sm">
                <Clock size={16} />
                {wib} WIB
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 self-end md:self-center">
            {ta ? (
              <div className="px-6 py-3 rounded-2xl bg-white text-slate-900 shadow-xl border-b-4 border-accent">
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Tahun Ajaran Aktif</p>
                <p className="text-lg font-bold">{ta.nama} • {ta.semester.toUpperCase()}</p>
              </div>
            ) : (
              <Badge variant="destructive" className="px-4 py-2 text-sm animate-pulse">Konfigurasi T.A. Dibutuhkan</Badge>
            )}
            <Badge variant="outline" className="bg-white/5 border-white/20 text-white capitalize px-4 py-1.5">
              Role: {primaryRole?.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {cards.map((c, i) => (
          <Card key={c.label} className={`group overflow-hidden border-0 shadow-lg ${c.shadow} transition-all hover:-translate-y-1 duration-300`}>
            <CardContent className="p-6 relative">
              <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-gradient-to-br ${c.color} opacity-5 rounded-full transition-transform group-hover:scale-150 duration-500`} />
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-4 shadow-lg`}>
                <c.icon className="text-white" size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-3xl font-black tracking-tight">{c.value}</h4>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Access & Info */}
      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-0 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader className="bg-secondary/20 border-b border-border/50">
            <div className="flex items-center gap-2">
              <LayoutDashboard size={20} className="text-primary" />
              <CardTitle>Panduan Penggunaan</CardTitle>
            </div>
            <CardDescription>Langkah awal untuk mengoperasikan sistem SiPoinSiswa</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {primaryRole === "admin" && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { t: "Pengaturan Sekolah", d: "Atur identitas & logo sekolah.", l: "/admin/sekolah" },
                    { t: "Tahun Ajaran", d: "Aktifkan semester berjalan.", l: "/admin/tahun-ajaran" },
                    { t: "Manajemen Data", d: "Kelola Kelas, Siswa, & Katalog.", l: "/admin/kelas" },
                    { t: "User & Akses", d: "Kelola akun Guru & Siswa.", l: "/admin/users" },
                  ].map((item) => (
                    <div key={item.t} className="p-4 rounded-xl bg-white border border-border/50 hover:border-primary/30 transition-colors shadow-sm group">
                      <h5 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{item.t}</h5>
                      <p className="text-xs text-muted-foreground mt-1">{item.d}</p>
                    </div>
                  ))}
                </div>
              )}
              {primaryRole === "guru_piket" && (
                <div className="space-y-4">
                  <div className="flex gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <AlertTriangle className="text-primary shrink-0" />
                    <div>
                      <h5 className="font-bold">Input Pelanggaran</h5>
                      <p className="text-sm text-muted-foreground">Catat setiap tindakan indisipliner siswa sesuai katalog poin yang berlaku.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 rounded-xl bg-accent/5 border border-accent/10">
                    <CalendarCheck className="text-accent shrink-0" />
                    <div>
                      <h5 className="font-bold">Input Absensi</h5>
                      <p className="text-sm text-muted-foreground">Rekap kehadiran harian siswa per kelas dengan cepat dan efisien.</p>
                    </div>
                  </div>
                </div>
              )}
              {primaryRole === "wali_kelas" && (
                <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-900">
                  <h5 className="font-bold text-lg mb-2">Monitoring Kelas Saya</h5>
                  <p className="text-sm opacity-80 leading-relaxed">
                    Anda dapat memantau akumulasi poin pelanggaran dan tingkat kehadiran siswa di kelas Anda secara langsung melalui menu <b>Kelas Saya</b>.
                  </p>
                </div>
              )}
              {primaryRole === "siswa" && (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-900">
                  <h5 className="font-bold text-lg mb-2">Lihat Catatan Kedisiplinan</h5>
                  <p className="text-sm opacity-80 leading-relaxed">
                    Pantau grafik perkembangan kedisiplinan dan riwayat absensi Anda melalui menu <b>Catatan Saya</b>.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-primary to-primary-glow text-white">
          <CardHeader>
            <CardTitle className="text-white">Informasi Sistem</CardTitle>
            <CardDescription className="text-white/70 text-xs">Status & Versi Terkini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold opacity-60">Versi Aplikasi</p>
              <p className="font-mono text-sm">v1.2.0-stable</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold opacity-60">Status Database</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-sm">Terhubung (Real-time)</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold opacity-60">Bantuan IT</p>
              <p className="text-sm">it-support@sekolah.sch.id</p>
            </div>
            
            <div className="pt-4">
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                <p className="text-xs italic opacity-80 leading-relaxed">
                  "Kedisiplinan adalah jembatan antara cita-cita dan pencapaian."
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;

