'use client'

import { Film } from 'lucide-react'

interface VideoPromptTaskProps {
  videoSceneText: string
  setVideoSceneText: (v: string) => void
  customInstructions: string
  setCustomInstructions: (v: string) => void
}

const SHOT_PRESETS = [
  { label: 'Macro Code Blink', desc: 'Sleek abstract macro Shot of terminal lines flickering rapidly on clean obsidian glass, neon blue lighting' },
  { label: 'Retro Rack Zoom', desc: 'Slow zoom in on ancient flashing modular computing rack in dark cold concrete bunker warehouse' },
  { label: 'Glass Blueprint Orbit', desc: 'Smooth orbit camera tracking transparent crystal blueprint drawings on black floating canvas' }
]

export function VideoPromptTask({
  videoSceneText,
  setVideoSceneText,
  customInstructions,
  setCustomInstructions
}: VideoPromptTaskProps) {
  return (
    <div className="space-y-4 font-sans text-slate-200">
      <div className="bg-[#0E0E10]/40 border border-white/[0.04] p-4 rounded-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.03] pb-2.5">
          <Film className="w-4 h-4 text-teal-400" />
          <span className="font-sans font-medium text-xs tracking-wider uppercase text-white">Cinematic Video Studio (Runway / Kling)</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider block">
              Director Camera Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {SHOT_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setVideoSceneText(p.desc)}
                  className={`px-2 py-1 rounded text-[9px] font-sans font-medium border transition ${
                    videoSceneText === p.desc
                      ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                      : 'bg-white/[0.02] text-slate-400 border-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.06]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider block">
              Cinematic Scene Blueprint / Camera Instructions
            </label>
            <textarea
              value={videoSceneText}
              onChange={(e) => setVideoSceneText(e.target.value)}
              className="w-full bg-[#080809] border border-white/[0.05] focus:border-teal-500/50 text-slate-200 text-xs px-3 py-2.5 rounded-lg outline-none transition resize-none min-h-[75px]"
              placeholder="e.g., Extreme macro bokeh track of spinning analog record player..."
              id="video-prompt-scene"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider block">
              Generative Frame Rate & Style Control
            </label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="w-full bg-[#080809] border border-white/[0.05] focus:border-teal-500/50 text-slate-200 text-xs px-3 py-2 rounded-lg outline-none transition"
              placeholder="e.g., Turbo fast rendering mode, photo-real slate textures, 60fps cinematic look"
              id="video-prompt-instructions"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
