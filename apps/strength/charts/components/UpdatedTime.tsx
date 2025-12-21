'use client'

import React from 'react'

interface UpdatedTimeProps {
  isRealtime: boolean
  lastUpdateTime: Date | null
}

export function UpdatedTime({ isRealtime, lastUpdateTime }: UpdatedTimeProps) {
  if (!isRealtime || !lastUpdateTime) return null

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  return (
    <div
      className="fixed bottom-[1.25rem] right-1 z-[10001] scale2x"
      dir="ltr"
      style={{ transformOrigin: 'bottom right' }}
    >
      <span className="text-xs text-orange-400 bg-white">
        {formatTime(lastUpdateTime)}
      </span>
    </div>
  )
}
