import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { LookerChartData, LookerChartConfig } from './utils/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
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
      backgroundColor: `rgba(${54 + idx*40}, ${162 - idx*30}, ${235 - idx*20}, 0.5)`,
      borderColor: `rgba(${54 + idx*40}, ${162 - idx*30}, ${235 - idx*20}, 1)`,
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
      title: {
        display: true,
        text: '{title}',
        color: textColor
      },
    },
    scales: {
      x: { ticks: { color: textColor } },
      y: { ticks: { color: textColor } }
    }
  };

  return (
    <div className="viz-container" style={{ width: '100%', height: '400px', backgroundColor: bgColor, padding: '15px', borderRadius: '4px' }>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default {component_name};
