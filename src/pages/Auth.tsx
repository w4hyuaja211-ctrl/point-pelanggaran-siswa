import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

const emailSchema = z.string().trim().email("Email tidak valid").max(255);
const passwordSchema = z.string().min(6, "Password minimal 6 karakter").max(72);
const namaSchema = z.string().trim().min(2, "Nama minimal 2 karakter").max(100);

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) return toast.error(err.errors[0].message);
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Berhasil masuk");
      navigate("/", { replace: true });
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    const nama = String(fd.get("nama") ?? "");
    try {
      namaSchema.parse(nama);
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) return toast.error(err.errors[0].message);
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { nama_lengkap: nama },
      },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Akun dibuat. Silakan masuk.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <Card className="w-full max-w-md shadow-[var(--shadow-elegant)]">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--gradient-primary)] flex items-center justify-center mb-3">
            <GraduationCap className="text-primary-foreground" size={28} />
          </div>
          <CardTitle className="text-2xl">SiPoinSiswa</CardTitle>
          <CardDescription>Sistem Poin Pelanggaran & Absensi</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="signup">Daftar</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" name="password" type="password" required />
                </div>
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? "Memproses..." : "Masuk"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="su-nama">Nama Lengkap</Label>
                  <Input id="su-nama" name="nama" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-password">Password</Label>
                  <Input id="su-password" name="password" type="password" required />
                </div>
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? "Memproses..." : "Daftar"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Akun baru akan berperan sebagai siswa. Hubungi admin untuk perubahan peran.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
