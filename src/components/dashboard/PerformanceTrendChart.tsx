import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { ChartSkeleton } from '../common/Skeleton';

interface PerformanceTrendChartProps {
  data: number[];
  isLoading: boolean;
}

export default function PerformanceTrendChart({ data, isLoading }: PerformanceTrendChartProps) {
  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Weekly Playtime</h3>
        <ChartSkeleton height={250} />
      </div>
    );
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartData = data.map((hours, index) => ({
    day: days[index],
    hours,
  }));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Weekly Playtime</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary-500" />
            <span className="text-sm text-dark-400">Hours Played</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(value) => `${value}h`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              labelStyle={{ color: '#f8fafc', fontWeight: 600 }}
              itemStyle={{ color: '#0ea5e9' }}
              formatter={(value: number) => [`${value}h`, 'Playtime']}
            />
            <Area
              type="monotone"
              dataKey="hours"
              stroke="#0ea5e9"
              strokeWidth={2}
              fill="url(#colorHours)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-dark-700">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary-400">
            {data.reduce((a, b) => a + b, 0).toFixed(1)}h
          </p>
          <p className="text-xs text-dark-400">Total This Week</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-accent-400">
            {(data.reduce((a, b) => a + b, 0) / 7).toFixed(1)}h
          </p>
          <p className="text-xs text-dark-400">Daily Average</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-400">
            {Math.max(...data).toFixed(1)}h
          </p>
          <p className="text-xs text-dark-400">Peak Day</p>
        </div>
      </div>
    </div>
  );
}
