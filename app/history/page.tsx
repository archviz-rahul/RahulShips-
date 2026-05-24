"use client";

import React, { useState, useEffect } from "react";
import { HistoryItem } from "../page"; // Re-use core types
import { BRAND_CONFIG } from "@/lib/config/brand";
import { Clock, Trash2, ArrowLeft, RotateCcw, Clipboard } from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // Simulate low-latency fetch and read from local storage with skeleton transition
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem("viztr_brief_history_v1");
        if (stored) {
          setHistoryList(JSON.parse(stored));
        }
      } catch (err) {
        console.error("Failed loading local storage history", err);
      } finally {
        setIsLoading(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, []);

  const deleteHistoryItem = (id: string) => {
    const updated = historyList.filter((item) => item.id !== id);
    setHistoryList(updated);
    localStorage.setItem("viztr_brief_history_v1", JSON.stringify(updated));
  };

  const copyBriefText = (briefText: string, id: string) => {
    navigator.clipboard.writeText(briefText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <main className="min-h-screen bg-[#0A0A0B] text-gray-200 p-6 sm:p-12 relative overflow-hidden">
      {/* Glow Ambient Highlights conform to design specs */}
      <div className="absolute top-[-10%] right-[10%] w-[40vw] h-[40vw] rounded-full blur-[150px] pointer-events-none bg-[#00F0FF]/5" />

      <div className="w-full max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/" className="text-xs font-mono text-[#00F0FF] hover:underline uppercase tracking-widest flex items-center gap-1">
                &larr; Back to Dashboard
              </Link>
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white flex items-center gap-2">
              @{BRAND_CONFIG.name} {"//"} History Center
            </h1>
            <p className="text-xs font-mono tracking-widest text-white/50">LOCAL REGISTRY | HISTORICAL BRIEFS STREAM</p>
          </div>
        </div>

        {/* List Content */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse flex flex-col gap-3">
                  <div className="h-4 bg-white/10 rounded w-1/4" />
                  <div className="h-6 bg-white/10 rounded w-2/3" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : historyList.length === 0 ? (
            <div className="p-12 rounded-2xl border border-dashed border-white/10 text-center flex flex-col items-center justify-center bg-white/[0.01]">
              <Clock className="w-12 h-12 text-[#00F0FF] mb-4 animate-bounce" />
              <h3 className="text-lg font-bold text-white">No historical briefs logged yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mt-1">
                Head back to the main console to customize directives and trigger your first content copilot curation.
              </p>
              <Link href="/" className="mt-5 rounded-full bg-[#00F0FF] text-black text-xs font-black px-6 py-2.5 hover:scale-105 active:scale-95 transition-all">
                Generate A Brief Now
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {historyList.map((item) => (
                <div key={item.id} className="p-6 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:border-white/20 transition-all duration-300 rounded-2xl flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#161616] border border-[#00F0FF]/30 text-[9px] font-bold uppercase tracking-wider text-[#00F0FF]">
                        {item.pillar}
                      </span>
                      <span className="text-[10px] font-mono text-gray-500">{item.dateStr}</span>
                    </div>

                    <div className="mt-3 space-y-1">
                      <h3 className="font-bold text-white text-sm line-clamp-1">
                        Topic: {item.customTarget || "Trending Brief Curation"}
                      </h3>
                      <p className="text-[11px] text-gray-400 font-mono">Date inside brief: {item.brief.date}</p>
                    </div>

                    {/* Quick overview of generated output */}
                    <div className="mt-3 p-3 rounded-xl bg-black/40 text-xs text-gray-400/90 font-mono space-y-1.5 border border-white/5 max-h-[120px] overflow-y-auto">
                      <p className="line-clamp-2">
                        <strong className="text-white">🚀 Reeling Hook:</strong> {item.brief.reel1?.topic} - {item.brief.reel1?.hookStrategy}
                      </p>
                      <p className="line-clamp-2">
                        <strong className="text-white">📺 YouTube Idea:</strong> {item.brief.youtube?.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <button
                      onClick={() => copyBriefText(JSON.stringify(item.brief, null, 2), item.id)}
                      className="text-[10px] font-mono uppercase font-black text-gray-400 hover:text-[#00F0FF] flex items-center gap-1 transition-all"
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                      <span>{copiedId === item.id ? "Copied!" : "Copy Raw JSON"}</span>
                    </button>
                    <button
                      onClick={() => deleteHistoryItem(item.id)}
                      className="p-2 rounded-full hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete brief"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
