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
      hour12: false,
    })
  }

  return (
    <div className="fixed bottom-[0.125rem] right-1 z-[10001]" dir="ltr">
      <span className="text-xs text-gray-600">
        {formatTime(lastUpdateTime)}
      </span>
    </div>
  )
}
