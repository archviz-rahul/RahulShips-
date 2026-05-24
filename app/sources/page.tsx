import React from "react";
import { readStore } from "@/lib/mediaSourcesStore";
import { BRAND_CONFIG } from "@/lib/config/brand";
import { Radio } from "lucide-react";
import Link from "next/link";

export const revalidate = 0; // Bypass server-side route caching to ensure dynamic content freshness on registry view

export default async function SourcesPage() {
  const sources = await readStore();

  return (
    <main className="min-h-screen bg-[#0A0A0B] text-gray-200 p-6 sm:p-12 relative overflow-hidden">
      {/* Background ambient accents conforming to RahulShips aesthetics */}
      <div className="absolute top-[-10%] left-[5%] w-[40vw] h-[40vw] rounded-full blur-[150px] pointer-events-none bg-[#00F0FF]/5" />

      <div className="w-full max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/" className="text-xs font-mono text-[#00F0FF] hover:underline uppercase tracking-widest flex items-center gap-1">
                &larr; Back to Dashboard
              </Link>
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white flex items-center gap-2">
              @{BRAND_CONFIG.name} {"//"} Sources Registry
            </h1>
            <p className="text-xs font-mono tracking-widest text-white/50">SERVER SIDE RENDERED | DIRECT INDEX GATEWAY</p>
          </div>
        </div>

        {/* Sources Layout Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-12 p-6 sm:p-8 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#00F0FF] animate-pulse" />
                Active Crawler Feeds
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                This list of high-fidelity RSS, newsletter channels, and custom endpoints is polled by the background content engine to discover top micro-trends.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] tracking-widest uppercase text-gray-400 font-mono">
                    <th className="pb-4 font-bold">Feed Source</th>
                    <th className="pb-4 font-bold">Category</th>
                    <th className="pb-4 font-bold">Status</th>
                    <th className="pb-4 font-bold">Frequency</th>
                    <th className="pb-4 font-bold">Health Metrics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {sources.map((source) => (
                    <tr key={source.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="py-4 pr-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{source.name}</span>
                          <span className="text-[10px] text-gray-500 font-mono mt-0.5 max-w-[320px] truncate block">
                            {source.url}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-[#00F0FF]">
                          {source.category}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                          source.status === "ALIVE" 
                            ? "bg-green-500/10 text-green-400 border-green-500/20" 
                            : source.status === "PAUSED"
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}>
                          <span className={`w-1 h-1 rounded-full mr-1.5 ${
                            source.status === "ALIVE" ? "bg-green-400 animate-pulse" : source.status === "PAUSED" ? "bg-amber-400" : "bg-red-400"
                          }`} />
                          {source.status}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <span className="font-mono text-gray-400">{source.fetchFrequency}</span>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="flex flex-col gap-1 font-mono text-[10px] text-gray-400">
                          <span className="flex items-center gap-1.5">
                            <span className="text-gray-500">POLLS:</span> {source.itemCount} items
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="text-gray-500">SPEED:</span> {source.averageFetchDuration}s avg
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="text-gray-500">HEALTH:</span> 
                            <span className={source.successRate >= 95 ? "text-green-400" : "text-amber-400"}>
                              {source.successRate}% OK
                            </span>
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
