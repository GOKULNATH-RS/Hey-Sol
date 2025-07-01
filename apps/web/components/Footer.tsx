import React from 'react'
import SolLOGO from '/public/assets/solanaLogo.svg'
import Image from 'next/image'

const Footer = () => {
  return (
    <div className='absolute bottom-0 w-full flex justify-center items-center h-16 text-foreground'>
        <div className='inline-flex items-center gap-2 text-sm font-poppins'>
            Built on <Image src={SolLOGO} alt="Solana" className='h-[12px] w-max'/>
        </div>
    </div>
  )
}

export default Footer