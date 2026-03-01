import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({
  className,
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  const baseClasses = 'skeleton';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={clsx(baseClasses, variantClasses[variant], className)}
      style={style}
    />
  );
}

// Skeleton presets for common UI patterns
export function CardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1">
          <Skeleton width="60%" className="mb-2" />
          <Skeleton width="40%" />
        </div>
      </div>
      <Skeleton height={100} variant="rectangular" className="mb-4" />
      <div className="flex gap-2">
        <Skeleton width={80} height={24} variant="rectangular" />
        <Skeleton width={80} height={24} variant="rectangular" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <Skeleton width="80%" />
        </td>
      ))}
    </tr>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 animate-pulse">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <Skeleton width="50%" className="mb-2" />
        <Skeleton width="30%" />
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="animate-pulse">
      <Skeleton variant="rectangular" height={height} className="w-full" />
    </div>
  );
}
