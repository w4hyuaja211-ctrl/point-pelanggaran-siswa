import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Kls { id: string; nama_kelas: string }
interface Siswa {
  id: string; nama: string; nisn: string | null; nis: string | null;
  jenis_kelamin: "L" | "P"; kelas_id: string | null; total_poin: number;
}

export default function SiswaAdmin() {
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [kelas, setKelas] = useState<Kls[]>([]);
  const [filterKelas, setFilterKelas] = useState<string>("all");
  const [form, setForm] = useState({ nama: "", nisn: "", nis: "", jenis_kelamin: "L" as "L" | "P", kelas_id: "" });

  const load = async () => {
    const { data: k } = await supabase.from("kelas").select("id,nama_kelas").order("nama_kelas");
    setKelas((k ?? []) as Kls[]);
    let q = supabase.from("siswa").select("*").order("nama");
    if (filterKelas !== "all") q = q.eq("kelas_id", filterKelas);
    const { data: s } = await q;
    setSiswa((s ?? []) as Siswa[]);
  };
  useEffect(() => { load(); }, [filterKelas]);

  const tambah = async () => {
    if (!form.nama.trim()) return toast.error("Nama wajib");
    const { error } = await supabase.from("siswa").insert({
      nama: form.nama.trim(),
      nisn: form.nisn || null,
      nis: form.nis || null,
      jenis_kelamin: form.jenis_kelamin,
      kelas_id: form.kelas_id || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Siswa ditambahkan"); setForm({ nama: "", nisn: "", nis: "", jenis_kelamin: "L", kelas_id: "" }); load(); }
  };

  const hapus = async (id: string) => {
    if (!confirm("Hapus siswa ini? Semua data terkait juga akan terhapus.")) return;
    const { error } = await supabase.from("siswa").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  const namaKelas = (id: string | null) => kelas.find((k) => k.id === id)?.nama_kelas ?? "—";

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kelola Siswa</h1>
        <p className="text-muted-foreground">Tambah dan kelola data siswa.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Tambah Siswa</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="space-y-2"><Label>Nama Lengkap</Label>
            <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} maxLength={100} /></div>
          <div className="space-y-2"><Label>NISN</Label>
            <Input value={form.nisn} onChange={(e) => setForm({ ...form, nisn: e.target.value })} maxLength={20} /></div>
          <div className="space-y-2"><Label>NIS</Label>
            <Input value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} maxLength={20} /></div>
          <div className="space-y-2"><Label>Jenis Kelamin</Label>
            <Select value={form.jenis_kelamin} onValueChange={(v) => setForm({ ...form, jenis_kelamin: v as "L" | "P" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="L">Laki-laki</SelectItem><SelectItem value="P">Perempuan</SelectItem></SelectContent>
            </Select></div>
          <div className="space-y-2"><Label>Kelas</Label>
            <Select value={form.kelas_id} onValueChange={(v) => setForm({ ...form, kelas_id: v })}>
              <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
              <SelectContent>{kelas.map(k => <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>)}</SelectContent>
            </Select></div>
          <div className="flex items-end"><Button onClick={tambah} className="w-full">Tambah Siswa</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Daftar Siswa ({siswa.length})</CardTitle>
          <Select value={filterKelas} onValueChange={setFilterKelas}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua kelas</SelectItem>
              {kelas.map(k => <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-2">
          {siswa.length === 0 && <p className="text-sm text-muted-foreground">Belum ada siswa.</p>}
          {siswa.map(s => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border">
              <div>
                <div className="font-medium">{s.nama} <span className="text-xs text-muted-foreground">({s.jenis_kelamin})</span></div>
                <div className="text-xs text-muted-foreground">
                  NISN: {s.nisn ?? "-"} • NIS: {s.nis ?? "-"} • Kelas: {namaKelas(s.kelas_id)}
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <Badge variant={s.total_poin >= 50 ? "destructive" : "secondary"}>{s.total_poin} poin</Badge>
                <Button size="sm" variant="ghost" onClick={() => hapus(s.id)}><Trash2 size={14} /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
