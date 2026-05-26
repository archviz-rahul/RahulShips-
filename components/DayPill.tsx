'use client'

import React from 'react'
import { motion } from 'motion/react'
import { DayData } from '@/hooks/useWeeklyCalendar'

interface DayPillProps {
  day: DayData
  isSelected: boolean
  onClick: () => void
}

export default function DayPill({ day, isSelected, onClick }: DayPillProps) {
  const {
    dayLabel,
    dateNumber,
    isToday,
    pillarConfig,
    contentPieces,
    isPast
  } = day

  // Content dots calculations (max 5)
  // Fill order: completed (pillar color) -> in-progress (amber) -> planned (outlined) -> skipped (red dash)
  const sortedPieces = [...contentPieces].sort((a, b) => {
    const score = { done: 3, 'in-progress': 2, planned: 1, skipped: 0 }
    return score[b.status] - score[a.status]
  })

  const visiblePieces = sortedPieces.slice(0, 5)
  const hasMore = contentPieces.length > 5

  return (
    <motion.button
      id={`day-pill-${day.dateStr}`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        boxShadow: isToday ? pillarConfig.glowClass : 'none',
        borderColor: isToday
          ? pillarConfig.color
          : isSelected
          ? '#3A3A4A'
          : '#1E1E24',
        backgroundColor: isToday
          ? pillarConfig.colorMuted
          : isSelected
          ? '#1A1A24'
          : 'transparent'
      }}
      className={`relative flex flex-col items-center justify-between p-3 min-w-[56px] h-24 rounded-xl border focus:outline-none cursor-pointer transition-colors duration-200 select-none`}
    >
      {/* Glow pulse animation background for Today */}
      {isToday && (
        <motion.div
          animate={{
            opacity: [0.15, 0.45, 0.15],
            scale: [0.98, 1.02, 0.98],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ backgroundColor: pillarConfig.color }}
          className="absolute inset-0 rounded-xl pointer-events-none blur-[4px] -z-10"
        />
      )}

      {/* Day label */}
      <span
        style={{ color: isToday ? pillarConfig.color : '#6B6B7B' }}
        className="text-[10px] uppercase font-bold tracking-wider font-sans select-none"
      >
        {dayLabel}
      </span>

      {/* Date Number */}
      <span
        className={`text-base font-bold font-display leading-none mt-1 ${
          isToday ? 'text-white scale-110' : isSelected ? 'text-white' : 'text-gray-400'
        }`}
      >
        {dateNumber}
      </span>

      {/* Pillar Color Dot */}
      <div className="group/dot relative flex items-center justify-center mt-1">
        <span
          style={{ backgroundColor: pillarConfig.color }}
          className="w-1.5 h-1.5 rounded-full ring-2 ring-black/40 transition-transform group-hover/dot:scale-150"
        />
        {/* Tooltip */}
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 scale-0 group-hover/dot:scale-100 transition-all duration-150 bg-black/95 text-white text-[9px] px-2 py-0.5 rounded border border-white/10 whitespace-nowrap z-50 pointer-events-none font-mono tracking-wide">
          {pillarConfig.emoji} {pillarConfig.label}
        </span>
      </div>

      {/* Content dots container */}
      <div className="flex items-center justify-center gap-0.5 mt-1.5 h-1.5 w-full">
        {hasMore ? (
          <span className="text-[8px] font-mono text-cyan-400 font-bold leading-none select-none">
            {contentPieces.length}+
          </span>
        ) : contentPieces.length === 0 ? (
          <span className="w-1 h-1 rounded-full bg-gray-800" />
        ) : (
          visiblePieces.map((piece) => {
            if (piece.status === 'done') {
              return (
                <span
                  key={piece.id}
                  style={{ backgroundColor: pillarConfig.color }}
                  className="w-1 h-1 rounded-full"
                />
              )
            } else if (piece.status === 'in-progress') {
              return <span key={piece.id} className="w-1 h-1 rounded-full bg-amber-500" />
            } else if (piece.status === 'skipped') {
              return <span key={piece.id} className="w-1 h-0.5 rounded bg-red-500" />
            } else {
              // Planned (outline only)
              return (
                <span
                  key={piece.id}
                  className="w-1 h-1 rounded-full border border-gray-500 bg-transparent"
                />
              )
            }
          })
        )}
      </div>
    </motion.button>
  )
}
