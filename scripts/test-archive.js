// Test script for archive functionality
// This script can be run to test the archive system

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testArchiveSystem() {
  console.log('🧪 Testing Archive System...\n');

  try {
    // 1. Test getting ads that need archiving
    console.log('1. Testing ads that need archiving...');
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const { data: adsNeedingArchive, error: fetchError } = await supabase
      .from('ads')
      .select('id, title, user_id, created_at, status')
      .eq('status', 'active')
      .lt('created_at', oneMonthAgo.toISOString());

    if (fetchError) {
      console.error('❌ Error fetching ads:', fetchError);
      return;
    }

    console.log(`✅ Found ${adsNeedingArchive?.length || 0} ads that need archiving`);
    
    if (adsNeedingArchive && adsNeedingArchive.length > 0) {
      console.log('Sample ads:');
      adsNeedingArchive.slice(0, 3).forEach(ad => {
        const daysOld = Math.floor((new Date() - new Date(ad.created_at)) / (1000 * 60 * 60 * 24));
        console.log(`  - ${ad.title} (${daysOld} days old)`);
      });
    }

    // 2. Test getting ads that need warnings
    console.log('\n2. Testing ads that need warnings...');
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() - 25);
    
    const { data: adsNeedingWarning, error: warningError } = await supabase
      .from('ads')
      .select('id, title, user_id, created_at, status')
      .eq('status', 'active')
      .lt('created_at', warningDate.toISOString());

    if (warningError) {
      console.error('❌ Error fetching ads needing warning:', warningError);
      return;
    }

    console.log(`✅ Found ${adsNeedingWarning?.length || 0} ads that need warnings`);
    
    if (adsNeedingWarning && adsNeedingWarning.length > 0) {
      console.log('Sample ads needing warning:');
      adsNeedingWarning.slice(0, 3).forEach(ad => {
        const daysOld = Math.floor((new Date() - new Date(ad.created_at)) / (1000 * 60 * 60 * 24));
        console.log(`  - ${ad.title} (${daysOld} days old)`);
      });
    }

    // 3. Test getting archived ads count
    console.log('\n3. Testing archived ads count...');
    const { count: archivedCount, error: archivedError } = await supabase
      .from('ads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'archived');

    if (archivedError) {
      console.error('❌ Error fetching archived count:', archivedError);
      return;
    }

    console.log(`✅ Found ${archivedCount || 0} archived ads`);

    // 4. Test getting active ads count
    console.log('\n4. Testing active ads count...');
    const { count: activeCount, error: activeError } = await supabase
      .from('ads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (activeError) {
      console.error('❌ Error fetching active count:', activeError);
      return;
    }

    console.log(`✅ Found ${activeCount || 0} active ads`);

    // 5. Summary
    console.log('\n📊 Summary:');
    console.log(`  - Active ads: ${activeCount || 0}`);
    console.log(`  - Archived ads: ${archivedCount || 0}`);
    console.log(`  - Ads needing archive: ${adsNeedingArchive?.length || 0}`);
    console.log(`  - Ads needing warning: ${adsNeedingWarning?.length || 0}`);

    console.log('\n✅ Archive system test completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testArchiveSystem();
}

module.exports = { testArchiveSystem }; 