import React from 'react'
import ChatInterface from './ChatInterface'

const Chat = () => {
  return (
    <div className='flex flex-col items-center justify-center gap-4 text-center'>
        <div>
            <p className='text-5xl font-darker-grotesque font-medium text-foreground/90 mb-4'>Welcome! Ready to explore?</p>
        </div>
        <div>
            <ChatInterface />
        </div>
    </div>
  )
}

export default Chat