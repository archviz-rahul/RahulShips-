'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAIStudio } from '../hooks/useAIStudio'
import { useModelConnection } from '../hooks/useModelConnection'
import { ModelRegistry } from './studio/ModelRegistry'
import { TaskCanvas } from './studio/TaskCanvas'
import { OutputPanel } from './studio/OutputPanel'
import { MODEL_REGISTRY } from '../lib/models/modelConfig'
import { Cpu, FileText, Layout, Settings, Sparkles } from 'lucide-react'

export function AIStudioView() {
  const [isLeftPanelExpanded, setIsLeftPanelExpanded] = useState(true)
  const [isRightPanelExpanded, setIsRightPanelExpanded] = useState(true)

  const studio = useAIStudio()
  const connections = useModelConnection(MODEL_REGISTRY)

  // Toggle helpers
  const toggleLeftPanel = () => setIsLeftPanelExpanded(!isLeftPanelExpanded)
  const toggleRightPanel = () => setIsRightPanelExpanded(!isRightPanelExpanded)

  return (
    <div className="w-full h-screen flex flex-col bg-[#0A0A0B] text-slate-100 font-sans selection:bg-teal-500/20 overflow-hidden">
      
      {/* Dynamic Sub-header Top-Bar */}
      <div className="w-full shrink-0 border-b border-white/[0.04] bg-[#070708]/80 backdrop-blur-md px-5 py-3.5 flex items-center justify-between select-none">
        
        {/* Left indicators */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div>
            <h2 className="font-sans font-medium text-xs tracking-wider uppercase text-white leading-none">
              AI Production Studio
            </h2>
            <span className="text-[10px] font-mono text-slate-500 block leading-none mt-1">
              co-pilot pipeline v3.0 • secure server keys activated
            </span>
          </div>
        </div>

        {/* Floating actions / collapsed controllers */}
        <div className="flex items-center gap-2.5">
          {/* Left panel collapse state */}
          <button
            type="button"
            onClick={toggleLeftPanel}
            className={`p-2 rounded-lg border text-xs font-sans transition flex items-center gap-1.5 ${
              isLeftPanelExpanded
                ? 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                : 'bg-white/[0.02] border-white/[0.05] text-slate-400 hover:bg-white/[0.03]'
            }`}
            title="Toggle Model Hub Left panel visibility"
            id="control-left-sidebar"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Model Hub</span>
          </button>

          {/* Right panel collapse state */}
          <button
            type="button"
            onClick={toggleRightPanel}
            className={`p-2 rounded-lg border text-xs font-sans transition flex items-center gap-1.5 ${
              isRightPanelExpanded
                ? 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                : 'bg-white/[0.02] border-white/[0.05] text-slate-400 hover:bg-white/[0.03]'
            }`}
            title="Toggle Output Right panel visibility"
            id="control-right-sidebar"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Active Preview</span>
          </button>
        </div>

      </div>

      {/* Main 3-Panel Split Screen Visual grid */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ── 1. MODEL REGISTRY SIDEBAR (LEFT) ──────────────── */}
        <div
          className={`h-full border-r border-white/[0.04] transition-all duration-300 transform shrink-0 ${
            isLeftPanelExpanded ? 'w-full md:w-64 opacity-100 translate-x-0' : 'w-0 opacity-0 pointer-events-none -translate-x-12'
          }`}
        >
          {isLeftPanelExpanded && (
            <ModelRegistry
              selectedModelId={studio.selectedModelId}
              onSelectModel={studio.setSelectedModelId}
              connections={connections.connections}
              onTestConnection={connections.testConnection}
            />
          )}
        </div>

        {/* ── 2. TASK CANVAS WORKSPACE (CENTER) ─────────────── */}
        <div className="flex-1 h-full min-w-0">
          <TaskCanvas
            activeTask={studio.activeTask}
            setActiveTask={studio.setActiveTask}
            selectedModelId={studio.selectedModelId}
            isStreaming={studio.isStreaming}
            generateTaskContent={studio.generateTaskContent}

            // Bind State Variables
            topic={studio.topic}
            setTopic={studio.setTopic}
            voiceStyle={studio.voiceStyle}
            setVoiceStyle={studio.setVoiceStyle}
            customInstructions={studio.customInstructions}
            setCustomInstructions={studio.setCustomInstructions}
            generatorHooksSource={studio.generatorHooksSource}
            setGeneratorHooksSource={studio.setGeneratorHooksSource}
            captionSourceText={studio.captionSourceText}
            setCaptionSourceText={studio.setCaptionSourceText}
            imagePromptTopic={studio.imagePromptTopic}
            setImagePromptTopic={studio.setImagePromptTopic}
            ttsScriptText={studio.ttsScriptText}
            setTtsScriptText={studio.setTtsScriptText}
            videoSceneText={studio.videoSceneText}
            setVideoSceneText={studio.setVideoSceneText}
            audioVibeText={studio.audioVibeText}
            setAudioVibeText={studio.setAudioVibeText}
            audioGenreText={studio.audioGenreText}
            setAudioGenreText={studio.setAudioGenreText}

            // Bind Context Injectors
            useCalendarPillar={studio.useCalendarPillar}
            setUseCalendarPillar={studio.setUseCalendarPillar}
            calendarPillar={studio.calendarPillar}
            useHookBankContext={studio.useHookBankContext}
            setUseHookBankContext={studio.setUseHookBankContext}
            hookBankHooks={studio.hookBankHooks}
            selectedHookFromBank={studio.selectedHookFromBank}
            setSelectedHookFromBank={studio.setSelectedHookFromBank}
            useLinkVaultRefs={studio.useLinkVaultRefs}
            setUseLinkVaultRefs={studio.setUseLinkVaultRefs}
            linkVaultSummary={studio.linkVaultSummary}
          />
        </div>

        {/* ── 3. PREVIEW OUTPUT PANEL (RIGHT) ────────────────── */}
        <div
          className={`h-full border-l border-white/[0.04] transition-all duration-300 transform shrink-0 ${
            isRightPanelExpanded ? 'w-full md:w-80 opacity-100 translate-x-0' : 'w-0 opacity-0 pointer-events-none translate-x-12'
          }`}
        >
          {isRightPanelExpanded && (
            <OutputPanel
              outputHistory={studio.outputHistory}
              activeOutputId={studio.activeOutputId}
              setActiveOutputId={studio.setActiveOutputId}
              currentStreamingText={studio.currentStreamingText}
              isStreaming={studio.isStreaming}
              onToggleSaveRecord={studio.toggleSaveRecord}
              onDeleteRecord={studio.deleteRecord}
              activeRecord={studio.activeRecord}
            />
          )}
        </div>

      </div>

    </div>
  )
}
export default AIStudioView
