import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { AppRole } from "@/hooks/useAuth";

interface Profile { id: string; nama_lengkap: string; email: string | null }
interface Role { user_id: string; role: AppRole }

const ROLES: AppRole[] = ["admin", "guru_piket", "wali_kelas", "siswa"];

export default function UsersAdmin() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const load = async () => {
    const { data: p } = await supabase.from("profiles").select("id,nama_lengkap,email").order("nama_lengkap");
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

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengguna & Peran</h1>
        <p className="text-muted-foreground">Atur peran setiap pengguna terdaftar.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Pengguna ({profiles.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {profiles.map(p => (
            <div key={p.id} className="p-3 border rounded-lg space-y-2">
              <div>
                <div className="font-medium">{p.nama_lengkap || "(tanpa nama)"}</div>
                <div className="text-xs text-muted-foreground">{p.email}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(r => (
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
          {profiles.length === 0 && <p className="text-sm text-muted-foreground">Belum ada pengguna.</p>}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Tips: untuk menjadikan diri Anda <Badge variant="secondary">admin</Badge> pertama, gunakan menu Backend → Users → user_roles untuk menambahkan role admin secara manual pada akun Anda.
      </p>
    </div>
  );
}
