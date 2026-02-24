// Amazon SSD Station Simulator - Configuration Manager

class ConfigManager {
    constructor() {
        this.currentConfig = null;
        this.templates = new Map();
        this.scenarios = {
            normal: {
                name: 'Normal Operations',
                packageVolume: 500,
                numSectors: 15,
                staffCount: 25,
                sortCycleTime: 45
            },
            peak: {
                name: 'Peak Volume',
                packageVolume: 1200,
                numSectors: 25,
                staffCount: 40,
                sortCycleTime: 35
            },
            low: {
                name: 'Low Volume',
                packageVolume: 200,
                numSectors: 10,
                staffCount: 15,
                sortCycleTime: 60
            },
            custom: {
                name: 'Custom Scenario',
                packageVolume: 500,
                numSectors: 15,
                staffCount: 25,
                sortCycleTime: 45
            }
        };
        
        this.defaultTemplate = {
            name: 'Default SSD Station',
            description: 'Standard sub same day delivery station layout',
            config: {
                packageVolume: 500,
                numSectors: 15,
                staffCount: 25,
                sortCycleTime: 45,
                stationSize: 15000,
                loadingDocks: 8,
                sortPositions: 12
            },
            layout: {
                zones: [
                    { id: 'inbound', type: 'inbound', x: 50, y: 50, width: 200, height: 150, capacity: 100, current: 0 },
                    { id: 'sort1', type: 'sort', x: 300, y: 50, width: 150, height: 100, capacity: 80, current: 0 },
                    { id: 'sort2', type: 'sort', x: 300, y: 180, width: 150, height: 100, capacity: 80, current: 0 },
                    { id: 'staging1', type: 'staging', x: 500, y: 50, width: 180, height: 120, capacity: 60, current: 0 },
                    { id: 'staging2', type: 'staging', x: 500, y: 200, width: 180, height: 120, capacity: 60, current: 0 },
                    { id: 'staging3', type: 'staging', x: 500, y: 350, width: 180, height: 120, capacity: 60, current: 0 },
                    { id: 'loading1', type: 'loading', x: 720, y: 80, width: 200, height: 100, capacity: 40, current: 0 },
                    { id: 'loading2', type: 'loading', x: 720, y: 220, width: 200, height: 100, capacity: 40, current: 0 },
                    { id: 'loading3', type: 'loading', x: 720, y: 360, width: 200, height: 100, capacity: 40, current: 0 },
                    { id: 'office', type: 'office', x: 50, y: 250, width: 120, height: 200, capacity: 20, current: 0 }
                ],
                conveyors: [
                    { from: 'inbound', to: 'sort1', points: [{x: 250, y: 100}, {x: 300, y: 100}] },
                    { from: 'inbound', to: 'sort2', points: [{x: 250, y: 130}, {x: 300, y: 230}] },
                    { from: 'sort1', to: 'staging1', points: [{x: 450, y: 100}, {x: 500, y: 110}] },
                    { from: 'sort2', to: 'staging2', points: [{x: 450, y: 230}, {x: 500, y: 260}] },
                    { from: 'staging1', to: 'loading1', points: [{x: 680, y: 110}, {x: 720, y: 130}] },
                    { from: 'staging2', to: 'loading2', points: [{x: 680, y: 260}, {x: 720, y: 270}] },
                    { from: 'staging3', to: 'loading3', points: [{x: 680, y: 410}, {x: 720, y: 410}] }
                ]
            }
        };
        
        this.isModalOpen = false;
    }
    
    static init() {
        window.configManager = new ConfigManager();
        window.configManager.setupEventListeners();
        window.configManager.loadSavedTemplates();
        window.configManager.setupDefaultTemplate();
    }
    
    setupEventListeners() {
        // Modal controls
        document.addEventListener('click', (e) => {
            // Modal trigger buttons
            if (e.target.id === 'loadTemplate') {
                this.showConfigModal();
            } else if (e.target.id === 'saveTemplate') {
                this.showSaveTemplateDialog();
            } else if (e.target.id === 'exportLayout') {
                this.exportCurrentLayout();
            }
            
            // Modal close buttons
            if (e.target.classList.contains('modal-close') || e.target.id === 'cancelConfig') {
                this.hideConfigModal();
            }
            
            // Apply configuration
            if (e.target.id === 'applyConfig') {
                this.applyConfiguration();
            }
            
            // Tab switching
            if (e.target.classList.contains('tab-btn')) {
                this.switchTab(e.target.dataset.tab);
            }
            
            // Scenario selection
            if (e.target.classList.contains('scenario-btn')) {
                this.selectScenario(e.target.dataset.scenario);
            }
        });
        
        // Close modal on outside click
        document.getElementById('configModal').addEventListener('click', (e) => {
            if (e.target.id === 'configModal') {
                this.hideConfigModal();
            }
        });
        
        // Mode switching
        document.getElementById('simulationMode').addEventListener('click', () => {
            this.switchToSimulationMode();
        });
        
        document.getElementById('editorMode').addEventListener('click', () => {
            this.switchToEditorMode();
        });
    }
    
