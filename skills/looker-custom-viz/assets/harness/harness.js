// Tab switching (Left Panel)
document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        document.getElementById(t.dataset.target).classList.add('active');
    });
});

// Tab switching (Preview Panel)
const visContainer = document.getElementById('vis-container');
const tableContainer = document.getElementById('table-container');
document.querySelectorAll('.preview-tab').forEach(t => {
    t.addEventListener('click', () => {
        document.querySelectorAll('.preview-tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        if (t.dataset.target === 'vis-container') {
            visContainer.style.display = 'block';
            tableContainer.style.display = 'none';
        } else {
            visContainer.style.display = 'none';
            tableContainer.style.display = 'block';
        }
        window.dispatchEvent(new Event('resize'));
    });
});

let currentSettingsRendered = false;
const dataArea = document.getElementById('data-area');
const queryArea = document.getElementById('query-area');
const errorOverlay = document.getElementById('error-overlay');
const scenariosBar = document.getElementById('scenarios-bar');
const importBtn = document.getElementById('import-btn');

// Populate Scenario Pills instead of dropdown
let defaultKey = 'category_value';
if (window.scenarios) {
    // Find default key
    if (!window.scenarios[defaultKey] && Object.keys(window.scenarios).length > 0) {
        defaultKey = Object.keys(window.scenarios)[0];
    }

    // Insert pills
    Object.keys(window.scenarios).forEach(key => {
        const pill = document.createElement('button');
        pill.className = 'scenario-pill';
        if (key === defaultKey) pill.classList.add('active');
        
        // Map camel/snake keys to readable labels
        const label = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        pill.textContent = label;
        pill.dataset.key = key;

        // Insert before the Import button
        scenariosBar.insertBefore(pill, importBtn);

        pill.addEventListener('click', () => {
            document.querySelectorAll('.scenario-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            loadScenario(key);
        });
    });
}

function loadScenario(key) {
    const selected = window.scenarios[key];
    if (selected) {
        window.currentConfig = selected.config || {};
        dataArea.value = JSON.stringify(selected.data || [], null, 2);
        queryArea.value = JSON.stringify(selected.queryResponse || {}, null, 2);
        currentSettingsRendered = false;
        run();
    }
}

// Modal elements
const importModal = document.getElementById('import-modal');
const tabImportUrl = document.getElementById('tab-import-url');
const tabImportJson = document.getElementById('tab-import-json');
const contentUrl = document.getElementById('modal-content-url');
const contentJson = document.getElementById('modal-content-json');
const inputUrl = document.getElementById('import-input-url');
const inputJson = document.getElementById('import-input-json');
const saveScenarioCheckbox = document.getElementById('save-as-scenario');
const scenarioKeyContainer = document.getElementById('scenario-key-container');
const scenarioKeyInput = document.getElementById('import-scenario-key');
const cancelBtn = document.getElementById('modal-cancel-btn');
const submitBtn = document.getElementById('modal-submit-btn');
const submitText = document.getElementById('submit-btn-text');
const submitSpinner = document.getElementById('submit-spinner');

let activeTab = 'url'; // 'url' or 'json'

// Show modal
importBtn.addEventListener('click', () => {
    importModal.style.display = 'flex';
    inputUrl.value = '';
    inputJson.value = '';
    scenarioKeyInput.value = '';
    saveScenarioCheckbox.checked = false;
    scenarioKeyContainer.style.display = 'none';
    activeTab = 'url';
    switchTab('url');
});

// Hide modal
cancelBtn.addEventListener('click', () => {
    importModal.style.display = 'none';
});

// Tab switches
tabImportUrl.addEventListener('click', () => switchTab('url'));
tabImportJson.addEventListener('click', () => switchTab('json'));

function switchTab(tab) {
    activeTab = tab;
    if (tab === 'url') {
        tabImportUrl.style.color = '#1a73e8';
        tabImportUrl.style.borderBottom = '2px solid #1a73e8';
        tabImportJson.style.color = '#5f6368';
        tabImportJson.style.borderBottom = '2px solid transparent';
        contentUrl.style.display = 'flex';
        contentJson.style.display = 'none';
    } else {
        tabImportJson.style.color = '#1a73e8';
        tabImportJson.style.borderBottom = '2px solid #1a73e8';
        tabImportUrl.style.color = '#5f6368';
        tabImportUrl.style.borderBottom = '2px solid transparent';
        contentJson.style.display = 'flex';
        contentUrl.style.display = 'none';
    }
}

saveScenarioCheckbox.addEventListener('change', () => {
    scenarioKeyContainer.style.display = saveScenarioCheckbox.checked ? 'flex' : 'none';
});

// Submit Import
submitBtn.addEventListener('click', async () => {
    if (activeTab === 'json') {
        const rawJson = inputJson.value.trim();
        if (!rawJson) return;
        try {
            const parsed = JSON.parse(rawJson);
            loadImportedData(parsed);
            importModal.style.display = 'none';
        } catch (e) {
            alert("Error parsing JSON: " + e.message);
        }
    } else {
        const rawUrl = inputUrl.value.trim();
        if (!rawUrl) return;
        
        // Parse slug or ID
        let identifier = rawUrl;
        let idType = 'slug';
        
        // Regex checks
        const qidMatch = rawUrl.match(/[\?&]qid=([a-zA-Z0-9_-]+)/) || rawUrl.match(/#qid=([a-zA-Z0-9_-]+)/);
        const queryIdMatch = rawUrl.match(/\/queries\/([0-9]+)/);
        const exploreMatch = rawUrl.match(/\/explore\/([^\/\?]+)/) || rawUrl.match(/\/queries\/slug\/([^\/\?]+)/);
        
        if (qidMatch) {
            identifier = qidMatch[1];
            idType = 'slug';
        } else if (queryIdMatch) {
            identifier = queryIdMatch[1];
            idType = 'id';
        } else if (exploreMatch) {
            identifier = exploreMatch[1];
            idType = 'slug';
        } else if (/^[0-9]+$/.test(rawUrl)) {
            identifier = rawUrl;
            idType = 'id';
        } else if (/^[a-zA-Z0-9_-]+$/.test(rawUrl)) {
            identifier = rawUrl;
            idType = 'slug';
        }
        
        // Trigger fetch from local server
        submitBtn.disabled = true;
        submitSpinner.style.display = 'block';
        submitText.textContent = 'Fetching...';
        
        try {
            const res = await fetch(`/api/fetch-explore?identifier=${identifier}&type=${idType}`);
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || `HTTP error ${res.status}`);
            }
            
            const scenario = await res.json();
            
            // Populate editor
            window.currentConfig = scenario.config || {};
            dataArea.value = JSON.stringify(scenario.data || [], null, 2);
            queryArea.value = JSON.stringify(scenario.queryResponse || {}, null, 2);
            
            document.querySelectorAll('.scenario-pill').forEach(p => p.classList.remove('active'));
            currentSettingsRendered = false;
            run();
            
            // Save if checked
            if (saveScenarioCheckbox.checked) {
                const key = scenarioKeyInput.value.trim() || identifier;
                const saveRes = await fetch('/api/save-scenario', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key, scenario })
                });
                
                if (!saveRes.ok) {
                    const saveErr = await saveRes.json();
                    throw new Error("Failed to save: " + (saveErr.error || saveRes.statusText));
                }
                
                // Dynamically add a new pill to the scenarios bar
                const pill = document.createElement('button');
                pill.className = 'scenario-pill active';
                const label = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                pill.textContent = label;
                pill.dataset.key = key;
                
                // Bind click
                pill.addEventListener('click', () => {
                    document.querySelectorAll('.scenario-pill').forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    // We need to inject it locally into the window.scenarios object
                    if (!window.scenarios) window.scenarios = {};
                    window.scenarios[key] = scenario;
                    loadScenario(key);
                });
                
                scenariosBar.insertBefore(pill, importBtn);
            }
            
            importModal.style.display = 'none';
        } catch (e) {
            alert("Import Failed: " + e.message);
        } finally {
            submitBtn.disabled = false;
            submitSpinner.style.display = 'none';
            submitText.textContent = 'Import';
        }
    }
});

