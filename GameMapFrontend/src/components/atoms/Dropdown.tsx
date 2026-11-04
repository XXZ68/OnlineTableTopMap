
import type { SelectHTMLAttributes, ReactNode } from 'react'

const SIZES = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-5 py-4 text-lg',
} as const

const VARIANTS = {
  primary:
    'bg-gray-800 text-white border-gray-600 hover:border-gray-400 focus:border-accent-special',
  secondary:
    'bg-gray-900 text-gray-100 border-gray-700 hover:border-gray-500 focus:border-accent-special',
  danger:
    'bg-gray-900 text-red-400 border-red-500 focus:border-red-400',
} as const

type DropdownProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'size'
> & {
  size?: keyof typeof SIZES
  variant?: keyof typeof VARIANTS
  children?: ReactNode
}

const Dropdown = ({
  size = 'md',
  variant = 'primary',
  disabled = false,
  className = '',
  children,
  ...props
}: DropdownProps) => {
  const baseClasses =
    'w-full border rounded-md font-medium transition-colors outline-none focus:ring-2 focus:ring-accent-special disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <select
      disabled={disabled}
      className={`${baseClasses} ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export default Dropdown
