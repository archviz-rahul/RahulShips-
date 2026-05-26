'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Pillar, getTodayPillar, getPillarConfig, PillarConfig } from '@/lib/pillarConfig'

interface PillarContextType {
  activePillar: Pillar
  activePillarConfig: PillarConfig
  isOverridden: boolean
  setActivePillar: (pillar: Pillar, override?: boolean) => void
  resetToAutomatic: () => void
}

const PillarContext = createContext<PillarContextType | null>(null)

export function PillarProvider({ children }: { children: ReactNode }) {
  const [activePillar, setActivePillarState] = useState<Pillar>(getTodayPillar())
  const [isOverridden, setIsOverridden] = useState(false)

  useEffect(() => {
    // Check for stored override on mount
    const stored = localStorage.getItem('rahulships_pillar_override')
    const storedDate = localStorage.getItem('rahulships_pillar_override_date')
    const today = new Date().toISOString().split('T')[0]

    if (stored && storedDate === today) {
      queueMicrotask(() => {
        setActivePillarState(stored as Pillar)
        setIsOverridden(true)
      })
    } else {
      // Clear stale override
      localStorage.removeItem('rahulships_pillar_override')
      localStorage.removeItem('rahulships_pillar_override_date')
      queueMicrotask(() => {
        setActivePillarState(getTodayPillar())
        setIsOverridden(false)
      })
    }
  }, [])

  const setActivePillar = (pillar: Pillar, override = false) => {
    setActivePillarState(pillar)
    if (override) {
      setIsOverridden(true)
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem('rahulships_pillar_override', pillar)
      localStorage.setItem('rahulships_pillar_override_date', today)
    }
  }

  const resetToAutomatic = () => {
    setIsOverridden(false)
    setActivePillarState(getTodayPillar())
    localStorage.removeItem('rahulships_pillar_override')
    localStorage.removeItem('rahulships_pillar_override_date')
  }

  return (
    <PillarContext.Provider value={{
      activePillar,
      activePillarConfig: getPillarConfig(activePillar),
      isOverridden,
      setActivePillar,
      resetToAutomatic
    }}>
      {children}
    </PillarContext.Provider>
  )
}

export function usePillar() {
  const context = useContext(PillarContext)
  if (!context) throw new Error('usePillar must be used within a PillarProvider')
  return context
}
