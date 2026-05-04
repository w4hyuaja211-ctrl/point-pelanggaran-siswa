import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function PengaturanSekolah() {
  const [id, setId] = useState<string | null>(null);
  const [form, setForm] = useState({ nama_sekolah: "", kepala_sekolah: "", nip_kepala: "", alamat: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase
      .from("pengaturan_sekolah")
      .select("*")
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setId(data.id);
          setForm({
            nama_sekolah: data.nama_sekolah ?? "",
            kepala_sekolah: data.kepala_sekolah ?? "",
            nip_kepala: data.nip_kepala ?? "",
            alamat: data.alamat ?? "",
          });
        }
      });
  }, []);

  const save = async () => {
    if (!form.nama_sekolah.trim()) return toast.error("Nama sekolah wajib diisi");
    setBusy(true);
    const payload = { ...form, updated_at: new Date().toISOString() };
    const res = id
      ? await supabase.from("pengaturan_sekolah").update(payload).eq("id", id)
      : await supabase.from("pengaturan_sekolah").insert(payload);
    setBusy(false);
    if (res.error) toast.error(res.error.message);
    else toast.success("Pengaturan disimpan");
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Pengaturan Sekolah</h1>
      <p className="text-muted-foreground mb-6">Identitas sekolah yang muncul di seluruh aplikasi.</p>
      <Card>
        <CardHeader><CardTitle>Identitas</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Sekolah</Label>
            <Input value={form.nama_sekolah} onChange={(e) => setForm({ ...form, nama_sekolah: e.target.value })} maxLength={150} />
          </div>
          <div className="space-y-2">
            <Label>Nama Kepala Sekolah</Label>
            <Input value={form.kepala_sekolah} onChange={(e) => setForm({ ...form, kepala_sekolah: e.target.value })} maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label>NIP Kepala Sekolah</Label>
            <Input value={form.nip_kepala} onChange={(e) => setForm({ ...form, nip_kepala: e.target.value })} maxLength={30} />
          </div>
          <div className="space-y-2">
            <Label>Alamat</Label>
            <Textarea value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} maxLength={500} />
          </div>
          <Button onClick={save} disabled={busy}>{busy ? "Menyimpan..." : "Simpan"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
