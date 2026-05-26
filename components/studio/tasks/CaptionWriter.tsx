'use client'

import { FileText } from 'lucide-react'

interface CaptionWriterProps {
  captionSourceText: string
  setCaptionSourceText: (v: string) => void
  customInstructions: string
  setCustomInstructions: (v: string) => void
}

export function CaptionWriter({
  captionSourceText,
  setCaptionSourceText,
  customInstructions,
  setCustomInstructions
}: CaptionWriterProps) {
  return (
    <div className="space-y-4 font-sans text-slate-200">
      <div className="bg-[#0E0E10]/40 border border-white/[0.04] p-4 rounded-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.03] pb-2.5">
          <FileText className="w-4 h-4 text-teal-400" />
          <span className="font-sans font-medium text-xs tracking-wider uppercase text-white">Social Media Caption Studio</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider block">
              Draft Script / Summary to Transcribe
            </label>
            <textarea
              value={captionSourceText}
              onChange={(e) => setCaptionSourceText(e.target.value)}
              className="w-full bg-[#080809] border border-white/[0.05] focus:border-teal-500/50 text-slate-200 text-xs px-3 py-2.5 rounded-lg outline-none transition resize-none min-h-[100px]"
              placeholder="Paste raw transcript, notes, or copy here. The AI will design custom post templates for LinkedIn (bookmarkable), X (punchy thread), and IG..."
              id="caption-writer-source"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider block">
              Tone & Tag Settings
            </label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="w-full bg-[#080809] border border-white/[0.05] focus:border-teal-500/50 text-slate-200 text-xs px-3 py-2 rounded-lg outline-none transition"
              placeholder="e.g., Include #serverless #developer, call to action: sign up to Rahul's newsletter"
              id="caption-writer-instructions"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
