-- Function to generate a random salt
CREATE OR REPLACE FUNCTION public.generate_salt()
RETURNS text AS $$
BEGIN
    RETURN gen_salt('bf'); -- Using bcrypt for salt generation
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to hash a credential (username or password)
CREATE OR REPLACE FUNCTION public.hash_credential(credential text, salt text)
RETURNS text AS $$
BEGIN
    RETURN crypt(credential, salt);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;