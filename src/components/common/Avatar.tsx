import { clsx } from 'clsx';

interface AvatarProps {
  src: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  showStatus?: boolean;
  className?: string;
}

export default function Avatar({
  src,
  alt,
  size = 'md',
  isOnline,
  showStatus = false,
  className,
}: AvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const statusSizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  };

  return (
    <div className={clsx('relative inline-block', className)}>
      <img
        src={src}
        alt={alt}
        className={clsx(
          'rounded-full object-cover ring-2 ring-dark-700',
          sizeClasses[size]
        )}
      />
      {showStatus && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-dark-800',
            statusSizeClasses[size],
            isOnline ? 'bg-green-500' : 'bg-dark-500'
          )}
        />
      )}
    </div>
  );
}

// Avatar Group for displaying multiple avatars
interface AvatarGroupProps {
  avatars: { src: string; alt: string }[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarGroup({ avatars, max = 4, size = 'md' }: AvatarGroupProps) {
  const displayAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  const sizeClasses = {
    sm: 'w-8 h-8 -ml-2',
    md: 'w-10 h-10 -ml-3',
    lg: 'w-14 h-14 -ml-4',
  };

  const remainingSizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
  };

  return (
    <div className="flex items-center">
      {displayAvatars.map((avatar, index) => (
        <img
          key={index}
          src={avatar.src}
          alt={avatar.alt}
          className={clsx(
            'rounded-full object-cover ring-2 ring-dark-800',
            sizeClasses[size],
            index === 0 && 'ml-0'
          )}
        />
      ))}
      {remaining > 0 && (
        <div
          className={clsx(
            'flex items-center justify-center rounded-full bg-dark-700 ring-2 ring-dark-800 font-medium text-dark-300',
            sizeClasses[size],
            remainingSizeClasses[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
