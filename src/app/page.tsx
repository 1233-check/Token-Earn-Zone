"use client";

import { useState, useEffect } from "react";
import { ArrowDown } from "lucide-react";
import { useAccount } from "wagmi";
import { getOrCreateProfile, getDashboardStats } from "@/lib/supabase";
import { DollarSign, User, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import DepositModal from "@/components/DepositModal";
import WithdrawModal from "@/components/WithdrawModal";

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

export default function Home() {
  const { isConnected, address } = useAccount();

  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const [mounted, setMounted] = useState(false);

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadData() {
      if (isConnected && address) {
        setIsLoadingStats(true);
        const profile = await getOrCreateProfile(address);
        if (profile) setBalance(profile.total_balance);

        const dashboardData = await getDashboardStats(address);
        if (dashboardData) setStats(dashboardData);
        setIsLoadingStats(false);
      }
    }
    loadData();
  }, [isConnected, address, isDepositOpen, isWithdrawOpen]);

  if (!mounted) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const referralLink = `http://usdtearn.trade/Register?ref=${address || 'guest'}`;

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
          {/* @ts-ignore */}
          <w3m-button balance="show" />
        </div>
      </div>

      {/* Global Token Earn Zone Card */}
      <div className="bg-card-glow border border-[var(--color-card-border)] rounded-2xl p-6 relative overflow-hidden h-[180px] shadow-lg mt-2 flex flex-col justify-between">
        <div className="flex justify-between w-full">
          <div className="font-bold text-[17px] leading-snug mt-2 z-10 w-1/2">Token Earn<br />Zone</div>
          <div className="text-right flex flex-col gap-2 items-end mt-2 z-10 w-1/2">
            <div className="font-bold text-[#e1e2e1] flex gap-2">Balance : {isLoadingStats ? <Loader2 size={16} className="animate-spin text-white" /> : `$${Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</div>
            <div className="font-bold text-[15px] leading-tight flex gap-2 items-center">Pre-Booking :<br />{isLoadingStats ? <Loader2 size={16} className="animate-spin text-white" /> : `$${Number(stats?.totalPreBooking || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</div>
          </div>
        </div>

        <div className="flex justify-between items-end w-full mt-auto">
          <div className="font-bold text-lg z-10 w-1/2">Package</div>
          <div className="flex gap-2 justify-end items-end w-1/2">
            <button
              onClick={() => setIsWithdrawOpen(true)}
              className="bg-transparent border border-[var(--color-text-muted)] text-[var(--color-text-muted)] rounded-full px-4 py-1.5 text-xs font-bold mb-1 hover:bg-[#1a2a1b] transition-colors z-10"
            >
              Withdraw
            </button>
            <button
              onClick={() => setIsDepositOpen(true)}
              className="bg-[var(--color-text-muted)] text-[#040804] rounded-full px-4 py-1.5 text-xs font-bold mb-1 hover:bg-[var(--color-accent-hover)] transition-colors z-10"
            >
              Deposit
            </button>
          </div>
        </div>
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

      {/* My All Income Lists */}
      <div className="mt-2">
        <h2 className="text-white text-xl font-bold mb-4">My All Income</h2>
        <div className="bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-3xl p-5 flex flex-col gap-4 shadow-sm">
          <IncomeItem label="Today Token Earn Trade Income" value={Number(stats?.todayBcTradeIncome || 0).toFixed(2)} isLoading={isLoadingStats} />
          <div className="h-[1px] w-full bg-[#1a2a1b]" />
          <IncomeItem label="Total Token Earn Trade Income" value={Number(stats?.totalBcTradeIncome || 0).toFixed(2)} isLoading={isLoadingStats} />
          <div className="h-[1px] w-full bg-[#1a2a1b]" />
          <IncomeItem label="Deposit Wallet (Total)" value={Number(stats?.totalDeposits || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} isLoading={isLoadingStats} />
          <div className="h-[1px] w-full bg-[#1a2a1b]" />
          <IncomeItem label="Today Team Deposit" value="0.00000000" isLoading={isLoadingStats} />
        </div>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-3xl p-5 flex flex-col gap-4 shadow-sm">
        <IncomeItem label="Today Matching Income" value="0.00" isLoading={isLoadingStats} />
        <div className="h-[1px] w-full bg-[#1a2a1b]" />
        <IncomeItem label="Total Matching Income" value="0.0000" isLoading={isLoadingStats} />
        <div className="h-[1px] w-full bg-[#1a2a1b]" />
        <IncomeItem label="Total Level Income" value="0.00" isLoading={isLoadingStats} />
        <div className="h-[1px] w-full bg-[#1a2a1b]" />
        <IncomeItem label="Today Level Income" value="0.0000" isLoading={isLoadingStats} />
        <div className="h-[1px] w-full bg-[#1a2a1b]" />
        <IncomeItem label="Total Direct Income" value="0.00" isLoading={isLoadingStats} />
        <div className="h-[1px] w-full bg-[#1a2a1b]" />
        <IncomeItem label="Today Direct Income" value="0.0000" isLoading={isLoadingStats} />
        <div className="h-[1px] w-full bg-[#1a2a1b]" />
        <IncomeItem label="Total Income" value={Number(stats?.totalBcTradeIncome || 0).toFixed(4)} isLoading={isLoadingStats} />
        <div className="h-[1px] w-full bg-[#1a2a1b]" />
        <IncomeItem label="Today Total Income" value={Number(stats?.todayBcTradeIncome || 0).toFixed(4)} isLoading={isLoadingStats} />
      </div>

      {/* My Business Lists */}
      <div className="mt-2">
        <h2 className="text-white text-xl font-bold mb-4">My Business</h2>
        <div className="bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-3xl p-5 flex flex-col gap-4 shadow-sm">
          <BusinessItem label="Current Unit" value={stats?.currentUnit || 0} isLoading={isLoadingStats} />
          <div className="h-[1px] w-full bg-[#1a2a1b]" />
          <BusinessItem label="Total Unit" value={stats?.totalUnit || 0} isLoading={isLoadingStats} />
          <div className="h-[1px] w-full bg-[#1a2a1b]" />
          <BusinessItem label="Today Team Unit(L/R)" value="0/0" isLoading={isLoadingStats} />
        </div>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-3xl p-5 flex flex-col gap-4 shadow-sm">
        <BusinessItem label="Current Team Unit" value="0" isLoading={isLoadingStats} />
        <div className="h-[1px] w-full bg-[#1a2a1b]" />
        <BusinessItem label="Total Team Unit" value="0" isLoading={isLoadingStats} />
        <div className="h-[1px] w-full bg-[#1a2a1b]" />
        <BusinessItem label="Yesterday Team Unit(L/R)" value="0/0" isLoading={isLoadingStats} />
      </div>

      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
      <WithdrawModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} />
    </div>
  );
}
