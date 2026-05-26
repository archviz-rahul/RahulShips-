'use client'

import { motion } from 'motion/react'
import { ModelConfig, ModelStatus } from '../../lib/models/modelConfig'
import { ModelConnectionState } from '../../hooks/useModelConnection'
import { Play, Check, AlertCircle, Loader2 } from 'lucide-react'

interface ModelCardProps {
  model: ModelConfig
  state: ModelConnectionState | undefined
  isSelected: boolean
  onSelect: () => void
  onTest: (model: ModelConfig) => void
}

export function ModelCard({ model, state, isSelected, onSelect, onTest }: ModelCardProps) {
  const currentStatus: ModelStatus = state?.status || (model.isEnabled ? 'connected' : 'not-configured')
  const lastTested = state?.lastTested

  // Colors based on Status indicator
  const getStatusBubbleStyle = () => {
    switch (currentStatus) {
      case 'connected':
        return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
      case 'testing':
        return 'bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]'
      case 'error':
        return 'bg-rose-500 animate-bounce shadow-[0_0_8px_rgba(244,63,94,0.5)]'
      default:
        return 'bg-slate-500'
    }
  }

  const getStatusLabel = () => {
    switch (currentStatus) {
      case 'connected':
        return 'Connected'
      case 'testing':
        return 'Testing...'
      case 'error':
        return 'Config Error'
      default:
        return 'Not Configured'
    }
  }

  return (
    <div
      onClick={onSelect}
      className={`relative w-full text-left p-3.5 rounded-xl border text-slate-200 transition-all duration-300 cursor-pointer overflow-hidden ${
        isSelected
          ? 'bg-white/[0.04] border-teal-500/80 shadow-[0_4px_20px_rgba(20,184,166,0.1)]'
          : 'bg-[#0E0E10]/80 border-white/[0.05] hover:bg-white/[0.02] hover:border-white/[0.1]'
      }`}
      id={`model-card-${model.id}`}
    >
      {/* Decorative colored glow on selected card */}
      {isSelected && (
        <span
          className="absolute -top-12 -left-12 w-24 h-24 rounded-full filter blur-[24px] pointer-events-none"
          style={{ backgroundColor: `${model.modelColor}33` }}
        />
      )}

      <div className="flex md:flex-row flex-col justify-between items-start gap-2.5">
        <div className="flex items-center gap-2.5 z-10 w-full">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg text-sm select-none"
            style={{
              backgroundColor: `${model.modelColor}1A`,
              color: model.modelColor,
              border: `1px solid ${model.modelColor}26`,
            }}
          >
            {model.modelIcon}
          </div>
          <div className="truncate w-full">
            <h4 className="font-sans font-medium text-xs tracking-wide text-white flex items-center gap-1.5 truncate">
              {model.name}
              <span className={`w-1.5 h-1.5 rounded-full ${getStatusBubbleStyle()}`} />
            </h4>
            <span className="font-mono text-[10px] text-slate-500 capitalize leading-none block mt-0.5">
              {model.provider} • {model.version}
            </span>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onTest(model)
          }}
          disabled={currentStatus === 'testing'}
          className={`px-2 py-1 rounded text-[10px] font-sans font-medium transition-all duration-200 z-10 hidden md:flex items-center gap-1 shrink-0 ${
            currentStatus === 'testing'
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 border border-white/[0.05] hover:border-white/[0.1] active:scale-95'
          }`}
          title="Test model API path connectivity"
        >
          {currentStatus === 'testing' ? (
            <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-500" />
          ) : (
            <Play className="w-2.5 h-2.5" />
          )}
          Ping
        </button>
      </div>

      <div className="mt-3.5 pt-3 border-t border-white/[0.03] flex items-center justify-between gap-1">
        {/* Tier Indicators */}
        <div className="flex gap-1.5 shrink-0 select-none">
          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/[0.02] text-[9px] font-mono text-slate-500 lowercase">
            ${model.costTier} cost
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/[0.02] text-[9px] font-mono text-slate-500 lowercase">
            {model.speedTier} speed
          </span>
        </div>

        {/* Status explanation or timestamp */}
        <span className="text-[9px] font-mono text-slate-400 text-right truncate">
          {currentStatus === 'error' && state?.errorMessage ? (
            <span className="text-rose-400 flex items-center gap-1 leading-none shrink-0" title={state.errorMessage}>
              <AlertCircle className="w-2.5 h-2.5 shrink-0" /> Failed
            </span>
          ) : lastTested ? (
            `Tested: ${lastTested}`
          ) : (
            getStatusLabel()
          )}
        </span>
      </div>

      {currentStatus === 'error' && state?.errorMessage && (
        <div className="mt-2 text-[9px] font-mono bg-rose-500/[0.03] border border-rose-500/10 text-rose-400/90 rounded p-1.5 leading-normal max-h-16 overflow-y-auto no-scrollbar">
          {state.errorMessage}
        </div>
      )}
    </div>
  )
}
