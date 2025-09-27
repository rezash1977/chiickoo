import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get ads that need archiving (older than 1 month)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const { data: adsToArchive, error: fetchError } = await supabase
      .from('ads')
      .select('id, title, user_id, created_at')
      .eq('status', 'active')
      .lt('created_at', oneMonthAgo.toISOString());

    if (fetchError) {
      console.error('Error fetching ads to archive:', fetchError);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch ads to archive',
        details: fetchError.message 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!adsToArchive || adsToArchive.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No ads need archiving',
        archived_count: 0 
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Archive the ads
    const { error: updateError } = await supabase
      .from('ads')
      .update({ status: 'archived' })
      .eq('status', 'active')
      .lt('created_at', oneMonthAgo.toISOString());

    if (updateError) {
      console.error('Error archiving ads:', updateError);
      return new Response(JSON.stringify({ 
        error: 'Failed to archive ads',
        details: updateError.message 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log the archived ads for monitoring
    console.log(`Archived ${adsToArchive.length} ads:`, adsToArchive.map(ad => ({
      id: ad.id,
      title: ad.title,
      user_id: ad.user_id,
      created_at: ad.created_at
    })));

    return new Response(JSON.stringify({ 
      message: 'Ads archived successfully',
      archived_count: adsToArchive.length,
      archived_ads: adsToArchive
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error in auto-archive function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}); 