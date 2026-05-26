'use client'

import { useState, useEffect, useMemo } from 'react'
import { Pillar, PillarConfig, getPillarConfig, getPillarForDate } from '@/lib/pillarConfig'
import { usePillar } from '@/context/PillarContext'

export interface ContentPiece {
  id: string
  type: 'reel' | 'short' | 'longvideo' | 'newsletter'
  title: string
  status: 'planned' | 'in-progress' | 'done' | 'skipped'
  pillar: Pillar
  date: string              // YYYY-MM-DD date string
  briefId: string | null    // links to generated brief
  hookId: string | null     // links to hook bank entry
}

export interface DayData {
  date: Date
  dateStr: string           // YYYY-MM-DD
  dayLabel: string          // "Mon"
  dayFull: string           // "Monday"
  dateNumber: number        // 25
  isToday: boolean
  isPast: boolean
  isFuture: boolean
  pillar: Pillar
  pillarConfig: PillarConfig
  contentPieces: ContentPiece[]
  completedCount: number
  plannedCount: number
  targetCount: number       // reels + video + newsletter
}

export function getStartOfWeek(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Start on Monday
  const start = new Date(date.setDate(diff))
  start.setHours(0, 0, 0, 0)
  return start
}

export function useWeeklyCalendar() {
  const {
    activePillar,
    activePillarConfig,
    isOverridden,
    setActivePillar,
    resetToAutomatic
  } = usePillar()

  // Week navigation
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getStartOfWeek(new Date('2026-05-25')))
  const [selectedDate, setSelectedDateState] = useState<Date>(() => new Date('2026-05-25'))

  // Content state loaded from localStorage
  const [contentPieces, setContentPieces] = useState<ContentPiece[]>([])

  // Load content on mount
  useEffect(() => {
    const saved = localStorage.getItem('rahulships_calendar')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        queueMicrotask(() => {
          setContentPieces(parsed)
        })
      } catch (err) {
        console.error('Failed to parse content pieces from storage', err)
      }
    } else {
      // Seed initial high quality content pieces to make the dashboard alive and matching the examples
      const todayStr = '2026-05-25' // Monday
      const tomorrowStr = '2026-05-26' // Tuesday
      const yesterdayStr = '2026-05-24' // Sunday
      
      const seedPieces: ContentPiece[] = [
        {
          id: 'seed-cp-1',
          type: 'reel',
          title: 'AI Gen tools for Archviz speedrenders',
          status: 'done',
          pillar: 'archviz',
          date: todayStr,
          briefId: 'brief-1',
          hookId: 'seed-1'
        },
        {
          id: 'seed-cp-2',
          type: 'reel',
          title: '3ds Max Unreal workflow automation script',
          status: 'done',
          pillar: 'archviz',
          date: todayStr,
          briefId: 'brief-2',
          hookId: 'seed-6'
        },
        {
          id: 'seed-cp-3',
          type: 'longvideo',
          title: 'Full tutorial on Unreal Engine 5 biophilic rendering',
          status: 'planned',
          pillar: 'archviz',
          date: todayStr,
          briefId: null,
          hookId: null
        },
        {
          id: 'seed-cp-4',
          type: 'reel',
          title: 'Option trading backtesting models in Python',
          status: 'planned',
          pillar: 'trading',
          date: tomorrowStr,
          briefId: null,
          hookId: 'seed-2'
        },
        {
          id: 'seed-cp-5',
          type: 'newsletter',
          title: 'My story of builder failure to 10k followers',
          status: 'done',
          pillar: 'builder',
          date: yesterdayStr,
          briefId: null,
          hookId: 'seed-4'
        }
      ]
      queueMicrotask(() => {
        setContentPieces(seedPieces)
      })
      localStorage.setItem('rahulships_calendar', JSON.stringify(seedPieces))
    }
  }, [])

  // Action methods with storage synchronisation
  const savePieces = (pieces: ContentPiece[]) => {
    setContentPieces(pieces)
    localStorage.setItem('rahulships_calendar', JSON.stringify(pieces))
  }

  const addContentPiece = (piece: Omit<ContentPiece, 'id'>) => {
    const newPiece: ContentPiece = {
      ...piece,
      id: 'cp-' + Date.now()
    }
    savePieces([...contentPieces, newPiece])
  }

  const updateContentPiece = (id: string, updates: Partial<ContentPiece>) => {
    savePieces(contentPieces.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  const deleteContentPiece = (id: string) => {
    savePieces(contentPieces.filter(p => p.id !== id))
  }

  const markPieceDone = (id: string) => {
    updateContentPiece(id, { status: 'done' })
  }

  const overridePillar = (pillar: Pillar) => {
    setActivePillar(pillar, true)
  }

  // Week navigation methods
  const goToPrevWeek = () => {
    const prev = new Date(currentWeekStart)
    prev.setDate(prev.getDate() - 7)
    setCurrentWeekStart(prev)
  }

  const goToNextWeek = () => {
    const next = new Date(currentWeekStart)
    next.setDate(next.getDate() + 7)
    setCurrentWeekStart(next)
  }

  const goToCurrentWeek = () => {
    const today = new Date('2026-05-25')
    setCurrentWeekStart(getStartOfWeek(today))
    setSelectedDateState(today)
  }

  // Compute stats on pieces
  const days = useMemo(() => {
    const dayDataList: DayData[] = []
    const baseDate = new Date(currentWeekStart)
    const today = new Date('2026-05-25')
    today.setHours(0, 0, 0, 0)

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const fullNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate)
      d.setDate(baseDate.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const isToday = d.getTime() === today.getTime()
      const isPast = d.getTime() < today.getTime()
      const isFuture = d.getTime() > today.getTime()

      const p = getPillarForDate(d)
      const pConf = getPillarConfig(p)

      // Filter pieces for this day
      const dayPieces = contentPieces.filter(piece => piece.date === dateStr)
      const completedCount = dayPieces.filter(piece => piece.status === 'done').length
      const plannedCount = dayPieces.filter(piece => piece.status === 'planned' || piece.status === 'in-progress').length

      dayDataList.push({
        date: d,
        dateStr,
        dayLabel: labels[i],
        dayFull: fullNames[i],
        dateNumber: d.getDate(),
        isToday,
        isPast,
        isFuture,
        pillar: p,
        pillarConfig: pConf,
        contentPieces: dayPieces,
        completedCount,
        plannedCount,
        targetCount: pConf.weeklyTarget.reels + pConf.weeklyTarget.longVideo + pConf.weeklyTarget.newsletter
      })
    }

    return dayDataList
  }, [currentWeekStart, contentPieces])

  const selectedDay = useMemo(() => {
    const selStr = selectedDate.toISOString().split('T')[0]
    const matched = days.find(d => d.dateStr === selStr)
    if (matched) return matched
    
    // Fallback construct
    const p = getPillarForDate(selectedDate)
    return {
      date: selectedDate,
      dateStr: selStr,
      dayLabel: selectedDate.toLocaleDateString('en-US', { weekday: 'short' }),
      dayFull: selectedDate.toLocaleDateString('en-US', { weekday: 'long' }),
      dateNumber: selectedDate.getDate(),
      isToday: selStr === '2026-05-25',
      isPast: selectedDate.getTime() < new Date('2026-05-25').getTime(),
      isFuture: selectedDate.getTime() > new Date('2026-05-25').getTime(),
      pillar: p,
      pillarConfig: getPillarConfig(p),
      contentPieces: [],
      completedCount: 0,
      plannedCount: 0,
      targetCount: 9
    }
  }, [selectedDate, days])

  const setSelectedDay = (date: Date) => {
    setSelectedDateState(date)
  }

  // Weekly Stats calculation
  const weeklyStats = useMemo(() => {
    const piecesInThisWeek = contentPieces.filter(p => {
      const pDate = new Date(p.date)
      const start = new Date(currentWeekStart)
      const end = new Date(currentWeekStart)
      end.setDate(end.getDate() + 7)
      return pDate >= start && pDate < end
    })

    const totalPlanned = piecesInThisWeek.length
    const totalCompleted = piecesInThisWeek.filter(p => p.status === 'done').length
    const completionRate = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0

    const byPillar: Record<Pillar, { planned: number; completed: number }> = {
      archviz: { planned: 0, completed: 0 },
      trading: { planned: 0, completed: 0 },
      'vibe-coding': { planned: 0, completed: 0 },
      builder: { planned: 0, completed: 0 }
    }

    piecesInThisWeek.forEach(p => {
      if (byPillar[p.pillar]) {
        byPillar[p.pillar].planned++
        if (p.status === 'done') {
          byPillar[p.pillar].completed++
        }
      }
    })

    return {
      totalPlanned,
      totalCompleted,
      completionRate,
      byPillar
    }
  }, [contentPieces, currentWeekStart])

  // Quota tracker metrics
  const quotaProgress = useMemo(() => {
    const start = new Date(currentWeekStart)
    const end = new Date(currentWeekStart)
    end.setDate(end.getDate() + 7)

    const piecesInThisWeek = contentPieces.filter(p => {
      const pDate = new Date(p.date)
      return pDate >= start && pDate < end
    })

    const reels = piecesInThisWeek.filter(p => p.type === 'reel' || p.type === 'short')
    const longVideos = piecesInThisWeek.filter(p => p.type === 'longvideo')
    const newsletters = piecesInThisWeek.filter(p => p.type === 'newsletter')

    return {
      reels: {
        done: reels.filter(p => p.status === 'done').length,
        target: 12
      },
      longVideos: {
        done: longVideos.filter(p => p.status === 'done').length,
        target: 6
      },
      newsletters: {
        done: newsletters.filter(p => p.status === 'done').length,
        target: 3
      }
    }
  }, [contentPieces, currentWeekStart])

  return {
    currentWeekStart,
    days,
    activePillar,
    activePillarConfig,
    isOverridden,
    selectedDay,
    selectedDate,
    weeklyStats,
    quotaProgress,
    setSelectedDay,
    overridePillar,
    resetToAutomatic,
    goToPrevWeek,
    goToNextWeek,
    goToCurrentWeek,
    addContentPiece,
    updateContentPiece,
    deleteContentPiece,
    markPieceDone
  }
}
