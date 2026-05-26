'use client'

import { useState } from 'react'
import { Sparkles, Sliders, Type, HelpCircle, User } from 'lucide-react'

interface ScriptWriterProps {
  topic: string
  setTopic: (v: string) => void
  voiceStyle: string
  setVoiceStyle: (v: string) => void
  customInstructions: string
  setCustomInstructions: (v: string) => void
  useCalendarPillar: boolean
  setUseCalendarPillar: (v: boolean) => void
  calendarPillar: string
}

const VOICE_PRESETS = [
  { label: 'Technical Architect', value: 'Architectural Developer, fast-paced, analogy-heavy' },
  { label: 'Cinematic Narrative Essayist', value: 'Cinematic, intellectual, slow deliberate thesis' },
  { label: 'Minimalist Startup Founder', value: 'Pragmatic, founder-first, conversational' },
  { label: 'Educational Dev Evangelist', value: 'Enthusiastic, clear, pedagogical code builder' }
]

export function ScriptWriter({
  topic,
  setTopic,
  voiceStyle,
  setVoiceStyle,
  customInstructions,
  setCustomInstructions,
  useCalendarPillar,
  setUseCalendarPillar,
  calendarPillar
}: ScriptWriterProps) {
  const [showConfig, setShowConfig] = useState(true)

  return (
    <div className="space-y-4 font-sans text-slate-200">
      
      {/* Short Form Parameters Card */}
      <div className="bg-[#0E0E10]/40 border border-white/[0.04] p-4 rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.03] pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span className="font-sans font-medium text-xs tracking-wider uppercase text-white">Script Parameters</span>
          </div>
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="text-[10px] text-slate-500 hover:text-slate-300 font-mono"
          >
            {showConfig ? 'Hide Config' : 'Show Config'}
          </button>
        </div>

        {showConfig && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left: Input topic */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider block">
                Primary Content Topic / Concept
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-[#080809] border border-white/[0.05] hover:border-white/[0.1] focus:border-teal-500/50 text-slate-200 text-xs px-3 py-2.5 rounded-lg outline-none transition"
                placeholder="e.g., Why framework fatigue is slowing down architectural pipelines"
                id="script-writer-topic"
              />
            </div>

            {/* Right: Voice / Style */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider block">
                Narrative Voice & Tone Style
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {VOICE_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setVoiceStyle(p.value)}
                    className={`px-2 py-1 rounded text-[9px] font-sans font-medium border transition ${
                      voiceStyle === p.value
                        ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                        : 'bg-white/[0.02] text-slate-400 border-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.06]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={voiceStyle}
                onChange={(e) => setVoiceStyle(e.target.value)}
                className="w-full bg-[#080809] border border-white/[0.05] focus:border-teal-500/50 text-slate-200 text-xs px-3 py-2 rounded-lg outline-none transition"
                placeholder="Define your own voice style preset..."
                id="script-writer-voice"
              />
            </div>

            {/* Additional custom guidelines */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider block">
                Custom Production Directives
              </label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="w-full bg-[#080809] border border-white/[0.05] focus:border-teal-500/50 text-slate-200 text-xs px-3 py-2 rounded-lg outline-none transition resize-none min-h-[60px]"
                placeholder="Give additional instructions (e.g., include an exact joke, include code brackets, restrict total scenes...)"
                id="script-writer-instructions"
              />
            </div>

          </div>
        )}
      </div>

    </div>
  )
}
