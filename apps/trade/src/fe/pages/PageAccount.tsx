'use client'

import { Data } from '@src/fe/blocks/Data'
import classes from './PageAccount.module.scss'
import { useEffect, useState } from 'react'
import { getAccountData } from '@src/fe/utils/getAccountData'
import { postOrder } from '@src/fe/utils/postOrder'

export const revalidate = 0

export function PageAccount() {
  const [orderText, setOrderText] = useState('')
  const [accountData, setAccountData] = useState<Record<string, unknown>>({})

  useEffect(() => {
    getAccountData().then((data) => {
      setAccountData(data)
    })
  }, [])

  return (
    <div className={classes.container}>
      <form
        onSubmit={() => {
          postOrder(orderText)
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

      <Data data={accountData} expandUntil={5} />
    </div>
  )
}
