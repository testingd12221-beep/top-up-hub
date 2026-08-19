REVOKE ALL ON FUNCTION public.adjust_wallet(UUID, NUMERIC, TEXT, TEXT, TEXT) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.adjust_wallet(UUID, NUMERIC, TEXT, TEXT, TEXT) TO service_role;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;