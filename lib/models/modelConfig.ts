export type ModelProvider =
  | 'gemini'
  | 'openai'
  | 'anthropic'
  | 'elevenlabs'
  | 'replicate'
  | 'runway'
  | 'kling'
  | 'suno'
  | 'perplexity'
  | 'ollama'
  | 'lmstudio'

export type ModelCapability =
  | 'text-generation'
  | 'image-generation'
  | 'audio-generation'
  | 'video-generation'
  | 'web-search'
  | 'vision'
  | 'code'
  | 'analysis'

export type ModelStatus =
  | 'connected'
  | 'disconnected'
  | 'testing'
  | 'error'
  | 'not-configured'

export type TaskType =
  | 'script-reel'
  | 'script-longform'
  | 'script-newsletter'
  | 'hook-generator'
  | 'caption-writer'
  | 'thumbnail-concept'
  | 'thumbnail-image'
  | 'voiceover'
  | 'video-prompt'
  | 'broll-prompt'
  | 'music-sfx'
  | 'research'
  | 'content-analysis'

export interface ModelConfig {
  id: string
  name: string
  provider: ModelProvider
  version: string
  capabilities: ModelCapability[]
  defaultTasks: TaskType[]
  connectionType: 'api-key' | 'local-endpoint'
  apiKeyLabel: string
  endpointDefault: string | null
  costTier: 'free' | 'low' | 'medium' | 'high'
  speedTier: 'fast' | 'medium' | 'slow'
  isLocal: boolean
  setupInstructions: string[]
  modelColor: string
  modelIcon: string
  isEnabled: boolean
  fallbackModelId: string | null
}

