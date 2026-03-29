"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowDown, Clock, Loader2, DollarSign, User, Zap } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { getDashboardStats, getTeamMembers, getDailySlotsConfig, bookSlot, getUserSlotStats } from "@/lib/supabase";
import toast from "react-hot-toast";
import ConnectButton from "@/components/ConnectButton";
import DepositModal from "@/components/DepositModal";
import WithdrawModal from "@/components/WithdrawModal";
import PromoPopup from "@/components/PromoPopup";

const IncomeItem = ({ label, value, isLoading }: { label: string, value: string | number, isLoading?: boolean }) => (
  <div className="flex justify-between items-center w-full">
    <div className="flex flex-col gap-1">
      <span className="text-[var(--color-text-muted)] text-sm">{label}</span>
      <span className="text-white text-lg font-bold">
        {isLoading ? <Loader2 size={16} className="animate-spin text-[var(--color-text-muted)]" /> : `$${value}`}
      </span>
    </div>
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0a150b] text-[var(--color-text-muted)] border border-[#1a2a1b]">
      <DollarSign size={16} />
    </div>
  </div>
);

const BusinessItem = ({ label, value, isLoading }: { label: string, value: string | number, isLoading?: boolean }) => (
  <div className="flex justify-between items-center w-full">
    <div className="flex flex-col gap-1">
      <span className="text-[var(--color-text-muted)] text-sm">{label}</span>
      <span className="text-white text-lg font-bold">
        {isLoading ? <Loader2 size={16} className="animate-spin text-[var(--color-text-muted)]" /> : value}
      </span>
    </div>
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0a150b] text-[var(--color-text-muted)] border border-[#1a2a1b]">
      <User size={16} />
    </div>
  </div>
);

// ── Timer helper: compute countdown to next 10 PM IST (16:30 UTC) ──
function getTimerState() {
  const now = new Date();
  // Target: 10:00 PM IST = 16:30 UTC
  const target = new Date(now);
  target.setUTCHours(16, 30, 0, 0);

  // If we're already past 16:30 UTC today, the window is OPEN until next day's cycle
  if (now >= target) {
    // Buy window is open! Timer shows 00:00:00
    // Next cycle target is tomorrow at 16:30 UTC
    const nextTarget = new Date(target);
    nextTarget.setUTCDate(nextTarget.getUTCDate() + 1);
    return { isBuyWindowOpen: true, timeLeft: 0, timerText: "00:00:00" };
  }

  // Window not yet open, count down
  const diff = target.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  const timerText = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return { isBuyWindowOpen: false, timeLeft: diff, timerText };
}

