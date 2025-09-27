-- Temporarily disable RLS for testing
-- Run this in your Supabase SQL Editor

-- Disable RLS on messages table temporarily
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Disable RLS on profiles table temporarily  
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on user_roles table temporarily
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_roles TO authenticated; 