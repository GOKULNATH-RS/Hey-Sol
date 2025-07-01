"use client"

import React from 'react'
import MessageInput from './MessageInput'
import { AudioWaveform, icons, PencilRuler, Replace, Rocket, ScanSearch, Send } from 'lucide-react'
import Capsules from './ui/Capsules'

const ChatInterface = () => {
  
  const [LastMessage, setLastMessage] = React.useState<string>("")

  const quickActions = [
    {
      label : "Transfer SOL",
      icon: <Rocket className='size-4' />
    },
    {
      label : "List NFTs",
      icon: <AudioWaveform className='size-4' />
    },
    {
      label : "Swap Tokens",
      icon: <Replace className='size-4' />
    },
    {
      label : "View Transactions",
      icon: <ScanSearch className='size-4' />
    }
  ]

  return (
    <div className='w-full'>

      {/* CHATBOX */}
      <div className='bg-background/70 sol-gradient rounded-[20px] overflow-hidden'>
        <div className='bg-background/40  p-[1px]  overflow-hidden'>
          <div className='bg-background rounded-[19px]'>
            <MessageInput setValue={setLastMessage} value={LastMessage}/>
            <div className='flex justify-end items-center gap-1.5 pt-3 pr-2.5 pb-2.5'>
              <button className='p-2 hover:bg-foreground/3 text-foreground/60 hover:text-sol-purple/70 rounded-[8px]'>
                <PencilRuler />
              </button>
              <button className='p-2 hover:bg-foreground/3 text-foreground/60 hover:text-sol-green/70 rounded-[8px]'>
                <Send />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className='mt-4 flex flex-wrap gap-4'>
          {
            quickActions.map((action, index) => (
              // TODO: Add random hover color to capsules
             <Capsules key={index} label={action.label} icon={action.icon ? action.icon : null}/>
            ))
          }
      </div>
    </div>
  )
}

export default ChatInterface