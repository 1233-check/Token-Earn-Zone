import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

console.log("Supabase Client Init - URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =====================
// AUTH FUNCTIONS
// =====================

export async function signUp(email: string, password: string, fullName?: string, referralCode?: string, referralSide?: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName || '',
                referred_by: referralCode || '',
                referral_side: referralSide || ''
            }
        }
    });
    return { data, error };
}

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    return { data, error };
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
}

export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
}

export async function getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
}

export async function getUserProfile(userId: string) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user profile:', error.message);
        return null;
    }
    return data;
}

export async function updateUserWallet(userId: string, walletAddress: string) {
    const { data, error } = await supabase
        .from('users')
        .update({ wallet_address: walletAddress })
        .eq('id', userId)
        .select()
        .single();
    return { data, error };
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
}

// Transactions
export async function createDepositRequest(walletAddress: string, txHash: string, amount: number = 0) {
    const { data, error } = await supabase
        .from('transactions')
        .insert([
            {
                wallet_address: walletAddress,
                user_id: walletAddress,
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
                user_id: walletAddress,
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

export async function getUserSlotStats(userId: string) {
    const { data, error } = await supabase
        .from('slot_bookings')
        .select('*')
        .eq('wallet_address', userId);

    if (error) {
        console.error('Error fetching user slots:', error);
        return { activeSlots: 0, pendingSlots: 0, totalSlots: 0, totalEarned: 0 };
    }

    const activeSlots = data.filter(s => s.status === 'active' || s.status === 'confirmed').length;
    const pendingSlots = data.filter(s => s.status === 'pending_approval' || s.status === 'pending').length;
    const totalEarned = data.reduce((sum, slot) => sum + Number(slot.total_earned), 0);

    return {
        activeSlots,
        pendingSlots,
        totalSlots: activeSlots + pendingSlots,
        totalEarned,
        bookings: data
    };
}

export async function bookSlot(userId: string, amount: number, roiRate: number) {
    // We call the Postgres RPC function to safely handle limits and concurrency
    const { data, error } = await supabase.rpc('process_slot_booking', {
        p_user_id: userId,
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
    let totalTokenEarnIncome = 0;
    let todayTokenEarnIncome = 0;
    let totalPreBooking = 0;

    (txs || []).forEach(tx => {
        const txDate = new Date(tx.created_at);
        const amount = Number(tx.amount || 0);
        const isToday = txDate >= today;

        if (tx.type === 'deposit') {
            totalDeposits += amount;
            if (isToday) todayDeposits += amount;
        } else if (tx.type === 'roi_distribution') {
            totalTokenEarnIncome += amount;
            if (isToday) todayTokenEarnIncome += amount;
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
        totalTokenEarnIncome,
        todayTokenEarnIncome,
        totalPreBooking,
        currentUnit,
        totalUnit: currentUnit, // Mocked for now
        // Assuming other metrics are 0 or placeholders until MLM tree is built
    };
}

// --- REFERRAL FUNCTIONS ---

export async function getTeamMembers(uniqueId: string | undefined) {
    if (!uniqueId) return [];

    const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, unique_id, created_at, referral_side')
        .eq('referred_by', uniqueId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching team members:', error.message);
        return [];
    }

    // For each direct referral, fetch their recursive team count
    const membersWithCounts = await Promise.all(
        (data || []).map(async (member) => {
            const { data: count } = await supabase.rpc('get_team_count', {
                p_unique_id: member.unique_id
            });
            return { ...member, teamCount: count || 0 };
        })
    );

    return membersWithCounts;
}

export async function getTotalTeamSize(uniqueId: string | undefined): Promise<number> {
    if (!uniqueId) return 0;
    const { data, error } = await supabase.rpc('get_team_count', {
        p_unique_id: uniqueId
    });
    if (error) {
        console.error('Error fetching total team size:', error.message);
        return 0;
    }
    return data || 0;
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
    const { data, error } = await supabase.rpc('admin_approve_slot', {
        p_slot_id: id,
        p_status: status
    });
    return { data, error };
}

export async function distributeDailyRoi() {
    const { data, error } = await supabase.rpc('distribute_daily_roi');
    return { data, error };
}

export async function verifyTransactionPin(userId: string, pin: string): Promise<boolean> {
    const { data, error } = await supabase.rpc("verify_transaction_pin", {
        p_user_id: userId,
        p_pin: pin
    });

    if (error) {
        console.error("Error verifying PIN:", error);
        return false;
    }

    return !!data;
}
