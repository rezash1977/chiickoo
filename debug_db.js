
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mosujjmlfwemaaanhrcm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vc3Vqam1sZndlbWFhYW5ocmNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNzI4MTksImV4cCI6MjA2Mzc0ODgxOX0.vegUrqTj6ou1PKf6Jq6xehaFMuya1j9XKPRJbF2WZj4";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function check() {
    const { data: ads } = await supabase.from('ads').select('id, title, location, categories(name)').ilike('location', '%شهرک%');
    console.log(JSON.stringify(ads, null, 2));
}

check();
