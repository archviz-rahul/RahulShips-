'use client'

import { motion } from 'motion/react'
import { TaskType, ModelConfig, MODEL_REGISTRY } from '../../lib/models/modelConfig'
import { ScriptWriter } from './tasks/ScriptWriter'
import { HookGenerator } from './tasks/HookGenerator'
import { ThumbnailStudio } from './tasks/ThumbnailStudio'
import { CaptionWriter } from './tasks/CaptionWriter'
import { VoiceoverTask } from './tasks/VoiceoverTask'
import { VideoPromptTask } from './tasks/VideoPromptTask'
import { MusicTask } from './tasks/MusicTask'
import { ResearchTask } from './tasks/ResearchTask'
import { ContextInjector } from './ContextInjector'
import { Play, Sparkles, Sliders, Layers, Zap } from 'lucide-react'

interface TaskCanvasProps {
  activeTask: TaskType
  setActiveTask: (t: TaskType) => void
  selectedModelId: string
  isStreaming: boolean
  generateTaskContent: () => Promise<void>

  // Dynamic state hooks of AIStudioState
  topic: string
  setTopic: (v: string) => void
  voiceStyle: string
  setVoiceStyle: (v: string) => void
  customInstructions: string
  setCustomInstructions: (v: string) => void
  generatorHooksSource: string
  setGeneratorHooksSource: (v: string) => void
  captionSourceText: string
  setCaptionSourceText: (v: string) => void
  imagePromptTopic: string
  setImagePromptTopic: (v: string) => void
  ttsScriptText: string
  setTtsScriptText: (v: string) => void
  videoSceneText: string
  setVideoSceneText: (v: string) => void
  audioVibeText: string
  setAudioVibeText: (v: string) => void
  audioGenreText: string
  setAudioGenreText: (v: string) => void

  // Context Toggles state
  useCalendarPillar: boolean
  setUseCalendarPillar: (val: boolean) => void
  calendarPillar: string
  useHookBankContext: boolean
  setUseHookBankContext: (val: boolean) => void
  hookBankHooks: string[]
  selectedHookFromBank: string
  setSelectedHookFromBank: (val: string) => void
  useLinkVaultRefs: boolean
  setUseLinkVaultRefs: (val: boolean) => void
  linkVaultSummary: string
}

const TASK_TABS: { id: TaskType; label: string; icon: string }[] = [
  { id: 'script-reel', label: 'Ree / Short Script', icon: '🎬' },
  { id: 'script-longform', label: 'Longform YouTube', icon: '🎥' },
  { id: 'hook-generator', label: 'Hook Generator', icon: '🪝' },
  { id: 'caption-writer', label: 'Post Caption', icon: '✍️' },
  { id: 'thumbnail-image', label: 'Thumbnail Studio', icon: '🖼️' },
  { id: 'voiceover', label: 'Voiceover TTS', icon: '🎙️' },
  { id: 'video-prompt', label: 'Scenic B-Roll', icon: '📹' },
  { id: 'music-sfx', label: 'Suno Music', icon: '🎵' },
  { id: 'research', label: 'Tech Research', icon: '🔍' }
]

