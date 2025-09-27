-- Fix RLS policies for messages table
-- Run this in your Supabase SQL Editor

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Users can read their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.messages;

-- 2. Create new policies with better logic
-- Allow all authenticated users to read messages (for admin dashboard)
CREATE POLICY "Allow read messages" ON public.messages
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to insert messages
CREATE POLICY "Allow insert messages" ON public.messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own messages
CREATE POLICY "Allow update messages" ON public.messages
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow admins to delete messages
CREATE POLICY "Allow delete messages" ON public.messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Also fix profiles table policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Allow read profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Allow update profiles" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Allow insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Fix user_roles table policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Allow read user roles" ON public.user_roles
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Allow manage user roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_roles TO authenticated; 