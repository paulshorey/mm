'use client'

import { Json } from '@my/fe/src/components/blocks/Json'
import { LocalShortTime } from '@my/fe/src/components/inline/LocalShortTime'
import { Badge } from '@my/fe/src/components/inline/Badge'
import Link from 'next/link'
import { Copy } from '../../../../../my/fe/src/components/buttons/Copy'
import { FilterBadge } from './FilterBadge'
import { Order } from '@src/types'
import React from 'react'
import { AccordionItem } from '@src/fe/components/AccordionItem'

export function Orders({ orders, where, openIndex, setOpenIndex }: { orders: Order[]; where: any; openIndex: number | null; setOpenIndex: (index: number | null) => void }) {
  const sections = orders.map((order: Order, i: number) => {
    const message = `${order.side} ${order.amount} ${order.ticker} @ ${order.price}`
    return (
      <AccordionItem
        classNames={{
          content: 'rounded-md bg-gray-800 mt-3 p-4',
        }}
        key={order.client_id || i}
        title={message}
        buttonsRight={[
          <Copy key="copy" text={message} className="align-middle self-center" />,
          <FilterBadge key="type" field="type" value={order.type} />,
          <FilterBadge key="ticker" field="ticker" value={order.ticker} />,
          <FilterBadge key="side" field="side" value={order.side} />,
          <FilterBadge key="app_name" field="app_name" value={order.app_name || ''} />,
          <FilterBadge key="server_name" field="server_name" value={order.server_name || ''} />,
          <Badge key="time">
            <LocalShortTime epoch={order.time || 0} />
          </Badge>,
        ]}
        open={openIndex === i}
        onToggle={() => setOpenIndex(openIndex === i ? null : i)}
        className="relative px-4 pt-3 pb-3 border-b border-gray-600 "
      >
        <Json data={order} />
      </AccordionItem>
    )
  })

  return (
    <div>
      {Object.keys(where).length > 0 && (
        <div>
          <Link href="/orders">◀ clear</Link>
        </div>
      )}
      <main>{sections}</main>
    </div>
  )
}
