'use client'

import { Volume2 } from 'lucide-react'

interface VoiceoverTaskProps {
  ttsScriptText: string
  setTtsScriptText: (v: string) => void
  customInstructions: string
  setCustomInstructions: (v: string) => void
}

export function VoiceoverTask({
  ttsScriptText,
  setTtsScriptText,
  customInstructions,
  setCustomInstructions
}: VoiceoverTaskProps) {
  return (
    <div className="space-y-4 font-sans text-slate-200">
      <div className="bg-[#0E0E10]/40 border border-white/[0.04] p-4 rounded-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.03] pb-2.5">
          <Volume2 className="w-4 h-4 text-teal-400" />
          <span className="font-sans font-medium text-xs tracking-wider uppercase text-white">Vocal Voiceover Studio (ElevenLabs)</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider block">
              Narration Script Text
            </label>
            <textarea
              value={ttsScriptText}
              onChange={(e) => setTtsScriptText(e.target.value)}
              className="w-full bg-[#080809] border border-white/[0.05] focus:border-teal-500/50 text-slate-200 text-xs px-3 py-2.5 rounded-lg outline-none transition resize-none min-h-[90px]"
              placeholder="Paste exact lines the speaker should read verbally..."
              id="voiceover-task-text"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider block">
              Vocal Model Configuration
            </label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="w-full bg-[#080809] border border-white/[0.05] focus:border-teal-500/50 text-slate-200 text-xs px-3 py-2 rounded-lg outline-none transition"
              placeholder="e.g., Target British tech tutor, slow pacing, high emotional warmth"
              id="voiceover-task-instructions"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
