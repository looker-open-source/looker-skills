import Chart from 'chart.js/auto';

function renderRadar(element, data) {
  element.innerHTML = '<canvas id="myChart"></canvas>';
  const ctx = document.getElementById('myChart').getContext('2d');
  
  if (!data || data.length === 0) return;
  const dimCol = Object.keys(data[0])[0];
  const measureCols = Object.keys(data[0]).slice(1);

  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: data.map(row => String(row[dimCol]?.value || '')),
      datasets: measureCols.map((col, idx) => ({
        label: col,
        data: data.map(row => Number(row[col]?.value || 0)),
        backgroundColor: `rgba(${255 - idx*50}, ${99 + idx*30}, ${132 + idx*20}, 0.2)`,
        borderColor: `rgba(${255 - idx*50}, ${99 + idx*30}, ${132 + idx*20}, 1)`,
        borderWidth: 1,
      })),
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

if (typeof looker !== 'undefined' && looker.plugins) {
  looker.plugins.visualizations.add({
    id: "prototypes/spider-viz",
    label: "Spider Chart",
    create: function(element) {
      element.innerHTML = `<div id="app-root" style="width:100%;height:100%;"></div>`;
    },
    updateAsync: function(data, element, config, queryResponse, details, done) {
      const root = document.getElementById('app-root');
      renderRadar(root, data);
      done();
    }
  });
} else {
  // Offline harness
  const mockData = [
    { 'dimension_1': { value: 'Speed' }, 'measure_1': { value: 80 } },
    { 'dimension_1': { value: 'Power' }, 'measure_1': { value: 90 } },
    { 'dimension_1': { value: 'Agility' }, 'measure_1': { value: 60 } },
    { 'dimension_1': { value: 'Stamina' }, 'measure_1': { value: 85 } },
  ];
  const container = document.getElementById('container');
  renderRadar(container, mockData);
}
