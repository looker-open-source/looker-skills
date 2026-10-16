import React from 'react';
import { LookerChartData, LookerChartConfig } from './utils/types';

interface Props {
  data: LookerChartData;
  config: LookerChartConfig;
}

export const {component_name}: React.FC<Props> = ({ data, config }) => {
  if (!data || data.length === 0) {
    return <div>No Results</div>;
  }

  const columns = Object.keys(data[0] || {});
  const bgColor = config.backgroundColor || '#ffffff';
  const textColor = config.textColor || '#000000';
  const showGridlines = config.gridlines !== undefined ? config.gridlines : true;
  
  // Conditional formatting options
  const threshold = config.threshold ? parseFloat(config.threshold) : null;
  const highlightColor = config.highlightColor || '#ffcccc';

  const borderStyle = showGridlines ? '1px solid #eee' : 'none';

  return (
    <div className="viz-container" style={{ backgroundColor: bgColor, color: textColor, padding: '15px', borderRadius: '4px' }>
      <h2 style={{ marginBottom: '15px' }>{title}</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'sans-serif' }>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left', backgroundColor: '#f5f5f5' }>
            {columns.map((col: string) => (
              <th key={col} style={{ padding: '10px' }>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, i: number) => (
            <tr key={i} style={{ borderBottom: borderStyle }>
              {columns.map((col: string) => {
                const val = row[col]?.value;
                const shouldHighlight = threshold !== null && val !== null && !isNaN(parseFloat(val)) && parseFloat(val) > threshold;
                const cellBg = shouldHighlight ? highlightColor : 'transparent';
                
                return (
                  <td key={col} style={{ padding: '10px', backgroundColor: cellBg }>
                    {row[col]?.rendered || String(val ?? '')}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default {component_name};
