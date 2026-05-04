import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Siswa { id: string; nama: string; nisn: string | null; nis: string | null; jenis_kelamin: string; total_poin: number; kelas_id: string | null }
interface Kls { id: string; nama_kelas: string }

export default function DataSiswa() {
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [kelas, setKelas] = useState<Kls[]>([]);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.from("kelas").select("id,nama_kelas").order("nama_kelas").then(({ data }) => setKelas((data ?? []) as Kls[]));
    supabase.from("siswa").select("*").order("total_poin", { ascending: false }).then(({ data }) => setSiswa((data ?? []) as Siswa[]));
  }, []);

  const filtered = siswa.filter(s => {
    if (filter !== "all" && s.kelas_id !== filter) return false;
    if (q && !s.nama.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const namaKls = (id: string | null) => kelas.find(k => k.id === id)?.nama_kelas ?? "—";

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Data Siswa</h1>
        <p className="text-muted-foreground">Diurutkan berdasarkan total poin pelanggaran tertinggi.</p>
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle>Daftar ({filtered.length})</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Input placeholder="Cari nama..." value={q} onChange={(e) => setQ(e.target.value)} className="w-48" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kelas</SelectItem>
                {kelas.map(k => <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.map(s => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <div className="font-medium">{s.nama} <span className="text-xs text-muted-foreground">({s.jenis_kelamin})</span></div>
                <div className="text-xs text-muted-foreground">{namaKls(s.kelas_id)} • NISN {s.nisn ?? "-"}</div>
              </div>
              <Badge variant={s.total_poin >= 75 ? "destructive" : s.total_poin >= 25 ? "default" : "secondary"}>
                {s.total_poin} poin
              </Badge>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground">Tidak ada siswa.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
