'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Orders } from './Orders'
import { OrderRowGet } from '@my/be/sql/order/types'

export function OrdersWrapper({
  orders: initialOrders,
  where: initialWhere,
}: {
  orders: OrderRowGet[]
  where: any
}) {
  const [orders, setOrders] = useState(initialOrders)
  const [where, setWhere] = useState(initialWhere)
  const whereString = useMemo(() => JSON.stringify(where), [where])
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  useEffect(() => {
    const hasFilters = Object.keys(JSON.parse(whereString)).length > 0
    setOpenIndex(hasFilters ? null : 0)
  }, [whereString])

  useEffect(() => {
    setOrders(initialOrders)
    setWhere(initialWhere)
  }, [initialOrders, initialWhere])

  return (
    <Orders
      orders={orders}
      where={where}
      openIndex={openIndex}
      setOpenIndex={setOpenIndex}
    />
  )
}