function loadImportedData(parsed) {
    let data = [];
    let queryResponse = {};
    
    if (parsed.data && parsed.data.data && parsed.data.fields) {
        data = parsed.data.data;
        queryResponse = { fields: parsed.data.fields, pivots: parsed.data.pivots || [] };
    } else if (parsed.data && parsed.fields) {
        data = parsed.data;
        queryResponse = { fields: parsed.fields, pivots: parsed.pivots || [] };
    } else {
        throw new Error("Could not detect standard Looker query data structure.");
    }

    window.currentConfig = {};
    dataArea.value = JSON.stringify(data, null, 2);
    queryArea.value = JSON.stringify(queryResponse, null, 2);
    
    document.querySelectorAll('.scenario-pill').forEach(p => p.classList.remove('active'));
    currentSettingsRendered = false;
    run();
}

// Initialize state
window.currentConfig = {};
const initialScenario = (window.scenarios && window.scenarios[defaultKey]) || {};
window.currentConfig = initialScenario.config || {};
dataArea.value = JSON.stringify(initialScenario.data || [], null, 2);
queryArea.value = JSON.stringify(initialScenario.queryResponse || {}, null, 2);

function showError(msg) {
    errorOverlay.textContent = msg;
    errorOverlay.style.display = 'block';
    setTimeout(() => errorOverlay.style.display = 'none', 5000);
}

