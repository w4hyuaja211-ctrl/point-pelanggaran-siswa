import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, Upload, FileSpreadsheet } from "lucide-react";
import type { AppRole } from "@/hooks/useAuth";

type Row = Record<string, any>;
interface Result { ok: boolean; nama: string; email?: string; code?: string; role?: string; error?: string }
interface Kls { id: string; nama_kelas: string }

const ROLES: { value: AppRole; label: string; cols: string[] }[] = [
  { value: "admin", label: "Admin", cols: ["nama", "email"] },
  { value: "guru_piket", label: "Guru Piket", cols: ["nama", "email"] },
  { value: "wali_kelas", label: "Wali Kelas", cols: ["nama", "email"] },
  { value: "siswa", label: "Siswa", cols: ["nama", "nis", "nisn", "jenis_kelamin (L/P)", "kelas (nama)"] },
];

export default function ImportData() {
  const [role, setRole] = useState<AppRole>("siswa");
  const [rows, setRows] = useState<Row[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  const [kelas, setKelas] = useState<Kls[]>([]);

  useEffect(() => {
    supabase.from("kelas").select("id,nama_kelas").then(({ data }) => setKelas((data ?? []) as Kls[]));
  }, []);

  const onFile = async (file: File) => {
    if (!/\.xlsx$/i.test(file.name)) {
      toast.error("Hanya file Excel (.xlsx) yang didukung");
      return;
    }
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data: Row[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
    if (data.length === 0) return toast.error("File kosong");
    // normalize keys to lowercase
    const norm = data.map((r) => {
      const o: Row = {};
      for (const k in r) o[k.toString().trim().toLowerCase()] = r[k];
      return o;
    });
    setRows(norm);
    setResults([]);
    toast.success(`${norm.length} baris terbaca`);
  };

  const downloadTemplate = () => {
    const conf = ROLES.find((r) => r.value === role)!;
    const headers = role === "siswa"
      ? ["nama", "nis", "nisn", "jenis_kelamin", "kelas"]
      : ["nama", "email"];
    const sample = role === "siswa"
      ? [{ nama: "Budi Santoso", nis: "1001", nisn: "0012345678", jenis_kelamin: "L", kelas: "X-IPA-1" }]
      : [{ nama: "Pak Andi", email: "andi@sekolah.id" }];
    const ws = XLSX.utils.json_to_sheet(sample, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `template-${role}.xlsx`);
  };

  const proses = async () => {
    if (rows.length === 0) return toast.error("Belum ada data");
    setBusy(true);
    setResults([]);
    try {
      const users = rows.map((r) => {
        const base: any = { nama: String(r.nama ?? "").trim(), role };
        if (r.email) base.email = String(r.email).trim();
        if (role === "siswa") {
          base.nis = r.nis ? String(r.nis) : null;
          base.nisn = r.nisn ? String(r.nisn) : null;
          base.jenis_kelamin = String(r.jenis_kelamin ?? "L").toUpperCase().startsWith("P") ? "P" : "L";
          const kelasName = String(r.kelas ?? "").trim().toLowerCase();
          const k = kelas.find((kk) => kk.nama_kelas.toLowerCase() === kelasName);
          base.kelas_id = k?.id ?? null;
        }
        return base;
      });
      const { data, error } = await supabase.functions.invoke("admin-manage-user", {
        body: { action: "create_users", users },
      });
      if (error) throw error;
      setResults(data.results as Result[]);
      const okCount = (data.results as Result[]).filter((r) => r.ok).length;
      toast.success(`${okCount} dari ${users.length} berhasil dibuat`);
      setRows([]);
    } catch (e: any) {
      toast.error(e.message || "Gagal proses");
    } finally {
      setBusy(false);
    }
  };

  const exportKode = () => {
    const ok = results.filter((r) => r.ok);
    if (ok.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(ok.map((r) => ({
      nama: r.nama, email: r.email, role: r.role, kode_login: r.code,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Akun");
    XLSX.writeFile(wb, `daftar-akun-${role}-${Date.now()}.xlsx`);
  };

  const conf = ROLES.find((r) => r.value === role)!;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import Data dari Excel</h1>
        <p className="text-muted-foreground">Buat banyak akun (admin/guru/wali/siswa) sekaligus dari file .xlsx.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>1. Pilih Peran & Template</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Peran yang akan diimpor</Label>
              <Select value={role} onValueChange={(v) => { setRole(v as AppRole); setRows([]); setResults([]); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={downloadTemplate}>
                <Download size={16} /> Unduh Template .xlsx
              </Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Kolom yang dikenali: <span className="font-mono">{conf.cols.join(", ")}</span>.
            {role === "siswa" && " Kolom kelas dicocokkan berdasarkan nama kelas yang sudah dibuat."}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>2. Unggah File Excel</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 cursor-pointer hover:bg-muted/50 transition-colors">
            <FileSpreadsheet className="text-primary" size={32} />
            <div className="text-sm font-medium">Klik untuk pilih file (.xlsx)</div>
            <div className="text-xs text-muted-foreground">Hanya format Excel murni, bukan CSV</div>
            <input type="file" accept=".xlsx" className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </label>

          {rows.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm">
                <Badge variant="secondary">{rows.length} baris siap diproses</Badge>
              </div>
              <div className="max-h-60 overflow-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>{Object.keys(rows[0]).map((k) => <th key={k} className="text-left p-2 font-medium">{k}</th>)}</tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 10).map((r, i) => (
                      <tr key={i} className="border-t">
                        {Object.keys(rows[0]).map((k) => <td key={k} className="p-2 truncate max-w-[160px]">{String(r[k] ?? "")}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button onClick={proses} disabled={busy} className="w-full">
                <Upload size={16} /> {busy ? "Memproses..." : `Buat ${rows.length} akun & generate kode`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Hasil Import</CardTitle>
            <Button size="sm" variant="outline" onClick={exportKode}>
              <Download size={14} /> Unduh Daftar Kode
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-auto">
            {results.map((r, i) => (
              <div key={i} className={`p-3 rounded-lg border text-sm flex items-center justify-between gap-3 ${r.ok ? "bg-success/5" : "bg-destructive/5"}`}>
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.nama}</div>
                  {r.ok ? (
                    <div className="text-xs text-muted-foreground truncate">{r.email}</div>
                  ) : (
                    <div className="text-xs text-destructive truncate">{r.error}</div>
                  )}
                </div>
                {r.ok && <Badge variant="default" className="font-mono">{r.code}</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
