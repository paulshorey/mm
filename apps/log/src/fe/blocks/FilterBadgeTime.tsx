'use client'

import { Badge } from '@my/fe/src/components/inline/Badge'
import Link from 'next/link'
import { getDayRange } from '@my/fe/src/lib/time'
import { LocalShortTime } from '@my/fe/src/components/inline/LocalShortTime'
import { usePathname, useSearchParams } from 'next/navigation'

export function FilterBadgeTime({ time }: { time: number }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  if (!time) {
    return null
  }

  const { startOfDay, endOfDay } = getDayRange(time)
  const [localTime, localDate] = LocalShortTime({ epoch: time })

  const newParams = new URLSearchParams(searchParams.toString())
  newParams.set('time_start', String(startOfDay))
  newParams.set('time_end', String(endOfDay))

  return (
    <Badge className="font-bold pr-2">
      <span className="mr-1">{localTime}</span>
      <Link key="edit" href={`${pathname}?${newParams.toString()}`}>
        {localDate}
      </Link>
    </Badge>
  )
}
