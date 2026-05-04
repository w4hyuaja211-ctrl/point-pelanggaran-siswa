import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Kls { id: string; nama_kelas: string; tingkat: string; wali_kelas_id: string | null }
interface Profile { id: string; nama_lengkap: string }

export default function KelasAdmin() {
  const [rows, setRows] = useState<Kls[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [form, setForm] = useState({ nama_kelas: "", tingkat: "X", wali_kelas_id: "" });

  const load = async () => {
    const { data } = await supabase.from("kelas").select("*").order("tingkat").order("nama_kelas");
    setRows((data ?? []) as Kls[]);
    // ambil semua profile yg punya role wali_kelas
    const { data: wRoles } = await supabase.from("user_roles").select("user_id").eq("role", "wali_kelas");
    const ids = (wRoles ?? []).map((r) => r.user_id);
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id,nama_lengkap").in("id", ids);
      setProfiles((ps ?? []) as Profile[]);
    } else setProfiles([]);
  };
  useEffect(() => { load(); }, []);

  const tambah = async () => {
    if (!form.nama_kelas.trim()) return toast.error("Nama kelas wajib");
    const payload = {
      nama_kelas: form.nama_kelas.trim(),
      tingkat: form.tingkat,
      wali_kelas_id: form.wali_kelas_id || null,
    };
    const { error } = await supabase.from("kelas").insert(payload);
    if (error) toast.error(error.message);
    else { toast.success("Kelas ditambahkan"); setForm({ nama_kelas: "", tingkat: "X", wali_kelas_id: "" }); load(); }
  };

  const hapus = async (id: string) => {
    if (!confirm("Hapus kelas ini?")) return;
    const { error } = await supabase.from("kelas").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  const setWali = async (id: string, walId: string) => {
    const { error } = await supabase.from("kelas").update({ wali_kelas_id: walId || null }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Wali kelas diperbarui"); load(); }
  };

  const namaWali = (id: string | null) => profiles.find((p) => p.id === id)?.nama_lengkap ?? "—";

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kelas</h1>
        <p className="text-muted-foreground">Kelola daftar kelas & wali kelasnya.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Tambah Kelas</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-4 gap-3 items-end">
          <div className="space-y-2">
            <Label>Tingkat</Label>
            <Select value={form.tingkat} onValueChange={(v) => setForm({ ...form, tingkat: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["7","8","9","X","XI","XII"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nama Kelas</Label>
            <Input placeholder="X IPA 1" value={form.nama_kelas} onChange={(e) => setForm({ ...form, nama_kelas: e.target.value })} />
          </div>
          <div className="space-y-2 sm:col-span-1">
            <Label>Wali Kelas</Label>
            <Select value={form.wali_kelas_id} onValueChange={(v) => setForm({ ...form, wali_kelas_id: v })}>
              <SelectTrigger><SelectValue placeholder="(opsional)" /></SelectTrigger>
              <SelectContent>
                {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.nama_lengkap}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={tambah}>Tambah</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Daftar Kelas</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {rows.length === 0 && <p className="text-muted-foreground text-sm">Belum ada kelas.</p>}
          {rows.map((k) => (
            <div key={k.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border">
              <div>
                <div className="font-medium">{k.nama_kelas} <span className="text-xs text-muted-foreground">• Tingkat {k.tingkat}</span></div>
                <div className="text-xs text-muted-foreground">Wali: {namaWali(k.wali_kelas_id)}</div>
              </div>
              <div className="flex gap-2 items-center">
                <Select value={k.wali_kelas_id ?? ""} onValueChange={(v) => setWali(k.id, v)}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Set wali kelas" /></SelectTrigger>
                  <SelectContent>
                    {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.nama_lengkap}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="ghost" onClick={() => hapus(k.id)}><Trash2 size={14} /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
