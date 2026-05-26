'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  X as XIcon,
  Video,
  BookOpen,
  Instagram,
  AlertCircle
} from 'lucide-react'
import { usePillar } from '@/context/PillarContext'
import { useWeeklyCalendar, ContentPiece } from '@/hooks/useWeeklyCalendar'
import { Pillar, PILLAR_CONFIG, getPillarConfig } from '@/lib/pillarConfig'
import DayPill from './DayPill'
import PillarBadge from './PillarBadge'

interface WeeklyCalendarStripProps {
  onPrefillScript?: (pillar: string) => void
  onNavigateToView?: (view: string) => void
}

export default function WeeklyCalendarStrip({
  onPrefillScript,
  onNavigateToView
}: WeeklyCalendarStripProps) {
  const {
    activePillar,
    activePillarConfig,
    isOverridden,
    overridePillar,
    resetToAutomatic
  } = usePillar()

  const {
    days,
    selectedDay,
    setSelectedDay,
    goToPrevWeek,
    goToNextWeek,
    goToCurrentWeek,
    quotaProgress,
    addContentPiece,
    updateContentPiece,
    deleteContentPiece,
    markPieceDone,
    currentWeekStart
  } = useWeeklyCalendar()

  // Local UI states
  const [isOverrideOpen, setIsOverrideOpen] = useState(false)
  const [isDetailExpanded, setIsDetailExpanded] = useState(false)
  const [isAddingPiece, setIsAddingPiece] = useState(false)

  // Add piece form state
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<'reel' | 'longvideo' | 'newsletter'>('reel')

  // Date range label
  const formattedWeekRange = (() => {
    const start = new Date(currentWeekStart)
    const end = new Date(currentWeekStart)
    end.setDate(end.getDate() + 6)
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    return `Week of ${start.toLocaleDateString('en-US', options)} – ${end.toLocaleDateString('en-US', options)}, ${end.getFullYear()}`
  })()

  // Check if viewing current week
  const isCurrentWeek = (() => {
    const todayStart = new Date('2026-05-25')
    todayStart.setHours(0,0,0,0)
    const currentWeekStartLocal = new Date(currentWeekStart)
    currentWeekStartLocal.setHours(0,0,0,0)
    
    // Check if within 7 days
    const diff = Math.abs(todayStart.getTime() - currentWeekStartLocal.getTime())
    return diff < 7 * 24 * 60 * 60 * 1000
  })()

  // Track expected progress vs completion rate for the track status badge
  const quotaStatus = (() => {
    // Current day in May 2026 week: Mon=0, Tue=1... Sun=6
    const todayIdx = 0 // Fixed date May 25, 2026 is Monday
    const expectedRatio = (todayIdx + 1) / 7
    
    const totalDone = quotaProgress.reels.done + quotaProgress.longVideos.done + quotaProgress.newsletters.done
    const totalTarget = quotaProgress.reels.target + quotaProgress.longVideos.target + quotaProgress.newsletters.target
    const expectedDoneBeforeToday = totalTarget * expectedRatio

    if (totalDone >= totalTarget) {
      return { text: 'Ahead ✦', color: '#06B6D4', bg: '#06B6D41A' }
    } else if (totalDone >= expectedDoneBeforeToday) {
      return { text: 'On track ✓', color: '#22C55E', bg: '#22C55E1A' }
    } else {
      return { text: 'Behind ⚠', color: '#F59E0B', bg: '#F59E0B1A' }
    }
  })()

  // Handle Day Pill Click
  const handleDaySelect = (dayDate: Date) => {
    setSelectedDay(dayDate)
    setIsDetailExpanded(true)
  }

  // Handle Action in inline add form
  const handleAddPieceSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    addContentPiece({
      type: newType,
      title: newTitle,
      status: 'planned',
      pillar: selectedDay.pillar,
      date: selectedDay.dateStr,
      briefId: null,
      hookId: null
    })

    setNewTitle('')
    setIsAddingPiece(false)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reel':
      case 'short':
        return '🎬'
      case 'longvideo':
        return '📹'
      case 'newsletter':
        return '📰'
      default:
        return '📝'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full bg-[#0D0D10] border-b border-[#1E1E24] relative text-gray-200"
    >
      {/* ========================================================== */}
      {/* ROW 1: PILLAR CONTEXT BAR                                 */}
      {/* ========================================================== */}
      <div
        style={{
          backgroundColor: activePillarConfig.colorMuted,
          borderBottomWidth: '1px',
          borderBottomColor: activePillarConfig.colorBorder,
          transition: 'background-color 0.4s ease, border-color 0.4s ease'
        }}
        className="flex flex-col md:flex-row items-center justify-between px-4 py-2.5 gap-2"
      >
        {/* Left Side: Pillar context toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOverrideOpen(!isOverrideOpen)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors focus:outline-none"
          >
            <span className="text-xl leading-none">{activePillarConfig.emoji}</span>
            <span
              style={{ color: activePillarConfig.color }}
              className="font-display font-semibold text-sm md:text-base leading-none"
            >
              {activePillarConfig.label} Day
            </span>
          </button>

          {/* Auto/Override badge */}
          <button
            onClick={() => setIsOverrideOpen(!isOverrideOpen)}
            style={{
              borderColor: isOverridden ? '#F59E0B44' : '#22C55E44',
              backgroundColor: isOverridden ? '#F59E0B15' : '#22C55E15',
              color: isOverridden ? '#F59E0B' : '#22C55E'
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-mono uppercase tracking-wider font-semibold focus:outline-none cursor-pointer"
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: isOverridden ? '#F59E0B' : '#22C55E' }}
            />
            {isOverridden ? 'Override' : 'Auto'}
          </button>
        </div>

        {/* Right Side: Week nav and date display */}
        <div className="flex items-center gap-2 font-sans">
          <button
            onClick={goToPrevWeek}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors focus:outline-none"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-xs md:text-sm font-medium text-gray-400 font-mono">
            {formattedWeekRange}
          </span>

          <button
            onClick={goToNextWeek}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors focus:outline-none"
          >
            <ChevronRight size={16} />
          </button>

          {!isCurrentWeek && (
            <button
              onClick={goToCurrentWeek}
              className="ml-2 flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase hover:bg-cyan-500/20 transition-all focus:outline-none"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* ========================================================== */}
      {/* OVERRIDE PANEL (DROPDOWN)                                */}
      {/* ========================================================== */}
      <AnimatePresence>
        {isOverrideOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-11 left-4 w-72 bg-[#111114] border border-[#1E1E24] rounded-xl shadow-2xl p-4 z-50 transform origin-top"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Override Today&apos;s Pillar
              </h4>
              <button
                onClick={() => setIsOverrideOpen(false)}
                className="text-gray-500 hover:text-white"
              >
                <XIcon size={14} />
              </button>
            </div>
            
            <p className="text-[10px] text-gray-500 mb-3">
              Forces global context to select another pillar. Re-aligns back to calendar rotation tomorrow at midnight.
            </p>

            <div className="grid grid-cols-1 gap-1.5">
              {Object.values(PILLAR_CONFIG).map((p) => {
                const isSelected = activePillar === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      overridePillar(p.id)
                      setIsOverrideOpen(false)
                    }}
                    style={{
                      borderColor: isSelected ? p.color : '#1E1E24',
                      backgroundColor: isSelected ? p.colorMuted : '#0D0D10'
                    }}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-lg border text-left hover:bg-white/5 transition-all text-xs focus:outline-none"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">{p.emoji}</span>
                      <span className="font-semibold" style={{ color: p.color }}>
                        {p.label}
                      </span>
                    </span>
                    {isSelected && <Check size={12} style={{ color: p.color }} />}
                  </button>
                )
              })}
            </div>

            {isOverridden && (
              <button
                onClick={() => {
                  resetToAutomatic()
                  setIsOverrideOpen(false)
                }}
                className="w-full mt-3 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-[10px] uppercase tracking-wider font-bold transition-colors focus:outline-none"
              >
                <RotateCcw size={12} />
                Reset to Auto rotation
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================== */}
      {/* ROW 2: DAY PILLS ROW                                       */}
      {/* ========================================================== */}
      <div className="flex items-center justify-center p-4">
        <div className="flex items-center gap-2 md:gap-3 overflow-x-auto w-full max-w-5xl justify-start md:justify-center no-scrollbar py-1">
          {days.map((day) => (
            <DayPill
              key={day.dateStr}
              day={day}
              isSelected={selectedDay.dateStr === day.dateStr}
              onClick={() => handleDaySelect(day.date)}
            />
          ))}
        </div>
      </div>

      {/* ========================================================== */}
      {/* ROW 3: WEEKLY QUOTA TRACKER                                */}
      {/* ========================================================== */}
      <div className="flex flex-col lg:flex-row items-center justify-between px-4 py-2 border-t border-[#1E1E24] bg-black/30 gap-3">
        {/* Progress meters */}
        <div className="flex flex-wrap items-center gap-4 lg:gap-6 w-full lg:w-auto text-xs font-semibold">
          {/* Item 1: Reels */}
          <div className="flex items-center gap-2 min-w-[170px]">
            <span className="text-pink-400 select-none">🎬</span>
            <span className="text-gray-400 font-mono text-[11px]">Reels:</span>
            <span className="text-white font-mono text-[11px]">
              {quotaProgress.reels.done}/{quotaProgress.reels.target}
            </span>
            <div className="relative flex-1 h-1.5 rounded bg-gray-900 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(quotaProgress.reels.done / quotaProgress.reels.target) * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute top-0 left-0 h-full bg-pink-500 rounded"
              />
            </div>
          </div>

          {/* Item 2: Long Videos */}
          <div className="flex items-center gap-2 min-w-[170px]">
            <span className="text-blue-400 select-none">📹</span>
            <span className="text-gray-400 font-mono text-[11px]">Videos:</span>
            <span className="text-white font-mono text-[11px]">
              {quotaProgress.longVideos.done}/{quotaProgress.longVideos.target}
            </span>
            <div className="relative flex-1 h-1.5 rounded bg-gray-900 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(quotaProgress.longVideos.done / quotaProgress.longVideos.target) * 100}%` }}
                transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                className="absolute top-0 left-0 h-full bg-blue-500 rounded"
              />
            </div>
          </div>

          {/* Item 3: Newsletters */}
          <div className="flex items-center gap-2 min-w-[170px]">
            <span className="text-amber-500 select-none">📰</span>
            <span className="text-gray-400 font-mono text-[11px]">Letters:</span>
            <span className="text-white font-mono text-[11px]">
              {quotaProgress.newsletters.done}/{quotaProgress.newsletters.target}
            </span>
            <div className="relative flex-1 h-1.5 rounded bg-gray-900 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(quotaProgress.newsletters.done / quotaProgress.newsletters.target) * 100}%` }}
                transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                className="absolute top-0 left-0 h-full bg-amber-500 rounded"
              />
            </div>
          </div>
        </div>

        {/* Quota track status badge */}
        <div className="flex items-center gap-2 ml-auto lg:ml-0">
          <span
            style={{
              color: quotaStatus.color,
              backgroundColor: quotaStatus.bg
            }}
            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
          >
            {quotaStatus.text}
          </span>
          <button
            onClick={() => setIsDetailExpanded(!isDetailExpanded)}
            className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 px-2 py-0.5 rounded hover:bg-cyan-500/10 focus:outline-none"
          >
            {isDetailExpanded ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* SECTION 5: DAY DETAIL EXPANDABLE PANEL                    */}
      {/* ========================================================== */}
      <AnimatePresence>
        {isDetailExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-[#1E1E24] bg-black/40"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-5">
              
              {/* LEFT COLUMN: Summary and triggers */}
              <div className="md:col-span-4 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#1E1E24] pb-4 md:pb-0 md:pr-6 whitespace-nowrap">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-white font-display">
                      {selectedDay.dayFull}, {new Date(selectedDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </h3>
                    <button
                      onClick={() => setIsDetailExpanded(false)}
                      className="text-gray-500 hover:text-white md:hidden"
                    >
                      <XIcon size={14} />
                    </button>
                  </div>

                  <PillarBadge pillar={selectedDay.pillar} className="mb-4" />

                  <div className="space-y-1.5 text-xs text-gray-400 mt-2 font-mono">
                    <div className="flex justify-between">
                      <span>Completed output:</span>
                      <span className="text-green-400 font-bold">{selectedDay.completedCount} pieces</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Planned/Queued:</span>
                      <span className="text-amber-500 font-bold">{selectedDay.plannedCount} pieces</span>
                    </div>
                  </div>
                </div>

                {/* Left Side Actions (Add Piece + Generate shortcut) */}
                <div className="mt-6 flex flex-col gap-2">
                  {!isAddingPiece ? (
                    <button
                      onClick={() => setIsAddingPiece(true)}
                      style={{
                        borderColor: activePillarConfig.colorBorder,
                        color: activePillarConfig.color
                      }}
                      className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg border bg-white/[0.02] hover:bg-white/[0.08] text-xs font-bold transition-all focus:outline-none cursor-pointer"
                    >
                      <Plus size={14} />
                      Add Content Piece
                    </button>
                  ) : (
                    <form onSubmit={handleAddPieceSubmit} className="p-3 bg-black/60 rounded-xl border border-white/10 flex flex-col gap-2.5">
                      <span className="text-[10px] uppercase font-bold text-gray-500">New Content Piece</span>
                      
                      {/* Segment select */}
                      <div className="grid grid-cols-3 gap-1">
                        {(['reel', 'longvideo', 'newsletter'] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setNewType(t)}
                            className={`py-1 text-[9px] font-bold uppercase tracking-wider rounded border focus:outline-none ${
                              newType === t
                                ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                                : 'bg-transparent border-white/5 text-gray-500 hover:text-white'
                            }`}
                          >
                            {t === 'reel' ? 'Reel' : t === 'longvideo' ? 'Video' : 'Letter'}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        placeholder="Title description..."
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50"
                      />

                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setIsAddingPiece(false)}
                          className="text-[10px] font-bold uppercase text-gray-500 hover:text-white px-2 py-1"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="text-[10px] font-bold uppercase bg-cyan-500 hover:bg-cyan-400 text-black px-3 py-1 rounded"
                        >
                          Save ✓
                        </button>
                      </div>
                    </form>
                  )}

                  {selectedDay.isToday && (
                    <button
                      onClick={() => {
                        if (onPrefillScript) onPrefillScript(selectedDay.pillar)
                        if (onNavigateToView) onNavigateToView('daily-brief')
                      }}
                      className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-cyan-500 text-black hover:bg-cyan-400 text-xs font-bold transition-all focus:outline-none cursor-pointer"
                    >
                      <Sparkles size={14} />
                      Generate Brief for Today
                    </button>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Content Pieces List */}
              <div className="md:col-span-8 flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                {selectedDay.contentPieces.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-28 border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                    <span className="text-xl">📅</span>
                    <span className="text-xs text-gray-500 mt-1">No content scheduled or listed for this day.</span>
                    <button
                      onClick={() => setIsAddingPiece(true)}
                      className="text-[10px] text-cyan-400 font-bold uppercase mt-1.5 hover:underline"
                    >
                      Schedule first piece &rarr;
                    </button>
                  </div>
                ) : (
                  selectedDay.contentPieces.map((piece) => (
                    <div
                      key={piece.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 gap-2 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg leading-none select-none">{getTypeIcon(piece.type)}</span>
                        <div className="flex flex-col">
                          <span className={`text-xs font-medium ${piece.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-200'}`}>
                            {piece.title}
                          </span>
                          <span className="text-[10px] text-gray-500 mt-0.5 capitalize font-mono">
                            Type: {piece.type} · Status: {piece.status}
                          </span>
                        </div>
                      </div>

                      {/* Piece Action and statuses */}
                      <div className="flex items-center gap-2.5 sm:ml-auto">
                        {piece.status === 'planned' && (
                          <button
                            onClick={() => markPieceDone(piece.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wide hover:bg-green-500/20 focus:outline-none cursor-pointer"
                          >
                            <Check size={11} />
                            Done ✓
                          </button>
                        )}
                        {piece.status === 'in-progress' && (
                          <button
                            onClick={() => markPieceDone(piece.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wide hover:bg-green-500/20 focus:outline-none cursor-pointer"
                          >
                            Done ✓
                          </button>
                        )}
                        {piece.status !== 'done' && (
                          <button
                            onClick={() => updateContentPiece(piece.id, { status: 'in-progress' })}
                            className="text-[10px] uppercase font-bold text-amber-500 px-2 py-1 hover:bg-amber-500/10 rounded focus:outline-none"
                          >
                            Progress
                          </button>
                        )}
                        <button
                          onClick={() => deleteContentPiece(piece.id)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-colors focus:outline-none"
                          title="Delete content piece"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
