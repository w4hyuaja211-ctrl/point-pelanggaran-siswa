import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Siswa { id: string; nama: string; total_poin: number }
interface Kls { id: string; nama_kelas: string }

export default function KelasSaya() {
  const { user } = useAuth();
  const [kelas, setKelas] = useState<Kls[]>([]);
  const [siswa, setSiswa] = useState<Record<string, Siswa[]>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: k } = await supabase.from("kelas").select("id,nama_kelas").eq("wali_kelas_id", user.id);
      const ks = (k ?? []) as Kls[]; setKelas(ks);
      const map: Record<string, Siswa[]> = {};
      for (const x of ks) {
        const { data: s } = await supabase.from("siswa").select("id,nama,total_poin").eq("kelas_id", x.id).order("total_poin", { ascending: false });
        map[x.id] = (s ?? []) as Siswa[];
      }
      setSiswa(map);
    })();
  }, [user]);

  return (
    <div className="max-w-4xl space-y-6">
      <div><h1 className="text-2xl font-bold">Kelas Saya</h1>
        <p className="text-muted-foreground">Siswa di kelas yang Anda walikan.</p></div>
      {kelas.length === 0 && <p className="text-sm text-muted-foreground">Anda belum diset sebagai wali kelas.</p>}
      {kelas.map(k => (
        <Card key={k.id}>
          <CardHeader><CardTitle>{k.nama_kelas}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(siswa[k.id] ?? []).map(s => (
              <div key={s.id} className="flex justify-between items-center p-3 rounded-lg border">
                <div className="font-medium">{s.nama}</div>
                <Badge variant={s.total_poin >= 50 ? "destructive" : "secondary"}>{s.total_poin} poin</Badge>
              </div>
            ))}
            {(siswa[k.id] ?? []).length === 0 && <p className="text-sm text-muted-foreground">Belum ada siswa.</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
