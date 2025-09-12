'use client'

import React from 'react'
import { ControlsDropdown } from '../controls/ControlsDropdown'
export default function Header() {
  return (
    <div className="fixed top-0 left-0 right-0 flex flex-row justify-between z-[10000]">
      <div className="flex-1 pl-2 py-1 font-semibold text-gray-900">
        <span
          style={{
            scale: '1.05 1',
            transformOrigin: 'left center',
          }}
        >
          strength<span className="text-gray-400">.finance</span>
        </span>
      </div>
      <div className="flex flex-row justify-end mr-[9px]">
        <ControlsDropdown />
      </div>
    </div>
  )
}
