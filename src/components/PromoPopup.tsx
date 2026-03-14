"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function PromoPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Small delay so it doesn't block initial render
    const timer = setTimeout(() => setShow(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={() => setShow(false)}
    >
      <div
        className="relative max-w-md w-full animate-popup"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => setShow(false)}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-[#1a1a1a] border border-[#333] rounded-full flex items-center justify-center text-white hover:bg-red-500 hover:border-red-500 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Promo image */}
        <img
          src="/promo-banner.jpeg"
          alt="Token Earn - Coming Soon"
          className="w-full rounded-2xl shadow-2xl"
          loading="eager"
        />
      </div>

      <style jsx>{`
        @keyframes popupIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-popup {
          animation: popupIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
