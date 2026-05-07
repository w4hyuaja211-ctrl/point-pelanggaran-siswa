import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap, Clock, ShieldCheck, Users, AlertTriangle, CalendarCheck, ArrowRight, Lock } from "lucide-react";
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
        // Special case for initial admin login as requested by user
        if (c === "1237219") {
          toast.info("Kode admin terdeteksi. Pastikan akun sudah dikonfigurasi di database.");
        }
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-accent/10 flex flex-col items-center justify-center p-4 md:p-8">
      {/* Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <main className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side: Branding & Info */}
        <section className="space-y-8 animate-fade-in hidden lg:block">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <ShieldCheck size={16} />
              Sistem Terpadu & Terenkripsi
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Kelola Disiplin <br />
              <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-glow">
                Siswa Lebih Mudah.
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-md">
              SiPoinSiswa membantu sekolah dalam mendata pelanggaran dan absensi secara real-time dan akurat.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {[
              { icon: AlertTriangle, title: "Poin Pelanggaran", desc: "Katalog poin yang terstandarisasi" },
              { icon: CalendarCheck, title: "Absensi Harian", desc: "Rekapitulasi kehadiran otomatis" },
              { icon: Users, title: "Multi Peran", desc: "Akses khusus untuk Admin, Guru, & Siswa" },
            ].map((f) => (
              <div key={f.title} className="flex items-center gap-4 p-4 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm transition-all hover:bg-card hover:shadow-elegant">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <f.icon size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-secondary/50 border border-border/50 backdrop-blur-sm inline-flex items-center gap-3">
            <Clock className="text-primary" size={20} />
            <div className="font-mono text-sm font-medium">
              <span className="text-muted-foreground mr-2">Waktu Lokal:</span>
              {wib}
            </div>
          </div>
        </section>

        {/* Right Side: Login Form */}
        <section className="animate-scale-in w-full max-w-md mx-auto">
          {/* Mobile Branding */}
          <div className="lg:hidden text-center mb-8 space-y-2">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow items-center justify-center shadow-elegant mb-4">
              <GraduationCap className="text-white" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-foreground">SiPoinSiswa</h2>
            <p className="text-muted-foreground">Masuk ke Dashboard Sistem</p>
          </div>

          <Card className="border-0 shadow-elegant bg-card/80 backdrop-blur-md overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary to-accent" />
            <CardContent className="p-8 md:p-10 space-y-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">Selamat Datang</h3>
                <p className="text-sm text-muted-foreground">Gunakan kode akses yang diberikan sekolah untuk melanjutkan.</p>
              </div>

              <form onSubmit={submit} className="space-y-6">
                <div className="space-y-2">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                      <Lock size={18} />
                    </div>
                    <Input
                      autoFocus
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="KODE AKSES"
                      className="pl-12 text-center text-xl font-mono tracking-[0.3em] h-14 bg-secondary/30 border-0 focus-visible:ring-2 focus-visible:ring-primary/20 placeholder:tracking-normal placeholder:text-sm"
                      maxLength={32}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={busy} className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]">
                  {busy ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memproses...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Masuk ke Sistem
                      <ArrowRight size={18} />
                    </div>
                  )}
                </Button>
              </form>

              <div className="pt-6 border-t border-border/50 text-center space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Lupa kode akses? Silakan hubungi bagian IT atau Tata Usaha sekolah Anda.
                </p>
                <div className="flex justify-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-primary/20 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-accent/20 animate-pulse delay-150" />
                  <div className="w-2 h-2 rounded-full bg-primary/20 animate-pulse delay-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <footer className="mt-8 text-center text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} SiPoinSiswa — Smart School Discipline Solution</p>
          </footer>
        </section>
      </main>
    </div>
  );
}

