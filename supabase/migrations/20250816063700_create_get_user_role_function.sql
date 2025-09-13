CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS public.role_type AS $$
BEGIN
    RETURN (
        SELECT u.role
        FROM public.users u
        WHERE u.id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
