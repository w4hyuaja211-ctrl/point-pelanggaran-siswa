import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Trash2 } from "lucide-react";

interface Siswa { id: string; nama: string; kelas_id: string | null }
interface Kls { id: string; nama_kelas: string }
interface Katalog { id: string; nama: string; poin: number; kategori: string }
interface TA { id: string; nama: string; semester: "ganjil" | "genap" }
interface Plg {
  id: string; jenis: string; poin: number; tanggal: string; deskripsi: string | null;
  siswa: { nama: string } | null;
}

export default function InputPelanggaran() {
  const { user } = useAuth();
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [kelas, setKelas] = useState<Kls[]>([]);
  const [katalog, setKatalog] = useState<Katalog[]>([]);
  const [ta, setTa] = useState<TA | null>(null);
  const [recent, setRecent] = useState<Plg[]>([]);

  const [filterKelas, setFilterKelas] = useState("all");
  const [siswaId, setSiswaId] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [katalogId, setKatalogId] = useState("");
  const [customNama, setCustomNama] = useState("");
  const [customPoin, setCustomPoin] = useState("5");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [deskripsi, setDeskripsi] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [k, s, kt, taRes, p] = await Promise.all([
      supabase.from("kelas").select("id,nama_kelas").order("nama_kelas"),
      supabase.from("siswa").select("id,nama,kelas_id").order("nama"),
      supabase.from("katalog_pelanggaran").select("*").order("nama"),
      supabase.from("tahun_ajaran").select("*").eq("is_aktif", true).maybeSingle(),
      supabase.from("pelanggaran")
        .select("id,jenis,poin,tanggal,deskripsi,siswa:siswa_id(nama)")
        .order("created_at", { ascending: false }).limit(10),
    ]);
    setKelas((k.data ?? []) as Kls[]);
    setSiswa((s.data ?? []) as Siswa[]);
    setKatalog((kt.data ?? []) as Katalog[]);
    setTa((taRes.data ?? null) as TA | null);
    setRecent((p.data ?? []) as unknown as Plg[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = filterKelas === "all" ? siswa : siswa.filter((x) => x.kelas_id === filterKelas);

  const submit = async () => {
    if (!siswaId) return toast.error("Pilih siswa");
    if (!ta) return toast.error("Belum ada tahun ajaran aktif. Hubungi admin.");
    let jenis = "", poin = 0, kid: string | null = null;
    if (useCustom) {
      if (!customNama.trim()) return toast.error("Isi nama pelanggaran");
      poin = parseInt(customPoin); if (isNaN(poin)) return toast.error("Poin tidak valid");
      jenis = customNama.trim();
    } else {
      const k = katalog.find((x) => x.id === katalogId);
      if (!k) return toast.error("Pilih jenis pelanggaran");
      jenis = k.nama; poin = k.poin; kid = k.id;
    }
    setBusy(true);
    const { error } = await supabase.from("pelanggaran").insert({
      siswa_id: siswaId, katalog_id: kid, jenis, poin, tanggal,
      deskripsi: deskripsi || null, dilaporkan_oleh: user?.id,
      tahun_ajaran_id: ta.id, semester: ta.semester,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Pelanggaran tercatat");
      setDeskripsi(""); setSiswaId(""); setCustomNama(""); load();
    }
  };

  const hapus = async (id: string) => {
    if (!confirm("Hapus catatan ini?")) return;
    const { error } = await supabase.from("pelanggaran").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Input Pelanggaran</h1>
          <p className="text-muted-foreground">Catat pelanggaran siswa.</p>
        </div>
        {ta && <Badge variant="secondary">T.A. {ta.nama} • {ta.semester}</Badge>}
      </div>

      <Card>
        <CardHeader><CardTitle>Form</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Filter Kelas</Label>
            <Select value={filterKelas} onValueChange={setFilterKelas}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kelas</SelectItem>
                {kelas.map(k => <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Siswa</Label>
            <Select value={siswaId} onValueChange={setSiswaId}>
              <SelectTrigger><SelectValue placeholder="Pilih siswa" /></SelectTrigger>
              <SelectContent>
                {filtered.map(s => <SelectItem key={s.id} value={s.id}>{s.nama}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2 flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Switch checked={useCustom} onCheckedChange={setUseCustom} id="custom" />
            <Label htmlFor="custom" className="cursor-pointer">Pelanggaran custom (di luar katalog)</Label>
          </div>

          {!useCustom ? (
            <div className="sm:col-span-2 space-y-2">
              <Label>Jenis Pelanggaran (dari katalog)</Label>
              <Select value={katalogId} onValueChange={setKatalogId}>
                <SelectTrigger><SelectValue placeholder="Pilih dari katalog" /></SelectTrigger>
                <SelectContent>
                  {katalog.map(k => (
                    <SelectItem key={k.id} value={k.id}>{k.nama} • {k.poin} poin</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Nama Pelanggaran</Label>
                <Input value={customNama} onChange={(e) => setCustomNama(e.target.value)} maxLength={150} />
              </div>
              <div className="space-y-2">
                <Label>Poin</Label>
                <Input type="number" min={0} value={customPoin} onChange={(e) => setCustomPoin(e.target.value)} />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Tanggal</Label>
            <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Keterangan (opsional)</Label>
            <Textarea value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} maxLength={500} />
          </div>
          <Button onClick={submit} disabled={busy} className="sm:col-span-2">
            {busy ? "Menyimpan..." : "Catat Pelanggaran"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pelanggaran Terbaru</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {recent.length === 0 && <p className="text-sm text-muted-foreground">Belum ada catatan.</p>}
          {recent.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <div className="font-medium">{p.siswa?.nama ?? "—"}</div>
                <div className="text-sm text-muted-foreground">{p.jenis} • {p.tanggal}</div>
                {p.deskripsi && <div className="text-xs text-muted-foreground mt-1">{p.deskripsi}</div>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={p.poin >= 50 ? "destructive" : "secondary"}>{p.poin} poin</Badge>
                <Button size="sm" variant="ghost" onClick={() => hapus(p.id)}><Trash2 size={14} /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
