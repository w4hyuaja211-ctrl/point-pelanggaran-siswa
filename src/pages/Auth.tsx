import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap, Clock, ShieldCheck, Users, AlertTriangle, CalendarCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function useWIB() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const fmt = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta", hour12: false,
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  return fmt.format(now);
}

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const wib = useWIB();

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c.length < 4) return toast.error("Kode minimal 4 karakter");
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("lookup-login-code", { body: { code: c } });
      if (error || !data?.email) {
        toast.error(data?.error || "Kode tidak ditemukan");
        return;
      }
      const { error: sErr } = await supabase.auth.signInWithPassword({ email: data.email, password: c });
      if (sErr) { toast.error("Kode tidak valid"); return; }
      toast.success("Berhasil masuk");
      navigate("/", { replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col">
      <main className="flex-1 grid lg:grid-cols-2 gap-8 max-w-6xl w-full mx-auto p-4 md:p-8 items-center">
        {/* Info */}
        <section className="space-y-6 animate-fade-in order-2 lg:order-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--gradient-primary)] flex items-center justify-center shadow-[var(--shadow-elegant)]">
              <GraduationCap className="text-primary-foreground" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold leading-tight">SiPoinSiswa</h1>
              <p className="text-sm text-muted-foreground">Sistem Poin Pelanggaran & Absensi Siswa</p>
            </div>
          </div>

          <p className="text-base text-foreground/80 leading-relaxed">
            Pencatatan disiplin siswa yang rapi: input pelanggaran berbasis katalog poin,
            rekap absensi harian per kelas, dan laporan otomatis sesuai tahun ajaran aktif.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: AlertTriangle, label: "Poin Pelanggaran" },
              { icon: CalendarCheck, label: "Absensi Harian" },
              { icon: Users, label: "Multi Peran" },
            ].map((f) => (
              <div key={f.label} className="rounded-xl border bg-card p-3 text-center transition-transform hover:-translate-y-0.5">
                <f.icon className="mx-auto text-primary" size={20} />
                <div className="text-xs mt-2 text-muted-foreground">{f.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <Clock className="text-primary shrink-0" size={20} />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Waktu Server (WIB / GMT+7)</div>
              <div className="font-mono text-sm md:text-base truncate">{wib}</div>
            </div>
          </div>
        </section>

        {/* Login */}
        <section className="order-1 lg:order-2 animate-scale-in">
          <Card className="shadow-[var(--shadow-elegant)] border-0">
            <CardContent className="p-6 md:p-8 space-y-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck size={16} className="text-primary" />
                Masuk dengan kode akses
              </div>
              <form onSubmit={submit} className="space-y-4">
                <Input
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Masukkan Kode"
                  className="text-center text-xl font-mono tracking-[0.4em] h-14 uppercase"
                  maxLength={32}
                  inputMode="text"
                  autoComplete="one-time-code"
                />
                <Button type="submit" disabled={busy} className="w-full h-12 text-base">
                  {busy ? "Memproses..." : "Masuk"}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                Kode akses diberikan oleh admin sekolah. Hubungi admin jika belum memiliki kode atau kode tidak berfungsi.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
      <footer className="text-center text-xs text-muted-foreground py-4">
        © {new Date().getFullYear()} SiPoinSiswa
      </footer>
    </div>
  );
}
