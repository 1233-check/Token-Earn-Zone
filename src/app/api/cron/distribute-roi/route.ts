import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy-initialize the Supabase client at request time, not at module load.
// This prevents the build from crashing when env vars aren't available
// during static page collection.
function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    return createClient(url, key);
}

export async function GET(req: NextRequest) {
    // Verify this is a legitimate cron call from Vercel
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.rpc('distribute_daily_roi');

        if (error) {
            console.error('ROI distribution failed:', error.message);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        console.log('ROI distribution completed:', data);
        return NextResponse.json({
            success: true,
            result: data,
            timestamp: new Date().toISOString()
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error';
        console.error('Cron job error:', err);
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
