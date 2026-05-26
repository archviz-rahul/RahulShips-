'use client'

import { Search } from 'lucide-react'

interface ResearchTaskProps {
  topic: string
  setTopic: (v: string) => void
  customInstructions: string
  setCustomInstructions: (v: string) => void
}

export function ResearchTask({
  topic,
  setTopic,
  customInstructions,
  setCustomInstructions
}: ResearchTaskProps) {
  return (
    <div className="space-y-4 font-sans text-slate-200">
      <div className="bg-[#0E0E10]/40 border border-white/[0.04] p-4 rounded-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.03] pb-2.5">
          <Search className="w-4 h-4 text-teal-400" />
          <span className="font-sans font-medium text-xs tracking-wider uppercase text-white">Technical Deep Research (Perplexity)</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider block">
              Core Technical Subject of Inquiry
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-[#080809] border border-white/[0.05] focus:border-teal-500/50 text-slate-200 text-xs px-3 py-2.5 rounded-lg outline-none transition"
              placeholder="e.g., Explain the real cost difference between AWS Lambda and Cloudflare Workers for edge file parsing"
              id="research-task-topic"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider block">
              Audience Segment & Golden Metrics Cues
            </label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="w-full bg-[#080809] border border-white/[0.05] focus:border-teal-500/50 text-slate-200 text-xs px-3 py-2 rounded-lg outline-none transition resize-none min-h-[60px]"
              placeholder="e.g., Find real quantitative benchmark figures. Include cold-start millisecond metrics if available."
              id="research-task-instructions"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