export const MODEL_REGISTRY: ModelConfig[] = [

  // ── TEXT MODELS ──────────────────────

  {
    id: 'gemini-flash',
    name: 'Gemini 3.5 Flash',
    provider: 'gemini',
    version: 'gemini-3.5-flash',
    capabilities: ['text-generation', 'vision', 'analysis'],
    defaultTasks: [
      'script-reel',
      'script-longform',
      'hook-generator',
      'caption-writer',
      'content-analysis',
      'script-newsletter'
    ],
    connectionType: 'api-key',
    apiKeyLabel: 'GEMINI_API_KEY',
    endpointDefault: null,
    costTier: 'low',
    speedTier: 'fast',
    isLocal: false,
    setupInstructions: [
      'Get API key from aistudio.google.com',
      'Add GEMINI_API_KEY to secrets panel or .env'
    ],
    modelColor: '#4285F4',
    modelIcon: '✦',
    isEnabled: true,
    fallbackModelId: 'gemini-pro'
  },

  {
    id: 'gemini-pro',
    name: 'Gemini 3.1 Pro',
    provider: 'gemini',
    version: 'gemini-3.1-pro-preview',
    capabilities: ['text-generation', 'vision', 'analysis'],
    defaultTasks: ['research', 'content-analysis', 'script-longform'],
    connectionType: 'api-key',
    apiKeyLabel: 'GEMINI_API_KEY',
    endpointDefault: null,
    costTier: 'medium',
    speedTier: 'medium',
    isLocal: false,
    setupInstructions: [
      'Uses same GEMINI_API_KEY as Flash'
    ],
    modelColor: '#4285F4',
    modelIcon: '✦',
    isEnabled: true,
    fallbackModelId: null
  },

  {
    id: 'gpt4o',
    name: 'GPT-4o',
    provider: 'openai',
    version: 'gpt-4o',
    capabilities: ['text-generation', 'vision', 'code'],
    defaultTasks: [
      'script-reel',
      'hook-generator',
      'caption-writer',
      'script-newsletter'
    ],
    connectionType: 'api-key',
    apiKeyLabel: 'OPENAI_API_KEY',
    endpointDefault: null,
    costTier: 'high',
    speedTier: 'medium',
    isLocal: false,
    setupInstructions: [
      'Get API key from platform.openai.com',
      'Add OPENAI_API_KEY to .env'
    ],
    modelColor: '#10A37F',
    modelIcon: '⬡',
    isEnabled: false,
    fallbackModelId: 'gemini-flash'
  },

  {
    id: 'claude-sonnet',
    name: 'Claude Sonnet 3.5',
    provider: 'anthropic',
    version: 'claude-3-5-sonnet-latest',
    capabilities: ['text-generation', 'analysis', 'code'],
    defaultTasks: [
      'script-longform',
      'script-newsletter',
      'content-analysis',
      'research'
    ],
    connectionType: 'api-key',
    apiKeyLabel: 'ANTHROPIC_API_KEY',
    endpointDefault: null,
    costTier: 'medium',
    speedTier: 'medium',
    isLocal: false,
    setupInstructions: [
      'Get API key from console.anthropic.com',
      'Add ANTHROPIC_API_KEY to .env'
    ],
    modelColor: '#D4A574',
    modelIcon: '◈',
    isEnabled: false,
    fallbackModelId: 'gemini-pro'
  },

  {
    id: 'llama-local',
    name: 'Llama 3.1 8B (Local)',
    provider: 'ollama',
    version: 'llama3.1',
    capabilities: ['text-generation', 'code'],
    defaultTasks: ['script-reel', 'hook-generator', 'caption-writer'],
    connectionType: 'local-endpoint',
    apiKeyLabel: '',
    endpointDefault: 'http://localhost:11434',
    costTier: 'free',
    speedTier: 'medium',
    isLocal: true,
    setupInstructions: [
      'Install Ollama: curl -fsSL https://ollama.com/install.sh | sh',
      'Pull model: ollama pull llama3.1',
      'Start server: ollama serve',
      'Verify: http://localhost:11434'
    ],
    modelColor: '#7C3AED',
    modelIcon: '⬡',
    isEnabled: false,
    fallbackModelId: 'gemini-flash'
  },

  {
    id: 'mistral-local',
    name: 'Mistral 7B (Local)',
    provider: 'ollama',
    version: 'mistral',
    capabilities: ['text-generation'],
    defaultTasks: ['hook-generator', 'caption-writer'],
    connectionType: 'local-endpoint',
    apiKeyLabel: '',
    endpointDefault: 'http://localhost:11434',
    costTier: 'free',
    speedTier: 'fast',
    isLocal: true,
    setupInstructions: [
      'Install Ollama first',
      'Pull model: ollama pull mistral',
      'Start server: ollama serve'
    ],
    modelColor: '#7C3AED',
    modelIcon: '⬡',
    isEnabled: false,
    fallbackModelId: 'gemini-flash'
  },

  // ── IMAGE MODELS ─────────────────────

  {
    id: 'flux-pro',
    name: 'FLUX.1 Pro',
    provider: 'replicate',
    version: 'black-forest-labs/flux-pro',
    capabilities: ['image-generation'],
    defaultTasks: ['thumbnail-image'],
    connectionType: 'api-key',
    apiKeyLabel: 'REPLICATE_API_KEY',
    endpointDefault: null,
    costTier: 'medium',
    speedTier: 'medium',
    isLocal: false,
    setupInstructions: [
      'Get API key from replicate.com',
      'Add REPLICATE_API_KEY to .env'
    ],
    modelColor: '#F59E0B',
    modelIcon: '◈',
    isEnabled: false,
    fallbackModelId: 'dalle3'
  },

  {
    id: 'flux-schnell',
    name: 'FLUX.1 Schnell (Fast)',
    provider: 'replicate',
    version: 'black-forest-labs/flux-schnell',
    capabilities: ['image-generation'],
    defaultTasks: ['thumbnail-image'],
    connectionType: 'api-key',
    apiKeyLabel: 'REPLICATE_API_KEY',
    endpointDefault: null,
    costTier: 'low',
    speedTier: 'fast',
    isLocal: false,
    setupInstructions: [
      'Uses same REPLICATE_API_KEY as FLUX Pro'
    ],
    modelColor: '#F59E0B',
    modelIcon: '◈',
    isEnabled: false,
    fallbackModelId: 'dalle3'
  },

  {
    id: 'sdxl-local',
    name: 'Stable Diffusion XL (Local)',
    provider: 'lmstudio',
    version: 'sdxl',
    capabilities: ['image-generation'],
    defaultTasks: ['thumbnail-image', 'broll-prompt'],
    connectionType: 'local-endpoint',
    apiKeyLabel: '',
    endpointDefault: 'http://localhost:7860',
    costTier: 'free',
    speedTier: 'slow',
    isLocal: true,
    setupInstructions: [
      'Install Automatic1111 WebUI',
      'Launch with: --api flag',
      'Verify: http://localhost:7860/docs'
    ],
    modelColor: '#EC4899',
    modelIcon: '◈',
    isEnabled: false,
    fallbackModelId: 'flux-schnell'
  },

  {
    id: 'dalle3',
    name: 'DALL-E 3',
    provider: 'openai',
    version: 'dall-e-3',
    capabilities: ['image-generation'],
    defaultTasks: ['thumbnail-image'],
    connectionType: 'api-key',
    apiKeyLabel: 'OPENAI_API_KEY',
    endpointDefault: null,
    costTier: 'medium',
    speedTier: 'medium',
    isLocal: false,
    setupInstructions: [
      'Uses same OPENAI_API_KEY as GPT-4o'
    ],
    modelColor: '#10A37F',
    modelIcon: '◈',
    isEnabled: false,
    fallbackModelId: 'flux-schnell'
  },

  // ── AUDIO MODELS ─────────────────────

  {
    id: 'elevenlabs',
    name: 'ElevenLabs TTS',
    provider: 'elevenlabs',
    version: 'eleven_multilingual_v2',
    capabilities: ['audio-generation'],
    defaultTasks: ['voiceover'],
    connectionType: 'api-key',
    apiKeyLabel: 'ELEVENLABS_API_KEY',
    endpointDefault: null,
    costTier: 'medium',
    speedTier: 'fast',
    isLocal: false,
    setupInstructions: [
      'Get API key from elevenlabs.io',
      'Add ELEVENLABS_API_KEY to .env',
      'Add ELEVENLABS_VOICE_ID to .env',
      'Get Voice ID from ElevenLabs dashboard'
    ],
    modelColor: '#06B6D4',
    modelIcon: '♪',
    isEnabled: false,
    fallbackModelId: null
  },

  {
    id: 'suno',
    name: 'Suno AI Music',
    provider: 'suno',
    version: 'v3.5',
    capabilities: ['audio-generation'],
    defaultTasks: ['music-sfx'],
    connectionType: 'api-key',
    apiKeyLabel: 'SUNO_API_KEY',
    endpointDefault: null,
    costTier: 'low',
    speedTier: 'slow',
    isLocal: false,
    setupInstructions: [
      'Get API key from suno.ai',
      'Add SUNO_API_KEY to .env'
    ],
    modelColor: '#A855F7',
    modelIcon: '♫',
    isEnabled: false,
    fallbackModelId: null
  },

  // ── VIDEO MODELS ─────────────────────

  {
    id: 'runway-gen3',
    name: 'Runway Gen-3 Alpha',
    provider: 'runway',
    version: 'gen3a_turbo',
    capabilities: ['video-generation'],
    defaultTasks: ['video-prompt', 'broll-prompt'],
    connectionType: 'api-key',
    apiKeyLabel: 'RUNWAY_API_KEY',
    endpointDefault: null,
    costTier: 'high',
    speedTier: 'slow',
    isLocal: false,
    setupInstructions: [
      'Get API key from runwayml.com',
      'Add RUNWAY_API_KEY to .env'
    ],
    modelColor: '#EF4444',
    modelIcon: '▶',
    isEnabled: false,
    fallbackModelId: 'kling'
  },

  {
    id: 'kling',
    name: 'Kling AI Video',
    provider: 'kling',
    version: 'kling-v1.5',
    capabilities: ['video-generation'],
    defaultTasks: ['video-prompt', 'broll-prompt'],
    connectionType: 'api-key',
    apiKeyLabel: 'KLING_API_KEY',
    endpointDefault: null,
    costTier: 'medium',
    speedTier: 'slow',
    isLocal: false,
    setupInstructions: [
      'Get API key from klingai.com',
      'Add KLING_API_KEY to .env'
    ],
    modelColor: '#EF4444',
    modelIcon: '▶',
    isEnabled: false,
    fallbackModelId: null
  },

  // ── ANALYSIS/SEARCH MODELS ───────────

  {
    id: 'perplexity',
    name: 'Perplexity Sonar',
    provider: 'perplexity',
    version: 'sonar-reasoning',
    capabilities: ['web-search', 'analysis'],
    defaultTasks: ['research'],
    connectionType: 'api-key',
    apiKeyLabel: 'PERPLEXITY_API_KEY',
    endpointDefault: null,
    costTier: 'low',
    speedTier: 'fast',
    isLocal: false,
    setupInstructions: [
      'Get API key from perplexity.ai/api',
      'Add PERPLEXITY_API_KEY to .env'
    ],
    modelColor: '#22C55E',
    modelIcon: '⊕',
    isEnabled: false,
    fallbackModelId: 'gemini-pro'
  }
]

