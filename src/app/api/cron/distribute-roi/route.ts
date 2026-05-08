import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use the service role key for server-side cron operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
    // Verify this is a legitimate cron call from Vercel
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
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
    } catch (err: any) {
        console.error('Cron job error:', err);
        return NextResponse.json(
            { error: err.message || 'Internal error' },
            { status: 500 }
        );
    }
}
