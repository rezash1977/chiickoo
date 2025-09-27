// Test script for messages table
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mosujjmlfwemaaanhrcm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vc3Vqam1sZndlbWFhYW5ocmNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNzI4MTksImV4cCI6MjA2Mzc0ODgxOX0.vegUrqTj6ou1PKf6Jq6xehaFMuya1j9XKPRJbF2WZj4";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testMessagesTable() {
  try {
    console.log('Testing messages table...');
    
    // Test 1: Check if table exists
    const { data, error } = await supabase
      .from('messages')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Messages table error:', error);
      console.log('💡 You need to create the messages table first.');
      console.log('📝 Run the SQL in supabase/migrations/003_create_messages_table.sql');
    } else {
      console.log('✅ Messages table exists!');
      
      // Test 2: Try to insert a test message
      const testMessage = {
        ad_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
        sender_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
        receiver_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
        content: 'Test message from script',
        is_read: false
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('messages')
        .insert([testMessage])
        .select();
      
      if (insertError) {
        console.error('❌ Insert test failed:', insertError);
      } else {
        console.log('✅ Insert test successful!');
        
        // Clean up test data
        if (insertData && insertData.length > 0) {
          await supabase
            .from('messages')
            .delete()
            .eq('id', insertData[0].id);
          console.log('🧹 Test data cleaned up');
        }
      }
    }
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testMessagesTable(); 