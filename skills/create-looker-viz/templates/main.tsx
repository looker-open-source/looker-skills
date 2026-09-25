import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { LookerChartData, LookerChartConfig } from './utils/types'

// If running in Looker Custom Visualization environment
if (typeof looker !== 'undefined' && looker.plugins && looker.plugins.visualizations) {
  looker.plugins.visualizations.add({
    id: "{name}",
    label: "{title}",
    options: {
      // Configuration UI injected by Looker
    },
    create: function(element: HTMLElement, _config: LookerChartConfig) {
      element.innerHTML = `<div id="container" style="width:100%;height:100%;"></div>`;
      this.root = ReactDOM.createRoot(document.getElementById('container')!);
    },
    updateAsync: function(data: LookerChartData, _element: HTMLElement, config: LookerChartConfig, _queryResponse: any, _details: any, done: () => void) {
      this.root.render(
        <React.StrictMode>
          <App data={data} config={config} />
        </React.StrictMode>
      );
      done();
    }
  });
} else {
  // Local development preview harness
  const container = document.getElementById('container');
  if (container) {
    const root = ReactDOM.createRoot(container);
    const mockData: LookerChartData = [
      { 'dimension_1': { value: 'Category A' }, 'measure_1': { value: 120 } },
      { 'dimension_1': { value: 'Category B' }, 'measure_1': { value: 240 } },
      { 'dimension_1': { value: 'Category C' }, 'measure_1': { value: 180 } },
      { 'dimension_1': { value: 'Category D' }, 'measure_1': { value: 310 } },
      { 'dimension_1': { value: 'Category E' }, 'measure_1': { value: 270 } },
    ];
    const mockConfig: LookerChartConfig = {
      backgroundColor: '#ffffff',
      textColor: '#000000',
    };
    root.render(
      <React.StrictMode>
        <App data={mockData} config={mockConfig} />
      </React.StrictMode>
    );
  }
}
