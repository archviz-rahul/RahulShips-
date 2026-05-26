'use client'

import { Image as ImageIcon, Sparkles } from 'lucide-react'

interface ThumbnailStudioProps {
  imagePromptTopic: string
  setImagePromptTopic: (v: string) => void
  customInstructions: string
  setCustomInstructions: (v: string) => void
}

const STYLE_PRESETS = [
  { label: 'Cinematic Workstation', prompt: 'glowing futuristic keyboard, blurred code on screen, soft blue light' },
  { label: 'Cyberpunk Vector', prompt: 'minimal neon wireframe architecture, abstract code flow grid graphics' },
  { label: 'Brutalist Terminal', prompt: 'retro cathode terminal text with extreme glow and slate background' },
  { label: 'Abstract 3D Shape', prompt: 'glowing glass polyhedron sphere, dark concrete block backdrop' }
]

export function ThumbnailStudio({
  imagePromptTopic,
  setImagePromptTopic,
  customInstructions,
  setCustomInstructions
}: ThumbnailStudioProps) {
  return (
    <div className="space-y-4 font-sans text-slate-200">
      <div className="bg-[#0E0E10]/40 border border-white/[0.04] p-4 rounded-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.03] pb-2.5">
          <ImageIcon className="w-4 h-4 text-teal-400" />
          <span className="font-sans font-medium text-xs tracking-wider uppercase text-white">Thumbnail Art Studio</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider block">
              Hero Concept Preset Styles
            </label>
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setImagePromptTopic(s.prompt)}
                  className={`px-2 py-1 rounded text-[9px] font-sans font-medium border transition ${
                    imagePromptTopic === s.prompt
                      ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                      : 'bg-white/[0.02] text-slate-400 border-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.06]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider block">
              Core Visual Object to Render (Image Prompt)
            </label>
            <textarea
              value={imagePromptTopic}
              onChange={(e) => setImagePromptTopic(e.target.value)}
              className="w-full bg-[#080809] border border-white/[0.05] focus:border-teal-500/50 text-slate-200 text-xs px-3 py-2.5 rounded-lg outline-none transition resize-none min-h-[70px]"
              placeholder="Describe the central physical elements to render..."
              id="thumbnail-studio-topic"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider block">
              DALL-E / FLUX Custom Visual Directives
            </label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="w-full bg-[#080809] border border-white/[0.05] focus:border-teal-500/50 text-slate-200 text-xs px-3 py-2 rounded-lg outline-none transition"
              placeholder="e.g., Ultra realism, cinematic lens flare, high contrast slate teal theme"
              id="thumbnail-studio-instructions"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
