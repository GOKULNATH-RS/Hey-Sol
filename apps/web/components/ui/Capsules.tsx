import React from 'react'

type CapsuleProps = {
  label?: string;
  icon?: React.ReactNode;
}


const Capsules = ({ label, icon }: CapsuleProps) => {
  return (
    <div className='bg-background/70 hover:bg-background/90 cursor-pointer rounded-[20px] py-2 px-3 
    flex items-center justify-center text-foreground font-poppins font-medium text-xs'>
      {icon && <span className='mr-2'>{icon}</span>}
      {label}
    </div>
  )
}

export default Capsules