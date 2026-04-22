import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center font-mono text-[9px] tracking-wider border px-1.5 py-0.5',
  {
    variants: {
      variant: {
        hostile:     'border-red-700/50    bg-red-900/20    text-red-400',
        disrupted:   'border-green-700/40  bg-green-900/15  text-green-400',
        destroyed:   'border-slate-700/40  bg-slate-900/20  text-slate-500',
        engaged:     'border-amber-700/50  bg-amber-900/20  text-amber-400',
        escaped:     'border-slate-700/40  bg-slate-900/20  text-slate-500',
        neutral:     'border-blue-700/40   bg-blue-900/15   text-blue-400',
        fpv:         'border-red-700/40    bg-red-900/10    text-red-400',
        ied:         'border-amber-700/40  bg-amber-900/10  text-amber-400',
        rcws:        'border-pink-700/40   bg-pink-900/10   text-pink-400',
      },
    },
    defaultVariants: { variant: 'neutral' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
