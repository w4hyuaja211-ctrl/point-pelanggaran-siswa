import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Check } from "lucide-react";

interface Row { id: string; nama: string; semester: "ganjil" | "genap"; is_aktif: boolean }

export default function TahunAjaran() {
  const [rows, setRows] = useState<Row[]>([]);
  const [nama, setNama] = useState("");
  const [semester, setSemester] = useState<"ganjil" | "genap">("ganjil");

  const load = async () => {
    const { data } = await supabase.from("tahun_ajaran").select("*").order("nama", { ascending: false });
    setRows((data ?? []) as Row[]);
  };
  useEffect(() => { load(); }, []);

  const tambah = async () => {
    if (!/^\d{4}\/\d{4}$/.test(nama.trim())) return toast.error("Format: 2025/2026");
    const { error } = await supabase.from("tahun_ajaran").insert({ nama: nama.trim(), semester });
    if (error) toast.error(error.message); else { toast.success("Ditambahkan"); setNama(""); load(); }
  };

  const setAktif = async (id: string) => {
    const { error } = await supabase.from("tahun_ajaran").update({ is_aktif: true }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Diaktifkan"); load(); }
  };

  const hapus = async (id: string) => {
    if (!confirm("Hapus tahun ajaran ini?")) return;
    const { error } = await supabase.from("tahun_ajaran").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tahun Ajaran</h1>
        <p className="text-muted-foreground">Kelola tahun pelajaran & semester aktif.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Tambah baru</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-3 items-end">
          <div className="space-y-2">
            <Label>Tahun Pelajaran</Label>
            <Input placeholder="2025/2026" value={nama} onChange={(e) => setNama(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Semester</Label>
            <Select value={semester} onValueChange={(v) => setSemester(v as "ganjil" | "genap")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ganjil">Ganjil</SelectItem>
                <SelectItem value="genap">Genap</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={tambah}>Tambah</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Daftar</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {rows.length === 0 && <p className="text-muted-foreground text-sm">Belum ada data.</p>}
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border">
              <div>
                <div className="font-medium">{r.nama} <span className="text-muted-foreground font-normal text-sm capitalize">• {r.semester}</span></div>
                {r.is_aktif && <Badge className="bg-success text-success-foreground mt-1">Aktif</Badge>}
              </div>
              <div className="flex gap-2">
                {!r.is_aktif && (
                  <Button size="sm" variant="outline" onClick={() => setAktif(r.id)}>
                    <Check size={14} /> Aktifkan
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => hapus(r.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
