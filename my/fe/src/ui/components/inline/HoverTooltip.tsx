'use client'

import React from 'react'
import classes from './HoverTooltip.module.scss'

type Props = {
  label: string
} & React.ComponentProps<'span'>

export const HoverTooltip = function ({
  className,
  children,
  label,
  ...props
}: Props) {
  return (
    <span className={className + ' ' + classes.container} {...props}>
      {children}
      <span>
        <span className="text-sm">{label}</span>
      </span>
    </span>
  )
}