export default function Home() {
  const { user, profile, refreshProfile } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);

  const [mounted, setMounted] = useState(false);

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  // Slot / Buy state
  const [slotsRemaining, setSlotsRemaining] = useState<number>(50);
  const [unitsToBuy, setUnitsToBuy] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [userSlots, setUserSlots] = useState<{ bookings?: any[] }>({});
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Timer state
  const [timerText, setTimerText] = useState("--:--:--");
  const [isBuyWindowOpen, setIsBuyWindowOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Countdown timer ──
  useEffect(() => {
    const update = () => {
      const state = getTimerState();
      setTimerText(state.timerText);
      setIsBuyWindowOpen(state.isBuyWindowOpen);
    };
    update(); // run immediately
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Load dashboard data ──
  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoadingStats(true);
    const dashboardData = await getDashboardStats(user.id);
    if (dashboardData) setStats(dashboardData);
    setIsLoadingStats(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData, isDepositOpen, isWithdrawOpen]);

  // ── Load user slot bookings ──
  const loadUserSlots = useCallback(async () => {
    if (!user) return;
    setIsLoadingSlots(true);
    const stats = await getUserSlotStats(user.id);
    setUserSlots(stats);
    setIsLoadingSlots(false);
  }, [user]);

  useEffect(() => {
    loadUserSlots();
  }, [loadUserSlots]);

  // ── Load slot availability ──
  const loadSlots = useCallback(async () => {
    try {
      const config = await getDailySlotsConfig();
      setSlotsRemaining(Math.max(0, 50 - (config?.slots_booked || 0)));
    } catch (e) {
      console.error("Failed to load slots config", e);
    }
  }, []);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  // ── Referral link ──
  const [referralLink, setReferralLink] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setReferralLink(`${window.location.origin}/login?ref=${profile?.unique_id || "guest"}`);
    }
  }, [profile]);

  // ── Team members ──
  useEffect(() => {
    if (profile?.unique_id) {
      setIsLoadingTeam(true);
      getTeamMembers(profile.unique_id).then(data => {
        setTeamMembers(data || []);
        setIsLoadingTeam(false);
      });
    }
  }, [profile?.unique_id]);

  if (!mounted) return null;

  // ── Derived balances ──
  const profitBalance = Number(stats?.totalROIIncome || 0) + Number(stats?.totalReferralIncome || 0);
  const principalBalance = Number(stats?.totalSlotInvestment || 0);

  // ── Buy handler ──
  const handleBuy = async () => {
    if (!user || !profile) {
      toast.error("Please log in first.");
      return;
    }
    const units = parseInt(unitsToBuy);
    if (!units || units <= 0) {
      toast.error("Please enter a valid number of units.");
      return;
    }
    const amount = units * 20;
    if (profile.total_balance < amount) {
      toast.error(`Insufficient balance. You need $${amount} to buy ${units} unit(s).`);
      return;
    }
    setIsBooking(true);
    try {
      const isTomorrowOrAfter = new Date() >= new Date("2026-03-30T00:00:00Z");
      const roiRate = isTomorrowOrAfter ? 0.05 : 0.10;
      
      const { error } = await bookSlot(user.id, amount, roiRate);
      if (error) throw new Error(error.message);
      toast.success("Slot booked successfully! Booking Processing.");
      setUnitsToBuy("");
      await loadSlots();
      await loadData();
      await loadUserSlots();
      await refreshProfile();
    } catch (error: any) {
      console.error("Booking failed:", error);
      toast.error(error.message || "Failed to book slot.");
    } finally {
      setIsBooking(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto w-full pb-28 pt-2">
      {/* Dashboard Title & User Card */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-3 tracking-tight">Dashboard</h1>
          <button className="flex items-center gap-1.5 text-sm bg-[var(--color-card)] border border-[var(--color-card-border)] px-4 py-1.5 rounded-full text-white font-medium">
            <ArrowDown size={14} className="text-[var(--color-text-muted)]" /> Dashboard
          </button>
        </div>

        {/* User Card element replacing custom implementation for native AppKit support */}
        <div className="flex flex-col justify-center items-end h-[100px]">
          <ConnectButton />
        </div>
      </div>

      {/* Global Token Earn Zone Card */}
      <div className="bg-card-glow border border-[var(--color-card-border)] rounded-2xl p-5 relative overflow-hidden shadow-lg mt-2 flex flex-col gap-3">
        {/* Row 1: Title + Balance/PreBooking */}
        <div className="flex justify-between w-full">
          <div className="font-bold text-[17px] leading-snug mt-1 z-10 w-1/2">Token Earn<br />Zone</div>
          <div className="text-right flex flex-col gap-2 items-end mt-1 z-10 w-1/2">
            <div className="font-bold text-[#e1e2e1] flex gap-2">Balance : {isLoadingStats ? <Loader2 size={16} className="animate-spin text-white" /> : `$${Number(profile?.total_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</div>
            <div className="font-bold text-[15px] leading-tight flex gap-2 items-center">Slot Investment :<br />{isLoadingStats ? <Loader2 size={16} className="animate-spin text-white" /> : `$${principalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</div>
          </div>
        </div>

        {/* Row 2: Countdown Timer */}
        <div className="flex items-center justify-center gap-2 bg-[#040804]/60 rounded-xl py-2.5 px-4 border border-[#1a2a1b] z-10">
          <Clock size={16} className={isBuyWindowOpen ? "text-[var(--color-accent)]" : "text-[#fbbf24]"} />
          <span className={`font-mono font-bold text-lg tracking-wider ${isBuyWindowOpen ? "text-[var(--color-accent)]" : "text-[#fbbf24]"}`}>
            {timerText}
          </span>
          <span className="text-[var(--color-text-muted)] text-xs ml-1">
            {isBuyWindowOpen ? "Buy window open!" : "until slots open"}
          </span>
        </div>

        {/* Row 3: Remaining Slots + Actions */}
        <div className="flex justify-between items-end w-full">
          <div className="font-bold text-sm z-10 flex items-center gap-1.5">
            <span className={`text-lg ${slotsRemaining > 0 ? "text-[var(--color-accent)]" : "text-[#fbbf24]"}`}>{slotsRemaining}</span>
            <span className="text-[var(--color-text-muted)]">slots remaining</span>
          </div>
          <div className="flex gap-2 justify-end items-end">
            <button
              onClick={() => setIsWithdrawOpen(true)}
              className="bg-transparent border border-[var(--color-text-muted)] text-[var(--color-text-muted)] rounded-full px-4 py-1.5 text-xs font-bold hover:bg-[#1a2a1b] transition-colors z-10"
            >
              Withdraw
            </button>
            <button
              onClick={() => setIsDepositOpen(true)}
              className="bg-[var(--color-text-muted)] text-[#040804] rounded-full px-4 py-1.5 text-xs font-bold hover:bg-[var(--color-accent-hover)] transition-colors z-10"
            >
              Deposit
            </button>
          </div>
        </div>

        {/* Row 4: Conditional Buy UI (only when window is open) */}
        {isBuyWindowOpen && (
          slotsRemaining > 0 ? (
            <div className="flex items-center gap-2 mt-1 z-10">
              <input
                type="number"
                value={unitsToBuy}
                onChange={(e) => setUnitsToBuy(e.target.value)}
                placeholder="Enter unit"
                min="1"
                className="flex-1 bg-[#040804]/60 border border-[var(--color-card-border)] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[var(--color-accent)] transition-colors placeholder:text-[var(--color-text-muted)]"
              />
              <button
                onClick={handleBuy}
                disabled={isBooking || !unitsToBuy}
                className="bg-[var(--color-accent)] text-[#0a150b] rounded-xl px-6 py-2.5 text-sm font-bold hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isBooking ? <Loader2 size={14} className="animate-spin" /> : "Buy"}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mt-1 z-10 bg-red-500/10 border border-red-500/20 rounded-xl py-2.5 px-4">
              <span className="text-red-400 font-bold text-sm">Sold Out for Today</span>
            </div>
          )
        )}
      </div>

      {/* Referral Link Card */}
      <div className="bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-2xl p-6 relative overflow-hidden bg-referral-glow shadow-md">
        <h2 className="text-[var(--color-text-muted)] font-semibold mb-3 text-lg">My Referral Link</h2>
        <div className="w-full h-[1px] bg-[var(--color-card-border)] mb-5" />

        <div className="flex mb-2 justify-center"><span className="text-[var(--color-text-muted)] text-[15px] font-semibold">Left Referral Link</span></div>
        <div className="flex items-center rounded-xl overflow-hidden border border-[var(--color-text-muted)] mb-6 bg-[#040804]/50">
          <input type="text" readOnly value={referralLink + '&side=left'} className="bg-transparent border-none text-[var(--color-text-muted)] text-[15px] p-3.5 w-full outline-none font-medium truncate" />
          <button
            onClick={() => handleCopy(referralLink + '&side=left')}
            className="border-l border-[var(--color-text-muted)] px-5 py-3.5 text-[15px] text-[var(--color-text-muted)] font-medium hover:bg-[var(--color-accent)]/10 transition-colors"
          >
            Copy
          </button>
        </div>

        <div className="flex mb-2 justify-center"><span className="text-[var(--color-text-muted)] text-[15px] font-semibold">Right Referral Link</span></div>
        <div className="flex items-center rounded-xl overflow-hidden border border-[var(--color-text-muted)] bg-[#040804]/50">
          <input type="text" readOnly value={referralLink + '&side=right'} className="bg-transparent border-none text-[var(--color-text-muted)] text-[15px] p-3.5 w-full outline-none font-medium truncate" />
          <button
            onClick={() => handleCopy(referralLink + '&side=right')}
            className="border-l border-[var(--color-text-muted)] px-5 py-3.5 text-[15px] text-[var(--color-text-muted)] font-medium hover:bg-[var(--color-accent)]/10 transition-colors"
          >
            Copy
          </button>
        </div>
      </div>

      {/* My All Income */}
      <div className="mt-2">
        <h2 className="text-white text-xl font-bold mb-4">My All Income</h2>
        <div className="bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-3xl p-5 flex flex-col gap-4 shadow-sm">
          <IncomeItem label="Today Mining Reward" value={Number(stats?.todayROIIncome || 0).toFixed(2)} isLoading={isLoadingStats} />
          <div className="h-[1px] w-full bg-[#1a2a1b]" />
          <IncomeItem label="Total Mining Reward" value={Number(stats?.totalROIIncome || 0).toFixed(2)} isLoading={isLoadingStats} />
          <div className="h-[1px] w-full bg-[#1a2a1b]" />
          <IncomeItem label="Total Referral Bonus" value={Number(stats?.totalReferralIncome || 0).toFixed(2)} isLoading={isLoadingStats} />
          <div className="h-[1px] w-full bg-[#1a2a1b]" />
          <IncomeItem label="Today Referral Bonus" value={Number(stats?.todayReferralIncome || 0).toFixed(2)} isLoading={isLoadingStats} />
          <div className="h-[1px] w-full bg-[#1a2a1b]" />
          <IncomeItem label="Total Deposits" value={Number(stats?.totalDeposits || 0).toFixed(2)} isLoading={isLoadingStats} />
          <div className="h-[1px] w-full bg-[#1a2a1b]" />
          <IncomeItem label="Today Deposits" value={Number(stats?.todayDeposits || 0).toFixed(2)} isLoading={isLoadingStats} />
          <div className="h-[1px] w-full bg-[#1a2a1b]" />
          <IncomeItem label="Total Income" value={Number(stats?.totalIncome || 0).toFixed(2)} isLoading={isLoadingStats} />
          <div className="h-[1px] w-full bg-[#1a2a1b]" />
          <IncomeItem label="Today Total Income" value={Number(stats?.todayIncome || 0).toFixed(2)} isLoading={isLoadingStats} />
        </div>
      </div>

      {/* My Business */}
      <div className="mt-2">
        <h2 className="text-white text-xl font-bold mb-4">My Business</h2>
        <div className="bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-3xl p-5 flex flex-col gap-4 shadow-sm">
          <BusinessItem label="Active Slots" value={stats?.activeSlotCount || 0} isLoading={isLoadingStats} />
          <div className="h-[1px] w-full bg-[#1a2a1b]" />
          <BusinessItem label="Slot Investment" value={`$${Number(stats?.totalSlotInvestment || 0).toFixed(2)}`} isLoading={isLoadingStats} />
          <div className="h-[1px] w-full bg-[#1a2a1b]" />
          <BusinessItem label="Total Slot Earned" value={`$${Number(stats?.totalSlotEarned || 0).toFixed(2)}`} isLoading={isLoadingStats} />
        </div>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-3xl p-5 flex flex-col gap-4 shadow-sm">
        <BusinessItem label="Team Business (L/R)" value={`$${Number(stats?.leftTeamBusiness || 0).toFixed(0)} / $${Number(stats?.rightTeamBusiness || 0).toFixed(0)}`} isLoading={isLoadingStats} />
        <div className="h-[1px] w-full bg-[#1a2a1b]" />
        <BusinessItem label="Team Members (L/R)" value={`${stats?.leftTeamCount || 0} / ${stats?.rightTeamCount || 0}`} isLoading={isLoadingStats} />
        <div className="h-[1px] w-full bg-[#1a2a1b]" />
        <BusinessItem label="Total Team Business" value={`$${Number(stats?.totalTeamBusiness || 0).toFixed(2)}`} isLoading={isLoadingStats} />
      </div>

      {/* My Mining */}
      <div className="mt-2">
        <h2 className="text-white text-xl font-bold mb-4">My Mining</h2>
        <div className="bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-3xl p-5 flex flex-col gap-4 shadow-sm">
          {isLoadingSlots ? (
            <div className="flex justify-center py-6"><Loader2 size={24} className="animate-spin text-[var(--color-accent)]" /></div>
          ) : userSlots.bookings && userSlots.bookings.length > 0 ? (
            userSlots.bookings.map((slot: any) => (
              <div key={slot.id} className="bg-[#040804]/50 rounded-2xl p-4 border border-[#1a2a1b]">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${['active', 'confirmed'].includes(slot.status) ? 'bg-[var(--color-accent)]' : 'bg-[#fbbf24]'}`} />
                    <span className="text-white font-medium">Slot ${slot.amount}</span>
                  </div>
                  <div className={`px-2 py-0.5 rounded text-xs font-semibold ${['active', 'confirmed'].includes(slot.status) ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'bg-[#fbbf24]/10 text-[#fbbf24]'}`}>
                    {['active', 'confirmed'].includes(slot.status) ? 'Active Mining' : 'Booking Processing'}
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-muted)]">Total Earned:</span>
                  <span className="text-white font-semibold">${Number(slot.total_earned).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-[var(--color-text-muted)]">Daily ROI:</span>
                  <span className="text-[var(--color-text-muted)]">{(Number(slot.daily_roi_rate) * 100).toPrecision()}%</span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#0a150b] flex items-center justify-center mb-4">
                <Zap size={24} className="text-[var(--color-text-muted)]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">No Active Mining</h3>
              <p className="text-[var(--color-text-muted)] text-sm">Buy a slot when the timer opens to start earning daily ROI.</p>
            </div>
          )}
        </div>
      </div>

      {/* My Team Members */}
      <div className="mt-2">
        <h2 className="text-white text-xl font-bold mb-4">My Team ({teamMembers.length})</h2>
        <div className="bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-3xl p-5 flex flex-col gap-4 shadow-sm">
          {isLoadingTeam ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-[var(--color-text-muted)]" /></div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center text-[var(--color-text-muted)] py-4">No team members yet. Share your referral link!</div>
          ) : (
            <div className="flex flex-col gap-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex justify-between items-center border-b border-[#1a2a1b] last:border-0 pb-3 last:pb-0">
                  <div className="flex flex-col">
                    <span className="text-white font-medium">{member.full_name || member.email?.split('@')[0] || "Anonymous User"}</span>
                    <span className="text-[var(--color-text-muted)] text-xs">Joined: {new Date(member.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                      {member.teamCount} in team
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${member.referral_side === 'left' ? 'bg-blue-500/20 text-blue-400' : member.referral_side === 'right' ? 'bg-purple-500/20 text-purple-400' : 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'}`}>
                      {member.referral_side?.toUpperCase() || 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
      <WithdrawModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} profitBalance={profitBalance} />
      <PromoPopup />
    </div>
  );
}
