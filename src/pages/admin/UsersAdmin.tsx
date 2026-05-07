import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { AppRole } from "@/hooks/useAuth";
import { KeyRound, RefreshCw, Copy } from "lucide-react";

interface Profile { id: string; nama_lengkap: string; email: string | null; login_code: string | null }
interface Role { user_id: string; role: AppRole }

const ROLES: AppRole[] = ["admin", "guru_piket", "wali_kelas", "siswa"];

export default function UsersAdmin() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | AppRole>("all");

  const load = async () => {
    const { data: p } = await supabase.from("profiles").select("id,nama_lengkap,email,login_code").order("nama_lengkap");
    setProfiles((p ?? []) as Profile[]);
    const { data: r } = await supabase.from("user_roles").select("user_id,role");
    setRoles((r ?? []) as Role[]);
  };
  useEffect(() => { load(); }, []);

  const has = (uid: string, role: AppRole) => roles.some((r) => r.user_id === uid && r.role === role);

  const toggle = async (uid: string, role: AppRole) => {
    if (has(uid, role)) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
      if (error) return toast.error(error.message);
    }
    toast.success("Peran diperbarui");
    load();
  };

  const regenerate = async (uid: string) => {
    if (!confirm("Buat ulang kode login? Kode lama tidak bisa dipakai lagi.")) return;
    setBusy(uid);
    try {
      const { data, error } = await supabase.functions.invoke("admin-manage-user", {
        body: { action: "regenerate_code", user_id: uid },
      });
      if (error) throw error;
      toast.success(`Kode baru: ${data.code}`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Kode disalin");
  };

  const list = profiles.filter((p) => filter === "all" || has(p.id, filter));

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengguna & Peran</h1>
        <p className="text-muted-foreground">Atur peran dan kode login setiap pengguna.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", ...ROLES] as const).map((r) => (
          <Button key={r} size="sm" variant={filter === r ? "default" : "outline"} onClick={() => setFilter(r as any)}>
            {r === "all" ? "Semua" : r.replace("_", " ")}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Pengguna ({list.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {list.map((p) => (
            <div key={p.id} className="p-3 border rounded-lg space-y-3 animate-fade-in">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.nama_lengkap || "(tanpa nama)"}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.email}</div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {p.login_code ? (
                    <Badge variant="secondary" className="font-mono text-sm gap-1">
                      <KeyRound size={12} /> {p.login_code}
                      <button onClick={() => copy(p.login_code!)} className="ml-1 opacity-60 hover:opacity-100">
                        <Copy size={12} />
                      </button>
                    </Badge>
                  ) : (
                    <Badge variant="outline">Belum ada kode</Badge>
                  )}
                  <Button size="sm" variant="outline" disabled={busy === p.id} onClick={() => regenerate(p.id)}>
                    <RefreshCw size={12} className={busy === p.id ? "animate-spin" : ""} />
                    {p.login_code ? "Buat ulang" : "Generate"}
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((r) => (
                  <Button
                    key={r}
                    size="sm"
                    variant={has(p.id, r) ? "default" : "outline"}
                    onClick={() => toggle(p.id, r)}
                  >
                    {has(p.id, r) ? "✓ " : ""}{r.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          {list.length === 0 && <p className="text-sm text-muted-foreground">Tidak ada pengguna.</p>}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Tips: untuk admin pertama, tambahkan baris di tabel <Badge variant="secondary">user_roles</Badge> dengan role <b>admin</b> melalui Backend.
      </p>
    </div>
  );
}
