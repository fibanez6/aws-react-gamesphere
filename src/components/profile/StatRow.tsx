interface StatRowProps {
  label: string;
  value: string;
}

export default function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-dark-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
