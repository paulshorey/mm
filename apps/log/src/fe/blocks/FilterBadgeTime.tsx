'use client'

import { Badge } from '@my/fe/src/components/inline/Badge'
import Link from 'next/link'
import { getDayRange } from '@my/fe/src/lib/time'
import { LocalShortTime } from '@my/fe/src/components/inline/LocalShortTime'
import { usePathname, useSearchParams } from 'next/navigation'
import { subtleColorGreen, subtleColorGray } from '@src/constants/ui'

export function FilterBadgeTime({ time }: { time: number }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  if (!time) {
    return null
  }

  const { startOfDay, endOfDay } = getDayRange(time)
  const [localTime, localDate] = LocalShortTime({ epoch: time })

  const isActive =
    searchParams.get('time_start') === String(startOfDay) &&
    searchParams.get('time_end') === String(endOfDay)

  const newParams = new URLSearchParams(searchParams.toString())
  if (isActive) {
    newParams.delete('time_start')
    newParams.delete('time_end')
  } else {
    newParams.set('time_start', String(startOfDay))
    newParams.set('time_end', String(endOfDay))
  }

  return (
    <Badge className="font-bold pr-2">
      <span
        className="mr-1"
        style={{
          color: subtleColorGray,
        }}
      >
        {localTime}
      </span>
      <Link
        key="edit"
        href={`${pathname}?${newParams.toString()}`}
        style={{
          color: isActive ? subtleColorGray : subtleColorGreen,
        }}
      >
        {localDate}
      </Link>
    </Badge>
  )
}