export function TaskCanvas({
  activeTask,
  setActiveTask,
  selectedModelId,
  isStreaming,
  generateTaskContent,

  // String parameters
  topic,
  setTopic,
  voiceStyle,
  setVoiceStyle,
  customInstructions,
  setCustomInstructions,
  generatorHooksSource,
  setGeneratorHooksSource,
  captionSourceText,
  setCaptionSourceText,
  imagePromptTopic,
  setImagePromptTopic,
  ttsScriptText,
  setTtsScriptText,
  videoSceneText,
  setVideoSceneText,
  audioVibeText,
  setAudioVibeText,
  audioGenreText,
  setAudioGenreText,

  // Context Injectors parameters
  useCalendarPillar,
  setUseCalendarPillar,
  calendarPillar,
  useHookBankContext,
  setUseHookBankContext,
  hookBankHooks,
  selectedHookFromBank,
  setSelectedHookFromBank,
  useLinkVaultRefs,
  setUseLinkVaultRefs,
  linkVaultSummary
}: TaskCanvasProps) {
  
  const activeModel = MODEL_REGISTRY.find(m => m.id === selectedModelId)

  // Sub-forms mapping
  const renderTaskForm = () => {
    switch (activeTask) {
      case 'script-reel':
      case 'script-longform':
        return (
          <ScriptWriter
            topic={topic}
            setTopic={setTopic}
            voiceStyle={voiceStyle}
            setVoiceStyle={setVoiceStyle}
            customInstructions={customInstructions}
            setCustomInstructions={setCustomInstructions}
            useCalendarPillar={useCalendarPillar}
            setUseCalendarPillar={setUseCalendarPillar}
            calendarPillar={calendarPillar}
          />
        )
      case 'hook-generator':
        return (
          <HookGenerator
            sourceText={generatorHooksSource}
            setSourceText={setGeneratorHooksSource}
            customInstructions={customInstructions}
            setCustomInstructions={setCustomInstructions}
          />
        )
      case 'thumbnail-image':
        return (
          <ThumbnailStudio
            imagePromptTopic={imagePromptTopic}
            setImagePromptTopic={setImagePromptTopic}
            customInstructions={customInstructions}
            setCustomInstructions={setCustomInstructions}
          />
        )
      case 'caption-writer':
        return (
          <CaptionWriter
            captionSourceText={captionSourceText}
            setCaptionSourceText={setCaptionSourceText}
            customInstructions={customInstructions}
            setCustomInstructions={setCustomInstructions}
          />
        )
      case 'voiceover':
        return (
          <VoiceoverTask
            ttsScriptText={ttsScriptText}
            setTtsScriptText={setTtsScriptText}
            customInstructions={customInstructions}
            setCustomInstructions={setCustomInstructions}
          />
        )
      case 'video-prompt':
        return (
          <VideoPromptTask
            videoSceneText={videoSceneText}
            setVideoSceneText={setVideoSceneText}
            customInstructions={customInstructions}
            setCustomInstructions={setCustomInstructions}
          />
        )
      case 'music-sfx':
        return (
          <MusicTask
            audioVibeText={audioVibeText}
            setAudioVibeText={setAudioVibeText}
            audioGenreText={audioGenreText}
            setAudioGenreText={setAudioGenreText}
            customInstructions={customInstructions}
            setCustomInstructions={setCustomInstructions}
          />
        )
      case 'research':
        return (
          <ResearchTask
            topic={topic}
            setTopic={setTopic}
            customInstructions={customInstructions}
            setCustomInstructions={setCustomInstructions}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0A0A0B] border-x border-white/[0.04]">
      
      {/* Horizontal Task bar selector */}
      <div className="flex overflow-x-auto border-b border-white/[0.04] bg-[#070708] scrollbar-thin scrollbar-thumb-white/10 shrink-0 p-1 bg-opacity-80 backdrop-blur-lg">
        <div className="flex gap-1 py-1.5 px-3">
          {TASK_TABS.map((t) => {
            const isTabActive = activeTask === t.id || (t.id === 'script-reel' && activeTask === 'script-longform')
            return (
              <button
                key={t.id}
                onClick={() => {
                  // Split active scripts nicely
                  setActiveTask(t.id)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium hover:text-white transition-all whitespace-nowrap scroll-ml-2 shrink-0 flex items-center gap-1.5 ${
                  activeTask === t.id
                    ? 'bg-white/[0.05] text-white shadow-sm border border-white/[0.06]'
                    : 'text-slate-400 hover:bg-white/[0.01]'
                }`}
                id={`task-tab-${t.id}`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Forms Body & Canvas */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
        
        {/* Dynamic Inner Task form */}
        {renderTaskForm()}

        {/* Co-pilot active Context Injector */}
        <ContextInjector
          useCalendarPillar={useCalendarPillar}
          setUseCalendarPillar={setUseCalendarPillar}
          calendarPillar={calendarPillar}
          useHookBank={useHookBankContext}
          setUseHookBank={setUseHookBankContext}
          hookBankHooks={hookBankHooks}
          selectedHook={selectedHookFromBank}
          setSelectedHook={setSelectedHookFromBank}
          useLinkVault={useLinkVaultRefs}
          setUseLinkVault={setUseLinkVaultRefs}
          linkVaultSummary={linkVaultSummary}
        />

        {/* Setup Prompt explanation details */}
        <div className="bg-[#0E0E10]/25 rounded-lg p-3 text-[10px] font-mono text-slate-500 leading-normal border border-white/[0.02]">
          💡 Co-pilot tip: Tap the left model card to assign high-performance overrides (e.g., FLUX.1 for images, Suno for audio). 
          Default models are pre-assigned to save key balances.
        </div>
      </div>

      {/* Production pipeline triggering footer */}
      <div className="p-4 border-t border-white/[0.04] bg-[#070708]/80 backdrop-blur-md shrink-0">
        <button
          onClick={generateTaskContent}
          disabled={isStreaming}
          className={`w-full py-4 px-4 rounded-xl text-xs font-sans font-medium transition-all duration-300 relative overflow-hidden group tracking-wider uppercase flex items-center justify-center gap-2 ${
            isStreaming
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-white/5'
              : 'bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold active:scale-[0.99] shadow-[0_4px_30px_rgba(20,184,166,0.3)]'
          }`}
          id="trigger-co-pilot-pipeline"
        >
          {isStreaming ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Streaming production pipeline...</span>
            </div>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Generate with {activeModel?.name || 'Selected Model'}</span>
            </>
          )}

          {/* Glowing bottom line border on hover */}
          {!isStreaming && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white opacity-0 group-hover:opacity-30 transition" />
          )}
        </button>
      </div>

    </div>
  )
}
