import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-mono text-xs tracking-widest border transition-all duration-150 cursor-pointer select-none disabled:opacity-40 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        // Tactical variants
        approve:  'border-amber-500/60  bg-amber-500/10  text-amber-300   hover:bg-amber-500/20  hover:border-amber-400/80',
        execute:  'border-red-500/70    bg-red-500/12    text-red-300     hover:bg-red-500/25    hover:border-red-400/90   font-bold',
        ghost:    'border-white/8       bg-transparent   text-slate-400   hover:bg-white/5       hover:text-slate-200',
        active:   'border-blue-500/50   bg-blue-500/10   text-blue-300    hover:bg-blue-500/20',
        danger:   'border-red-600/80    bg-red-600/20    text-red-200     hover:bg-red-600/35',
      },
      size: {
        sm:   'h-7  px-3  text-[10px]',
        md:   'h-8  px-4  text-xs',
        lg:   'h-10 px-5  text-sm',
        full: 'h-9  w-full px-4 text-xs',
      },
    },
    defaultVariants: { variant: 'ghost', size: 'md' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
