'use client'

import { useState } from 'react'
import { Calendar, Link, Sparkles, HelpCircle, Check, ChevronDown, ChevronUp } from 'lucide-react'

interface ContextInjectorProps {
  useCalendarPillar: boolean
  setUseCalendarPillar: (val: boolean) => void
  calendarPillar: string

  useHookBank: boolean
  setUseHookBank: (val: boolean) => void
  hookBankHooks: string[]
  selectedHook: string
  setSelectedHook: (val: string) => void

  useLinkVault: boolean
  setUseLinkVault: (val: boolean) => void
  linkVaultSummary: string
}

export function ContextInjector({
  useCalendarPillar,
  setUseCalendarPillar,
  calendarPillar,
  useHookBank,
  setUseHookBank,
  hookBankHooks,
  selectedHook,
  setSelectedHook,
  useLinkVault,
  setUseLinkVault,
  linkVaultSummary
}: ContextInjectorProps) {
  const [isOpen, setIsOpen] = useState(true)

  const hasHookBankData = hookBankHooks.length > 0
  const hasLinkVaultData = !!linkVaultSummary

  return (
    <div className="w-full bg-[#0E0E10]/90 border border-white/[0.05] rounded-xl overflow-hidden transition-all duration-300">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white/[0.02] flex items-center justify-between text-left border-b border-white/[0.03] select-none hover:bg-white/[0.04] transition-all"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <h4 className="font-sans font-medium text-xs tracking-wider uppercase text-white">
            Context Co-pilot Injection
          </h4>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {/* Collapse Container */}
      {isOpen && (
        <div className="p-4 space-y-4">
          <p className="font-sans text-[11px] text-slate-400 leading-normal">
            Wire other app modules directly into your LLM prompt. This serves as the global context pool.
          </p>

          <div className="space-y-3">
            {/* 1. CALENDAR PILLAR */}
            <div className={`p-3 rounded-lg border transition-all duration-200 ${
              useCalendarPillar ? 'bg-teal-500/[0.02] border-teal-500/20' : 'bg-transparent border-white/[0.03]'
            }`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCalendarPillar}
                    onChange={(e) => setUseCalendarPillar(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-white/25 text-teal-500 focus:ring-0 focus:ring-offset-0 bg-[#070708]"
                  />
                  <div className="flex items-center gap-1.5 text-xs font-sans font-medium text-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    Inject Todays Calendar Pillar
                  </div>
                </label>
                <span className="font-mono text-[9px] px-1 bg-sky-500/10 text-sky-400 rounded">
                  Daily Active
                </span>
              </div>
              {useCalendarPillar && (
                <div className="mt-2 pl-6 font-mono text-[10px] text-slate-400 border-l border-white/10 italic truncate">
                  {calendarPillar || 'No active pillar selected in weekly calendar. (Defaults to Architecture)'}
                </div>
              )}
            </div>

            {/* 2. HOOK BANK */}
            <div className={`p-3 rounded-lg border transition-all duration-200 ${
              useHookBank ? 'bg-teal-500/[0.02] border-teal-500/20' : 'bg-transparent border-white/[0.03]'
            }`}>
              <div className="flex items-center justify-between">
                <label className={`flex items-center gap-2.5 ${hasHookBankData ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                  <input
                    type="checkbox"
                    checked={useHookBank}
                    disabled={!hasHookBankData}
                    onChange={(e) => setUseHookBank(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-white/25 text-teal-500 focus:ring-0 focus:ring-offset-0 bg-[#070708]"
                  />
                  <div className="flex items-center gap-1.5 text-xs font-sans font-medium text-slate-200">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Inject Selected Hook Bank Variation
                  </div>
                </label>
                <span className={`font-mono text-[9px] px-1 rounded ${
                  hasHookBankData ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  {hasHookBankData ? `${hookBankHooks.length} hooks found` : 'Hook Bank Empty'}
                </span>
              </div>

              {useHookBank && hasHookBankData && (
                <div className="mt-2.5 pl-6 space-y-1.5">
                  <span className="font-sans text-[10px] text-slate-500 font-medium block">
                    Choose an ingested seed hook:
                  </span>
                  <select
                    value={selectedHook}
                    onChange={(e) => setSelectedHook(e.target.value)}
                    className="w-full bg-[#141417] border border-white/[0.06] text-xs text-slate-300 font-sans p-1.5 rounded outline-none focus:border-teal-500/50"
                  >
                    {hookBankHooks.map((h, i) => (
                      <option key={i} value={h}>
                        {h.substring(0, 60)}{h.length > 60 ? '...' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 3. LINK VAULT */}
            <div className={`p-3 rounded-lg border transition-all duration-200 ${
              useLinkVault ? 'bg-teal-500/[0.02] border-teal-500/20' : 'bg-transparent border-white/[0.03]'
            }`}>
              <div className="flex items-center justify-between">
                <label className={`flex items-center gap-2.5 ${hasLinkVaultData ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                  <input
                    type="checkbox"
                    checked={useLinkVault}
                    disabled={!hasLinkVaultData}
                    onChange={(e) => setUseLinkVault(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-white/25 text-teal-500 focus:ring-0 focus:ring-offset-0 bg-[#070708]"
                  />
                  <div className="flex items-center gap-1.5 text-xs font-sans font-medium text-slate-200">
                    <Link className="w-3.5 h-3.5 text-teal-400" />
                    Inject Link Vault Source Data
                  </div>
                </label>
                <span className={`font-mono text-[9px] px-1 rounded ${
                  hasLinkVaultData ? 'bg-teal-500/10 text-teal-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  {hasLinkVaultData ? 'Data Loaded' : 'No Links Ingested'}
                </span>
              </div>

              {useLinkVault && hasLinkVaultData && (
                <div className="mt-2.5 pl-6">
                  <div className="text-[10px] font-mono bg-[#141417] border border-white/[0.05] p-2 rounded text-slate-400 max-h-24 overflow-y-auto no-scrollbar scroll-smooth leading-normal">
                    {linkVaultSummary}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
