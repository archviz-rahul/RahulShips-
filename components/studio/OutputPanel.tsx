'use client'

import { useState } from 'react'
import Image from 'next/image'
import { StreamingText } from './StreamingText'
import { OutputCard } from './OutputCard'
import { OutputRecord } from '../../hooks/useAIStudio'
import { MODEL_REGISTRY } from '../../lib/models/modelConfig'
import { FileText, History, Trash2, HelpCircle } from 'lucide-react'

interface OutputPanelProps {
  outputHistory: OutputRecord[]
  activeOutputId: string | null
  setActiveOutputId: (id: string | null) => void
  currentStreamingText: string
  isStreaming: boolean
  onToggleSaveRecord: (id: string) => void
  onDeleteRecord: (id: string) => void
  activeRecord: OutputRecord | null
}

export function OutputPanel({
  outputHistory,
  activeOutputId,
  setActiveOutputId,
  currentStreamingText,
  isStreaming,
  onToggleSaveRecord,
  onDeleteRecord,
  activeRecord
}: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState<'stream' | 'history'>('stream')

  // Auto focus Stream tab if streaming starts
  if (isStreaming && activeTab !== 'stream') {
    setActiveTab('stream')
  }

  return (
    <div className="flex flex-col h-full bg-[#0A0A0B] text-slate-200">
      
      {/* Right panel subtabs navigation */}
      <div className="flex border-b border-white/[0.04] bg-[#070708]/90 shrink-0 select-none p-1">
        <button
          onClick={() => setActiveTab('stream')}
          className={`flex-1 py-3 text-xs font-sans font-medium transition flex items-center justify-center gap-1.5 border-b-2 ${
            activeTab === 'stream'
              ? 'text-teal-400 border-teal-500'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/[0.01]'
          }`}
          id="tab-draft-stream"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Active Generation</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 text-xs font-sans font-medium transition flex items-center justify-center gap-1.5 border-b-2 relative ${
            activeTab === 'history'
              ? 'text-teal-400 border-teal-500'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/[0.01]'
          }`}
          id="tab-production-archives"
        >
          <History className="w-3.5 h-3.5" />
          <span>Archives</span>
          {outputHistory.length > 0 && (
            <span className="absolute right-4 px-1 py-0.5 roundedbg-slate-800 text-[8px] font-bold text-slate-300 font-mono bg-white/10 shrink-0">
              {outputHistory.length}
            </span>
          )}
        </button>
      </div>

      {/* Panels content area */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        
        {/* ── A. ACTIVE STREAM CANVAS ─────────────────────── */}
        {activeTab === 'stream' && (
          <div className="p-5 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white/[0.01] p-2.5 rounded border border-white/[0.03]">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`} />
                  <span className="font-sans text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {isStreaming ? 'Streaming Content Frame...' : 'Active Preview Console'}
                  </span>
                </div>
                {activeRecord?.createdAt && (
                  <span className="font-mono text-[9px] text-slate-500">{activeRecord.createdAt}</span>
                )}
              </div>

              {/* Streaming Content Display */}
              <div className="bg-[#0E0E10]/30 rounded-xl p-4 border border-white/[0.02]">
                <StreamingText
                  text={isStreaming ? currentStreamingText : (activeRecord?.outputText || '')}
                  isStreaming={isStreaming}
                />
              </div>

              {/* Display generated attachment blocks here directly in preview! */}
              {!isStreaming && activeRecord && (
                <div className="space-y-4 mt-4">
                  
                  {/* Image render display details */}
                  {activeRecord.imageUrl && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-sans text-slate-400 font-medium uppercase tracking-wider block">Art Director Canvas Reference:</span>
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-slate-900 shadow-2xl">
                        <Image
                          src={activeRecord.imageUrl}
                          alt={activeRecord.prompt || 'Generated preview'}
                          fill
                          referrerPolicy="no-referrer"
                          className="object-cover select-none pointer-events-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Audio narration block playing details */}
                  {activeRecord.audioUrl && (
                    <div className="space-y-1.5 p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/10 flex items-center justify-between gap-4">
                      <span className="font-sans text-xs text-slate-200">TTS Audio track parsed:</span>
                      <audio controls src={activeRecord.audioUrl} className="h-7 scale-90" />
                    </div>
                  )}

                  {/* Video clip display player details */}
                  {activeRecord.videoUrl && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-sans text-slate-400 font-medium uppercase tracking-wider block">Generated Video Preview clip:</span>
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 video-playback-wrapper bg-slate-950">
                        <video
                          src={activeRecord.videoUrl}
                          controls
                          muted
                          autoPlay
                          loop
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        )}

        {/* ── B. PRODUCTION HISTORIES ARCHIVES ─────────────── */}
        {activeTab === 'history' && (
          <div className="p-4 space-y-3.5">
            {outputHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                <HelpCircle className="w-8 h-8 text-slate-600 mb-2.5 animate-bounce" />
                <h4 className="font-sans font-medium text-xs text-slate-300">Archives Empty</h4>
                <p className="font-sans text-[10px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                  Generations checklist will accumulate here as you trigger pipelines.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-slate-500 block mb-2 px-1">
                  Historical Records Sequence
                </span>
                
                {outputHistory.map(record => (
                  <OutputCard
                    key={record.id}
                    record={record}
                    isActive={activeOutputId === record.id}
                    onSelect={() => {
                      setActiveOutputId(record.id)
                      setActiveTab('stream') // Automatically bounce to active preview tab
                    }}
                    onToggleSave={() => onToggleSaveRecord(record.id)}
                    onDelete={() => onDeleteRecord(record.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
