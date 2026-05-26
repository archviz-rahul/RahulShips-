'use client'

import React from 'react'
import { Pillar, PILLAR_CONFIG, getPillarConfig } from '@/lib/pillarConfig'

interface PillarBadgeProps {
  pillar: Pillar | string
  className?: string
  glow?: boolean
}

// Map legacy labels to modern format keys
function normalizePillarId(p: string): Pillar {
  const clean = p.toLowerCase().trim()
  if (clean.includes('archviz') || clean.includes('architecture')) return 'archviz'
  if (clean.includes('trading') || clean.includes('finance') || clean.includes('systems')) return 'trading'
  if (clean.includes('vibe') || clean.includes('coding')) return 'vibe-coding'
  if (clean.includes('builder') || clean.includes('journey')) return 'builder'
  return 'archviz' // fallback
}

export default function PillarBadge({ pillar, className = '', glow = false }: PillarBadgeProps) {
  const pillarId = typeof pillar === 'string' ? normalizePillarId(pillar) : pillar
  const config = getPillarConfig(pillarId)

  if (!config) return null

  return (
    <span
      id={`pillar-badge-${config.id}`}
      style={{
        borderColor: config.colorBorder,
        backgroundColor: config.colorMuted,
        color: config.color,
        boxShadow: glow ? config.glowClass : 'none'
      }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all ${className}`}
    >
      <span className="text-sm select-none leading-none">{config.emoji}</span>
      <span className="font-display leading-none">{config.label}</span>
    </span>
  )
}
