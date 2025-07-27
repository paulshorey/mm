'use client'

import { Badge } from '@my/fe/src/components/inline/Badge'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

export function FilterBadge({
  field,
  value,
}: {
  field: string
  value: string | boolean
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  if (value === null || value === undefined || value === '') {
    return null
  }

  const newParams = new URLSearchParams(searchParams.toString())
  newParams.set(field, String(value))

  const displayValue =
    typeof value === 'boolean' ? (value ? 'dev' : 'pro') : value
  return (
    <Badge className="font-bold pr-2">
      <Link key="edit" href={`${pathname}?${newParams.toString()}`}>
        {' '}
        {displayValue}{' '}
      </Link>
    </Badge>
  )
}
