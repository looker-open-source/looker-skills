import { useEffect, useState } from 'react';
import { LookerChartData } from './utils/types';

export function useLookerData(mockData: LookerChartData): LookerChartData | null {
  const [data, setData] = useState<LookerChartData | null>(null);

  useEffect(() => {
    if (typeof looker !== 'undefined' && looker.plugins && looker.plugins.visualizations) {
      // Data passed via Looker updateAsync handler
    } else {
      console.log("Not in Looker host, loading mock data...");
      setData(mockData);
    }
  }, [mockData]);

  return data;
}
