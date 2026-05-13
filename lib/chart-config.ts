// Chart configuration and theming for Recharts

export const chartColors = {
  primary: '#3B82F6',      // Blue-500
  secondary: '#8B5CF6',    // Violet-500
  success: '#10B981',      // Emerald-500
  warning: '#F59E0B',      // Amber-500
  danger: '#EF4444',       // Red-500
  info: '#06B6D4',         // Cyan-500
  gray: '#6B7280',         // Gray-500
  
  // Chart specific colors
  chart1: '#3B82F6',       // Blue
  chart2: '#8B5CF6',       // Violet
  chart3: '#10B981',       // Emerald
  chart4: '#F59E0B',       // Amber
  chart5: '#EF4444',       // Red
  chart6: '#06B6D4',       // Cyan
  chart7: '#EC4899',       // Pink
  chart8: '#84CC16',       // Lime
};

export const chartPalette = [
  chartColors.chart1,
  chartColors.chart2,
  chartColors.chart3,
  chartColors.chart4,
  chartColors.chart5,
  chartColors.chart6,
  chartColors.chart7,
  chartColors.chart8,
];

export const defaultChartConfig = {
  // Responsive breakpoints
  breakpoints: {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
  },
  
  // Default margins
  margin: {
    top: 20,
    right: 30,
    left: 20,
    bottom: 20,
  },
  
  // Grid styling
  grid: {
    stroke: '#E5E7EB',
    strokeDasharray: '3 3',
  },
  
  // Axis styling
  axis: {
    tick: {
      fontSize: 12,
      fill: '#6B7280',
    },
    axisLine: {
      stroke: '#D1D5DB',
    },
    tickLine: {
      stroke: '#D1D5DB',
    },
  },
  
  // Tooltip styling
  tooltip: {
    contentStyle: {
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      fontSize: '14px',
    },
    labelStyle: {
      color: '#374151',
      fontWeight: '600',
    },
  },
  
  // Legend styling
  legend: {
    wrapperStyle: {
      fontSize: '14px',
      color: '#374151',
    },
  },
};

// Chart size configurations
export const chartSizes = {
  small: {
    width: 300,
    height: 200,
  },
  medium: {
    width: 400,
    height: 300,
  },
  large: {
    width: 600,
    height: 400,
  },
  dashboard: {
    width: '100%',
    height: 250,
  },
};

// Performance metrics color mapping
export const performanceColors = {
  excellent: chartColors.success,  // Green for 8-10
  good: chartColors.info,         // Blue for 6-8
  average: chartColors.warning,   // Yellow for 4-6
  poor: chartColors.danger,       // Red for 0-4
};

// Get color based on performance score
export const getPerformanceColor = (score: number): string => {
  if (score >= 8) return performanceColors.excellent;
  if (score >= 6) return performanceColors.good;
  if (score >= 4) return performanceColors.average;
  return performanceColors.poor;
};

// Format numbers for charts
export const formatters = {
  number: (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  },
  
  percentage: (value: number): string => {
    return `${value.toFixed(1)}%`;
  },
  
  currency: (value: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(value);
  },
  
  date: (value: string | Date): string => {
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
    });
  },
  
  dateTime: (value: string | Date): string => {
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  },
};

// Common chart props
export const getResponsiveProps = (size: 'small' | 'medium' | 'large' | 'dashboard') => {
  const config = chartSizes[size];
  return {
    width: config.width,
    height: config.height,
    margin: defaultChartConfig.margin,
  };
};

// Animation configurations
export const animations = {
  duration: 750,
  easing: 'ease-out',
};

export default {
  colors: chartColors,
  palette: chartPalette,
  config: defaultChartConfig,
  sizes: chartSizes,
  formatters,
  getPerformanceColor,
  getResponsiveProps,
  animations,
};