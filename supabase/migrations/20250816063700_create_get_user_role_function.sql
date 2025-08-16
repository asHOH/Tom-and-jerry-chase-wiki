CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS public.role_type AS $$
BEGIN
    RETURN (
        SELECT r.name
        FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE u.id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;