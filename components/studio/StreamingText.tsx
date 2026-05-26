'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'

interface StreamingTextProps {
  text: string
  isStreaming: boolean
}

export function StreamingText({ text, isStreaming }: StreamingTextProps) {
  const endRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of text output while active generation is in-progress
  useEffect(() => {
    if (isStreaming) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [text, isStreaming])

  if (!text) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-sm font-sans italic">
        Awaiting input parameters to begin content generation...
      </div>
    )
  }

  // Format code blocks, columns or bold points aesthetic-first
  const lines = text.split('\n')

  return (
    <div className="space-y-4 font-mono text-xs text-slate-300 leading-relaxed selection:bg-teal-500/30">
      {lines.map((line, idx) => {
        // Render headings
        if (line.startsWith('## ') || line.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-sans font-medium text-sm text-slate-100 mt-6 mb-2 border-b border-white/[0.05] pb-1 first:mt-0">
              {line.replace(/^#+ /, '')}
            </h4>
          )
        }
        if (line.startsWith('# ')) {
          return (
            <h3 key={idx} className="font-sans font-bold text-base text-teal-400 mt-8 mb-4 first:mt-0">
              {line.replace(/^# /, '')}
            </h3>
          )
        }

        // Render Code / Pre Blocks
        if (line.startsWith('```')) {
          return null // Skip triple backticks to make look neat or wrap
        }

        // Bullet items
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          return (
            <div key={idx} className="pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-teal-500 py-0.5">
              <span>{line.replace(/^[-\*]\s+/, '')}</span>
            </div>
          )
        }

        // Scene / visual column markers (e.g. Spoken Narration, Visual Description, SFX)
        if (line.startsWith('**Spoken Narration**') || line.startsWith('- **Spoken Narration**')) {
          return (
            <div key={idx} className="bg-white/[0.02] border-l-2 border-teal-500 p-3 rounded-r-md my-2">
              <span className="font-sans font-medium text-teal-400 text-[10px] tracking-wider uppercase block mb-1">Narration Script</span>
              <p className="font-sans text-sm text-slate-100">{line.replace(/^(-\s*)?\*\*Spoken Narration\*\*:\s*/, '')}</p>
            </div>
          )
        }

        if (line.startsWith('**Visual Description**') || line.startsWith('- **Visual Description**')) {
          return (
            <div key={idx} className="bg-white/[0.01] border-l-2 border-slate-500 p-3 rounded-r-md my-2">
              <span className="font-sans font-medium text-slate-400 text-[10px] tracking-wider uppercase block mb-1">Visual Action Cues</span>
              <p className="font-sans text-xs text-slate-300 italic">{line.replace(/^(-\s*)?\*\*Visual Description\*\*:\s*/, '')}</p>
            </div>
          )
        }

        if (line.startsWith('**Audio Cue') || line.startsWith('- **Audio Cue')) {
          return (
            <div key={idx} className="bg-teal-500/[0.03] border-l-2 border-teal-500/40 p-3 rounded-r-md my-2">
              <span className="font-sans font-medium text-teal-400/80 text-[10px] tracking-wider uppercase block mb-1">Sound FX / Music</span>
              <p className="font-sans text-xs text-slate-300">{line.replace(/^(-\s*)?\*\*Audio Cue.*?\*\*:\s*/, '')}</p>
            </div>
          )
        }

        if (line.trim() === '') {
          return <div key={idx} className="h-2" />
        }

        return (
          <p key={idx} className="font-sans text-sm text-slate-300 leading-relaxed py-0.5">
            {line}
          </p>
        )
      })}

      {isStreaming && (
        <motion.span
          className="inline-block w-2 h-4 bg-teal-500 ml-1 rounded-sm shadow-[0_0_8px_rgba(20,184,166,0.6)]"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <div ref={endRef} />
    </div>
  )
}
