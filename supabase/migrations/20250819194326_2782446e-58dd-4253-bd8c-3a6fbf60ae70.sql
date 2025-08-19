-- Create role enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'employee', 'student', 'guest');

-- Create access_level enum for different access permissions
CREATE TYPE public.access_level AS ENUM ('full', 'restricted', 'visitor');

-- Create tappass_users table for additional user information
CREATE TABLE public.tappass_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  digital_id UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  role user_role NOT NULL DEFAULT 'guest',
  access_level access_level NOT NULL DEFAULT 'visitor',
  full_name TEXT,
  department TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create access_logs table for tracking access attempts
CREATE TABLE public.access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  digital_id UUID NOT NULL,
  reader_user_id UUID REFERENCES auth.users(id),
  access_granted BOOLEAN NOT NULL,
  access_reason TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tappass_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for tappass_users
CREATE POLICY "Users can view their own profile" 
ON public.tappass_users 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.tappass_users 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.tappass_users 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.tappass_users tu 
  WHERE tu.user_id = auth.uid() AND tu.role = 'admin'
));

CREATE POLICY "Admins can update all profiles" 
ON public.tappass_users 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.tappass_users tu 
  WHERE tu.user_id = auth.uid() AND tu.role = 'admin'
));

CREATE POLICY "System can insert new users" 
ON public.tappass_users 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policies for access_logs
CREATE POLICY "Users can view their own access logs" 
ON public.access_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.tappass_users tu 
  WHERE tu.digital_id = access_logs.digital_id AND tu.user_id = auth.uid()
));

CREATE POLICY "Users can view logs they created as readers" 
ON public.access_logs 
FOR SELECT 
USING (auth.uid() = reader_user_id);

CREATE POLICY "Admins can view all access logs" 
ON public.access_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.tappass_users tu 
  WHERE tu.user_id = auth.uid() AND tu.role = 'admin'
));

CREATE POLICY "Authenticated users can insert access logs" 
ON public.access_logs 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create function to automatically create tappass_user when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_tappass_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.tappass_users (user_id, full_name, role, access_level)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'guest',
    'visitor'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-creating tappass_user
CREATE TRIGGER on_auth_user_created_tappass
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_tappass_user();

-- Create function to update updated_at timestamp
CREATE TRIGGER update_tappass_users_updated_at
  BEFORE UPDATE ON public.tappass_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();