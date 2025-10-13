import { cn } from '@/lib/utils'
import React from 'react'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: number | string
  height?: number | string
  className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200/80 dark:bg-gray-700/50',
        className
      )}
      style={{ width, height }}
      {...props}
    />
  )
}

export const SkeletonCard: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div className={cn('space-y-3', className)} {...props}>
      <Skeleton className="h-[200px] w-full rounded-lg" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
    </div>
  )
}

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-8 w-[20%]" />
        <Skeleton className="h-8 w-[30%]" />
        <Skeleton className="h-8 w-[25%]" />
        <Skeleton className="h-8 w-[25%]" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-[20%]" />
          <Skeleton className="h-12 w-[30%]" />
          <Skeleton className="h-12 w-[25%]" />
          <Skeleton className="h-12 w-[25%]" />
        </div>
      ))}
    </div>
  )
}

export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  )
}

export const SkeletonAvatar: React.FC<SkeletonProps> = ({
  width = 40,
  height = 40,
  className,
  ...props
}) => {
  return (
    <Skeleton
      className={cn('rounded-full', className)}
      style={{ width, height }}
      {...props}
    />
  )
}
