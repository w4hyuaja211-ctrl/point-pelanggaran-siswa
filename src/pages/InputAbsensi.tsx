import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type Status = "hadir" | "sakit" | "izin" | "alpa";
interface Siswa { id: string; nama: string }
interface Kls { id: string; nama_kelas: string }
interface TA { id: string; nama: string; semester: "ganjil" | "genap" }

const STATUS_OPTIONS: { v: Status; label: string; cls: string }[] = [
  { v: "hadir", label: "H", cls: "bg-success text-success-foreground" },
  { v: "sakit", label: "S", cls: "bg-warning text-warning-foreground" },
  { v: "izin", label: "I", cls: "bg-primary text-primary-foreground" },
  { v: "alpa", label: "A", cls: "bg-destructive text-destructive-foreground" },
];

export default function InputAbsensi() {
  const { user } = useAuth();
  const [kelas, setKelas] = useState<Kls[]>([]);
  const [kelasId, setKelasId] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [keterangan, setKeterangan] = useState<Record<string, string>>({});
  const [ta, setTa] = useState<TA | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("kelas").select("id,nama_kelas").order("nama_kelas").then(({ data }) => setKelas((data ?? []) as Kls[]));
    supabase.from("tahun_ajaran").select("*").eq("is_aktif", true).maybeSingle().then(({ data }) => setTa(data as TA | null));
  }, []);

  useEffect(() => {
    if (!kelasId) { setSiswa([]); return; }
    (async () => {
      const { data: s } = await supabase.from("siswa").select("id,nama").eq("kelas_id", kelasId).order("nama");
      const list = (s ?? []) as Siswa[];
      setSiswa(list);
      // load existing absensi for tanggal
      const { data: ex } = await supabase.from("absensi")
        .select("siswa_id,status,keterangan").eq("tanggal", tanggal).eq("kelas_id", kelasId);
      const st: Record<string, Status> = {};
      const kt: Record<string, string> = {};
      list.forEach((x) => { st[x.id] = "hadir"; });
      (ex ?? []).forEach((r) => {
        st[r.siswa_id] = r.status as Status;
        if (r.keterangan) kt[r.siswa_id] = r.keterangan;
      });
      setStatus(st); setKeterangan(kt);
    })();
  }, [kelasId, tanggal]);

  const setSt = (id: string, v: Status) => setStatus((p) => ({ ...p, [id]: v }));
  const setKet = (id: string, v: string) => setKeterangan((p) => ({ ...p, [id]: v }));

  const simpan = async () => {
    if (!kelasId) return toast.error("Pilih kelas");
    if (!ta) return toast.error("Belum ada tahun ajaran aktif. Hubungi admin.");
    setBusy(true);
    const rows = siswa.map((s) => ({
      tanggal, kelas_id: kelasId, siswa_id: s.id,
      status: status[s.id] ?? "hadir",
      keterangan: keterangan[s.id] || null,
      dicatat_oleh: user?.id,
      tahun_ajaran_id: ta.id, semester: ta.semester,
    }));
    const { error } = await supabase.from("absensi").upsert(rows, { onConflict: "tanggal,siswa_id" });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Absensi tersimpan");
  };

  const counts = STATUS_OPTIONS.reduce<Record<Status, number>>((acc, o) => {
    acc[o.v] = Object.values(status).filter((v) => v === o.v).length; return acc;
  }, { hadir: 0, sakit: 0, izin: 0, alpa: 0 });

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Input Absensi</h1>
          <p className="text-muted-foreground">Rekap kehadiran siswa per kelas.</p>
        </div>
        {ta && <Badge variant="secondary">T.A. {ta.nama} • {ta.semester}</Badge>}
      </div>

      <Card>
        <CardContent className="grid sm:grid-cols-3 gap-3 pt-6">
          <div className="space-y-2">
            <Label>Kelas</Label>
            <Select value={kelasId} onValueChange={setKelasId}>
              <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
              <SelectContent>{kelas.map(k => <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tanggal</Label>
            <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={simpan} disabled={busy || !kelasId} className="w-full">
              {busy ? "Menyimpan..." : "Simpan Absensi"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {siswa.length > 0 && (
        <>
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map(o => (
              <Badge key={o.v} className={o.cls}>{o.label}: {counts[o.v]}</Badge>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle>Daftar Siswa ({siswa.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {siswa.map((s, i) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border">
                  <div className="flex-1 min-w-[150px]">
                    <div className="font-medium">{i + 1}. {s.nama}</div>
                    {(status[s.id] === "sakit" || status[s.id] === "izin" || status[s.id] === "alpa") && (
                      <Input
                        className="mt-2 h-8 text-xs"
                        placeholder="Keterangan (opsional)"
                        value={keterangan[s.id] ?? ""}
                        onChange={(e) => setKet(s.id, e.target.value)}
                        maxLength={200}
                      />
                    )}
                  </div>
                  <div className="flex gap-1">
                    {STATUS_OPTIONS.map(o => (
                      <button
                        key={o.v}
                        onClick={() => setSt(s.id, o.v)}
                        className={cn(
                          "w-9 h-9 rounded-md text-sm font-bold transition-all",
                          status[s.id] === o.v ? o.cls + " scale-110 shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/70"
                        )}
                      >{o.label}</button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
      {kelasId && siswa.length === 0 && (
        <p className="text-sm text-muted-foreground">Belum ada siswa di kelas ini.</p>
      )}
    </div>
  );
}
