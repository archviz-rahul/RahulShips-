'use client'

import { useState, useEffect } from 'react'
import { TaskType, ModelConfig, MODEL_REGISTRY, getDefaultModelForTask } from '../lib/models/modelConfig'
import { getPromptForTask } from '../lib/studioPrompts'

export interface OutputRecord {
  id: string
  task: TaskType
  modelId: string
  prompt: string
  systemPromptUsed: string
  outputText: string
  imageUrl?: string
  audioUrl?: string
  videoUrl?: string
  createdAt: string
  isSaved: boolean
}

export function useAIStudio() {
  const [activeTask, setActiveTaskState] = useState<TaskType>('script-reel')
  const [selectedModelId, setSelectedModelId] = useState<string>('gemini-flash')
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentStreamingText, setCurrentStreamingText] = useState('')

  const [outputHistory, setOutputHistory] = useState<OutputRecord[]>(() => {
    if (typeof window === 'undefined') return []
    const saved = localStorage.getItem('rahulships_studio_generations')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {}
    }
    return []
  })

  const [activeOutputId, setActiveOutputId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    const saved = localStorage.getItem('rahulships_studio_generations')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.length > 0) return parsed[0].id
      } catch (e) {}
    }
    return null
  })

  // ── TASK STAGE CONFIG ───────────────────
  const [topic, setTopic] = useState('Why fast scaling kills early software startups')
  const [voiceStyle, setVoiceStyle] = useState('Architectural Visual Developer, fast-paced and punchy')
  const [customInstructions, setCustomInstructions] = useState('Keep it visual, structured with columns, and under 160 words.')
  
  // Specific Task Fields
  const [generatorHooksSource, setGeneratorHooksSource] = useState('Everyone tells you to build microservices. But here is the architectural scam...')
  const [captionSourceText, setCaptionSourceText] = useState('In today\'s video, we are breaking down why serverless runtimes are a visual blueprint paradigm of file system caching.')
  const [imagePromptTopic, setImagePromptTopic] = useState('A glowing cybernetic computer terminal with architectural blueprint graphics floating in black dark matter, 3D render')
  const [ttsScriptText, setTtsScriptText] = useState('Welcome back to the co-pilot. Today we are looking at real-time telemetry systems.')
  const [videoSceneText, setVideoSceneText] = useState('A extreme macro closeup of an analog tape machine turning silently, glowing teal indicators flickering in soft shadow')
  const [audioVibeText, setAudioVibeText] = useState('Focused late-night minimal lofi coding beat')
  const [audioGenreText, setAudioGenreText] = useState('Analog minimal techno pulse, sub-bass, clean modular ticks, 90 BPM')

  // Context Injection Flags
  const [useCalendarPillar, setUseCalendarPillar] = useState(true)
  const [useHookBankContext, setUseHookBankContext] = useState(false)
  const [useLinkVaultRefs, setUseLinkVaultRefs] = useState(false)

  // Context Extracted from Storage (initialized directly synchronously on mount)
  const [calendarPillar, setCalendarPillar] = useState<string>(() => {
    if (typeof window === 'undefined') return 'Software Architecture'
    const activeDayIndexStr = localStorage.getItem('rahul_calendar_active_index')
    const savedPillars = localStorage.getItem('rahul_calendar_pillars')
    if (savedPillars) {
      try {
        const parsed = JSON.parse(savedPillars)
        const idx = activeDayIndexStr ? parseInt(activeDayIndexStr) : new Date().getDay()
        if (parsed[idx]) {
          return parsed[idx].pillar || parsed[idx].description || 'Software Architecture'
        }
      } catch (e) {}
    }
    return 'Software Architecture'
  })

  const [hookBankHooks, setHookBankHooks] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    const savedHooks = localStorage.getItem('rahulships_hooks') || localStorage.getItem('rahul_hooks')
    if (savedHooks) {
      try {
        const parsed = JSON.parse(savedHooks)
        if (Array.isArray(parsed)) {
          return parsed.map(h => h.hook || h.text || h.title).filter(Boolean)
        }
      } catch (e) {}
    }
    return []
  })

  const [selectedHookFromBank, setSelectedHookFromBank] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    const savedHooks = localStorage.getItem('rahulships_hooks') || localStorage.getItem('rahul_hooks')
    if (savedHooks) {
      try {
        const parsed = JSON.parse(savedHooks)
        if (Array.isArray(parsed)) {
          const texts = parsed.map(h => h.hook || h.text || h.title).filter(Boolean)
          if (texts.length > 0) return texts[0]
        }
      } catch (e) {}
    }
    return ''
  })

  const [linkVaultSummary, setLinkVaultSummary] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    const savedLinks = localStorage.getItem('rahulships_linkvault') || localStorage.getItem('rahulships_links')
    if (savedLinks) {
      try {
        const parsed = JSON.parse(savedLinks)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 5).map(lnk => {
            return `Link citation: [Title: ${lnk.title || lnk.url}] (Analysis: ${lnk.summary || 'Awaits deep analysis'})`
          }).join('\n')
        }
      } catch (e) {}
    }
    return ''
  })

  // Set active task and default model together synchronously to bypass effect triggers
  const setActiveTask = (task: TaskType) => {
    setActiveTaskState(task)
    const defaultModel = getDefaultModelForTask(task)
    if (defaultModel) {
      setSelectedModelId(defaultModel.id)
    }
  }

  // Helper: Save Outputs History to localStorage
  const saveHistory = (updated: OutputRecord[]) => {
    setOutputHistory(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('rahulships_studio_generations', JSON.stringify(updated))
    }
  }

  // Inject Context builder
  const buildContextArguments = () => {
    const args: any = {
      topic,
      voiceStyle,
      customInstructions
    }

    if (useCalendarPillar && calendarPillar) {
      args.calendarPillar = calendarPillar
    }
    if (useHookBankContext && selectedHookFromBank) {
      args.hookBankHook = selectedHookFromBank
    }
    if (useLinkVaultRefs && linkVaultSummary) {
      args.linkVaultContext = linkVaultSummary
    }

    // Specific task overrides
    if (activeTask === 'hook-generator') {
      args.topic = generatorHooksSource
    } else if (activeTask === 'caption-writer') {
      args.topic = captionSourceText
    } else if (activeTask === 'thumbnail-image') {
      args.promptTopic = imagePromptTopic
    } else if (activeTask === 'voiceover') {
      args.scriptText = ttsScriptText
    } else if (activeTask === 'video-prompt' || activeTask === 'broll-prompt') {
      args.sceneText = videoSceneText
    } else if (activeTask === 'music-sfx') {
      args.vibe = audioVibeText
      args.genre = audioGenreText
    }

    return args
  }

  // Trigger Content Production
  const generateTaskContent = async () => {
    if (isStreaming) return

    setIsStreaming(true)
    setCurrentStreamingText('')
    
    // Create pre-validation prompt parameters
    const argsContext = buildContextArguments()
    const { systemPrompt, userPrompt } = getPromptForTask(activeTask, argsContext)

    // Append standard visual guidelines to userPrompt if requested
    let promptToSend = userPrompt
    if (useCalendarPillar && calendarPillar) {
      promptToSend += `\nEnsure we integrate our core context topic: ${calendarPillar}`
    }

    const modelObj = MODEL_REGISTRY.find(m => m.id === selectedModelId) || MODEL_REGISTRY[0]

    // Determine streaming: ONLY stream text-generation capabilities of GEMINI!
    const shouldStream = modelObj.capabilities.includes('text-generation') && modelObj.provider === 'gemini'

    try {
      const response = await fetch('/api/studio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelId: selectedModelId,
          task: activeTask,
          prompt: promptToSend,
          systemPrompt,
          stream: shouldStream
        })
      })

      if (!response.ok) {
        const errorBody = await response.json()
        throw new Error(errorBody.error || 'Server returned an error during content production.')
      }

      // ── A. STEAMING DISPATCHER ───────────────────
      if (shouldStream) {
        const reader = response.body?.getReader()
        if (!reader) throw new Error('Unresolved stream body handle.')

        const decoder = new TextDecoder()
        let completeOutputText = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          completeOutputText += chunk
          setCurrentStreamingText(prev => prev + chunk)
        }

        // Push output record to history
        const newRecord: OutputRecord = {
          id: `out-${Date.now()}`,
          task: activeTask,
          modelId: selectedModelId,
          prompt: promptToSend,
          systemPromptUsed: systemPrompt,
          outputText: completeOutputText,
          createdAt: new Date().toLocaleString(),
          isSaved: false
        }

        const nextHistory = [newRecord, ...outputHistory]
        saveHistory(nextHistory)
        setActiveOutputId(newRecord.id)

      } else {
        // ── B. REGULAR JSON DISPATCHER (Images, media elements) ───
        const data = await response.json()

        const newRecord: OutputRecord = {
          id: `out-${Date.now()}`,
          task: activeTask,
          modelId: selectedModelId,
          prompt: promptToSend,
          systemPromptUsed: systemPrompt,
          outputText: data.text || `Output result successfully synthesized by ${modelObj.name}.`,
          imageUrl: data.imageUrl,
          audioUrl: data.audioUrl,
          videoUrl: data.videoUrl,
          createdAt: new Date().toLocaleString(),
          isSaved: false
        }

        setCurrentStreamingText(newRecord.outputText)
        const nextHistory = [newRecord, ...outputHistory]
        saveHistory(nextHistory)
        setActiveOutputId(newRecord.id)
      }

    } catch (err: any) {
      console.error('Task generation failed:', err)
      const errorText = `[Error occurred during content production]:\n${err.message || 'Verification mismatch inside backend container.'}`
      setCurrentStreamingText(errorText)

      const errorRecord: OutputRecord = {
        id: `out-${Date.now()}`,
        task: activeTask,
        modelId: selectedModelId,
        prompt: promptToSend,
        systemPromptUsed: systemPrompt,
        outputText: errorText,
        createdAt: new Date().toLocaleString(),
        isSaved: false
      }
      saveHistory([errorRecord, ...outputHistory])
      setActiveOutputId(errorRecord.id)
    } finally {
      setIsStreaming(false)
    }
  }

  // Delete an output card
  const deleteRecord = (id: string) => {
    const updated = outputHistory.filter(o => o.id !== id)
    saveHistory(updated)
    if (activeOutputId === id) {
      setActiveOutputId(updated.length > 0 ? updated[0].id : null)
      setCurrentStreamingText(updated.length > 0 ? updated[0].outputText : '')
    }
  }

  // Toggle saving an output card (favorites)
  const toggleSaveRecord = (id: string) => {
    const updated = outputHistory.map(o => {
      if (o.id === id) {
        return { ...o, isSaved: !o.isSaved }
      }
      return o
    })
    saveHistory(updated)
  }

  // Active record getter
  const activeRecord = outputHistory.find(o => o.id === activeOutputId) ?? null

  return {
    activeTask,
    setActiveTask,
    selectedModelId,
    setSelectedModelId,
    isStreaming,
    currentStreamingText,
    outputHistory,
    activeOutputId,
    setActiveOutputId,
    activeRecord,

    // Task Parameter Binding
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

    // Context Toggles
    useCalendarPillar,
    setUseCalendarPillar,
    useHookBankContext,
    setUseHookBankContext,
    useLinkVaultRefs,
    setUseLinkVaultRefs,

    // Loaded Context Values
    calendarPillar,
    hookBankHooks,
    selectedHookFromBank,
    setSelectedHookFromBank,
    linkVaultSummary,

    // Core Actions
    generateTaskContent,
    deleteRecord,
    toggleSaveRecord
  }
}
