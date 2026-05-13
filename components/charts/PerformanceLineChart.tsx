'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { chartColors, defaultChartConfig, formatters } from '@/lib/chart-config';

export interface PerformanceDataPoint {
  date: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagement_rate: number;
  platform: string;
}

interface PerformanceLineChartProps {
  data: PerformanceDataPoint[];
  metrics: ('views' | 'likes' | 'comments' | 'engagement_rate' | 'shares' | 'saves')[];
  dateRange?: { from: string; to: string };
  platform?: 'instagram' | 'tiktok' | 'youtube' | 'all';
  height?: number;
  showLegend?: boolean;
}

export default function PerformanceLineChart({
  data,
  metrics,
  dateRange,
  platform = 'all',
  height = 300,
  showLegend = true
}: PerformanceLineChartProps) {

  // Filter data by platform if specified
  const filteredData = platform === 'all' 
    ? data 
    : data.filter(item => item.platform === platform);

  // Sort data by date
  const sortedData = [...filteredData].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Metric configurations
  const metricConfigs = {
    views: {
      key: 'views',
      name: 'Görüntülenme',
      color: chartColors.chart1,
      formatter: formatters.number,
      yAxisId: 'left'
    },
    likes: {
      key: 'likes',
      name: 'Beğeni',
      color: chartColors.chart2,
      formatter: formatters.number,
      yAxisId: 'left'
    },
    comments: {
      key: 'comments',
      name: 'Yorum',
      color: chartColors.chart3,
      formatter: formatters.number,
      yAxisId: 'left'
    },
    shares: {
      key: 'shares',
      name: 'Paylaşım',
      color: chartColors.chart4,
      formatter: formatters.number,
      yAxisId: 'left'
    },
    saves: {
      key: 'saves',
      name: 'Kaydetme',
      color: chartColors.chart5,
      formatter: formatters.number,
      yAxisId: 'left'
    },
    engagement_rate: {
      key: 'engagement_rate',
      name: 'Etkileşim Oranı',
      color: chartColors.chart6,
      formatter: formatters.percentage,
      yAxisId: 'right'
    }
  };

  // Check if we need dual Y-axis (engagement_rate with other metrics)
  const hasEngagementRate = metrics.includes('engagement_rate');
  const hasOtherMetrics = metrics.some(m => m !== 'engagement_rate');
  const needsDualAxis = hasEngagementRate && hasOtherMetrics;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">
            {formatters.dateTime(label)}
          </p>
          {payload.map((entry: any, index: number) => {
            const config = metricConfigs[entry.dataKey as keyof typeof metricConfigs];
            return (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                <span className="font-medium">{config.name}:</span>{' '}
                {config.formatter(entry.value)}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  if (!sortedData || sortedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-gray-600">Henüz performans verisi yok</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={sortedData}
          margin={defaultChartConfig.margin}
        >
          <CartesianGrid 
            strokeDasharray={defaultChartConfig.grid.strokeDasharray}
            stroke={defaultChartConfig.grid.stroke}
          />
          
          <XAxis 
            dataKey="date"
            tickFormatter={formatters.date}
            tick={defaultChartConfig.axis.tick}
            axisLine={defaultChartConfig.axis.axisLine}
            tickLine={defaultChartConfig.axis.tickLine}
          />
          
          {/* Left Y-Axis for counts */}
          <YAxis 
            yAxisId="left"
            tickFormatter={formatters.number}
            tick={defaultChartConfig.axis.tick}
            axisLine={defaultChartConfig.axis.axisLine}
            tickLine={defaultChartConfig.axis.tickLine}
          />
          
          {/* Right Y-Axis for percentages */}
          {needsDualAxis && (
            <YAxis 
              yAxisId="right"
              orientation="right"
              tickFormatter={formatters.percentage}
              tick={defaultChartConfig.axis.tick}
              axisLine={defaultChartConfig.axis.axisLine}
              tickLine={defaultChartConfig.axis.tickLine}
            />
          )}
          
          <Tooltip content={<CustomTooltip />} />
          
          {showLegend && (
            <Legend wrapperStyle={defaultChartConfig.legend.wrapperStyle} />
          )}
          
          {/* Render lines for each metric */}
          {metrics.map((metric) => {
            const config = metricConfigs[metric];
            return (
              <Line
                key={metric}
                yAxisId={needsDualAxis ? config.yAxisId : 'left'}
                type="monotone"
                dataKey={config.key}
                stroke={config.color}
                strokeWidth={2}
                dot={{ fill: config.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: config.color, strokeWidth: 2 }}
                name={config.name}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}