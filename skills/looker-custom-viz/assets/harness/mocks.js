// harness/mocks.js
window.looker = {
  plugins: {
    visualizations: {
      add: function (viz) {
        console.log(`Registering visualization: ${viz.id}`);
        // Add required methods to the viz object itself as Looker does
        viz.clearErrors = function () {
          console.log('Errors cleared');
          const errorOverlay = document.getElementById('error-overlay');
          if (errorOverlay) {
            errorOverlay.style.display = 'none';
          }
        };
        viz.addError = function (e) {
          console.error('Error added:', e);
          const errorOverlay = document.getElementById('error-overlay');
          if (errorOverlay) {
            errorOverlay.textContent = `${e.title || 'Error'}: ${e.message || ''}`;
            errorOverlay.style.display = 'block';
            errorOverlay.style.backgroundColor = '#ea4335'; // Red banner
          }
        };
        viz.trigger = function (event, args) {
          console.log(`Viz Event: ${event}`, args);
          if (event === 'registerOptions') {
            viz.options = args;
            if (window.refreshSettingsPanel) {
              window.refreshSettingsPanel(viz);
            }
          }
        };
        this[viz.id] = viz;
        // Make it available as currentViz for legacy harness support if needed
        window.currentViz = viz;
      },
    },
  },
  // Simplified trigger for events
  trigger: function (event, args) {
    console.log(`Looker Event: ${event}`, args);
  }
};

// Mock the LookerCharts utility library
window.LookerCharts = {
  Utils: {
    htmlForCell: (cell) => {
      if (!cell) return "";
      return cell.html || cell.rendered || (cell.value !== null && cell.value !== undefined ? String(cell.value) : "");
    },
    textForCell: (cell) => {
      if (!cell) return "";
      return cell.rendered || (cell.value !== null && cell.value !== undefined ? String(cell.value) : "");
    },
    openDrillMenu: (options) => {
      console.log("Mock Drill Menu Opened with options:", options);
      
      // Remove any existing menus
      const existingMenu = document.getElementById('looker-mock-drill-menu');
      if (existingMenu) {
        existingMenu.remove();
      }

      if (!options.links || options.links.length === 0) {
        return;
      }

      const event = options.event;
      if (!event) {
        console.error("openDrillMenu requires a native event for positioning");
        alert("Developer Error: openDrillMenu was called without passing the 'event' object. This will fail in Looker.");
        return;
      }

      // Create menu container
      const menu = document.createElement('div');
      menu.id = 'looker-mock-drill-menu';
      menu.style.position = 'fixed';
      menu.style.left = `${event.clientX + 5}px`;
      menu.style.top = `${event.clientY + 5}px`;
      menu.style.backgroundColor = '#ffffff';
      menu.style.border = '1px solid #ccd1d5';
      menu.style.borderRadius = '4px';
      menu.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      menu.style.padding = '8px 0';
      menu.style.zIndex = '10000';
      menu.style.minWidth = '180px';
      menu.style.fontFamily = 'sans-serif';
      menu.style.fontSize = '13px';

      // Header
      const header = document.createElement('div');
      header.innerText = 'Drills';
      header.style.padding = '4px 12px';
      header.style.fontWeight = 'bold';
      header.style.color = '#707070';
      header.style.borderBottom = '1px solid #e0e0e0';
      header.style.marginBottom = '4px';
      menu.appendChild(header);

      // Links
      options.links.forEach(link => {
        const item = document.createElement('a');
        item.href = link.url;
        item.target = '_blank';
        item.innerText = link.label;
        item.style.display = 'block';
        item.style.padding = '6px 12px';
        item.style.color = '#1a73e8';
        item.style.textDecoration = 'none';
        
        item.addEventListener('mouseenter', () => {
          item.style.backgroundColor = '#f1f3f4';
        });
        item.addEventListener('mouseleave', () => {
          item.style.backgroundColor = 'transparent';
        });
        item.addEventListener('click', () => {
          console.log(`Mock Drill Link Clicked: ${link.label} -> ${link.url}`);
          menu.remove();
        });
        
        menu.appendChild(item);
      });

      document.body.appendChild(menu);

      // Dismiss on click outside
      const dismissHandler = (e) => {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', dismissHandler);
        }
      };
      
      setTimeout(() => {
        document.addEventListener('click', dismissHandler);
      }, 50);
    }
  },
};