    setupDefaultTemplate() {
        this.templates.set('default', this.defaultTemplate);
        this.currentConfig = JSON.parse(JSON.stringify(this.defaultTemplate));
    }
    
    loadSavedTemplates() {
        try {
            const savedTemplates = localStorage.getItem('ssdStationTemplates');
            if (savedTemplates) {
                const templates = JSON.parse(savedTemplates);
                Object.entries(templates).forEach(([key, template]) => {
                    this.templates.set(key, template);
                });
                console.log(`Loaded ${Object.keys(templates).length} saved templates`);
            }
        } catch (error) {
            console.warn('Could not load saved templates:', error);
        }
    }
    
    saveTemplatesToStorage() {
        try {
            const templatesObj = {};
            this.templates.forEach((template, key) => {
                if (key !== 'default') { // Don't save the default template
                    templatesObj[key] = template;
                }
            });
            localStorage.setItem('ssdStationTemplates', JSON.stringify(templatesObj));
            console.log('Templates saved to localStorage');
        } catch (error) {
            console.error('Could not save templates:', error);
        }
    }
    
    showConfigModal() {
        this.isModalOpen = true;
        const modal = document.getElementById('configModal');
        modal.style.display = 'flex';
        
        // Populate current configuration
        this.populateConfigForm();
        
        // Show simulation tab by default
        this.switchTab('operational');
    }
    
    hideConfigModal() {
        this.isModalOpen = false;
        document.getElementById('configModal').style.display = 'none';
    }
    
