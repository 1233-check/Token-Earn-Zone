"use client";

import { MessageCircle, Mail, HelpCircle, FileText, ExternalLink } from "lucide-react";

export default function SupportPage() {
    return (
        <div className="flex flex-col gap-6 max-w-md mx-auto w-full pb-28 pt-2">
            {/* Header */}
            <div className="flex justify-between items-center px-1">
                <h1 className="text-2xl font-bold text-white">Support Center</h1>
            </div>

            {/* Quick Links Group */}
            <div className="grid grid-cols-2 gap-4">
                <button className="bg-card rounded-2xl p-5 border border-[var(--color-card-border)] flex flex-col items-center justify-center gap-3 hover:bg-white/5 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-[#3b82f6]/10 flex items-center justify-center">
                        <MessageCircle size={24} className="text-[#3b82f6]" />
                    </div>
                    <span className="text-white font-medium text-sm">Live Chat</span>
                </button>
                <button className="bg-card rounded-2xl p-5 border border-[var(--color-card-border)] flex flex-col items-center justify-center gap-3 hover:bg-white/5 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
                        <Mail size={24} className="text-[var(--color-accent)]" />
                    </div>
                    <span className="text-white font-medium text-sm">Email Us</span>
                </button>
            </div>

            <div className="bg-card rounded-3xl overflow-hidden border border-[var(--color-card-border)]">
                <div className="p-5 border-b border-[var(--color-card-border)] bg-[#040804]/50">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <HelpCircle size={20} className="text-[var(--color-text-muted)]" />
                        Frequently Asked Questions
                    </h2>
                </div>
                <div className="flex flex-col">
                    <div className="p-5 border-b border-[var(--color-card-border)] hover:bg-white/5 transition-colors cursor-pointer group">
                        <h3 className="text-white font-medium text-sm flex justify-between items-center mb-1 group-hover:text-[var(--color-accent)] transition-colors">
                            How long do withdrawals take?
                            <span className="text-[var(--color-accent)]">›</span>
                        </h3>
                        <p className="text-[var(--color-text-muted)] text-xs leading-relaxed mt-2 opacity-80">
                            Standard USDT withdrawals are typically processed manually by our finance team within 24 to 48 hours for security purposes.
                        </p>
                    </div>
                    <div className="p-5 border-b border-[var(--color-card-border)] hover:bg-white/5 transition-colors cursor-pointer group">
                        <h3 className="text-white font-medium text-sm flex justify-between items-center group-hover:text-[var(--color-accent)] transition-colors">
                            What is the minimum deposit?
                            <span className="text-[var(--color-text-muted)]">›</span>
                        </h3>
                    </div>
                    <div className="p-5 hover:bg-white/5 transition-colors cursor-pointer group">
                        <h3 className="text-white font-medium text-sm flex justify-between items-center group-hover:text-[var(--color-accent)] transition-colors">
                            How does the referral bonus work?
                            <span className="text-[var(--color-text-muted)]">›</span>
                        </h3>
                    </div>
                </div>
            </div>

            <div className="bg-card-glow rounded-3xl p-[1px] mt-2">
                <button className="w-full bg-[#0a150b] rounded-3xl p-5 border border-[var(--color-card-border)] shadow-lg flex items-center justify-between hover:bg-[#0a150b]/80 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/5 text-[var(--color-text-muted)] flex items-center justify-center">
                            <FileText size={20} />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-white font-bold text-sm">Platform Guidelines</span>
                            <span className="text-[var(--color-text-muted)] text-xs mt-0.5">Read our terms and conditions</span>
                        </div>
                    </div>
                    <ExternalLink size={18} className="text-[var(--color-accent)]" />
                </button>
            </div>

        </div>
    );
}
