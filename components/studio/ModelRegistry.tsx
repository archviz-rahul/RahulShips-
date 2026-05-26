'use client'

import { useState } from 'react'
import { ModelConfig, MODEL_REGISTRY } from '../../lib/models/modelConfig'
import { ModelCard } from './ModelCard'
import { ModelConnectionState } from '../../hooks/useModelConnection'
import { Laptop, Cpu, Radio, Sliders } from 'lucide-react'

interface ModelRegistryProps {
  selectedModelId: string
  onSelectModel: (id: string) => void
  connections: Record<string, ModelConnectionState>
  onTestConnection: (model: ModelConfig) => void
}

export function ModelRegistry({
  selectedModelId,
  onSelectModel,
  connections,
  onTestConnection
}: ModelRegistryProps) {
  const [showLocalOnly, setShowLocalOnly] = useState(false)

  // Filter models based on search or local preferences
  const filteredModels = MODEL_REGISTRY.filter(m => {
    if (showLocalOnly) {
      return m.isLocal === true
    }
    return true
  })

  // Grouping Models by family
  const textModels = filteredModels.filter(m => m.capabilities.includes('text-generation') || m.capabilities.includes('web-search'))
  const imageModels = filteredModels.filter(m => m.capabilities.includes('image-generation'))
  const voiceVideoModels = filteredModels.filter(m => m.capabilities.includes('audio-generation') || m.capabilities.includes('video-generation'))

  return (
    <div className="flex flex-col h-full bg-[#0A0A0B] text-slate-200">
      
      {/* Search / Local filter controls */}
      <div className="p-4 border-b border-white/[0.04] space-y-3 shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-teal-400" />
            <h3 className="font-sans font-medium text-xs tracking-wider uppercase text-white">
              Model Hub Engine
            </h3>
          </div>
          <span className="font-mono text-[9px] text-[#4285F4] bg-[#4285F4]/10 px-1.5 py-0.5 rounded uppercase font-semibold">
            Multi-LLM
          </span>
        </div>

        {/* Local override toggle */}
        <button
          type="button"
          onClick={() => setShowLocalOnly(!showLocalOnly)}
          className={`w-full py-2 px-3 rounded-lg border text-left text-xs font-sans transition flex items-center justify-between ${
            showLocalOnly
              ? 'bg-teal-500/10 border-teal-500/30 text-teal-400'
              : 'bg-white/[0.02] border-white/[0.05] text-slate-400 hover:bg-white/[0.04]'
          }`}
          id="toggle-local-models"
        >
          <div className="flex items-center gap-2">
            <Laptop className="w-3.5 h-3.5" />
            <span>Show Local / Offline Models</span>
          </div>
          <span className="font-mono text-[9px] uppercase px-1.5 bg-white/10 rounded">
            Ollama
          </span>
        </button>
      </div>

      {/* Model Categories List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar">
        
        {/* TEXT MODELS */}
        {textModels.length > 0 && (
          <div className="space-y-2.5">
            <span className="text-[10px] font-sans font-medium uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-1">
              <span className="w-1 h-3 bg-teal-500/60 rounded-full" /> Language & Search Models
            </span>
            <div className="space-y-2">
              {textModels.map(m => (
                <ModelCard
                  key={m.id}
                  model={m}
                  state={connections[m.id]}
                  isSelected={selectedModelId === m.id}
                  onSelect={() => onSelectModel(m.id)}
                  onTest={onTestConnection}
                />
              ))}
            </div>
          </div>
        )}

        {/* IMAGE GENERATORS */}
        {imageModels.length > 0 && (
          <div className="space-y-2.5">
            <span className="text-[10px] font-sans font-medium uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-1">
              <span className="w-1 h-3 bg-teal-500/60 rounded-full" /> Graphics & Thumbnails
            </span>
            <div className="space-y-2">
              {imageModels.map(m => (
                <ModelCard
                  key={m.id}
                  model={m}
                  state={connections[m.id]}
                  isSelected={selectedModelId === m.id}
                  onSelect={() => onSelectModel(m.id)}
                  onTest={onTestConnection}
                />
              ))}
            </div>
          </div>
        )}

        {/* AUDIO & VIDEO */}
        {voiceVideoModels.length > 0 && (
          <div className="space-y-2.5">
            <span className="text-[10px] font-sans font-medium uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-1">
              <span className="w-1 h-3 bg-teal-500/60 rounded-full" /> Vocal & Sonic Cinematic
            </span>
            <div className="space-y-2">
              {voiceVideoModels.map(m => (
                <ModelCard
                  key={m.id}
                  model={m}
                  state={connections[m.id]}
                  isSelected={selectedModelId === m.id}
                  onSelect={() => onSelectModel(m.id)}
                  onTest={onTestConnection}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
