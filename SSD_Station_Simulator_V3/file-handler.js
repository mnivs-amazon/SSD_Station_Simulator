// Amazon SSD Station Simulator - File Handler

class FileHandler {
    constructor() {
        this.supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        this.supportedDocTypes = ['application/pdf'];
        this.supportedDataTypes = ['application/json', 'text/csv', 'application/vnd.ms-excel'];
        
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.dragDropZone = null;
        this.isDragging = false;
    }
    
    static init() {
        window.fileHandler = new FileHandler();
        window.fileHandler.setupDragDrop();
        window.fileHandler.setupFileInputs();
    }
    
    setupDragDrop() {
        // Create drag drop zone overlay
        this.dragDropZone = document.createElement('div');
        this.dragDropZone.id = 'dragDropZone';
        this.dragDropZone.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(52, 152, 219, 0.1);
            border: 3px dashed #3498db;
            z-index: 10000;
            display: none;
            justify-content: center;
            align-items: center;
            font-size: 24px;
            color: #3498db;
            font-family: 'Segoe UI', sans-serif;
            pointer-events: none;
        `;
        this.dragDropZone.innerHTML = `
            <div style="text-align: center; pointer-events: none;">
                <div style="font-size: 48px; margin-bottom: 16px;">📁</div>
                <div>Drop files here to import</div>
                <div style="font-size: 14px; margin-top: 8px; opacity: 0.7;">
                    Supported: JSON, Images, CSV, PDF
                </div>
            </div>
        `;
        document.body.appendChild(this.dragDropZone);
        
        // Setup drag and drop events
        document.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        document.addEventListener('dragover', (e) => this.handleDragOver(e));
        document.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        document.addEventListener('drop', (e) => this.handleDrop(e));
    }
    
    setupFileInputs() {
        // Enhanced file input handling
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleFileSelection(e.target.files);
                e.target.value = ''; // Reset input for repeated selections
            });
        });
    }
    
    handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (!this.isDragging) {
            this.isDragging = true;
            this.dragDropZone.style.display = 'flex';
        }
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Check if we're leaving the window
        if (!e.relatedTarget || e.relatedTarget.nodeName === 'HTML') {
            this.isDragging = false;
            this.dragDropZone.style.display = 'none';
        }
    }
    
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        this.isDragging = false;
        this.dragDropZone.style.display = 'none';
        
        const files = Array.from(e.dataTransfer.files);
        this.handleFileSelection(files);
    }
    
    async handleFileSelection(files) {
        if (!files || files.length === 0) return;
        
        const validFiles = [];
        const errors = [];
        
        for (const file of files) {
            const validation = this.validateFile(file);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                errors.push(`${file.name}: ${validation.error}`);
            }
        }
        
        if (errors.length > 0) {
            this.showErrors(errors);
        }
        
        if (validFiles.length > 0) {
            await this.processFiles(validFiles);
        }
    }
    
    validateFile(file) {
        // Check file size
        if (file.size > this.maxFileSize) {
            return {
                valid: false,
                error: `File too large (${this.formatFileSize(file.size)}). Maximum size is ${this.formatFileSize(this.maxFileSize)}.`
            };
        }
        
        // Check file type
        const allSupportedTypes = [
            ...this.supportedImageTypes,
            ...this.supportedDocTypes,
            ...this.supportedDataTypes
        ];
        
        if (!allSupportedTypes.includes(file.type) && !this.isJSONFile(file)) {
            return {
                valid: false,
                error: `Unsupported file type (${file.type || 'unknown'})`
            };
        }
        
        return { valid: true };
    }
    
    isJSONFile(file) {
        return file.name.toLowerCase().endsWith('.json') || file.type === 'application/json';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    async processFiles(files) {
        const results = [];
        
        for (const file of files) {
            try {
                const result = await this.processFile(file);
                results.push({ file: file.name, result, success: true });
            } catch (error) {
                results.push({ file: file.name, error: error.message, success: false });
            }
        }
        
        this.showProcessingResults(results);
    }
    
    async processFile(file) {
        if (this.supportedImageTypes.includes(file.type)) {
            return await this.processImageFile(file);
        } else if (this.supportedDocTypes.includes(file.type)) {
            return await this.processDocumentFile(file);
        } else if (this.supportedDataTypes.includes(file.type) || this.isJSONFile(file)) {
            return await this.processDataFile(file);
        } else {
            throw new Error('Unsupported file type');
        }
    }
    
    async processImageFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const img = new Image();
                    img.onload = () => {
                        // Apply as background if in editor mode
                        if (window.layoutEditor && document.getElementById('editorView').style.display !== 'none') {
                            window.layoutEditor.importBackgroundImage(e.target.result);
                            resolve('Image set as background in layout editor');
                        } else {
                            resolve('Image loaded successfully');
                        }
                    };
                    img.onerror = () => reject(new Error('Invalid image file'));
                    img.src = e.target.result;
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read image file'));
            reader.readAsDataURL(file);
        });
    }
    
    async processDocumentFile(file) {
        // For PDF files, we'll just acknowledge receipt
        // In a real implementation, you might use PDF.js to extract layout information
        return `PDF document "${file.name}" uploaded. PDF parsing not implemented in this demo.`;
    }
    
    async processDataFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    
                    if (file.type === 'application/json' || this.isJSONFile(file)) {
                        const data = JSON.parse(content);
                        this.processJSONData(data, file.name);
                        resolve(`JSON configuration "${file.name}" imported successfully`);
                    } else if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
                        const csvData = this.parseCSV(content);
                        this.processCSVData(csvData, file.name);
                        resolve(`CSV data "${file.name}" imported successfully`);
                    } else {
                        reject(new Error('Unsupported data file format'));
                    }
                } catch (error) {
                    reject(new Error(`Failed to parse ${file.name}: ${error.message}`));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read data file'));
            reader.readAsText(file);
        });
    }
    
    processJSONData(data, filename) {
        // Determine what kind of JSON data this is
        if (data.layout && Array.isArray(data.layout.zones)) {
            // This is a layout configuration
            if (window.layoutEditor) {
                window.layoutEditor.importLayout(data);
            } else if (window.configManager) {
                window.configManager.importLayout(data);
            }
        } else if (data.config && typeof data.config === 'object') {
            // This is a station configuration
            if (window.configManager) {
                if (window.simulator) {
                    window.simulator.updateConfig(data.config);
                }
                if (data.layout) {
                    window.simulator.stationLayout = data.layout;
                    window.simulator.render();
                }
            }
        } else if (Array.isArray(data) || data.routes || data.packages) {
            // This might be operational data
            this.processOperationalData(data, filename);
        } else {
            throw new Error('Unrecognized JSON structure');
        }
    }
    
    processCSVData(csvData, filename) {
        if (csvData.length === 0) {
            throw new Error('Empty CSV file');
        }
        
        const headers = csvData[0];
        
        // Try to identify what kind of CSV data this is based on headers
        if (headers.includes('route_id') || headers.includes('routeId')) {
            this.importRouteData(csvData);
        } else if (headers.includes('package_id') || headers.includes('packageId')) {
            this.importPackageData(csvData);
        } else if (headers.includes('zone_id') || headers.includes('zoneId')) {
            this.importZoneData(csvData);
        } else if (headers.includes('x') && headers.includes('y') && headers.includes('width') && headers.includes('height')) {
            this.importLayoutData(csvData);
        } else {
            // Generic data import
            this.importGenericData(csvData, filename);
        }
    }
    
    parseCSV(text) {
        const lines = text.split('\n');
        const result = [];
        
        for (let line of lines) {
            line = line.trim();
            if (line) {
                // Simple CSV parsing - would need more sophisticated parsing for complex CSV
                const row = line.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''));
                result.push(row);
            }
        }
        
        return result;
    }
    
    importRouteData(csvData) {
        const [headers, ...rows] = csvData;
        const routes = [];
        
        rows.forEach(row => {
            const route = {};
            headers.forEach((header, index) => {
                route[header] = row[index];
            });
            routes.push(route);
        });
        
        // Apply route data to simulator
        if (window.simulator && routes.length > 0) {
            // Update simulator routes based on imported data
            console.log('Imported route data:', routes);
            window.configManager?.showNotification(`Imported ${routes.length} routes`, 'success');
        }
    }
    
    importPackageData(csvData) {
        const [headers, ...rows] = csvData;
        console.log('Package data imported:', { headers, rowCount: rows.length });
        window.configManager?.showNotification(`Imported ${rows.length} package records`, 'success');
    }
    
    importZoneData(csvData) {
        const [headers, ...rows] = csvData;
        
        rows.forEach(row => {
            const zone = {};
            headers.forEach((header, index) => {
                const value = row[index];
                // Convert numeric fields
                if (['x', 'y', 'width', 'height', 'capacity'].includes(header.toLowerCase())) {
                    zone[header] = parseInt(value) || 0;
                } else {
                    zone[header] = value;
                }
            });
            
            // Add zone to layout if valid
            if (zone.id && zone.type && zone.x !== undefined && zone.y !== undefined) {
                if (window.layoutEditor) {
                    window.layoutEditor.layout.zones.push(zone);
                    window.layoutEditor.render();
                }
            }
        });
        
        window.configManager?.showNotification(`Imported ${rows.length} zones`, 'success');
    }
    
    importLayoutData(csvData) {
        const [headers, ...rows] = csvData;
        const zones = [];
        
        rows.forEach(row => {
            const zone = {
                id: row[headers.indexOf('id')] || `zone${zones.length + 1}`,
                type: row[headers.indexOf('type')] || 'staging',
                x: parseInt(row[headers.indexOf('x')]) || 0,
                y: parseInt(row[headers.indexOf('y')]) || 0,
                width: parseInt(row[headers.indexOf('width')]) || 100,
                height: parseInt(row[headers.indexOf('height')]) || 80,
                capacity: parseInt(row[headers.indexOf('capacity')]) || 50,
                current: 0
            };
            zones.push(zone);
        });
        
        if (window.layoutEditor && zones.length > 0) {
            window.layoutEditor.layout.zones = zones;
            window.layoutEditor.render();
            window.configManager?.showNotification(`Imported layout with ${zones.length} zones`, 'success');
        }
    }
    
    importGenericData(csvData, filename) {
        console.log('Generic CSV data imported:', { filename, headers: csvData[0], rowCount: csvData.length - 1 });
        window.configManager?.showNotification(`Imported generic data from ${filename}`, 'info');
    }
    
    processOperationalData(data, filename) {
        // Handle operational data like routes, packages, metrics, etc.
        if (data.routes && window.simulator) {
            window.simulator.routes = data.routes;
        }
        
        if (data.packages && window.simulator) {
            // Could import historical package data for analysis
            console.log('Package data imported:', data.packages.length);
        }
        
        console.log('Operational data processed:', filename);
    }
    
    // Export functions
    exportStationData(format = 'json') {
        const data = this.gatherStationData();
        
        switch (format.toLowerCase()) {
            case 'json':
                this.exportJSON(data, `station-data-${Date.now()}.json`);
                break;
            case 'csv':
                this.exportCSV(data, `station-data-${Date.now()}.csv`);
                break;
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
    
    gatherStationData() {
        const data = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            config: window.simulator?.config || {},
            layout: window.simulator?.stationLayout || window.layoutEditor?.layout || {},
            metrics: window.simulator?.metrics || {},
            routes: window.simulator?.routes || [],
            currentPackages: window.simulator?.packages || []
        };
        
        return data;
    }
    
    exportJSON(data, filename) {
        if (window.configManager) {
            window.configManager.downloadJSON(data, filename);
        }
    }
    
    exportCSV(data, filename) {
        // Convert station data to CSV format
        let csvContent = '';
        
        // Export zones as CSV
        if (data.layout && data.layout.zones) {
            csvContent = 'id,type,x,y,width,height,capacity,current\n';
            data.layout.zones.forEach(zone => {
                csvContent += `${zone.id},${zone.type},${zone.x},${zone.y},${zone.width},${zone.height},${zone.capacity},${zone.current || 0}\n`;
            });
        }
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        window.configManager?.showNotification(`Data exported as ${filename}`, 'success');
    }
    
    showProcessingResults(results) {
        const successCount = results.filter(r => r.success).length;
        const errorCount = results.filter(r => !r.success).length;
        
        let message = '';
        if (successCount > 0) {
            message += `${successCount} file${successCount > 1 ? 's' : ''} processed successfully`;
        }
        if (errorCount > 0) {
            if (message) message += ', ';
            message += `${errorCount} file${errorCount > 1 ? 's' : ''} failed`;
        }
        
        const type = errorCount > 0 ? (successCount > 0 ? 'warning' : 'error') : 'success';
        
        if (window.configManager) {
            window.configManager.showNotification(message, type);
        }
        
        // Log detailed results to console
        console.log('File processing results:', results);
        
        // Show errors in detail if any
        const errors = results.filter(r => !r.success);
        if (errors.length > 0) {
            console.error('File processing errors:', errors);
        }
    }
    
    showErrors(errors) {
        const message = `File validation errors:\n${errors.join('\n')}`;
        console.error(message);
        
        if (window.configManager) {
            window.configManager.showNotification('Some files could not be processed. Check console for details.', 'error');
        }
    }
    
    // Utility functions for data conversion
    convertLayoutToCSV(layout) {
        if (!layout || !layout.zones) return '';
        
        const headers = ['id', 'type', 'x', 'y', 'width', 'height', 'capacity'];
        let csv = headers.join(',') + '\n';
        
        layout.zones.forEach(zone => {
            const row = headers.map(header => zone[header] || '').join(',');
            csv += row + '\n';
        });
        
        return csv;
    }
    
    convertRoutesToCSV(routes) {
        if (!routes || routes.length === 0) return '';
        
        const headers = ['id', 'packagesAssigned', 'packagesLoaded', 'status', 'stagingZone'];
        let csv = headers.join(',') + '\n';
        
        routes.forEach(route => {
            const row = headers.map(header => route[header] || '').join(',');
            csv += row + '\n';
        });
        
        return csv;
    }
    
    // Template creation functions
    createLayoutTemplate() {
        const layout = window.layoutEditor?.layout || window.simulator?.stationLayout;
        if (!layout) return null;
        
        return {
            name: 'Custom Layout Template',
            description: `Created ${new Date().toLocaleDateString()}`,
            layout: JSON.parse(JSON.stringify(layout)),
            createdAt: Date.now()
        };
    }
    
    createConfigTemplate() {
        const config = window.simulator?.config;
        if (!config) return null;
        
        return {
            name: 'Custom Configuration Template',
            description: `Created ${new Date().toLocaleDateString()}`,
            config: JSON.parse(JSON.stringify(config)),
            createdAt: Date.now()
        };
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FileHandler.init());
} else {
    FileHandler.init();
}
