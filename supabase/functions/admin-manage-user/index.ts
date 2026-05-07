import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Role = "admin" | "guru_piket" | "wali_kelas" | "siswa";

function genCode(len = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const buf = new Uint8Array(len);
  crypto.getRandomValues(buf);
  for (let i = 0; i < len; i++) out += chars[buf[i] % chars.length];
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE);

  // Verify caller is admin
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace("Bearer ", "");
  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const { data: userRes } = await admin.auth.getUser(token);
  const callerId = userRes?.user?.id;
  if (!callerId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const { data: hasAdmin } = await admin.rpc("has_role", { _user_id: callerId, _role: "admin" });
  if (!hasAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const body = await req.json();
    const action = String(body.action ?? "");

    if (action === "regenerate_code") {
      const userId = String(body.user_id);
      const code = genCode(8);
      // Update auth password = code, and profile login_code
      const { error: pErr } = await admin.auth.admin.updateUserById(userId, { password: code });
      if (pErr) throw pErr;
      const { error: prErr } = await admin.from("profiles").update({ login_code: code }).eq("id", userId);
      if (prErr) throw prErr;
      return new Response(JSON.stringify({ code }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "create_users") {
      // body.users: [{ nama, email?, role, kelas_id?, nis?, nisn?, jenis_kelamin? }]
      const items: any[] = body.users ?? [];
      const results: any[] = [];
      for (const it of items) {
        try {
          const nama = String(it.nama ?? "").trim();
          if (!nama) { results.push({ ok: false, nama: it.nama, error: "Nama kosong" }); continue; }
          const role = (String(it.role ?? "siswa") as Role);
          const code = genCode(8);
          // Synthesize email if missing
          const safeName = nama.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) || "user";
          const email = String(it.email ?? "").trim() || `${safeName}.${code.toLowerCase()}@sipoinsiswa.local`;

          const { data: created, error: cErr } = await admin.auth.admin.createUser({
            email, password: code, email_confirm: true,
            user_metadata: { nama_lengkap: nama },
          });
          if (cErr) { results.push({ ok: false, nama, error: cErr.message }); continue; }
          const uid = created.user!.id;
          // profile may already exist via trigger
          await admin.from("profiles").update({ nama_lengkap: nama, email, login_code: code }).eq("id", uid);
          // ensure role (trigger already adds 'siswa')
          if (role !== "siswa") {
            await admin.from("user_roles").delete().eq("user_id", uid).eq("role", "siswa");
          }
          await admin.from("user_roles").insert({ user_id: uid, role }).select();
          // For siswa: also create siswa row
          if (role === "siswa") {
            await admin.from("siswa").insert({
              user_id: uid,
              nama,
              nisn: it.nisn ? String(it.nisn) : null,
              nis: it.nis ? String(it.nis) : null,
              jenis_kelamin: it.jenis_kelamin === "P" ? "P" : "L",
              kelas_id: it.kelas_id ?? null,
            });
          }
          results.push({ ok: true, nama, email, code, role });
        } catch (e) {
          results.push({ ok: false, nama: it.nama, error: (e as Error).message });
        }
      }
      return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});