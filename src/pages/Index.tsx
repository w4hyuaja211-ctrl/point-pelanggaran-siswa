import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Users, AlertTriangle, CalendarCheck, TrendingUp, Clock } from "lucide-react";
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
    { label: "Total Siswa", value: stats.totalSiswa, icon: Users, color: "from-primary to-primary-glow" },
    { label: "Total Kelas", value: stats.totalKelas, icon: TrendingUp, color: "from-accent to-warning" },
    { label: "Pelanggaran Tercatat", value: stats.totalPelanggaran, icon: AlertTriangle, color: "from-destructive to-warning" },
    { label: "Hadir Hari Ini", value: stats.hadirHariIni, icon: CalendarCheck, color: "from-success to-primary" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl bg-[var(--gradient-primary)] text-primary-foreground p-6 md:p-8 shadow-[var(--shadow-elegant)]">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{sekolah?.nama_sekolah ?? "Selamat Datang"}</h1>
            <p className="text-primary-foreground/80 mt-1">Kepala Sekolah: {sekolah?.kepala_sekolah || "-"}</p>
            <div className="flex items-center gap-2 mt-3 text-sm text-primary-foreground/90">
              <Clock size={14} />
              <span className="font-mono">{wib} WIB</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {ta ? (
              <Badge variant="secondary" className="text-sm px-3 py-1">
                T.A. {ta.nama} • Semester {ta.semester}
              </Badge>
            ) : (
              <Badge variant="destructive">Belum ada T.A. aktif</Badge>
            )}
            <span className="text-xs uppercase tracking-wider text-primary-foreground/70 capitalize">
              Peran: {primaryRole?.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="overflow-hidden border-0 shadow-[var(--shadow-card)]">
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center mb-3`}>
                <c.icon className="text-primary-foreground" size={20} />
              </div>
              <div className="text-2xl font-bold">{c.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Panduan Cepat</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          {primaryRole === "admin" && (
            <>
              <p>• Atur identitas sekolah di menu <b>Pengaturan Sekolah</b>.</p>
              <p>• Buat <b>Tahun Ajaran</b> & semester yang aktif sebelum mulai input.</p>
              <p>• Kelola <b>Kelas</b>, <b>Siswa</b>, <b>Katalog Pelanggaran</b>, dan <b>Pengguna</b>.</p>
            </>
          )}
          {primaryRole === "guru_piket" && (
            <>
              <p>• Gunakan <b>Input Pelanggaran</b> untuk mencatat pelanggaran siswa.</p>
              <p>• Gunakan <b>Input Absensi</b> untuk merekap kehadiran per kelas.</p>
            </>
          )}
          {primaryRole === "wali_kelas" && <p>• Buka <b>Kelas Saya</b> untuk melihat poin & absensi siswa kelasmu.</p>}
          {primaryRole === "siswa" && <p>• Buka <b>Catatan Saya</b> untuk melihat poin pelanggaran & rekap absensi.</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
