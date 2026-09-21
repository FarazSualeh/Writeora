-- Only the publication owner may hold the admin role.
DELETE FROM public.user_roles
WHERE role = 'admin'
  AND user_id NOT IN (
    SELECT id FROM auth.users WHERE lower(email) = 'farazsualeh75@gmail.com'
  );

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = 'farazsualeh75@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

CREATE OR REPLACE FUNCTION public.grant_role_on_verify() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE invited public.app_role;
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN RETURN NEW; END IF;

  IF lower(COALESCE(NEW.email, '')) = 'farazsualeh75@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
    RETURN NEW;
  END IF;

  SELECT role INTO invited
  FROM public.invites
  WHERE lower(email) = lower(NEW.email)
  LIMIT 1;

  IF invited = 'author' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, invited)
    ON CONFLICT DO NOTHING;
    UPDATE public.invites
    SET accepted_at = now()
    WHERE lower(email) = lower(NEW.email);
  END IF;

  RETURN NEW;
END; $$;

DROP POLICY IF EXISTS "Admins manage contributor roles" ON public.user_roles;
CREATE POLICY "Admins manage contributor roles" ON public.user_roles
FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  AND role = 'author'
);
