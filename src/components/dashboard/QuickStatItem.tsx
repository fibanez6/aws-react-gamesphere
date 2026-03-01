interface QuickStatItemProps {
  label: string;
  value: string;
  icon: string;
  trend?: string;
  isLive?: boolean;
}

export default function QuickStatItem({ label, value, icon, trend, isLive }: QuickStatItemProps) {
  return (
    <div className="bg-dark-700/30 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <span className="text-2xl">{icon}</span>
        {isLive && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <span className="online-indicator scale-75" />
            Live
          </span>
        )}
        {trend && !isLive && (
          <span className="text-xs text-green-400">{trend}</span>
        )}
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
      <p className="text-xs text-dark-400">{label}</p>
    </div>
  );
};
