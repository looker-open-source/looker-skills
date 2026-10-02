import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { LookerChartData, LookerChartConfig } from './utils/types';

ChartJS.register(
  ArcElement,
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
  const measureCol = columns[1] || columns[0];

  const bgColor = config.backgroundColor || '#ffffff';
  const textColor = config.textColor || '#000000';

  const chartData = {
    labels: data.map((row: any) => String(row[dimCol]?.rendered || row[dimCol]?.value || '')),
    datasets: [
      {
        label: measureCol,
        data: data.map((row: any) => Number(row[measureCol]?.value || 0)),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: textColor }
      },
    }
  };

  return (
    <div className="viz-container" style={{ width: '100%', height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: bgColor, padding: '15px', borderRadius: '4px', color: textColor }>
      <h2>{title}</h2>
      <div style={{ width: '300px', height: '300px', marginTop: '10px' }>
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
};

export default {component_name};
