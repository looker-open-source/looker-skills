import React from 'react';
import ReactECharts from 'echarts-for-react';
import { LookerChartData, LookerChartConfig } from './utils/types';

interface Props {
  data: LookerChartData;
  config: LookerChartConfig;
}

export const {component_name}: React.FC<Props> = ({ data, config }) => {
  // Extract styles directly from Looker configuration
  const bgColor = config.backgroundColor ? config.backgroundColor : '#ffffff';
  const textColor = config.textColor ? config.textColor : '#000000';

  // Generic ECharts configuration
  const option = {
    backgroundColor: bgColor,
    textStyle: { color: textColor },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      axisLabel: { color: textColor }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: textColor }
    },
    series: [
      {
        data: data.map((d: any) => d[Object.keys(d)[0]]?.value || 0),
        type: 'bar',
      }
    ]
  };

  return (
    <div style={{ width: '100%', height: '100vh', boxSizing: 'border-box' }>
      <ReactECharts 
        option={option} 
        style={{ height: '100%', width: '100%' } 
        opts={{ renderer: 'canvas' } 
      />
    </div>
  );
};

export default {component_name};
