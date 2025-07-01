import React from 'react'

const HeySol = () => {
  return (
    <div className='font-darker-grotesque  flex flex-col items-center justify-center h-1/3 gap-4 text-center'>
        <p className='text-7xl leading-12'>
            Hey
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-sol-purple via to-sol-green'>SOL</span>
        </p>
        <p className='text-xl tracking-wider font text-foreground/90'>Your chat-based gateway to Solana actions</p>
    </div>
  )
}

export default HeySol