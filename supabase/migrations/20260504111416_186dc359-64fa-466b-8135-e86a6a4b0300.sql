
-- Fix search_path for trigger functions
ALTER FUNCTION public.ensure_single_active_tahun_ajaran() SET search_path = public;

-- Revoke public/authenticated execute on internal trigger functions
REVOKE EXECUTE ON FUNCTION public.ensure_single_active_tahun_ajaran() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_total_poin_siswa() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- has_role must remain executable for RLS policies (it's used in policies via auth.uid)
-- Keep it executable to authenticated since policies need it
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
