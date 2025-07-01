"use client"

import React from 'react'

type MessageInputProps = {
    value: string;
    setValue: (value: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ value, setValue }: MessageInputProps) => {
  return (
    <div className='rounded-[20px] flex items-center justify-center'>
        <textarea 
            placeholder='Start chatting to transfer SOL, list NFTs, swap tokens, and more...' 
            value={value} 
            onChange={(e) => {
                setValue(e.target.value);
                // Auto resize textarea height
                e.target.style.height = 'auto';
                const newHeight = Math.min(e.target.scrollHeight, 200); // Max height of 200px
                e.target.style.height = `${newHeight}px`;
            }}
            rows={1}
            className='bg-background lg:w-[850px] p-4 px-6 rounded-[20px] active:border-none focus:outline-none 
                      text-foreground/95 font-poppins text-lg placeholder:text-foreground/50 resize-none min-h-[48px] max-h-[200px] overflow-auto'
            style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                scrollbarGutter: 'stable',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255, 255, 255, 0.2) rgba(0, 0, 0, 0.1)',
                overflowY: 'auto',
                transition: 'height 0.4s ease',

            }}
        />
    </div>
  )
}

export default MessageInput