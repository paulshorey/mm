'use client'

import { Data } from '@src/fe/blocks/Data'
import classes from './PageAccount.module.scss'
import { useState } from 'react'
import { executeOrderMarket } from '@src/be/dydx/executeOrderMarket'
import { parseOrdersText } from '@src/be/dydx/lib/parseOrdersText'

export const revalidate = 0

type Props = {
  data: Record<string, unknown>
  expandUntil?: number
}

export function PageAccount(props: Props) {
  const [orderText, setOrderText] = useState('')

  return (
    <div className={classes.container}>
      <form
        onSubmit={() => {
          var orderObject = (parseOrdersText(orderText) || [])[0]
          if (orderObject) {
            executeOrderMarket(orderObject)
          }
        }}
      >
        <input
          className="p-2"
          type="text"
          value={orderText}
          onChange={(e) => {
            setOrderText(e.target.value)
          }}
        />
        <button className="p-2" type="submit">
          ✔️
        </button>
      </form>

      <Data data={props.data} expandUntil={props.expandUntil || 5} />
    </div>
  )
}
