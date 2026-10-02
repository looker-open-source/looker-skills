// /tmp/harness-demo/demo_viz.js



looker.plugins.visualizations.add({
  id: 'demo_svg_bar_chart',
  label: 'Demo SVG Bar Chart',
  options: {
    custom_color_palette: {
      type: 'array',
      label: 'Color Palette',
      display: 'colors',
      default: ['#1a73e8', '#34a853', '#fbbc05', '#ea4335'],
      section: 'Plot'
    },
    show_labels: {
      type: 'boolean',
      label: 'Show Labels',
      default: true,
      section: 'Plot'
    }
  },
  create: function(element, config) {
    // Resolve Looker base URL dynamically to load native Google Sans without hardcoded domains
    let parentOrigin = window.location.origin;
    try {
      if (document.referrer) {
        parentOrigin = new URL(document.referrer).origin;
      }
    } catch (e) {
      // Fallback to window origin
    }

    if (!document.getElementById('looker-native-fonts')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'looker-native-fonts';
      styleEl.innerHTML = `
        @font-face {
          font-family: 'Google Sans';
          font-weight: 400;
          font-style: normal;
          src: url('${parentOrigin}/fonts/vendor/google-sans/GoogleSans-Regular-cb71e97c92.woff') format('woff');
        }
        @font-face {
          font-family: 'Google Sans';
          font-weight: 500;
          font-style: normal;
          src: url('${parentOrigin}/fonts/vendor/google-sans/GoogleSans-Medium-36c5aa25bb.woff') format('woff');
        }
      `;
      document.head.appendChild(styleEl);
    }

    element.innerHTML = `
      <div style="width: 100%; height: 100%; display: flex; flex-direction: column; font-family: sans-serif; box-sizing: border-box; padding: 2px; overflow: hidden;">
        <div id="chart-container" style="flex: 1; width: 100%; height: 100%;"></div>
      </div>
    `;

    // Initialize ResizeObserver to redraw when container size changes
    this.resizeObserver = new ResizeObserver(() => {
      if (this.currentData && this.currentQueryResponse) {
        this.renderChart(element);
      }
    });
    const container = element.querySelector('#chart-container');
    this.resizeObserver.observe(container);
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    // Store references for the ResizeObserver
    this.currentData = data;
    this.currentConfig = config;
    this.currentQueryResponse = queryResponse;
    this.currentDone = done;

    this.clearErrors();
    this.renderChart(element);
  },

  renderChart: function(element) {
    const container = element.querySelector('#chart-container');
    if (!container) return;

    const data = this.currentData;
    const config = this.currentConfig;
    const queryResponse = this.currentQueryResponse;

    const dimensions = queryResponse.fields.dimensions || [];
    const measures = queryResponse.fields.measures || [];

    if (dimensions.length === 0 || measures.length === 0) {
      container.innerHTML = '';
      this.addError({
        group: "query_shape",
        title: "Incompatible Data",
        message: "Requires at least 1 Dimension and 1 Measure."
      });
      if (this.currentDone) {
        this.currentDone();
        this.currentDone = null;
      }
      return;
    }

    if (data.length === 0) {
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; font-family: 'Google Sans', sans-serif;">
          <div style="color: rgb(140, 140, 140); display: flex; align-items: center; justify-content: center; margin-bottom: 6px;">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path fill="none" d="M0 0h24v24H0V0z"></path>
              <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path>
            </svg>
          </div>
          <span style="box-sizing: border-box; font-family: 'Google Sans', sans-serif; margin: 0px; padding: 0px; font-size: 1rem; font-weight: 500; line-height: 1.5rem; text-align: center; color: rgb(38, 45, 51); -webkit-font-smoothing: antialiased;">No results</span>
        </div>
      `;
      if (this.currentDone) {
        this.currentDone();
        this.currentDone = null;
      }
      return;
    }

    const showLabels = config.show_labels !== false;
    const colors = config.custom_color_palette || ['#1a73e8', '#34a853', '#fbbc05', '#ea4335'];

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;

    // Adjust top margin if we have multiple measures to fit a legend
    const numSeries = measures.length;
    const margin = { top: numSeries > 1 ? 35 : 15, right: 10, bottom: 40, left: 55 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Parse pivots if present
    const pivots = queryResponse.pivots || [];
    const isPivoted = pivots.length > 0;
    const pivotKey = isPivoted ? pivots[0].key : null;

    // Parse Data
    const chartData = data.map((row, idx) => {
      // Concatenate all dimensions for label
      const dimLabel = dimensions.map(d => {
        const cell = row[d.name];
        return cell ? ((window.LookerCharts && LookerCharts.Utils) ? LookerCharts.Utils.textForCell(cell) : String(cell.value || '')) : '';
      }).join(' - ');

      // Extract values for all measures (and handle pivots)
      const seriesData = [];
      measures.forEach(meas => {
        const measField = meas.name;
        const measCell = isPivoted ? (row[measField] ? row[measField][pivotKey] : null) : row[measField];
        
        const val = measCell ? (Number(measCell.value) || 0) : 0;
        const rendered = measCell 
          ? ((window.LookerCharts && LookerCharts.Utils)
            ? LookerCharts.Utils.htmlForCell(measCell)
            : String(measCell.rendered || measCell.value || ''))
          : '';
        const links = measCell ? (measCell.links || []) : [];
        
        seriesData.push({ value: val, rendered, links });
      });

      const dimLinks = row[dimensions[0].name] ? (row[dimensions[0].name].links || []) : [];

      return {
        label: dimLabel,
        series: seriesData,
        dimLinks
      };
    });

    // Find global max value across all series/rows
    let maxVal = 1;
    chartData.forEach(d => {
      d.series.forEach(s => {
        if (s.value > maxVal) maxVal = s.value;
      });
    });

    const barWidth = chartWidth / chartData.length;
    const groupPadding = 0.2; // 20% space between groups
    const barPadding = 0.05;  // 5% space between bars inside group
    
    const groupWidth = barWidth * (1 - groupPadding);
    const barSlotWidth = groupWidth / numSeries;
    const singleBarWidth = barSlotWidth * (1 - barPadding);

    // Build SVG
    let svgHtml = `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">`;
    
    // Draw Legend if multi-series
    if (numSeries > 1) {
      svgHtml += `<g transform="translate(${margin.left}, 15)">`;
      measures.forEach((meas, s) => {
        const color = colors[s % colors.length];
        const legendX = s * 160;
        svgHtml += `
          <rect x="${legendX}" y="0" width="12" height="12" fill="${color}" rx="2" />
          <text x="${legendX + 18}" y="10" font-size="11" fill="#555" font-weight="bold">${meas.label || meas.name}</text>
        `;
      });
      svgHtml += `</g>`;
    }

    svgHtml += `<g transform="translate(${margin.left}, ${margin.top})">`;

    // Gridlines & Y Axis Labels
    const ticks = [0, 0.25, 0.5, 0.75, 1];
    ticks.forEach(ratio => {
      const y = chartHeight * (1 - ratio);
      const labelVal = Math.round(maxVal * ratio);
      let displayLabel = String(labelVal);
      if (labelVal >= 1000000) {
        displayLabel = (labelVal / 1000000).toFixed(1) + 'M';
      } else if (labelVal >= 1000) {
        displayLabel = (labelVal / 1000).toFixed(1) + 'K';
      }

      svgHtml += `<line x1="0" y1="${y}" x2="${chartWidth}" y2="${y}" stroke="#e0e0e0" stroke-dasharray="4 4" />`;
      svgHtml += `<text x="-10" y="${y + 4}" text-anchor="end" font-size="12" fill="#666">${displayLabel}</text>`;
    });

    // Draw Bars
    chartData.forEach((d, i) => {
      const groupX = i * barWidth + (barWidth * groupPadding) / 2;

      d.series.forEach((sData, s) => {
        const barX = groupX + s * barSlotWidth + (barSlotWidth * barPadding) / 2;
        const barHeight = (sData.value / maxVal) * chartHeight;
        const y = chartHeight - barHeight;

        // If single series, color by group index, otherwise color by series index
        const color = numSeries === 1 ? colors[i % colors.length] : colors[s % colors.length];
        const hasMeasDrill = sData.links && sData.links.length > 0;

        // Draw Bar
        svgHtml += `
          <rect
            class="drillable-bar"
            x="${barX}"
            y="${y}"
            width="${singleBarWidth}"
            height="${barHeight}"
            fill="${color}"
            rx="3"
            style="cursor: ${hasMeasDrill ? 'pointer' : 'default'}"
            data-type="meas"
            data-group="${i}"
            data-series="${s}"
          />
        `;

        // Value Label
        if (showLabels && barHeight > 15) {
          let displayVal = sData.rendered || String(sData.value);
          displayVal = displayVal.replace(/<[^>]*>/g, ''); // strip HTML tags
          
          svgHtml += `
            <text
              x="${barX + singleBarWidth / 2}"
              y="${y - 8}"
              text-anchor="middle"
              font-size="9"
              font-weight="bold"
              fill="#333"
            >
              ${displayVal}
            </text>
          `;
        }
      });

      // X Axis Label (One per group, under the group)
      const hasDimDrill = d.dimLinks && d.dimLinks.length > 0;
      // Truncate label if it's too long
      let displayLabel = d.label;
      if (displayLabel.length > 15) {
        displayLabel = displayLabel.substring(0, 12) + '...';
      }

      svgHtml += `
        <text
          class="drillable-label"
          x="${groupX + groupWidth / 2}"
          y="${chartHeight + 20}"
          text-anchor="middle"
          font-size="10"
          fill="#555"
          transform="rotate(-15, ${groupX + groupWidth / 2}, ${chartHeight + 20})"
          style="cursor: ${hasDimDrill ? 'pointer' : 'default'}; font-weight: ${hasDimDrill ? 'bold' : 'normal'}"
          data-type="dim"
          data-group="${i}"
        >
          ${displayLabel}
          <title>${d.label}</title> <!-- Simple SVG Tooltip -->
        </text>
      `;
    });

    svgHtml += `</g></svg>`;
    container.innerHTML = svgHtml;

    // Bind click events programmatically to avoid CSP inline script violations
    container.querySelectorAll('.drillable-bar, .drillable-label').forEach(el => {
      el.addEventListener('click', (event) => {
        const type = el.getAttribute('data-type');
        const groupIdx = parseInt(el.getAttribute('data-group'), 10);
        
        let links;
        if (type === 'dim') {
          links = chartData[groupIdx].dimLinks;
        } else {
          const seriesIdx = parseInt(el.getAttribute('data-series'), 10);
          links = chartData[groupIdx].series[seriesIdx].links;
        }

        if (links && links.length > 0 && window.LookerCharts && LookerCharts.Utils.openDrillMenu) {
          LookerCharts.Utils.openDrillMenu({
            links: links,
            event: event
          });
        }
      });
    });

    if (this.currentDone) {
      this.currentDone();
      this.currentDone = null;
    }
  }
});
