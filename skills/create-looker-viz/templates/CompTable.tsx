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
              {columns.map((col: string) => (
                <td key={col} style={{ padding: '10px' }>
                  {row[col]?.rendered || String(row[col]?.value ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default {component_name};
