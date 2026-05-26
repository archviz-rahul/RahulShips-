'use client'

import { Sparkles } from 'lucide-react'

interface HookGeneratorProps {
  sourceText: string
  setSourceText: (v: string) => void
  customInstructions: string
  setCustomInstructions: (v: string) => void
}

export function HookGenerator({
  sourceText,
  setSourceText,
  customInstructions,
  setCustomInstructions
}: HookGeneratorProps) {
  return (
    <div className="space-y-4 font-sans text-slate-200">
      <div className="bg-[#0E0E10]/40 border border-white/[0.04] p-4 rounded-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.03] pb-2.5">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span className="font-sans font-medium text-xs tracking-wider uppercase text-white">Hook Variation Parameters</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider block">
              Draft / Concept Source Text to Hookify
            </label>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className="w-full bg-[#080809] border border-white/[0.05] focus:border-teal-500/50 text-slate-200 text-xs px-3 py-2.5 rounded-lg outline-none transition resize-none min-h-[100px]"
              placeholder="Paste raw thoughts, a section of script, or a tweet. The Hook Engine will extract high-retention variations (Curiosity, Contra, Story, proof)..."
              id="hook-generator-source"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider block">
              Refinement Style Focus
            </label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="w-full bg-[#080809] border border-white/[0.05] focus:border-teal-500/50 text-slate-200 text-xs px-3 py-2 rounded-lg outline-none transition"
              placeholder="e.g., Target senior node engineering audience, ultra minimalist style"
              id="hook-generator-instructions"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
