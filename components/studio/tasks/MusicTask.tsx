'use client'

import { Music } from 'lucide-react'

interface MusicTaskProps {
  audioVibeText: string
  setAudioVibeText: (v: string) => void
  audioGenreText: string
  setAudioGenreText: (v: string) => void
  customInstructions: string
  setCustomInstructions: (v: string) => void
}

export function MusicTask({
  audioVibeText,
  setAudioVibeText,
  audioGenreText,
  setAudioGenreText,
  customInstructions,
  setCustomInstructions
}: MusicTaskProps) {
  return (
    <div className="space-y-4 font-sans text-slate-200">
      <div className="bg-[#0E0E10]/40 border border-white/[0.04] p-4 rounded-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.03] pb-2.5">
          <Music className="w-4 h-4 text-teal-400" />
          <span className="font-sans font-medium text-xs tracking-wider uppercase text-white">Generative Soundscape & Music (Suno)</span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider block">
                Soundscape Ambient Vibe
              </label>
              <input
                type="text"
                value={audioVibeText}
                onChange={(e) => setAudioVibeText(e.target.value)}
                className="w-full bg-[#080809] border border-white/[0.05] focus:border-teal-500/50 text-slate-200 text-xs px-3 py-2.5 rounded-lg outline-none transition"
                placeholder="e.g., Deep focus, late night coding, dark concrete garage vibes"
                id="music-vibe-text"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider block">
                Instrumentation & Style Genre Grouping
              </label>
              <input
                type="text"
                value={audioGenreText}
                onChange={(e) => setAudioGenreText(e.target.value)}
                className="w-full bg-[#080809] border border-white/[0.05] focus:border-teal-500/50 text-slate-200 text-xs px-3 py-2.5 rounded-lg outline-none transition"
                placeholder="e.g., Modular analog techno pulse, sub-bass pads, ticking clocks, 110 BPM"
                id="music-genre-text"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider block">
                Suno Rendering Cues
              </label>
              <input
                type="text"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="w-full bg-[#080809] border border-white/[0.05] focus:border-teal-500/50 text-slate-200 text-xs px-3 py-2 rounded-lg outline-none transition"
                placeholder="e.g., No vocals, extreme synth focus, slow progressive build"
                id="music-instructions-text"
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