    populateConfigForm() {
        const config = window.simulator ? window.simulator.config : this.defaultTemplate.config;
        
        // Operational tab
        document.getElementById('packageVolume').value = config.packageVolume;
        document.getElementById('numSectors').value = config.numSectors;
        document.getElementById('staffCount').value = config.staffCount;
        document.getElementById('sortCycleTime').value = config.sortCycleTime;
        
        // Layout tab
        document.getElementById('stationSize').value = config.stationSize;
        document.getElementById('loadingDocks').value = config.loadingDocks;
        document.getElementById('sortPositions').value = config.sortPositions;
    }
    
    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab and activate button
        document.getElementById(tabName + 'Tab').style.display = 'block';
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }
    
    selectScenario(scenarioName) {
        // Update active scenario button
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-scenario="${scenarioName}"]`).classList.add('active');
        
        // Apply scenario configuration
        const scenario = this.scenarios[scenarioName];
        if (scenario) {
            document.getElementById('packageVolume').value = scenario.packageVolume;
            document.getElementById('numSectors').value = scenario.numSectors;
            document.getElementById('staffCount').value = scenario.staffCount;
            document.getElementById('sortCycleTime').value = scenario.sortCycleTime;
        }
    }
    
    applyConfiguration() {
        const newConfig = {
            packageVolume: parseInt(document.getElementById('packageVolume').value),
            numSectors: parseInt(document.getElementById('numSectors').value),
            staffCount: parseInt(document.getElementById('staffCount').value),
            sortCycleTime: parseInt(document.getElementById('sortCycleTime').value),
            stationSize: parseInt(document.getElementById('stationSize').value),
            loadingDocks: parseInt(document.getElementById('loadingDocks').value),
            sortPositions: parseInt(document.getElementById('sortPositions').value)
        };
        
        // Validate configuration
        if (this.validateConfiguration(newConfig)) {
            // Apply to simulator
            if (window.simulator) {
                window.simulator.updateConfig(newConfig);
            }
            
            // Update current config
            this.currentConfig.config = newConfig;
            
            this.hideConfigModal();
            this.showNotification('Configuration updated successfully!', 'success');
        } else {
            this.showNotification('Invalid configuration values. Please check your inputs.', 'error');
        }
    }
    
    validateConfiguration(config) {
        return (
            config.packageVolume >= 100 && config.packageVolume <= 2000 &&
            config.numSectors >= 5 && config.numSectors <= 50 &&
            config.staffCount >= 10 && config.staffCount <= 100 &&
            config.sortCycleTime >= 20 && config.sortCycleTime <= 180 &&
            config.stationSize >= 5000 && config.stationSize <= 50000 &&
            config.loadingDocks >= 2 && config.loadingDocks <= 20 &&
            config.sortPositions >= 4 && config.sortPositions <= 30
        );
    }
    
    showSaveTemplateDialog() {
        const templateName = prompt('Enter a name for this template:');
        if (templateName && templateName.trim()) {
            this.saveCurrentAsTemplate(templateName.trim());
        }
    }
    
    saveCurrentAsTemplate(name) {
        const template = {
            name: name,
            description: `Custom template created ${new Date().toLocaleDateString()}`,
            config: window.simulator ? window.simulator.config : this.defaultTemplate.config,
            layout: window.simulator ? window.simulator.stationLayout : this.defaultTemplate.layout,
            createdAt: Date.now()
        };
        
        this.templates.set(name.toLowerCase().replace(/\s+/g, '_'), template);
        this.saveTemplatesToStorage();
        this.showNotification(`Template "${name}" saved successfully!`, 'success');
    }
    
    loadTemplate(templateKey) {
        const template = this.templates.get(templateKey);
        if (template) {
            const templateConfig = JSON.parse(JSON.stringify(template.config || {}));
            if (typeof templateConfig.numSectors !== 'number' && typeof templateConfig.numRoutes === 'number') {
                templateConfig.numSectors = templateConfig.numRoutes;
                delete templateConfig.numRoutes;
            }
            
            // Apply template configuration
            if (window.simulator) {
                window.simulator.updateConfig(templateConfig);
                window.simulator.stationLayout = JSON.parse(JSON.stringify(template.layout));
                window.simulator.resetSimulation();
                window.simulator.render();
            }
            
            this.currentConfig = JSON.parse(JSON.stringify(template));
            this.currentConfig.config = templateConfig;
            this.showNotification(`Template "${template.name}" loaded successfully!`, 'success');
        }
    }
    
    exportCurrentLayout() {
        const exportData = {
            name: 'SSD Station Export',
            version: '1.0',
            exportDate: new Date().toISOString(),
            config: window.simulator ? window.simulator.config : this.defaultTemplate.config,
            layout: window.simulator ? window.simulator.stationLayout : this.defaultTemplate.layout,
            metrics: window.simulator ? window.simulator.metrics : null
        };
        
        this.downloadJSON(exportData, `ssd-station-export-${Date.now()}.json`);
    }
    
    importLayout(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Normalize legacy configs (numRoutes -> numSectors)
                    if (data?.config && typeof data.config.numSectors !== 'number' && typeof data.config.numRoutes === 'number') {
                        data.config.numSectors = data.config.numRoutes;
                        delete data.config.numRoutes;
                    }
                    
                    // Validate imported data
                    if (this.validateImportedData(data)) {
                        // Apply imported configuration
                        if (window.simulator) {
                            window.simulator.updateConfig(data.config);
                            if (data.layout) {
                                window.simulator.stationLayout = data.layout;
                            }
                            window.simulator.resetSimulation();
                            window.simulator.render();
                        }
                        
                        this.showNotification('Layout imported successfully!', 'success');
                        resolve(data);
                    } else {
                        reject(new Error('Invalid layout file format'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }
    
    validateImportedData(data) {
        return data && 
               data.config && 
               typeof data.config.packageVolume === 'number' &&
               typeof data.config.numSectors === 'number' &&
               Array.isArray(data.layout?.zones);
    }
    
    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification(`Configuration exported as ${filename}`, 'success');
    }
    
    switchToSimulationMode() {
        document.getElementById('simulationView').style.display = 'flex';
        document.getElementById('editorView').style.display = 'none';
        
        document.getElementById('simulationMode').classList.add('active');
        document.getElementById('editorMode').classList.remove('active');
        
        // Ensure simulator is properly rendered
        if (window.simulator) {
            setTimeout(() => {
                window.simulator.setupCanvas();
                window.simulator.render();
            }, 100);
        }
    }
    
    switchToEditorMode() {
        document.getElementById('simulationView').style.display = 'none';
        document.getElementById('editorView').style.display = 'flex';
        
        document.getElementById('simulationMode').classList.remove('active');
        document.getElementById('editorMode').classList.add('active');
        
        // Initialize layout editor if not already done
        if (window.layoutEditor) {
            setTimeout(() => {
                window.layoutEditor.setupCanvas();
                window.layoutEditor.render();
            }, 100);
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #fff;
                border-left: 4px solid #3498db;
                padding: 16px 20px;
                border-radius: 4px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 3000;
                max-width: 300px;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
                font-family: 'Segoe UI', sans-serif;
                font-size: 14px;
            `;
            document.body.appendChild(notification);
        }
        
        // Set color based on type
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        
        notification.style.borderColor = colors[type] || colors.info;
        notification.textContent = message;
        
        // Show notification
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
        }, 3000);
    }
    
    getAvailableTemplates() {
        const templates = [];
        this.templates.forEach((template, key) => {
            templates.push({
                key: key,
                name: template.name,
                description: template.description,
                createdAt: template.createdAt
            });
        });
        return templates.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    
    deleteTemplate(templateKey) {
        if (templateKey !== 'default' && this.templates.has(templateKey)) {
            this.templates.delete(templateKey);
            this.saveTemplatesToStorage();
            this.showNotification('Template deleted successfully!', 'success');
            return true;
        }
        return false;
    }
    
    resetToDefault() {
        this.loadTemplate('default');
    }
    
    getCurrentConfiguration() {
        return {
            config: window.simulator ? window.simulator.config : this.defaultTemplate.config,
            layout: window.simulator ? window.simulator.stationLayout : this.defaultTemplate.layout
        };
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ConfigManager.init());
} else {
    ConfigManager.init();
}
