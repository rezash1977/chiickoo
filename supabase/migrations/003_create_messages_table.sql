-- Create messages table for chat functionality
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_ad_id ON public.messages(ad_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read messages they sent or received
CREATE POLICY "Users can read their own messages" ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- Policy to allow users to insert messages
CREATE POLICY "Users can insert messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );

-- Policy to allow users to update their own messages (for marking as read)
CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (
    auth.uid() = receiver_id
  );

-- Policy to allow admins to manage all messages
CREATE POLICY "Admins can manage all messages" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.messages TO authenticated; 