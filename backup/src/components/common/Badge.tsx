import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'default';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  const variantClasses = {
    primary: 'bg-primary-500/20 text-primary-300',
    accent: 'bg-accent-500/20 text-accent-300',
    success: 'bg-green-500/20 text-green-300',
    warning: 'bg-yellow-500/20 text-yellow-300',
    danger: 'bg-red-500/20 text-red-300',
    default: 'bg-dark-600/50 text-dark-300',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}

// Rank Badge with special styling
interface RankBadgeProps {
  rank: string;
  size?: 'sm' | 'md' | 'lg';
}

export function RankBadge({ rank, size = 'md' }: RankBadgeProps) {
  const rankColors: Record<string, string> = {
    Bronze: 'bg-amber-700/30 text-amber-400 border-amber-600/50',
    Silver: 'bg-gray-400/20 text-gray-300 border-gray-500/50',
    Gold: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    Platinum: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
    Diamond: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    Master: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    Grandmaster: 'bg-red-500/20 text-red-400 border-red-500/50',
    Challenger: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border-yellow-500/50',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-lg font-semibold border',
        rankColors[rank] || 'bg-dark-600/50 text-dark-300 border-dark-500/50',
        sizeClasses[size]
      )}
    >
      {rank}
    </span>
  );
}

// Achievement Rarity Badge
interface RarityBadgeProps {
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export function RarityBadge({ rarity }: RarityBadgeProps) {
  const rarityStyles = {
    common: 'bg-gray-500/20 text-gray-300',
    rare: 'bg-blue-500/20 text-blue-300',
    epic: 'bg-purple-500/20 text-purple-300',
    legendary: 'bg-yellow-500/20 text-yellow-300',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize',
        rarityStyles[rarity]
      )}
    >
      {rarity}
    </span>
  );
}
