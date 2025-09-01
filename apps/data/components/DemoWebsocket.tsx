'use client'

import React, { useState } from 'react'
import * as Ably from 'ably'
import {
  AblyProvider,
  ChannelProvider,
  useChannel,
  useConnectionStateListener,
} from 'ably/react'

// Connect to Ably using the AblyProvider component and your API key
const client = new Ably.Realtime({
  key: `${process.env.NEXT_PUBLIC_ABLY_API_USER ?? 'IDK'}:${
    process.env.NEXT_PUBLIC_ABLY_API_PASS ?? 'HUH'
  }`,
})

export function DemoWebsocket() {
  return (
    <AblyProvider client={client}>
      <ChannelProvider channelName="get-started">
        <AblyPubSub />
      </ChannelProvider>
    </AblyProvider>
  )
}

// POST https://rest.ably.io/channels/get-started/messages \
//      -u "NEXT_PUBLIC_ABLY_API_USER:NEXT_PUBLIC_ABLY_API_PASS" \
//      -H "Content-Type: application/json" \
//      --data '{ "name": "first", "data": "Here is my first message!" }'

export function AblyPubSub() {
  const [messages, setMessages] = useState<Ably.Message[]>([])

  useConnectionStateListener('connected', () => {
    console.log('Connected to Ably!')
  })

  // Create a channel called 'get-started' and subscribe to all messages with the name 'first' using the useChannel hook
  const { channel } = useChannel('get-started', 'first', (message) => {
    setMessages((previousMessages) => [...previousMessages, message])
  })

  return (
    // Publish a message with the name 'first' and the contents 'Here is my first message!' when the 'Publish' button is clicked
    <div>
      <button
        onClick={() => {
          channel.publish('first', 'Here is my first message!')
        }}
      >
        Publish
      </button>
      {messages.map((message) => {
        return <p key={message.id}>{message.data}</p>
      })}
    </div>
  )
}