function run() {
    try {
        const data = JSON.parse(dataArea.value);
        const queryResponse = JSON.parse(queryArea.value);
        const config = window.currentConfig;

        const vizIds = Object.keys(looker.plugins.visualizations);
        if (vizIds.length === 0) {
            throw new Error("No visualizations registered.");
        }
        let vizId = vizIds.find(id => id === 'custom_pivot' || id === 'kpi_canvas' || id === 'demo_svg_bar_chart' || id === 'custom_pie_chart') || vizIds[vizIds.length - 1];
        const viz = looker.plugins.visualizations[vizId];

        if (window._currentActiveVizId !== vizId || visContainer.innerHTML.trim() === '' || !viz._hasCreatedInHarness) {
            visContainer.innerHTML = '';
            console.log("Creating viz:", vizId);
            viz.create(visContainer, config, {
                looker: window.looker
            }, {
                escape: x => x
            });
            viz._hasCreatedInHarness = true;
            window._currentActiveVizId = vizId;
        }

        viz.updateAsync(data, visContainer, config, queryResponse, {
            crossfilterEnabled: false
        }, () => {
            console.log("Render finished");
        });

        renderLookerTable(data, queryResponse, tableContainer);

    } catch (e) {
        console.error(e);
        showError(e.message);
    }
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Auto-run on inputs
dataArea.addEventListener('input', debounce(run, 500));
queryArea.addEventListener('input', debounce(run, 500));

// Auto-run on load
window.addEventListener('load', () => {
    setTimeout(run, 100);
});

// Re-render on window resize
window.addEventListener('resize', debounce(run, 150));

// ⚙️ Dynamic Settings Panel Generation inside Options Preview Tab

function getHarnessPalettes() {
    const defaultPalettes = [
        {
            label: "Shoreline (Default)",
            colors: ['#1A73E8', '#12B5CB', '#E52592', '#E8710A', '#F9AB00', '#7CB342', '#9334E6', '#80868B']
        },
        {
            label: "Classic Looker",
            colors: ['#3eb0d5', '#b1399f', '#c2dd67', '#607d8b', '#e17f24', '#4285f4', '#f1ca3a', '#e52592']
        }
    ];

    let palettes = [];
    if (window.lookerColorCollections) {
        const categorical = window.lookerColorCollections.categoricalPalettes || [];
        categorical.forEach(p => {
            palettes.push({ label: p.label, colors: p.colors });
        });
    }
    return palettes.length > 0 ? palettes : defaultPalettes;
}

function renderSettings(viz) {
    if (currentSettingsRendered) return;
    const container = document.getElementById('settings-content');
    container.innerHTML = '';

    const options = viz.options || {};
    if (Object.keys(options).length === 0) {
        container.innerHTML = '<div style="color: #666; font-size: 13px; padding: 10px 0;">No configurable options for this visualization.</div>';
        currentSettingsRendered = true;
        return;
    }

    const sections = {};
    Object.keys(options).forEach(key => {
        const opt = options[key];
        const sec = opt.section || 'General';
        if (!sections[sec]) sections[sec] = [];
        sections[sec].push({ key, ...opt });
    });

    Object.keys(sections).forEach(secName => {
        const group = document.createElement('div');
        group.className = 'settings-group';
        
        const title = document.createElement('div');
        title.className = 'settings-group-title';
        title.textContent = secName;
        group.appendChild(title);

        sections[secName].forEach(opt => {
            const control = document.createElement('div');
            control.className = 'settings-control';

            const currentVal = window.currentConfig[opt.key] !== undefined ? window.currentConfig[opt.key] : opt.default;

            if (opt.type === 'boolean') {
                control.classList.add('checkbox-control');
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.id = `opt-${opt.key}`;
                input.checked = !!currentVal;
                
                const lbl = document.createElement('label');
                lbl.htmlFor = input.id;
                lbl.textContent = opt.label || opt.key;
                
                control.appendChild(input);
                control.appendChild(lbl);

                input.addEventListener('change', (e) => {
                    window.currentConfig[opt.key] = e.target.checked;
                    run();
                });

            } else if (opt.type === 'array' && opt.display === 'colors') {
                const lbl = document.createElement('label');
                lbl.textContent = opt.label || opt.key;
                
                const select = document.createElement('select');
                select.id = `opt-${opt.key}`;
                
                const previewContainer = document.createElement('div');
                previewContainer.style.display = 'flex';
                previewContainer.style.gap = '4px';
                previewContainer.style.marginTop = '6px';
                
                const palettes = getHarnessPalettes();

                palettes.forEach((p, pIdx) => {
                    const option = document.createElement('option');
                    option.value = pIdx;
                    option.textContent = p.label;
                    select.appendChild(option);
                });

                let selectedIdx = 0;
                if (Array.isArray(currentVal)) {
                    const matchIdx = palettes.findIndex(p => JSON.stringify(p.colors) === JSON.stringify(currentVal));
                    if (matchIdx !== -1) selectedIdx = matchIdx;
                }

                select.value = selectedIdx;

                const updatePreview = (idx) => {
                    previewContainer.innerHTML = '';
                    const colors = palettes[idx].colors;
                    colors.forEach(color => {
                        const circle = document.createElement('div');
                        circle.style.width = '14px';
                        circle.style.height = '14px';
                        circle.style.borderRadius = '50%';
                        circle.style.backgroundColor = color;
                        circle.style.border = '1px solid #dadce0';
                        previewContainer.appendChild(circle);
                    });
                };

                updatePreview(selectedIdx);

                control.appendChild(lbl);
                control.appendChild(select);
                control.appendChild(previewContainer);

                select.addEventListener('change', (e) => {
                    const idx = parseInt(e.target.value, 10);
                    window.currentConfig[opt.key] = palettes[idx].colors;
                    updatePreview(idx);
                    run();
                });

            } else if (opt.type === 'string' && opt.display === 'select') {
                const lbl = document.createElement('label');
                lbl.textContent = opt.label || opt.key;
                
                const select = document.createElement('select');
                select.id = `opt-${opt.key}`;
                
                opt.values.forEach(valObj => {
                    const label = Object.keys(valObj)[0];
                    const val = valObj[label];
                    const option = document.createElement('option');
                    option.value = val;
                    option.textContent = label;
                    if (val === currentVal) option.selected = true;
                    select.appendChild(option);
                });

                control.appendChild(lbl);
                control.appendChild(select);

                select.addEventListener('change', (e) => {
                    window.currentConfig[opt.key] = e.target.value;
                    run();
                });

            } else {
                const lbl = document.createElement('label');
                lbl.textContent = opt.label || opt.key;
                
                const input = document.createElement('input');
                input.type = 'text';
                input.id = `opt-${opt.key}`;
                input.value = currentVal || '';
                
                control.appendChild(lbl);
                control.appendChild(input);

                input.addEventListener('change', (e) => {
                    window.currentConfig[opt.key] = e.target.value;
                    run();
                });
            }

            group.appendChild(control);
        });

        container.appendChild(group);
    });

    currentSettingsRendered = true;
}

const originalRun = run;
run = function () {
    try {
        const vizIds = Object.keys(looker.plugins.visualizations);
        if (vizIds.length > 0) {
            let vizId = vizIds.find(id => id === 'custom_pivot' || id === 'kpi_canvas' || id === 'demo_svg_bar_chart' || id === 'custom_pie_chart') || vizIds[vizIds.length - 1];
            const viz = looker.plugins.visualizations[vizId];
            renderSettings(viz);

            Object.keys(viz.options || {}).forEach(key => {
                const el = document.getElementById(`opt-${key}`);
                if (el) {
                    const val = window.currentConfig[key] !== undefined ? window.currentConfig[key] : (viz.options[key] && viz.options[key].default);
                    if (viz.options[key] && viz.options[key].type === 'array' && viz.options[key].display === 'colors') {
                        const palettes = getHarnessPalettes();
                        const matchIdx = palettes.findIndex(p => JSON.stringify(p.colors) === JSON.stringify(val));
                        el.value = matchIdx !== -1 ? matchIdx : 0;
                    } else if (el.type === 'checkbox') {
                        el.checked = !!val;
                    } else {
                        el.value = val || '';
                    }
                }
            });
        }
    } catch (e) { console.error("Settings sync error", e); }

    originalRun();
}

// Render Looker Table View Helper
function renderLookerTable(data, queryResponse, container) {
    container.innerHTML = '';
    
    const dimensions = queryResponse.fields.dimensions || [];
    const measures = queryResponse.fields.measures || [];
    const pivots = queryResponse.pivots || [];
    const isPivoted = pivots.length > 0;

    let html = '<table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; font-size: 13px; font-family: sans-serif; border: 1px solid #ccc; text-align: left; background: white; color: #333;">';
    
    if (isPivoted) {
        html += '<thead style="background: #f1f3f4; font-weight: bold; color: #202124;">';
        html += '<tr>';
        dimensions.forEach(dim => {
            html += `<th rowspan="2" style="border: 1px solid #ccc; padding: 8px;">${dim.label || dim.name}</th>`;
        });
        pivots.forEach(pivot => {
            html += `<th colspan="${measures.length}" style="border: 1px solid #ccc; padding: 8px; text-align: center; background: #e8eaed;">${pivot.label || pivot.key}</th>`;
        });
        html += '</tr>';
        
        html += '<tr>';
        pivots.forEach(pivot => {
            measures.forEach(meas => {
                html += `<th style="border: 1px solid #ccc; padding: 8px;">${meas.label || meas.name}</th>`;
            });
        });
        html += '</tr>';
        html += '</thead>';
    } else {
        html += '<thead style="background: #f1f3f4; font-weight: bold; color: #202124;"><tr>';
        dimensions.forEach(dim => {
            html += `<th style="border: 1px solid #ccc; padding: 8px;">${dim.label || dim.name}</th>`;
        });
        measures.forEach(meas => {
            html += `<th style="border: 1px solid #ccc; padding: 8px;">${meas.label || meas.name}</th>`;
        });
        html += '</tr></thead>';
    }

    html += '<tbody>';
    data.forEach((row, rowIndex) => {
        html += '<tr>';
        dimensions.forEach(dim => {
            const cell = row[dim.name];
            html += `<td style="border: 1px solid #ccc; padding: 8px;">${renderTableCell(cell, dim.name, rowIndex, data)}</td>`;
        });
        
        if (isPivoted) {
            pivots.forEach(pivot => {
                measures.forEach(meas => {
                    const pivotData = row[meas.name];
                    const cell = pivotData ? pivotData[pivot.key] : null;
                    html += `<td style="border: 1px solid #ccc; padding: 8px;">${renderTableCell(cell, meas.name, rowIndex, data, pivot.key)}</td>`;
                });
            });
        } else {
            measures.forEach(meas => {
                const cell = row[meas.name];
                html += `<td style="border: 1px solid #ccc; padding: 8px;">${renderTableCell(cell, meas.name, rowIndex, data)}</td>`;
            });
        }
        html += '</tr>';
    });
    html += '</tbody></table>';
    
    container.innerHTML = html;
}

function renderTableCell(cell, fieldName, rowIndex, data, pivotKey = null) {
    if (!cell) return '<span style="color: #999;">-</span>';
    
    const displayValue = (window.LookerCharts && LookerCharts.Utils)
        ? LookerCharts.Utils.htmlForCell(cell)
        : (cell.html || cell.rendered || String(cell.value || ''));
    
    if (cell.links && cell.links.length > 0) {
        if (!window.handleTableDrillClick) {
            window.handleTableDrillClick = function(event, fieldName, rowIndex, pivotKey) {
                event.preventDefault();
                const row = window.currentTableData[rowIndex];
                let cellData = row[fieldName];
                if (pivotKey) {
                    cellData = cellData[pivotKey];
                }
                
                if (window.LookerCharts && window.LookerCharts.Utils.openDrillMenu) {
                    LookerCharts.Utils.openDrillMenu({
                        links: cellData.links,
                        event: event
                    });
                }
            };
        }
        window.currentTableData = data;
        
        const pivotArg = pivotKey ? `, '${pivotKey}'` : '';
        return `<a href="#" onclick="handleTableDrillClick(event, '${fieldName}', ${rowIndex}${pivotArg})" style="color: #1a73e8; text-decoration: underline;">${displayValue}</a>`;
    }
    
    return displayValue;
}

// Setup Viz Script Input and Loader
const fileUrlParams = new URLSearchParams(window.location.search);
const defaultVizFile = fileUrlParams.get('file') || 'demo_viz.js';

const vizFileInput = document.getElementById('viz-file-input');
if (vizFileInput) {
    vizFileInput.value = defaultVizFile;
    
    document.getElementById('load-viz-btn').addEventListener('click', () => {
        const file = vizFileInput.value.trim() || 'demo_viz.js';
        const url = new URL(window.location.href);
        url.searchParams.set('file', file);
        window.location.href = url.toString();
    });
}

// Dynamically load the visualization script
console.log(`Dynamically loading viz script: ${defaultVizFile}`);
const script = document.createElement('script');
script.src = defaultVizFile;
script.onload = () => {
    console.log(`Successfully loaded viz script: ${defaultVizFile}`);
    setTimeout(run, 100);
};
script.onerror = () => {
    showError(`Failed to load viz script: ${defaultVizFile}`);
};
document.body.appendChild(script);

// Fetch instance Color Collections if available via CLI proxy
fetch('/api/color-collections')
    .then(res => {
        if (!res.ok) throw new Error("Status " + res.status);
        return res.json();
    })
    .then(data => {
        console.log("Successfully loaded Looker instance color collections:", data);
        window.lookerColorCollections = data;
        currentSettingsRendered = false;
        run();
    })
    .catch(err => {
        console.warn("Looker instance color collections unavailable, using static fallback palettes. Detail:", err.message);
    });
