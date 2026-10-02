import React from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { LookerChartData, LookerChartConfig } from './utils/types';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface Props {
  data: LookerChartData;
  config: LookerChartConfig;
}

export const {component_name}: React.FC<Props> = ({ data, config }) => {
  if (!data || data.length === 0) {
    return <div>No Results</div>;
  }

  const columns = Object.keys(data[0] || {});
  const dimCol = columns[0] || 'dimension';
  const measureCols = columns.slice(1);

  const bgColor = config.backgroundColor || '#ffffff';
  const textColor = config.textColor || '#000000';

  const chartData = {
    labels: data.map((row: any) => String(row[dimCol]?.rendered || row[dimCol]?.value || '')),
    datasets: (measureCols.length > 0 ? measureCols : [dimCol]).map((col: string, idx: number) => ({
      label: col,
      data: data.map((row: any) => Number(row[col]?.value || 0)),
      backgroundColor: `rgba(${255 - idx*50}, ${99 + idx*30}, ${132 + idx*20}, 0.2)`,
      borderColor: `rgba(${255 - idx*50}, ${99 + idx*30}, ${132 + idx*20}, 1)`,
      borderWidth: 1,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: textColor }
      },
    },
    scales: {
      r: {
        ticks: { color: textColor, showLabelBackdrop: false },
        grid: { color: 'rgba(0,0,0,0.1)' },
        angleLines: { color: 'rgba(0,0,0,0.1)' },
        pointLabels: { color: textColor }
      }
    }
  };

  return (
    <div className="viz-container" style={{ width: '100%', height: '400px', display: 'flex', justifyContent: 'center', backgroundColor: bgColor, padding: '15px', borderRadius: '4px' }}>
      <div style={{ width: '350px', height: '350px' }>
        <Radar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default {component_name};
