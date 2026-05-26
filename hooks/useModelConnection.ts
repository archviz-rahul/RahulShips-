'use client'

import { useState, useEffect } from 'react'
import { ModelConfig, ModelStatus, ModelProvider } from '../lib/models/modelConfig'

export interface ModelConnectionState {
  modelId: string
  status: ModelStatus
  lastTested: string | null
  errorMessage?: string
}

export function useModelConnection(models: ModelConfig[]) {
  const [connections, setConnections] = useState<Record<string, ModelConnectionState>>(() => {
    let savedMap: Record<string, ModelConnectionState> = {}

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rahulships_studio_connections')
      if (saved) {
        try {
          savedMap = JSON.parse(saved)
        } catch (e) {
          console.error('Failed to parse connections from localStorage', e)
        }
      }
    }

    // Prepare full map ensuring every model is represented
    const initialConnections: Record<string, ModelConnectionState> = {}

    models.forEach(model => {
      const existing = savedMap[model.id]
      if (existing) {
        initialConnections[model.id] = {
          ...existing,
          // If enabled, make sure we show it as connected or disconnected
          status: model.isEnabled && existing.status === 'not-configured' ? 'connected' : existing.status
        }
      } else {
        // Default values
        initialConnections[model.id] = {
          modelId: model.id,
          status: model.isEnabled ? 'connected' : 'not-configured',
          lastTested: null
        }
      }
    })

    return initialConnections
  })

  const [isInitializing, setIsInitializing] = useState(false)

  // Save changes to localStorage
  const saveConnections = (updated: Record<string, ModelConnectionState>) => {
    setConnections(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('rahulships_studio_connections', JSON.stringify(updated))
    }
  }

  // Set specific model configuration toggle
  const toggleModelEnabled = (modelId: string, isEnabled: boolean) => {
    const updated = { ...connections }
    if (updated[modelId]) {
      updated[modelId] = {
        ...updated[modelId],
        status: isEnabled ? 'connected' : 'not-configured'
      }
      saveConnections(updated)
    }
  }

  // Test connection to a specific model
  const testConnection = async (model: ModelConfig): Promise<boolean> => {
    const updated = { ...connections }
    updated[model.id] = {
      ...updated[model.id],
      status: 'testing',
      errorMessage: undefined
    }
    setConnections(updated)

    try {
      // Perform actual simple ping to our backend route
      const response = await fetch('/api/studio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelId: model.id,
          task: 'content-analysis',
          prompt: 'Identify if connection is active. Speak exactly two words: "Connection active".',
          stream: false
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Server returned an error during connection test.')
      }

      const data = await response.json()
      
      const isConnectionSucceeded = data.success === true

      const result: ModelConnectionState = {
        modelId: model.id,
        status: isConnectionSucceeded ? 'connected' : 'error',
        lastTested: new Date().toLocaleTimeString(),
        errorMessage: isConnectionSucceeded ? undefined : 'Unacknowledged API structure.'
      }

      const finalMap = { ...connections, [model.id]: result }
      saveConnections(finalMap)
      return isConnectionSucceeded

    } catch (err: any) {
      console.error(`Connection test failed for ${model.id}:`, err)
      
      // If it's a model not fully configured, show custom error
      const result: ModelConnectionState = {
        modelId: model.id,
        status: 'error',
        lastTested: new Date().toLocaleTimeString(),
        errorMessage: err.message || 'Network error / endpoint unreachable.'
      }
      
      const finalMap = { ...connections, [model.id]: result }
      saveConnections(finalMap)
      return false
    }
  }

  return {
    connections,
    isInitializing,
    testConnection,
    toggleModelEnabled
  }
}
