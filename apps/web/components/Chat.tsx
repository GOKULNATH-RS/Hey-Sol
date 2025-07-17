import React from 'react'
import ChatInterface from './ChatInterface'
import HeySol from './HeySol'

const Chat = () => {
  return (
    <div className='flex h-full flex-col items-center justify-center gap-4 text-center'>
        <div className='h-full'>
            <ChatInterface />
        </div>
    </div>
  )
}

export default Chat