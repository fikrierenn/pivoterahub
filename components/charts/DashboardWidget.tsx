'use client';

import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { chartColors, chartPalette, defaultChartConfig, formatters } from '@/lib/chart-config';

interface DashboardWidgetProps {
  title: string;
  data: any[];
  chartType: 'line' | 'bar' | 'pie' | 'donut' | 'sparkline';
  size: 'small' | 'medium' | 'large';
  interactive?: boolean;
  dataKey?: string;
  nameKey?: string;
  valueFormatter?: (value: any) => string;
  color?: string;
}

export default function DashboardWidget({
  title,
  data,
  chartType,
  size,
  interactive = true,
  dataKey = 'value',
  nameKey = 'name',
  valueFormatter = formatters.number,
  color = chartColors.primary
}: DashboardWidgetProps) {

  const sizeConfig = {
    small: { width: '100%', height: 150 },
    medium: { width: '100%', height: 200 },
    large: { width: '100%', height: 300 },
  };

  const { width, height } = sizeConfig[size];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-lg text-sm">
          {label && <p className="font-medium text-gray-800">{label}</p>}
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {valueFormatter(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-2xl mb-1">📊</div>
            <div className="text-xs">Veri yok</div>
          </div>
        </div>
      );
    }

    switch (chartType) {
      case 'line':
        return (
          <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            {interactive && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            {interactive && <XAxis dataKey={nameKey} tick={{ fontSize: 10 }} />}
            {interactive && <YAxis tick={{ fontSize: 10 }} />}
            {interactive && <Tooltip content={<CustomTooltip />} />}
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />
          </LineChart>
        );

      case 'sparkline':
        return (
          <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            {interactive && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            {interactive && <XAxis dataKey={nameKey} tick={{ fontSize: 10 }} />}
            {interactive && <YAxis tick={{ fontSize: 10 }} />}
            {interactive && <Tooltip content={<CustomTooltip />} />}
            <Bar dataKey={dataKey} fill={color} radius={[2, 2, 0, 0]} />
          </BarChart>
        );

      case 'pie':
      case 'donut':
        const innerRadius = chartType === 'donut' ? 40 : 0;
        return (
          <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={Math.min(height, 120) / 2 - 10}
              dataKey={dataKey}
              nameKey={nameKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartPalette[index % chartPalette.length]} />
              ))}
            </Pie>
            {interactive && <Tooltip content={<CustomTooltip />} />}
          </PieChart>
        );

      default:
        return <div>Desteklenmeyen grafik türü</div>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">{title}</h3>
      <div style={{ width, height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}