import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Siswa { id: string; nama: string; total_poin: number }
interface Plg { id: string; jenis: string; poin: number; tanggal: string; deskripsi: string | null }
interface Abs { id: string; tanggal: string; status: string; keterangan: string | null }

export default function CatatanSaya() {
  const { user } = useAuth();
  const [siswa, setSiswa] = useState<Siswa | null>(null);
  const [plg, setPlg] = useState<Plg[]>([]);
  const [abs, setAbs] = useState<Abs[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: s } = await supabase.from("siswa").select("id,nama,total_poin").eq("user_id", user.id).maybeSingle();
      if (!s) return;
      setSiswa(s as Siswa);
      const { data: p } = await supabase.from("pelanggaran").select("id,jenis,poin,tanggal,deskripsi").eq("siswa_id", s.id).order("tanggal", { ascending: false });
      setPlg((p ?? []) as Plg[]);
      const { data: a } = await supabase.from("absensi").select("id,tanggal,status,keterangan").eq("siswa_id", s.id).order("tanggal", { ascending: false }).limit(30);
      setAbs((a ?? []) as Abs[]);
    })();
  }, [user]);

  if (!siswa) return <p className="text-muted-foreground">Akun Anda belum tertaut ke data siswa. Hubungi admin.</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader><CardTitle>{siswa.nama}</CardTitle></CardHeader>
        <CardContent>
          <Badge variant={siswa.total_poin >= 50 ? "destructive" : "secondary"} className="text-base px-3 py-1">
            Total: {siswa.total_poin} poin
          </Badge>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Riwayat Pelanggaran</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {plg.length === 0 && <p className="text-sm text-muted-foreground">Tidak ada pelanggaran. 👍</p>}
          {plg.map(p => (
            <div key={p.id} className="flex justify-between p-3 rounded-lg border">
              <div><div className="font-medium">{p.jenis}</div><div className="text-xs text-muted-foreground">{p.tanggal}</div></div>
              <Badge variant="destructive">{p.poin}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Absensi (30 terakhir)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {abs.map(a => (
            <div key={a.id} className="flex justify-between p-3 rounded-lg border">
              <div className="text-sm">{a.tanggal}</div>
              <Badge variant="outline" className="capitalize">{a.status}</Badge>
            </div>
          ))}
          {abs.length === 0 && <p className="text-sm text-muted-foreground">Belum ada catatan absensi.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
