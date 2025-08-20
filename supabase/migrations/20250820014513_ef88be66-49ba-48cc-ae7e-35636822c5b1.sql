-- Fix recursive RLS policy issue on tappass_users table
-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.tappass_users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.tappass_users;

-- Create a security definer function to safely check admin role
CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tappass_users
    WHERE user_id = _user_id
      AND role = 'admin'
  );
$$;

-- Create new non-recursive policies for admins
CREATE POLICY "Admins can view all profiles" 
ON public.tappass_users 
FOR SELECT 
USING (public.is_admin_user(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Admins can update all profiles" 
ON public.tappass_users 
FOR UPDATE 
USING (public.is_admin_user(auth.uid()) OR auth.uid() = user_id);