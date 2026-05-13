'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { chartColors, defaultChartConfig, formatters, getPerformanceColor } from '@/lib/chart-config';

export interface ScoreDataPoint {
  date: string;
  video_id: string;
  hook_score: number;
  tempo_score: number;
  clarity_score: number;
  cta_score: number;
  visual_score: number;
  overall_score: number;
}

interface ScoreProgressChartProps {
  data: ScoreDataPoint[];
  scoreTypes: ('hook' | 'tempo' | 'clarity' | 'cta' | 'visual' | 'overall')[];
  showAverage?: boolean;
  highlightChanges?: boolean;
  height?: number;
  showLegend?: boolean;
}

export default function ScoreProgressChart({
  data,
  scoreTypes,
  showAverage = true,
  highlightChanges = true,
  height = 300,
  showLegend = true
}: ScoreProgressChartProps) {

  // Sort data by date
  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate averages if needed
  const dataWithAverages = showAverage ? sortedData.map((item, index) => {
    // Calculate rolling average for each score type
    const windowSize = Math.min(3, index + 1); // 3-point moving average
    const startIndex = Math.max(0, index - windowSize + 1);
    const window = sortedData.slice(startIndex, index + 1);
    
    const averages: Record<string, number> = {};
    scoreTypes.forEach(scoreType => {
      if (scoreType !== 'overall') {
        const avg = window.reduce((sum, d) => {
          const val = d[`${scoreType}_score` as keyof ScoreDataPoint];
          return sum + (typeof val === 'number' ? val : 0);
        }, 0) / window.length;
        averages[`${scoreType}_avg`] = Math.round(avg * 10) / 10;
      }
    });
    
    return { ...item, ...averages };
  }) : sortedData;

  // Score configurations
  const scoreConfigs = {
    hook: {
      key: 'hook_score',
      avgKey: 'hook_avg',
      name: 'Hook',
      color: chartColors.chart1,
    },
    tempo: {
      key: 'tempo_score',
      avgKey: 'tempo_avg',
      name: 'Tempo',
      color: chartColors.chart2,
    },
    clarity: {
      key: 'clarity_score',
      avgKey: 'clarity_avg',
      name: 'Netlik',
      color: chartColors.chart3,
    },
    cta: {
      key: 'cta_score',
      avgKey: 'cta_avg',
      name: 'CTA',
      color: chartColors.chart4,
    },
    visual: {
      key: 'visual_score',
      avgKey: 'visual_avg',
      name: 'Görsel',
      color: chartColors.chart5,
    },
    overall: {
      key: 'overall_score',
      avgKey: 'overall_avg',
      name: 'Genel',
      color: chartColors.chart6,
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">
            {formatters.dateTime(label)}
          </p>
          {payload.map((entry: any, index: number) => {
            const isAverage = entry.dataKey.includes('_avg');
            const scoreType = entry.dataKey.replace('_score', '').replace('_avg', '');
            const config = scoreConfigs[scoreType as keyof typeof scoreConfigs];
            
            return (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                <span className="font-medium">
                  {config.name}{isAverage ? ' (Ort.)' : ''}:
                </span>{' '}
                {entry.value.toFixed(1)}/10
                <span 
                  className="ml-2 px-1 py-0.5 rounded text-xs text-white"
                  style={{ backgroundColor: getPerformanceColor(entry.value) }}
                >
                  {entry.value >= 8 ? 'Mükemmel' : 
                   entry.value >= 6 ? 'İyi' : 
                   entry.value >= 4 ? 'Orta' : 'Zayıf'}
                </span>
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  if (!dataWithAverages || dataWithAverages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-4xl mb-2">📈</div>
          <p className="text-gray-600">Henüz skor verisi yok</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={dataWithAverages}
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
          
          <YAxis 
            domain={[0, 10]}
            tickFormatter={(value) => `${value}/10`}
            tick={defaultChartConfig.axis.tick}
            axisLine={defaultChartConfig.axis.axisLine}
            tickLine={defaultChartConfig.axis.tickLine}
          />
          
          {/* Reference lines for score thresholds */}
          <ReferenceLine y={8} stroke={getPerformanceColor(8)} strokeDasharray="2 2" />
          <ReferenceLine y={6} stroke={getPerformanceColor(6)} strokeDasharray="2 2" />
          <ReferenceLine y={4} stroke={getPerformanceColor(4)} strokeDasharray="2 2" />
          
          <Tooltip content={<CustomTooltip />} />
          
          {showLegend && (
            <Legend wrapperStyle={defaultChartConfig.legend.wrapperStyle} />
          )}
          
          {/* Render lines for each score type */}
          {scoreTypes.map((scoreType) => {
            const config = scoreConfigs[scoreType];
            return (
              <Line
                key={scoreType}
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
          
          {/* Render average lines if enabled */}
          {showAverage && scoreTypes.map((scoreType) => {
            if (scoreType === 'overall') return null; // Skip overall average for now
            
            const config = scoreConfigs[scoreType];
            return (
              <Line
                key={`${scoreType}_avg`}
                type="monotone"
                dataKey={config.avgKey}
                stroke={config.color}
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name={`${config.name} Ort.`}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}