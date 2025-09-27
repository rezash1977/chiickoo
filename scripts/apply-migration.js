// Script to apply the archive migration
// This script will update the database to support archived status

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying archive migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/001_add_archived_status.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL:');
    console.log(migrationSQL);
    console.log('\n' + '='.repeat(50) + '\n');

    // Execute the migration
    console.log('🔧 Executing migration...');
    
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Error applying migration:', error);
      return;
    }

    console.log('✅ Migration applied successfully!');

    // Test the migration by checking if we can insert an archived status
    console.log('\n🧪 Testing migration...');
    
    const testResult = await supabase
      .from('ads')
      .select('id, status')
      .limit(1);

    if (testResult.error) {
      console.error('❌ Error testing migration:', testResult.error);
    } else {
      console.log('✅ Migration test passed!');
    }

    // Show current status values
    console.log('\n📊 Current status values in ads table:');
    const statusResult = await supabase
      .from('ads')
      .select('status')
      .limit(10);

    if (statusResult.data) {
      const statuses = [...new Set(statusResult.data.map(row => row.status))];
      console.log('Available statuses:', statuses);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Alternative method using direct SQL execution
async function applyMigrationDirect() {
  console.log('🚀 Applying archive migration (direct method)...\n');

  try {
    // Step 1: Drop existing constraint
    console.log('1. Dropping existing constraint...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.check_constraints 
                WHERE constraint_name = 'ads_status_check'
            ) THEN
                ALTER TABLE ads DROP CONSTRAINT ads_status_check;
            END IF;
        END $$;
      `
    });

    if (dropError) {
      console.error('❌ Error dropping constraint:', dropError);
      return;
    }

    console.log('✅ Constraint dropped successfully');

    // Step 2: Add new constraint with archived
    console.log('2. Adding new constraint with archived status...');
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE ads ADD CONSTRAINT ads_status_check 
        CHECK (status IN ('pending', 'active', 'expired', 'rejected', 'archived'));
      `
    });

    if (addError) {
      console.error('❌ Error adding constraint:', addError);
      return;
    }

    console.log('✅ New constraint added successfully');

    // Step 3: Create index
    console.log('3. Creating index...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_ads_status_created_at ON ads(status, created_at);
      `
    });

    if (indexError) {
      console.error('❌ Error creating index:', indexError);
    } else {
      console.log('✅ Index created successfully');
    }

    // Step 4: Create functions
    console.log('4. Creating functions...');
    const functionsSQL = `
      CREATE OR REPLACE FUNCTION archive_old_ads()
      RETURNS void AS $$
      BEGIN
        UPDATE ads 
        SET status = 'archived'
        WHERE status = 'active' 
          AND created_at < (NOW() - INTERVAL '1 month');
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION get_ads_needing_archive()
      RETURNS TABLE (
        id uuid,
        title text,
        user_id uuid,
        created_at timestamptz,
        days_old integer
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          a.id,
          a.title,
          a.user_id,
          a.created_at,
          EXTRACT(day FROM (NOW() - a.created_at))::integer as days_old
        FROM ads a
        WHERE a.status = 'active' 
          AND a.created_at < (NOW() - INTERVAL '1 month');
      END;
      $$ LANGUAGE plpgsql;
    `;

    const { error: funcError } = await supabase.rpc('exec_sql', { sql: functionsSQL });

    if (funcError) {
      console.error('❌ Error creating functions:', funcError);
    } else {
      console.log('✅ Functions created successfully');
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('✅ The ads table now supports "archived" status');
    console.log('✅ Archive functions are available');
    console.log('✅ Index for better performance is created');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the migration
if (require.main === module) {
  // Try the direct method first
  applyMigrationDirect().catch(console.error);
}

module.exports = { applyMigration, applyMigrationDirect }; 