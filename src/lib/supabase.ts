import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

console.log("Supabase Client Init - URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Profiles
export async function getOrCreateProfile(walletAddress: string) {
    // First try to fetch
    let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

    // If not found, create one
    if (error && error.code === 'PGRST116') {
        const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([{ wallet_address: walletAddress, total_balance: 0 }])
            .select()
            .single();

        if (insertError) {
            console.error('Error creating profile:', insertError.message || insertError);
            return null;
        }
        return newProfile;
    }

    if (error) {
        console.error('Error fetching profile:', error.message || error);
    }
    return data;
}

// Transactions
export async function createDepositRequest(walletAddress: string, txHash: string, amount: number = 0) {
    const { data, error } = await supabase
        .from('transactions')
        .insert([
            {
                wallet_address: walletAddress,
                type: 'deposit',
                tx_hash: txHash,
                amount: amount,
                status: 'pending'
            }
        ])
        .select();

    return { data, error };
}

export async function createWithdrawRequest(walletAddress: string, destinationAddress: string, amount: number) {
    const { data, error } = await supabase
        .from('transactions')
        .insert([
            {
                wallet_address: walletAddress,
                type: 'withdrawal',
                destination_address: destinationAddress,
                amount: amount,
                status: 'pending'
            }
        ])
        .select();

    return { data, error };
}

export async function getTransactions(walletAddress: string) {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching transactions:', error.message || error);
        return [];
    }
    return data;
}

// Slot Bookings

export async function getDailySlotsConfig() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
        .from('daily_slots_config')
        .select('*')
        .eq('booking_date', today)
        .single();

    // If not found or error, safely assume 0 booked so far and UI can handle it.
    // The backend RPC handles the strict check.
    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching daily slots:", error);
    }

    return data || { booking_date: today, slots_booked: 0 };
}

export async function getUserSlotStats(walletAddress: string) {
    const { data, error } = await supabase
        .from('slot_bookings')
        .select('*')
        .eq('wallet_address', walletAddress);

    if (error) {
        console.error('Error fetching user slots:', error);
        return { activeSlots: 0, pendingSlots: 0, totalSlots: 0, totalEarned: 0 };
    }

    const activeSlots = data.filter(s => s.status === 'active').length;
    const pendingSlots = data.filter(s => s.status === 'pending_approval').length;
    const totalEarned = data.reduce((sum, slot) => sum + Number(slot.total_earned), 0);

    return {
        activeSlots,
        pendingSlots,
        totalSlots: activeSlots + pendingSlots,
        totalEarned,
        bookings: data
    };
}

export async function bookSlot(walletAddress: string, amount: number, roiRate: number) {
    // We call the Postgres RPC function to safely handle limits and concurrency
    const { data, error } = await supabase.rpc('process_slot_booking', {
        p_wallet_address: walletAddress,
        p_amount: amount,
        p_roi_rate: roiRate
    });

    return { data, error };
}

// Full Dashboard Stats
export async function getDashboardStats(walletAddress: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Get transactions (deposits, ROI, slot bookings)
    const { data: txs, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('wallet_address', walletAddress)
        .eq('status', 'approved');

    if (txError) {
        console.error("Error fetching txs for stats:", txError);
        return null;
    }

    // 2. Compute sums from transactions
    let totalDeposits = 0;
    let todayDeposits = 0;
    let totalBcTradeIncome = 0;
    let todayBcTradeIncome = 0;
    let totalPreBooking = 0;

    (txs || []).forEach(tx => {
        const txDate = new Date(tx.created_at);
        const amount = Number(tx.amount || 0);
        const isToday = txDate >= today;

        if (tx.type === 'deposit') {
            totalDeposits += amount;
            if (isToday) todayDeposits += amount;
        } else if (tx.type === 'roi_distribution') {
            totalBcTradeIncome += amount;
            if (isToday) todayBcTradeIncome += amount;
        } else if (tx.type === 'slot_booking') {
            totalPreBooking += amount;
        }
    });

    // 3. User Slots
    const { data: slots } = await supabase
        .from('slot_bookings')
        .select('id, amount, status')
        .eq('wallet_address', walletAddress);

    // 4. Mock MLM Stats (To be replaced with real referral logic if added later)
    const activeSlotsCount = (slots || []).filter(s => s.status === 'active').length;
    const currentUnit = activeSlotsCount * 20; // Example metric: $20 per unit

    return {
        totalDeposits,
        todayDeposits,
        totalBcTradeIncome,
        todayBcTradeIncome,
        totalPreBooking,
        currentUnit,
        totalUnit: currentUnit, // Mocked for now
        // Assuming other metrics are 0 or placeholders until MLM tree is built
    };
}

// --- ADMIN FUNCTIONS ---

export async function getAdminPendingTransactions() {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
    return { data, error };
}

export async function getAdminPendingSlots() {
    const { data, error } = await supabase
        .from('slot_bookings')
        .select('*')
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false });
    return { data, error };
}

export async function updateTransactionStatus(id: string, status: 'approved' | 'rejected') {
    const { data, error } = await supabase
        .from('transactions')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
    return { data, error };
}

export async function updateSlotStatus(id: string, status: 'active' | 'rejected') {
    const updateData: any = { status };
    if (status === 'active') {
        updateData.approved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
        .from('slot_bookings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
    return { data, error };
}

export async function distributeDailyRoi() {
    const { data, error } = await supabase.rpc('distribute_daily_roi');
    return { data, error };
}