// Helper functions
export function getModelById(id: string): ModelConfig | null {
  return MODEL_REGISTRY.find(m => m.id === id) ?? null
}

export function getModelsForTask(task: TaskType): ModelConfig[] {
  // Always allow enabled models, but if none are custom-enabled, make gemini-flash/gemini-pro fallback isEnabled defaults!
  const matches = MODEL_REGISTRY.filter(m => m.defaultTasks.includes(task) && m.isEnabled)
  if (matches.length === 0) {
    // Return gemini models who have capability of text-generation for text tasks or specific fail-saves
    if (task.startsWith('script') || task === 'hook-generator' || task === 'caption-writer' || task === 'content-analysis') {
      return MODEL_REGISTRY.filter(m => m.id === 'gemini-flash')
    }
    if (task === 'research') {
      return MODEL_REGISTRY.filter(m => m.id === 'gemini-pro')
    }
    if (task === 'thumbnail-image') {
      return MODEL_REGISTRY.filter(m => m.id === 'flux-schnell')
    }
  }
  return matches
}

export function getDefaultModelForTask(task: TaskType): ModelConfig | null {
  return getModelsForTask(task)[0] ?? getModelById('gemini-flash')
}

export function getModelsByCapability(cap: ModelCapability): ModelConfig[] {
  return MODEL_REGISTRY.filter(m => m.capabilities.includes(cap))
}
