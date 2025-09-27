-- Fix database issues for chat functionality
-- Run this in your Supabase SQL Editor

-- 1. Fix messages table foreign key constraints
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_ad_id_fkey;

ALTER TABLE public.messages 
ADD CONSTRAINT messages_ad_id_fkey 
FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE CASCADE;

ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

ALTER TABLE public.messages 
ADD CONSTRAINT messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;

ALTER TABLE public.messages 
ADD CONSTRAINT messages_receiver_id_fkey 
FOREIGN KEY (receiver_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Fix profiles table RLS policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Fix user_roles table RLS policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Fix messages table RLS policies
DROP POLICY IF EXISTS "Users can read their own messages" ON public.messages;
CREATE POLICY "Users can read their own messages" ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (
    auth.uid() = receiver_id
  );

-- 5. Add admin policy for messages (for admin dashboard)
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.messages;
CREATE POLICY "Admins can manage all messages" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_roles TO authenticated; 