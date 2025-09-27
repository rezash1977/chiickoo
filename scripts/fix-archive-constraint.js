// Simple script to fix the archive constraint issue
// This will update the CHECK constraint to include 'archived' status

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  console.log('Please set these environment variables and try again.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixArchiveConstraint() {
  console.log('🔧 Fixing archive constraint...\n');

  try {
    // Step 1: Drop the existing constraint
    console.log('1. Dropping existing ads_status_check constraint...');
    
    const dropSQL = `
      ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_status_check;
    `;
    
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropSQL });
    
    if (dropError) {
      console.error('❌ Error dropping constraint:', dropError);
      return;
    }
    
    console.log('✅ Existing constraint dropped successfully');

    // Step 2: Add new constraint with 'archived'
    console.log('2. Adding new constraint with archived status...');
    
    const addSQL = `
      ALTER TABLE ads ADD CONSTRAINT ads_status_check 
      CHECK (status IN ('pending', 'active', 'expired', 'rejected', 'archived'));
    `;
    
    const { error: addError } = await supabase.rpc('exec_sql', { sql: addSQL });
    
    if (addError) {
      console.error('❌ Error adding constraint:', addError);
      return;
    }
    
    console.log('✅ New constraint added successfully');

    // Step 3: Test the constraint
    console.log('3. Testing the new constraint...');
    
    // Try to update a test ad to archived status
    const { data: testAd } = await supabase
      .from('ads')
      .select('id')
      .limit(1);
    
    if (testAd && testAd.length > 0) {
      const { error: testError } = await supabase
        .from('ads')
        .update({ status: 'archived' })
        .eq('id', testAd[0].id);
      
      if (testError) {
        console.error('❌ Error testing archived status:', testError);
        return;
      }
      
      console.log('✅ Archived status test passed!');
      
      // Change it back to active
      await supabase
        .from('ads')
        .update({ status: 'active' })
        .eq('id', testAd[0].id);
    }

    console.log('\n🎉 Archive constraint fixed successfully!');
    console.log('✅ The ads table now supports "archived" status');
    console.log('✅ You can now archive ads without constraint errors');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
if (require.main === module) {
  fixArchiveConstraint().catch(console.error);
}

module.exports = { fixArchiveConstraint }; 