import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Item { id: string; nama: string; kategori: string; poin: number }

export default function KatalogPelanggaran() {
  const [rows, setRows] = useState<Item[]>([]);
  const [form, setForm] = useState({ nama: "", kategori: "Umum", poin: "5" });

  const load = async () => {
    const { data } = await supabase.from("katalog_pelanggaran").select("*").order("kategori").order("nama");
    setRows((data ?? []) as Item[]);
  };
  useEffect(() => { load(); }, []);

  const tambah = async () => {
    const poin = parseInt(form.poin);
    if (!form.nama.trim() || isNaN(poin)) return toast.error("Lengkapi nama & poin");
    const { error } = await supabase.from("katalog_pelanggaran").insert({
      nama: form.nama.trim(), kategori: form.kategori.trim() || "Umum", poin,
    });
    if (error) toast.error(error.message);
    else { toast.success("Ditambahkan"); setForm({ nama: "", kategori: "Umum", poin: "5" }); load(); }
  };

  const hapus = async (id: string) => {
    if (!confirm("Hapus item katalog ini?")) return;
    const { error } = await supabase.from("katalog_pelanggaran").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Katalog Pelanggaran</h1>
        <p className="text-muted-foreground">Daftar jenis pelanggaran beserta poinnya.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Tambah Item</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-4 gap-3 items-end">
          <div className="space-y-2 sm:col-span-2"><Label>Nama Pelanggaran</Label>
            <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} maxLength={150} /></div>
          <div className="space-y-2"><Label>Kategori</Label>
            <Input value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} maxLength={50} /></div>
          <div className="space-y-2"><Label>Poin</Label>
            <Input type="number" min={0} value={form.poin} onChange={(e) => setForm({ ...form, poin: e.target.value })} /></div>
          <Button onClick={tambah} className="sm:col-span-4">Tambah</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Daftar ({rows.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {rows.map(r => (
            <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border">
              <div>
                <div className="font-medium">{r.nama}</div>
                <Badge variant="outline" className="mt-1">{r.kategori}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={r.poin >= 50 ? "destructive" : "secondary"}>{r.poin} poin</Badge>
                <Button size="sm" variant="ghost" onClick={() => hapus(r.id)}><Trash2 size={14} /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
