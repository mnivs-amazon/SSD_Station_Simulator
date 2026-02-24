// Amazon SSD Station Simulator - Layout Editor

class LayoutEditor {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.currentTool = 'select';
        this.selectedZone = null;
        this.selectedZones = []; // Multiple selection support
        this.isDragging = false;
        this.isResizing = false;
        this.isAreaSelecting = false;
        this.dragOffset = { x: 0, y: 0 };
        this.resizeHandle = null;
        
        // Area selection
        this.selectionStart = { x: 0, y: 0 };
        this.selectionEnd = { x: 0, y: 0 };
        this.selectionRect = { x: 0, y: 0, width: 0, height: 0 };
        
        // Grid settings
        this.gridSize = 20;
        this.showGrid = true;
        this.snapToGrid = true;
        
        // Undo functionality
        this.undoHistory = [];
        this.maxUndoHistory = 50;
        
        // Last action tracking for Cmd+= duplication
        this.lastCreatedZoneType = 'inbound'; // Default starting zone type
        this.lastCreatedZonePosition = { x: 100, y: 100 }; // Default position
        
        // Zone types and their properties - Updated for Grocery SSD Station with Route Closure Workflow
        this.zoneTypes = {
            inbound: { color: '#3498db', minSize: { width: 100, height: 80 }, defaultCapacity: 50 },
            chilled: { color: '#5dade2', minSize: { width: 80, height: 60 }, defaultCapacity: 45 },
            frozen: { color: '#aed6f1', minSize: { width: 80, height: 60 }, defaultCapacity: 18 },
            ambient: { color: '#f7dc6f', minSize: { width: 100, height: 80 }, defaultCapacity: 30 },
            produce: { color: '#82e0aa', minSize: { width: 100, height: 80 }, defaultCapacity: 25 },
            chilled_staging: { color: '#48c9b0', minSize: { width: 120, height: 80 }, defaultCapacity: 46 },
            frozen_staging: { color: '#85c1e9', minSize: { width: 120, height: 80 }, defaultCapacity: 18 },
            ambient_staging: { color: '#f8c471', minSize: { width: 120, height: 80 }, defaultCapacity: 9 },
            cart_storage: { color: '#d5a6bd', minSize: { width: 100, height: 60 }, defaultCapacity: 50 },
            route_closure: { color: '#e67e22', minSize: { width: 120, height: 60 }, defaultCapacity: 25 },
            cart_staging: { color: '#f39c12', minSize: { width: 120, height: 60 }, defaultCapacity: 30 },
            van_loading: { color: '#2ecc71', minSize: { width: 120, height: 60 }, defaultCapacity: 8 },
            problem_solve: { color: '#ec7063', minSize: { width: 80, height: 60 }, defaultCapacity: 20 },
            cage_pick: { color: '#bb8fce', minSize: { width: 80, height: 60 }, defaultCapacity: 15 },
            hazmat: { color: '#f1948a', minSize: { width: 60, height: 60 }, defaultCapacity: 10 },
            loading: { color: '#27ae60', minSize: { width: 120, height: 60 }, defaultCapacity: 20 },
            office: { color: '#9b59b6', minSize: { width: 60, height: 60 }, defaultCapacity: 10 }
        };
        
        // Current layout (copy from simulator)
        this.layout = null;
        this.zoneIdCounter = 1;
    }
    
    static init() {
        console.log('Initializing Layout Editor...');
        window.layoutEditor = new LayoutEditor();
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                window.layoutEditor.setupCanvas();
                window.layoutEditor.setupEventListeners();
                window.layoutEditor.initializeLayout();
            });
        } else {
            window.layoutEditor.setupCanvas();
            window.layoutEditor.setupEventListeners();
            window.layoutEditor.initializeLayout();
        }
        
        console.log('Layout Editor initialized');
    }
    
    setupCanvas() {
        this.canvas = document.getElementById('editorCanvas');
        if (!this.canvas) {
            console.error('Editor canvas not found!');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas dimensions
        this.canvas.width = 1000;
        this.canvas.height = 700;
        this.canvas.style.width = '1000px';
        this.canvas.style.height = '700px';
        
        console.log('Editor canvas setup complete:', this.canvas.width + 'x' + this.canvas.height);
    }
    
    setupEventListeners() {
        console.log('Setting up Layout Editor event listeners...');
        
        if (!this.canvas) {
            console.error('Canvas not available for event listeners');
            return;
        }
        
        // Mode switching
        const simulationModeBtn = document.getElementById('simulationMode');
        const editorModeBtn = document.getElementById('editorMode');
        
        if (simulationModeBtn) {
            simulationModeBtn.addEventListener('click', () => {
                console.log('Switching to simulation mode');
                this.switchToSimulation();
            });
        }
        
        if (editorModeBtn) {
            editorModeBtn.addEventListener('click', () => {
                console.log('Switching to editor mode');
                this.switchToEditor();
            });
        }
        
        // Header button handlers
        const loadTemplateBtn = document.getElementById('loadTemplate');
        const saveTemplateBtn = document.getElementById('saveTemplate');
        const exportLayoutBtn = document.getElementById('exportLayout');
        
        if (loadTemplateBtn) {
            loadTemplateBtn.addEventListener('click', () => {
                console.log('Load template clicked');
                this.showTemplateManager();
            });
        }
        
        if (saveTemplateBtn) {
            saveTemplateBtn.addEventListener('click', () => {
                console.log('Save template clicked');
                this.showSaveDialog();
            });
        }
        
        if (exportLayoutBtn) {
            exportLayoutBtn.addEventListener('click', () => {
                console.log('Export layout clicked');
                this.exportCurrentLayout();
            });
        }
        
        // Tool selection with delegation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tool-btn')) {
                console.log('Tool button clicked:', e.target.dataset.tool);
                this.selectTool(e.target.dataset.tool);
                e.preventDefault();
                e.stopPropagation();
            }
            
            if (e.target.classList.contains('zone-btn')) {
                const zoneType = e.target.dataset.zone;
                console.log('Zone button clicked:', zoneType);
                console.log('Setting tool to add-zone and selectedZoneType to:', zoneType);
                
                this.currentTool = 'add-zone';
                this.selectedZoneType = zoneType;
                this.canvas.style.cursor = 'crosshair';
                
                // Update tool button UI
                document.querySelectorAll('.tool-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                const addZoneBtn = document.querySelector('[data-tool="add-zone"]');
                if (addZoneBtn) {
                    addZoneBtn.classList.add('active');
                }
                
                console.log('Ready to add zone type:', this.selectedZoneType, 'Current tool:', this.currentTool);
                e.preventDefault();
                e.stopPropagation();
            }
            
            if (e.target.id === 'undoBtn') {
                console.log('Undo button clicked');
                this.undo();
                e.preventDefault();
                e.stopPropagation();
            }
            
            if (e.target.id === 'uploadLayout') {
                console.log('Upload layout button clicked');
                const layoutUpload = document.getElementById('layoutUpload');
                if (layoutUpload) {
                    layoutUpload.click();
                } else {
                    console.error('Layout upload input not found');
                }
            }
            
            if (e.target.id === 'downloadConfig') {
                this.exportLayout();
            }
        });
        
        // File upload handler
        const layoutUpload = document.getElementById('layoutUpload');
        if (layoutUpload) {
            layoutUpload.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileUpload(e.target.files[0]);
                }
            });
        }
        
        // Canvas mouse events
        console.log('Adding canvas event listeners...');
        this.canvas.addEventListener('mousedown', (e) => {
            console.log('Canvas mousedown', e.clientX, e.clientY);
            this.handleMouseDown(e);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            console.log('Canvas mouseup');
            this.handleMouseUp(e);
        });
        
        this.canvas.addEventListener('click', (e) => {
            console.log('Canvas click', e.clientX, e.clientY);
            this.handleClick(e);
        });
        
        // Context menu for zones
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            const editorView = document.getElementById('editorView');
            if (editorView && editorView.style.display !== 'none') {
                this.handleKeyDown(e);
            }
        });
        
        console.log('Layout Editor event listeners setup complete');
    }
    
    initializeLayout() {
        console.log('Initializing layout...');
        
        // Initialize with empty layout structure
        this.layout = {
            zones: [],
            conveyors: [],
            cart_routes: []
        };
        
        // Always load the current simulation layout if available
        this.syncFromSimulation();
        
        this.updateZoneIdCounter();
        
        // Only render if we have a layout
        if (this.layout && this.layout.zones) {
            this.render();
            console.log('Layout initialized with', this.layout.zones.length, 'zones');
        }
    }
    
    syncFromSimulation() {
        // Load current layout from simulator
        if (window.simulator && window.simulator.stationLayout) {
            this.layout = JSON.parse(JSON.stringify(window.simulator.stationLayout));
            this.showNotification('Layout synchronized with current simulation', 'info');
        } else {
            // Load the updated grocery station template as fallback
            this.loadCurrentTemplate();
        }
    }
    
    loadCurrentTemplate() {
        // Load the SFL1 Grocery Station template with route closure workflow
        fetch('./templates/sfl1-grocery-station.json')
            .then(response => response.json())
            .then(template => {
                this.layout = {
                    zones: template.zones || [],
                    conveyors: template.conveyors || [],
                    cart_routes: template.cart_routes || []
                };
                this.updateZoneIdCounter();
                this.render();
                this.showNotification('Current SFL1 Grocery Station template loaded', 'success');
            })
            .catch(error => {
                console.error('Error loading template:', error);
                // Fallback to basic layout
                this.layout = {
                    zones: [
                        { id: 'inbound', type: 'inbound', x: 50, y: 50, width: 200, height: 80, capacity: 100, current: 0 }
                    ],
                    conveyors: [],
                    cart_routes: []
                };
                this.showNotification('Loaded basic template - could not load SFL1 template', 'warning');
            });
    }
    
    updateZoneIdCounter() {
        // Find the highest zone number to avoid ID conflicts
        let maxId = 0;
        this.layout.zones.forEach(zone => {
            const match = zone.id.match(/\d+$/);
            if (match) {
                maxId = Math.max(maxId, parseInt(match[0]));
            }
        });
        this.zoneIdCounter = maxId + 1;
    }
    
    selectTool(tool) {
        // Check if we have multiple zones selected from area selection
        if (this.selectedZones.length > 1 && tool !== 'select') {
            // Apply tool action immediately to all selected zones
            this.applyToolToSelectedZones(tool);
            return;
        }
        
        this.currentTool = tool;
        
        // Update UI
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
        
        // Change cursor
        switch (tool) {
            case 'select':
                this.canvas.style.cursor = 'default';
                break;
            case 'move':
                this.canvas.style.cursor = 'move';
                break;
            case 'resize':
                this.canvas.style.cursor = 'nw-resize';
                break;
            case 'delete':
                this.canvas.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23e74c3c\' d=\'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z\'/%3E%3C/svg%3E") 12 12, pointer';
                break;
            case 'add-zone':
                this.canvas.style.cursor = 'crosshair';
                break;
        }
        
        // Only clear selection if switching to select tool
        if (tool === 'select') {
            this.selectedZone = null;
        }
        this.render();
    }
    
    applyToolToSelectedZones(tool) {
        if (this.selectedZones.length === 0) return;
        
        switch (tool) {
            case 'delete':
                this.deleteSelectedZones();
                break;
            case 'move':
                this.initializeGroupMove();
                break;
            case 'resize':
                this.showNotification('Resize tool cannot be applied to multiple zones. Please select individual zones for resizing.', 'info');
                break;
            default:
                this.showNotification(`${tool} tool applied to ${this.selectedZones.length} selected zones`, 'info');
                break;
        }
    }
    
    initializeGroupMove() {
        if (this.selectedZones.length === 0) {
            this.showNotification('No zones selected for group move', 'error');
            return;
        }
        
        // Save state before group move
        this.saveToHistory();
        
        // Enable group move mode
        this.currentTool = 'move';
        this.groupMoveMode = true;
        this.groupMoveStarted = false;
        
        // Update UI
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('[data-tool="move"]').classList.add('active');
        this.canvas.style.cursor = 'move';
        
        this.showNotification(`Group move enabled for ${this.selectedZones.length} zones. Click and drag to move all zones together.`, 'info');
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.currentTool === 'select') {
            const zone = this.getZoneAt(x, y);
            if (zone) {
                // Check if zone is already selected (for multi-select with Cmd/Ctrl)
                if (e.metaKey || e.ctrlKey) {
                    if (this.selectedZones.includes(zone)) {
                        // Remove from selection
                        this.selectedZones = this.selectedZones.filter(z => z !== zone);
                        this.selectedZone = this.selectedZones.length > 0 ? this.selectedZones[0] : null;
                    } else {
                        // Add to selection
                        this.selectedZones.push(zone);
                        this.selectedZone = zone;
                    }
                } else {
                    // Single selection
                    this.selectedZones = [zone];
                    this.selectedZone = zone;
                }
                
                if (this.selectedZone) {
                    this.showZoneProperties(this.selectedZone);
                } else {
                    this.hideZoneProperties();
                }
                this.render();
                console.log('Selected zones:', this.selectedZones.length);
            } else {
                // Clicked on empty area - start area selection
                if (!e.metaKey && !e.ctrlKey) {
                    this.selectedZones = [];
                    this.selectedZone = null;
                    this.hideZoneProperties();
                }
                
                this.isAreaSelecting = true;
                this.selectionStart.x = x;
                this.selectionStart.y = y;
                this.selectionEnd.x = x;
                this.selectionEnd.y = y;
                this.updateSelectionRect();
                this.render();
                console.log('Started area selection');
            }
        } else if (this.currentTool === 'move') {
            if (this.groupMoveMode && this.selectedZones.length > 1) {
                // Group move mode - move all selected zones
                this.saveToHistory();
                this.isDragging = true;
                this.isGroupMoving = true;
                this.groupMoveReference = { x: x, y: y };
                
                // Calculate relative positions for all selected zones
                this.groupMoveOffsets = this.selectedZones.map(zone => ({
                    zone: zone,
                    offsetX: zone.x - x,
                    offsetY: zone.y - y
                }));
                
                console.log('Starting group move for', this.selectedZones.length, 'zones');
            } else {
                const zone = this.getZoneAt(x, y);
                if (zone) {
                    // Single zone move
                    this.saveToHistory();
                    this.isDragging = true;
                    this.selectedZone = zone;
                    this.dragOffset.x = x - zone.x;
                    this.dragOffset.y = y - zone.y;
                    console.log('Starting to move zone:', zone.id);
                }
            }
        } else if (this.currentTool === 'resize') {
            const zone = this.getZoneAt(x, y);
            if (zone) {
                // Save state before resizing
                this.saveToHistory();
                this.isResizing = true;
                this.selectedZone = zone;
                this.resizeHandle = this.getResizeHandle(zone, x, y);
                console.log('Starting to resize zone:', zone.id, 'Handle:', this.resizeHandle);
            }
        } else if (this.currentTool === 'delete') {
            const zone = this.getZoneAt(x, y);
            if (zone) {
                console.log('Deleting zone with delete tool:', zone.id);
                this.deleteZone(zone);
            }
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.isDragging && this.isGroupMoving && this.groupMoveOffsets) {
            // Group move mode - move all selected zones together
            this.groupMoveOffsets.forEach(item => {
                let newX = x + item.offsetX;
                let newY = y + item.offsetY;
                
                if (this.snapToGrid) {
                    newX = Math.round(newX / this.gridSize) * this.gridSize;
                    newY = Math.round(newY / this.gridSize) * this.gridSize;
                }
                
                // Keep zone within canvas bounds
                newX = Math.max(0, Math.min(newX, this.canvas.clientWidth - item.zone.width));
                newY = Math.max(0, Math.min(newY, this.canvas.clientHeight - item.zone.height));
                
                item.zone.x = newX;
                item.zone.y = newY;
            });
            this.render();
        } else if (this.isDragging && this.selectedZone) {
            // Single zone move
            let newX = x - this.dragOffset.x;
            let newY = y - this.dragOffset.y;
            
            if (this.snapToGrid) {
                newX = Math.round(newX / this.gridSize) * this.gridSize;
                newY = Math.round(newY / this.gridSize) * this.gridSize;
            }
            
            // Keep zone within canvas bounds
            newX = Math.max(0, Math.min(newX, this.canvas.clientWidth - this.selectedZone.width));
            newY = Math.max(0, Math.min(newY, this.canvas.clientHeight - this.selectedZone.height));
            
            this.selectedZone.x = newX;
            this.selectedZone.y = newY;
            this.render();
        } else if (this.isResizing && this.selectedZone && this.resizeHandle) {
            this.resizeZone(this.selectedZone, x, y, this.resizeHandle);
            this.render();
        } else if (this.isAreaSelecting) {
            // Update area selection
            this.selectionEnd.x = x;
            this.selectionEnd.y = y;
            this.updateSelectionRect();
            
            // Find zones in selection area
            const zonesInArea = this.getZonesInRect(this.selectionRect);
            this.selectedZones = zonesInArea;
            this.selectedZone = zonesInArea.length > 0 ? zonesInArea[0] : null;
            
            this.render();
        }
    }
    
    handleMouseUp(e) {
        this.isDragging = false;
        this.isResizing = false;
        this.resizeHandle = null;
        
        // Reset group move state
        if (this.isGroupMoving) {
            this.isGroupMoving = false;
            this.groupMoveOffsets = null;
            this.groupMoveReference = null;
            console.log('Group move completed');
        }
        
        if (this.isAreaSelecting) {
            // Finalize area selection
            this.isAreaSelecting = false;
            
            if (this.selectedZones.length > 0) {
                this.showMultiZoneProperties();
                this.showNotification(`Selected ${this.selectedZones.length} zones`, 'info');
                console.log('Area selection completed, selected zones:', this.selectedZones.length);
            }
        }
        
        if (this.selectedZone) {
            this.showZoneProperties(this.selectedZone);
        }
    }
    
    handleClick(e) {
        if (this.currentTool === 'add-zone' && this.selectedZoneType) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.addZone(this.selectedZoneType, x, y);
        }
    }
    
    handleRightClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const zone = this.getZoneAt(x, y);
        if (zone) {
            this.showZoneContextMenu(zone, e.clientX, e.clientY);
        }
    }
    
    handleKeyDown(e) {
        if (e.key === 'Delete') {
            e.preventDefault();
            if (this.selectedZones.length > 1) {
                // Multiple zones selected - delete all
                this.deleteSelectedZones();
            } else if (this.selectedZone) {
                // Single zone selected - delete it
                this.deleteZone(this.selectedZone);
            } else {
                this.showNotification('Please select zones to delete', 'info');
            }
        } else if (e.key === 'Escape') {
            // RESET: Always switch to select tool and clear everything
            this.currentTool = 'select';
            this.selectedZones = [];
            this.selectedZone = null;
            this.selectedZoneType = null;
            this.isDragging = false;
            this.isResizing = false;
            this.isAreaSelecting = false;
            this.groupMoveMode = false;
            
            // Reset UI
            document.querySelectorAll('.tool-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector('[data-tool="select"]').classList.add('active');
            this.canvas.style.cursor = 'default';
            
            this.hideZoneProperties();
            this.render();
            
            this.showNotification('Reset to select tool', 'info');
        } else if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
            // Cmd+Z on Mac or Ctrl+Z on PC - Undo
            e.preventDefault();
            this.undo();
        } else if ((e.metaKey || e.ctrlKey) && e.key === '-') {
            // Cmd+- on Mac or Ctrl+- on PC for delete
            e.preventDefault();
            if (this.selectedZones.length > 1) {
                this.deleteSelectedZones();
            } else if (this.selectedZone) {
                this.deleteZone(this.selectedZone);
            } else {
                this.showNotification('Please select zones to delete', 'info');
            }
        } else if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
            // Cmd+D on Mac or Ctrl+D on PC for duplicate
            e.preventDefault();
            if (this.selectedZones.length > 1) {
                this.duplicateSelectedZones();
            } else if (this.selectedZone) {
                this.duplicateZone();
            } else {
                this.showNotification('Please select zones to duplicate', 'info');
            }
        } else if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
            // Cmd+C on Mac or Ctrl+C on PC for copy
            e.preventDefault();
            if (this.selectedZones.length > 0) {
                this.copySelectedZones();
            } else {
                this.showNotification('Please select zones to copy', 'info');
            }
        } else if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
            // Cmd+A on Mac or Ctrl+A on PC for select all
            e.preventDefault();
            this.selectAllZones();
        } else if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) {
            // Cmd+= or Cmd++ on Mac or Ctrl+= or Ctrl++ on PC for duplicate last shape
            e.preventDefault();
            this.duplicateLastCreatedZone();
        }
    }
    
    // Additional helper method for select all
    selectAllZones() {
        this.selectedZones = [...this.layout.zones];
        this.selectedZone = this.selectedZones.length > 0 ? this.selectedZones[0] : null;
        
        if (this.selectedZones.length > 0) {
            this.showMultiZoneProperties();
            this.render();
            this.showNotification(`Selected all ${this.selectedZones.length} zones`, 'info');
        } else {
            this.showNotification('No zones available to select', 'info');
        }
    }
    
    getZoneAt(x, y) {
        // Check zones in reverse order (top to bottom)
        for (let i = this.layout.zones.length - 1; i >= 0; i--) {
            const zone = this.layout.zones[i];
            if (x >= zone.x && x <= zone.x + zone.width &&
                y >= zone.y && y <= zone.y + zone.height) {
                return zone;
            }
        }
        return null;
    }
    
    getResizeHandle(zone, x, y) {
        const handleSize = 10;
        const right = zone.x + zone.width;
        const bottom = zone.y + zone.height;
        
        // Check corner handles
        if (Math.abs(x - right) <= handleSize && Math.abs(y - bottom) <= handleSize) {
            return 'se'; // Southeast
        } else if (Math.abs(x - zone.x) <= handleSize && Math.abs(y - bottom) <= handleSize) {
            return 'sw'; // Southwest
        } else if (Math.abs(x - right) <= handleSize && Math.abs(y - zone.y) <= handleSize) {
            return 'ne'; // Northeast
        } else if (Math.abs(x - zone.x) <= handleSize && Math.abs(y - zone.y) <= handleSize) {
            return 'nw'; // Northwest
        }
        
        // Check edge handles
        if (Math.abs(x - right) <= handleSize && y >= zone.y && y <= bottom) {
            return 'e'; // East
        } else if (Math.abs(x - zone.x) <= handleSize && y >= zone.y && y <= bottom) {
            return 'w'; // West
        } else if (Math.abs(y - bottom) <= handleSize && x >= zone.x && x <= right) {
            return 's'; // South
        } else if (Math.abs(y - zone.y) <= handleSize && x >= zone.x && x <= right) {
            return 'n'; // North
        }
        
        return null;
    }
    
    resizeZone(zone, mouseX, mouseY, handle) {
        const minSize = this.zoneTypes[zone.type].minSize;
        
        switch (handle) {
            case 'se':
                zone.width = Math.max(minSize.width, mouseX - zone.x);
                zone.height = Math.max(minSize.height, mouseY - zone.y);
                break;
            case 'sw':
                const newWidth = zone.x + zone.width - mouseX;
                if (newWidth >= minSize.width) {
                    zone.x = mouseX;
                    zone.width = newWidth;
                }
                zone.height = Math.max(minSize.height, mouseY - zone.y);
                break;
            case 'ne':
                zone.width = Math.max(minSize.width, mouseX - zone.x);
                const newHeight = zone.y + zone.height - mouseY;
                if (newHeight >= minSize.height) {
                    zone.y = mouseY;
                    zone.height = newHeight;
                }
                break;
            case 'nw':
                const newWidthNW = zone.x + zone.width - mouseX;
                const newHeightNW = zone.y + zone.height - mouseY;
                if (newWidthNW >= minSize.width) {
                    zone.x = mouseX;
                    zone.width = newWidthNW;
                }
                if (newHeightNW >= minSize.height) {
                    zone.y = mouseY;
                    zone.height = newHeightNW;
                }
                break;
            case 'e':
                zone.width = Math.max(minSize.width, mouseX - zone.x);
                break;
            case 'w':
                const newWidthW = zone.x + zone.width - mouseX;
                if (newWidthW >= minSize.width) {
                    zone.x = mouseX;
                    zone.width = newWidthW;
                }
                break;
            case 's':
                zone.height = Math.max(minSize.height, mouseY - zone.y);
                break;
            case 'n':
                const newHeightN = zone.y + zone.height - mouseY;
                if (newHeightN >= minSize.height) {
                    zone.y = mouseY;
                    zone.height = newHeightN;
                }
                break;
        }
        
        if (this.snapToGrid) {
            zone.x = Math.round(zone.x / this.gridSize) * this.gridSize;
            zone.y = Math.round(zone.y / this.gridSize) * this.gridSize;
            zone.width = Math.round(zone.width / this.gridSize) * this.gridSize;
            zone.height = Math.round(zone.height / this.gridSize) * this.gridSize;
        }
    }
    
    addZone(type, x, y) {
        // Save current state for undo
        this.saveToHistory();
        
        const zoneType = this.zoneTypes[type];
        const zone = {
            id: `${type}${this.zoneIdCounter++}`,
            type: type,
            x: this.snapToGrid ? Math.round(x / this.gridSize) * this.gridSize : x,
            y: this.snapToGrid ? Math.round(y / this.gridSize) * this.gridSize : y,
            width: zoneType.minSize.width,
            height: zoneType.minSize.height,
            capacity: zoneType.defaultCapacity,
            current: 0
        };
        
        // Track last created zone type and position for Cmd+= duplication
        this.lastCreatedZoneType = type;
        this.lastCreatedZonePosition = { x: zone.x, y: zone.y };
        
        this.layout.zones.push(zone);
        this.selectedZone = zone;
        this.showZoneProperties(zone);
        this.render();
        
        if (window.configManager) {
            window.configManager.showNotification(`${type} zone added`, 'success');
        }
    }
    
    deleteZone(zone) {
        if (!zone) {
            this.showNotification('No zone selected for deletion', 'error');
            return;
        }
        
        // Save current state for undo before deleting
        this.saveToHistory();
        
        const index = this.layout.zones.indexOf(zone);
        if (index > -1) {
            const zoneName = zone.id;
            this.layout.zones.splice(index, 1);
            this.selectedZone = null;
            this.hideZoneProperties();
            this.render();
            this.applyToSimulator();
            
            this.showNotification(`Zone ${zoneName} deleted`, 'success');
            console.log(`Deleted zone: ${zoneName}, remaining zones:`, this.layout.zones.length);
        } else {
            this.showNotification('Zone not found in layout', 'error');
        }
    }
    
    showZoneProperties(zone) {
        const panel = document.getElementById('propertyPanel');
        panel.innerHTML = `
            <div class="zone-properties">
                <h4>Zone Properties</h4>
                <div class="property-group">
                    <label>ID:</label>
                    <input type="text" id="zoneId" value="${zone.id}" onchange="layoutEditor.updateZoneProperty('id', this.value)">
                </div>
                <div class="property-group">
                    <label>Type:</label>
                    <select id="zoneType" onchange="layoutEditor.updateZoneProperty('type', this.value)">
                        ${Object.keys(this.zoneTypes).map(type => 
                            `<option value="${type}" ${zone.type === type ? 'selected' : ''}>${type}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="property-group">
                    <label>X:</label>
                    <input type="number" id="zoneX" value="${zone.x}" onchange="layoutEditor.updateZoneProperty('x', parseInt(this.value))">
                </div>
                <div class="property-group">
                    <label>Y:</label>
                    <input type="number" id="zoneY" value="${zone.y}" onchange="layoutEditor.updateZoneProperty('y', parseInt(this.value))">
                </div>
                <div class="property-group">
                    <label>Width:</label>
                    <input type="number" id="zoneWidth" value="${zone.width}" onchange="layoutEditor.updateZoneProperty('width', parseInt(this.value))">
                </div>
                <div class="property-group">
                    <label>Height:</label>
                    <input type="number" id="zoneHeight" value="${zone.height}" onchange="layoutEditor.updateZoneProperty('height', parseInt(this.value))">
                </div>
                <div class="property-group">
                    <label>Capacity:</label>
                    <input type="number" id="zoneCapacity" value="${zone.capacity}" onchange="layoutEditor.updateZoneProperty('capacity', parseInt(this.value))">
                </div>
                <div class="property-actions">
                    <button class="btn btn-secondary" onclick="layoutEditor.duplicateZone()">Duplicate</button>
                    <button class="btn btn-primary" onclick="layoutEditor.deleteZone(layoutEditor.selectedZone)">Delete</button>
                </div>
            </div>
        `;
    }
    
    hideZoneProperties() {
        document.getElementById('propertyPanel').innerHTML = '<p>Select a zone to edit properties</p>';
    }
    
    updateZoneProperty(property, value) {
        if (this.selectedZone) {
            // Save state before property change for undo
            this.saveToHistory();
            
            this.selectedZone[property] = value;
            this.render();
            // Auto-apply changes to simulation
            this.applyToSimulator();
        }
    }
    
    duplicateZone() {
        if (this.selectedZone) {
            const newZone = JSON.parse(JSON.stringify(this.selectedZone));
            newZone.id = `${newZone.type}${this.zoneIdCounter++}`;
            newZone.x += 20;
            newZone.y += 20;
            
            this.layout.zones.push(newZone);
            this.selectedZone = newZone;
            this.showZoneProperties(newZone);
            this.render();
        }
    }
    
    render() {
        if (!this.ctx) {
            console.log('No canvas context available for rendering');
            return;
        }
        
        if (!this.layout || !this.layout.zones) {
            console.log('No layout or zones available for rendering');
            return;
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid if enabled
        if (this.showGrid) {
            this.drawGrid();
        }
        
        // Draw zones
        if (Array.isArray(this.layout.zones)) {
            this.layout.zones.forEach(zone => {
                this.drawZone(zone, zone === this.selectedZone);
            });
        }
        
        // Draw selection handles
        if (this.selectedZone && this.currentTool === 'resize') {
            this.drawResizeHandles(this.selectedZone);
        }
        
        // Draw area selection rectangle
        if (this.isAreaSelecting) {
            this.drawSelectionRect();
        }
        
        // Draw multi-selection highlights
        if (this.selectedZones.length > 1) {
            this.drawMultiSelection();
        }
        
        console.log('Rendered layout with', this.layout.zones.length, 'zones');
    }
    
    // Area Selection Helper Methods
    updateSelectionRect() {
        const startX = Math.min(this.selectionStart.x, this.selectionEnd.x);
        const startY = Math.min(this.selectionStart.y, this.selectionEnd.y);
        const endX = Math.max(this.selectionStart.x, this.selectionEnd.x);
        const endY = Math.max(this.selectionStart.y, this.selectionEnd.y);
        
        this.selectionRect = {
            x: startX,
            y: startY,
            width: endX - startX,
            height: endY - startY
        };
    }
    
    getZonesInRect(rect) {
        const selectedZones = [];
        
        this.layout.zones.forEach(zone => {
            // Check if zone intersects with selection rectangle
            const zoneLeft = zone.x;
            const zoneRight = zone.x + zone.width;
            const zoneTop = zone.y;
            const zoneBottom = zone.y + zone.height;
            
            const rectLeft = rect.x;
            const rectRight = rect.x + rect.width;
            const rectTop = rect.y;
            const rectBottom = rect.y + rect.height;
            
            // Check for intersection
            if (zoneLeft < rectRight && zoneRight > rectLeft &&
                zoneTop < rectBottom && zoneBottom > rectTop) {
                selectedZones.push(zone);
            }
        });
        
        return selectedZones;
    }
    
    drawSelectionRect() {
        if (this.selectionRect.width === 0 && this.selectionRect.height === 0) return;
        
        // Selection rectangle background
        this.ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
        this.ctx.fillRect(this.selectionRect.x, this.selectionRect.y, this.selectionRect.width, this.selectionRect.height);
        
        // Selection rectangle border
        this.ctx.strokeStyle = '#3498db';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(this.selectionRect.x, this.selectionRect.y, this.selectionRect.width, this.selectionRect.height);
        this.ctx.setLineDash([]); // Reset dash pattern
    }
    
    drawMultiSelection() {
        this.selectedZones.forEach(zone => {
            if (zone !== this.selectedZone) {
                // Draw highlight for multi-selected zones
                this.ctx.strokeStyle = '#e74c3c';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([3, 3]);
                this.ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
                this.ctx.setLineDash([]); // Reset dash pattern
            }
        });
    }
    
    showMultiZoneProperties() {
        const panel = document.getElementById('propertyPanel');
        
        if (this.selectedZones.length === 0) {
            this.hideZoneProperties();
            return;
        }
        
        if (this.selectedZones.length === 1) {
            this.showZoneProperties(this.selectedZones[0]);
            return;
        }
        
        // Show multi-zone properties
        const zoneTypes = [...new Set(this.selectedZones.map(z => z.type))];
        const totalCapacity = this.selectedZones.reduce((sum, z) => sum + (z.capacity || 0), 0);
        
        panel.innerHTML = `
            <div class="zone-properties">
                <h4>Multiple Zones Selected (${this.selectedZones.length})</h4>
                <div class="property-group">
                    <label>Zone Types:</label>
                    <div class="multi-zone-info">${zoneTypes.join(', ')}</div>
                </div>
                <div class="property-group">
                    <label>Total Capacity:</label>
                    <div class="multi-zone-info">${totalCapacity}</div>
                </div>
                <div class="property-group">
                    <label>Zone IDs:</label>
                    <div class="multi-zone-list">
                        ${this.selectedZones.map(z => `<span class="zone-tag">${z.id}</span>`).join(' ')}
                    </div>
                </div>
                <div class="property-actions">
                    <button class="btn btn-secondary" onclick="layoutEditor.duplicateSelectedZones()">Duplicate All</button>
                    <button class="btn btn-primary" onclick="layoutEditor.deleteSelectedZones()">Delete All</button>
                    <button class="btn btn-secondary" onclick="layoutEditor.copySelectedZones()">Copy</button>
                    <button class="btn btn-secondary" onclick="layoutEditor.moveSelectedZones()">Move Together</button>
                </div>
            </div>
        `;
    }
    
    // Multi-zone Operations
    deleteSelectedZones() {
        if (this.selectedZones.length === 0) {
            this.showNotification('No zones selected for deletion', 'error');
            return;
        }
        
        const count = this.selectedZones.length;
        if (!confirm(`Are you sure you want to delete ${count} selected zones?`)) {
            return;
        }
        
        // Save state for undo
        this.saveToHistory();
        
        // Remove all selected zones
        this.selectedZones.forEach(zone => {
            const index = this.layout.zones.indexOf(zone);
            if (index > -1) {
                this.layout.zones.splice(index, 1);
            }
        });
        
        // Clear selection
        this.selectedZones = [];
        this.selectedZone = null;
        this.hideZoneProperties();
        
        this.render();
        this.applyToSimulator();
        this.showNotification(`Deleted ${count} zones`, 'success');
    }
    
    duplicateSelectedZones() {
        if (this.selectedZones.length === 0) {
            this.showNotification('No zones selected for duplication', 'error');
            return;
        }
        
        // Save state for undo
        this.saveToHistory();
        
        const newZones = [];
        this.selectedZones.forEach(zone => {
            const newZone = JSON.parse(JSON.stringify(zone));
            newZone.id = `${newZone.type}${this.zoneIdCounter++}`;
            newZone.x += 20;
            newZone.y += 20;
            
            this.layout.zones.push(newZone);
            newZones.push(newZone);
        });
        
        // Select the duplicated zones
        this.selectedZones = newZones;
        this.selectedZone = newZones[0];
        
        this.render();
        this.showMultiZoneProperties();
        this.showNotification(`Duplicated ${newZones.length} zones`, 'success');
    }
    
    copySelectedZones() {
        if (this.selectedZones.length === 0) {
            this.showNotification('No zones selected for copying', 'error');
            return;
        }
        
        // Store in clipboard (simple implementation using browser storage)
        const clipboardData = {
            type: 'zones',
            zones: JSON.parse(JSON.stringify(this.selectedZones)),
            timestamp: Date.now()
        };
        
        localStorage.setItem('ssd_clipboard', JSON.stringify(clipboardData));
        this.showNotification(`Copied ${this.selectedZones.length} zones to clipboard`, 'success');
    }
    
    moveSelectedZones() {
        if (this.selectedZones.length === 0) {
            this.showNotification('No zones selected for moving', 'error');
            return;
        }
        
        this.showNotification('Click and drag to move selected zones together', 'info');
        
        // Switch to move tool and enable group move mode
        this.currentTool = 'move';
        this.groupMoveMode = true;
        
        // Update tool UI
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('[data-tool="move"]').classList.add('active');
        this.canvas.style.cursor = 'move';
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#e1e8ed';
        this.ctx.lineWidth = 1;
        
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        // Vertical lines
        for (let x = 0; x <= width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
    }
    
    drawZone(zone, isSelected = false) {
        const zoneType = this.zoneTypes[zone.type];
        
        // Handle unknown zone types gracefully
        if (!zoneType) {
            console.warn(`Unknown zone type: ${zone.type}. Using default styling.`);
            const defaultColor = '#95a5a6';
            
            // Zone background
            this.ctx.fillStyle = defaultColor + (isSelected ? '40' : '20');
            this.ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
            
            // Zone border
            this.ctx.strokeStyle = isSelected ? '#000' : defaultColor;
            this.ctx.lineWidth = isSelected ? 3 : 2;
            this.ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
            
            // Zone label
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                zone.id.toUpperCase(),
                zone.x + zone.width / 2,
                zone.y + 15
            );
            
            // Zone type (for unknown types)
            this.ctx.font = '10px Arial';
            this.ctx.fillText(
                zone.type || 'unknown',
                zone.x + zone.width / 2,
                zone.y + zone.height - 5
            );
            
            return;
        }
        
        // Zone background
        this.ctx.fillStyle = zoneType.color + (isSelected ? '40' : '20');
        this.ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        
        // Zone border
        this.ctx.strokeStyle = isSelected ? '#000' : zoneType.color;
        this.ctx.lineWidth = isSelected ? 3 : 2;
        this.ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
        
        // Zone label
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            zone.id.toUpperCase(),
            zone.x + zone.width / 2,
            zone.y + 15
        );
        
        // Zone capacity
        this.ctx.font = '10px Arial';
        this.ctx.fillText(
            `Cap: ${zone.capacity || 0}`,
            zone.x + zone.width / 2,
            zone.y + zone.height - 5
        );
    }
    
    drawResizeHandles(zone) {
        const handleSize = 8;
        const handles = [
            { x: zone.x, y: zone.y }, // NW
            { x: zone.x + zone.width, y: zone.y }, // NE
            { x: zone.x, y: zone.y + zone.height }, // SW
            { x: zone.x + zone.width, y: zone.y + zone.height }, // SE
            { x: zone.x + zone.width / 2, y: zone.y }, // N
            { x: zone.x + zone.width / 2, y: zone.y + zone.height }, // S
            { x: zone.x, y: zone.y + zone.height / 2 }, // W
            { x: zone.x + zone.width, y: zone.y + zone.height / 2 } // E
        ];
        
        this.ctx.fillStyle = '#3498db';
        this.ctx.strokeStyle = '#2980b9';
        this.ctx.lineWidth = 1;
        
        handles.forEach(handle => {
            this.ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
            this.ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
        });
    }
    
    applyToSimulator() {
        if (window.simulator) {
            window.simulator.stationLayout = JSON.parse(JSON.stringify(this.layout));
            window.simulator.render();
            
            if (window.configManager) {
                window.configManager.showNotification('Layout applied to simulation!', 'success');
            }
        }
    }
    
    exportLayout() {
        const exportData = {
            name: 'Custom Layout',
            version: '1.0',
            exportDate: new Date().toISOString(),
            layout: this.layout
        };
        
        if (window.configManager) {
            window.configManager.downloadJSON(exportData, `layout-${Date.now()}.json`);
        }
    }
    
    importLayout(data) {
        if (data.layout && Array.isArray(data.layout.zones)) {
            this.layout = data.layout;
            this.updateZoneIdCounter();
            this.selectedZone = null;
            this.hideZoneProperties();
            this.render();
            
            if (window.configManager) {
                window.configManager.showNotification('Layout imported successfully!', 'success');
            }
        }
    }
    
    handleFileUpload(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                if (file.type === 'application/json') {
                    const data = JSON.parse(e.target.result);
                    this.importLayout(data);
                } else if (file.type.startsWith('image/')) {
                    this.importBackgroundImage(e.target.result);
                } else {
                    if (window.configManager) {
                        window.configManager.showNotification('Unsupported file type', 'error');
                    }
                }
            } catch (error) {
                if (window.configManager) {
                    window.configManager.showNotification('Error reading file: ' + error.message, 'error');
                }
            }
        };
        
        if (file.type.startsWith('image/')) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    }
    
    importBackgroundImage(dataUrl) {
        const img = new Image();
        img.onload = () => {
            this.backgroundImage = img;
            this.render();
            
            if (window.configManager) {
                window.configManager.showNotification('Background image loaded', 'success');
            }
        };
        img.src = dataUrl;
    }
    
    switchToSimulation() {
        // Hide editor view, show simulation view
        document.getElementById('editorView').style.display = 'none';
        document.getElementById('simulationView').style.display = 'flex';
        
        // Update mode buttons
        document.getElementById('simulationMode').classList.add('active');
        document.getElementById('editorMode').classList.remove('active');
        
        // Apply current layout to simulator if it exists
        this.applyToSimulator();
    }
    
    switchToEditor() {
        // Hide simulation view, show editor view
        document.getElementById('simulationView').style.display = 'none';
        document.getElementById('editorView').style.display = 'flex';
        
        // Update mode buttons
        document.getElementById('editorMode').classList.add('active');
        document.getElementById('simulationMode').classList.remove('active');
        
        // Copy current layout from simulator
        if (window.simulator && window.simulator.stationLayout) {
            this.layout = JSON.parse(JSON.stringify(window.simulator.stationLayout));
            this.updateZoneIdCounter();
            this.render();
        }
    }
    
    // Template Management Methods
    showTemplateManager() {
        const templates = this.getSavedTemplates();
        const modal = this.createModal('Load Template', `
            <div class="template-manager">
                <div class="template-list">
                    ${templates.length === 0 ? '<p>No saved templates found.</p>' : 
                        templates.map(template => `
                            <div class="template-item" data-template-id="${template.id}">
                                <div class="template-info">
                                    <h4>${template.name}</h4>
                                    <p>Version: ${template.version} | Created: ${new Date(template.created).toLocaleDateString()}</p>
                                    <p>${template.zones.length} zones | ${template.description || 'No description'}</p>
                                </div>
                                <div class="template-actions">
                                    <button class="btn btn-primary" onclick="layoutEditor.loadTemplate('${template.id}')">Load</button>
                                    <button class="btn btn-secondary" onclick="layoutEditor.deleteTemplate('${template.id}')">Delete</button>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
                <div class="template-upload">
                    <h4>Upload Template</h4>
                    <input type="file" id="templateFileInput" accept=".json" />
                    <button class="btn btn-secondary" onclick="layoutEditor.uploadTemplate()">Upload File</button>
                </div>
            </div>
        `);
        document.body.appendChild(modal);
    }
    
    showSaveDialog() {
        const modal = this.createModal('Save Template', `
            <div class="save-template-dialog">
                <div class="property-group">
                    <label>Template Name:</label>
                    <input type="text" id="templateName" placeholder="Enter template name..." />
                </div>
                <div class="property-group">
                    <label>Description:</label>
                    <textarea id="templateDescription" placeholder="Optional description..." rows="3"></textarea>
                </div>
                <div class="property-group">
                    <label>Version:</label>
                    <input type="text" id="templateVersion" value="${this.getNextVersion()}" />
                </div>
                <div class="save-actions">
                    <button class="btn btn-primary" onclick="layoutEditor.saveTemplate()">Save Template</button>
                    <button class="btn btn-secondary" onclick="layoutEditor.closeModal()">Cancel</button>
                </div>
            </div>
        `);
        document.body.appendChild(modal);
    }
    
    exportCurrentLayout() {
        const templateData = {
            id: `template_${Date.now()}`,
            name: `Layout Export ${new Date().toLocaleDateString()}`,
            description: 'Exported layout',
            version: '1.0.0',
            created: new Date().toISOString(),
            zones: this.layout.zones,
            conveyors: this.layout.conveyors || []
        };
        
        const dataStr = JSON.stringify(templateData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${templateData.name.replace(/\s+/g, '_')}_${templateData.version}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showNotification('Template exported successfully!', 'success');
    }
    
    saveTemplate() {
        const nameInput = document.getElementById('templateName');
        const descInput = document.getElementById('templateDescription');
        const versionInput = document.getElementById('templateVersion');
        
        if (!nameInput || !descInput || !versionInput) {
            this.showNotification('Save form fields not found', 'error');
            return;
        }
        
        const name = nameInput.value.trim();
        const description = descInput.value.trim();
        const version = versionInput.value.trim();
        
        if (!name) {
            this.showNotification('Please enter a template name', 'error');
            nameInput.focus();
            return;
        }
        
        const templateData = {
            id: `template_${Date.now()}`,
            name: name,
            description: description,
            version: version || '1.0.0',
            created: new Date().toISOString(),
            zones: JSON.parse(JSON.stringify(this.layout.zones)),
            conveyors: JSON.parse(JSON.stringify(this.layout.conveyors || []))
        };
        
        this.saveTemplateToStorage(templateData);
        this.autoSaveCurrentLayout(); // Auto-save as well
        this.closeModal();
        this.showNotification(`Template "${name}" saved successfully!`, 'success');
    }
    
    loadTemplate(templateId) {
        const templates = this.getSavedTemplates();
        const template = templates.find(t => t.id === templateId);
        
        if (template) {
            this.layout = {
                zones: JSON.parse(JSON.stringify(template.zones)),
                conveyors: JSON.parse(JSON.stringify(template.conveyors || []))
            };
            this.updateZoneIdCounter();
            this.selectedZone = null;
            this.hideZoneProperties();
            this.render();
            this.closeModal();
            this.showNotification(`Template "${template.name}" loaded successfully!`, 'success');
        }
    }
    
    deleteTemplate(templateId) {
        if (confirm('Are you sure you want to delete this template?')) {
            let templates = this.getSavedTemplates();
            templates = templates.filter(t => t.id !== templateId);
            localStorage.setItem('ssd_templates', JSON.stringify(templates));
            
            // Refresh the template manager
            this.closeModal();
            this.showTemplateManager();
            this.showNotification('Template deleted successfully!', 'success');
        }
    }
    
    uploadTemplate() {
        const fileInput = document.getElementById('templateFileInput');
        if (!fileInput) {
            this.showNotification('File input not found', 'error');
            return;
        }
        
        const file = fileInput.files[0];
        
        if (!file) {
            this.showNotification('Please select a file to upload', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const templateData = JSON.parse(e.target.result);
                
                // Validate template structure - check for zones array
                if (!templateData.zones || !Array.isArray(templateData.zones)) {
                    // Try to handle different template formats
                    if (templateData.layout && templateData.layout.zones) {
                        // Handle wrapped format
                        templateData.zones = templateData.layout.zones;
                        templateData.conveyors = templateData.layout.conveyors || [];
                        templateData.cart_routes = templateData.layout.cart_routes || [];
                    } else {
                        throw new Error('Invalid template format - no zones array found');
                    }
                }
                
                // Add upload metadata
                templateData.id = `template_${Date.now()}`;
                templateData.name = templateData.name || `Uploaded Template ${new Date().toLocaleDateString()}`;
                templateData.version = templateData.version || '1.0.0';
                templateData.uploaded = new Date().toISOString();
                
                this.saveTemplateToStorage(templateData);
                this.closeModal();
                this.showTemplateManager(); // Refresh the template list
                this.showNotification(`Template "${templateData.name}" uploaded successfully!`, 'success');
                
            } catch (error) {
                console.error('Upload error:', error);
                this.showNotification(`Error reading template file: ${error.message}`, 'error');
            }
        };
        
        reader.onerror = () => {
            this.showNotification('Error reading file', 'error');
        };
        
        reader.readAsText(file);
    }
    
    // Template Storage Methods
    getSavedTemplates() {
        try {
            const saved = localStorage.getItem('ssd_templates');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error reading templates from localStorage:', error);
            return [];
        }
    }
    
    saveTemplateToStorage(templateData) {
        try {
            const templates = this.getSavedTemplates();
            templates.push(templateData);
            localStorage.setItem('ssd_templates', JSON.stringify(templates));
        } catch (error) {
            console.error('Error saving template to localStorage:', error);
            this.showNotification('Error saving template to browser storage', 'error');
        }
    }
    
    getNextVersion() {
        const templates = this.getSavedTemplates();
        if (templates.length === 0) return '1.0.0';
        
        const versions = templates.map(t => t.version || '1.0.0');
        const latest = versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0];
        
        const parts = latest.split('.');
        const patch = parseInt(parts[2] || 0) + 1;
        return `${parts[0]}.${parts[1]}.${patch}`;
    }
    
    // UI Helper Methods
    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="layoutEditor.closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
        
        return modal;
    }
    
    closeModal() {
        const modal = document.querySelector('.modal');
        if (modal) {
            document.body.removeChild(modal);
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 24px',
            borderRadius: '6px',
            color: 'white',
            fontSize: '14px',
            zIndex: '9999',
            minWidth: '250px',
            backgroundColor: type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'
        });
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }
    
    // Duplicate Last Created Zone - for Cmd+= shortcut
    duplicateLastCreatedZone() {
        if (!this.lastCreatedZoneType) {
            this.showNotification('No previous zone type to duplicate', 'info');
            return;
        }
        
        // Calculate new position (offset from last position)
        const offsetX = 40; // Offset to avoid overlapping
        const offsetY = 40;
        let newX = this.lastCreatedZonePosition.x + offsetX;
        let newY = this.lastCreatedZonePosition.y + offsetY;
        
        // Keep within canvas bounds
        const zoneType = this.zoneTypes[this.lastCreatedZoneType];
        if (newX + zoneType.minSize.width > this.canvas.width) {
            newX = 50; // Reset to left side
            newY = this.lastCreatedZonePosition.y + offsetY;
        }
        if (newY + zoneType.minSize.height > this.canvas.height) {
            newY = 50; // Reset to top
        }
        
        // Create the zone
        this.addZone(this.lastCreatedZoneType, newX, newY);
        
        this.showNotification(`Duplicated ${this.lastCreatedZoneType} zone`, 'success');
        console.log('Duplicated last created zone type:', this.lastCreatedZoneType);
    }
    
    // Auto-save and Persistence
    autoSaveCurrentLayout() {
        try {
            const autoSaveData = {
                id: 'auto_save',
                name: 'Auto-saved Layout',
                description: 'Automatically saved current layout',
                version: 'auto',
                created: new Date().toISOString(),
                zones: JSON.parse(JSON.stringify(this.layout.zones)),
                conveyors: JSON.parse(JSON.stringify(this.layout.conveyors || [])),
                isAutoSave: true
            };
            
            localStorage.setItem('ssd_current_layout', JSON.stringify(autoSaveData));
            console.log('Auto-saved current layout');
        } catch (error) {
            console.error('Error auto-saving layout:', error);
        }
    }
    
    loadLastSession() {
        try {
            const lastLayout = localStorage.getItem('ssd_current_layout');
            if (lastLayout) {
                const layoutData = JSON.parse(lastLayout);
                if (layoutData.zones && Array.isArray(layoutData.zones)) {
                    this.layout = {
                        zones: layoutData.zones,
                        conveyors: layoutData.conveyors || [],
                        cart_routes: layoutData.cart_routes || []
                    };
                    this.updateZoneIdCounter();
                    this.render();
                    this.showNotification('Restored last session layout', 'info');
                    return true;
                }
            }
        } catch (error) {
            console.error('Error loading last session:', error);
        }
        return false;
    }
    
    // Undo Functionality
    saveToHistory() {
        if (this.layout && this.layout.zones) {
            const state = {
                zones: JSON.parse(JSON.stringify(this.layout.zones)),
                conveyors: JSON.parse(JSON.stringify(this.layout.conveyors || [])),
                cart_routes: JSON.parse(JSON.stringify(this.layout.cart_routes || [])),
                timestamp: Date.now()
            };
            
            this.undoHistory.push(state);
            
            // Limit history size
            if (this.undoHistory.length > this.maxUndoHistory) {
                this.undoHistory.shift(); // Remove oldest entry
            }
            
            // Auto-save on any change
            this.autoSaveCurrentLayout();
            
            console.log('Saved state to undo history, total states:', this.undoHistory.length);
        }
    }
    
    undo() {
        if (this.undoHistory.length === 0) {
            this.showNotification('Nothing to undo', 'info');
            return;
        }
        
        const previousState = this.undoHistory.pop();
        
        if (previousState) {
            this.layout.zones = JSON.parse(JSON.stringify(previousState.zones));
            this.layout.conveyors = JSON.parse(JSON.stringify(previousState.conveyors));
            this.layout.cart_routes = JSON.parse(JSON.stringify(previousState.cart_routes));
            
            this.updateZoneIdCounter();
            this.selectedZone = null;
            this.hideZoneProperties();
            this.render();
            this.applyToSimulator();
            
            this.showNotification('Action undone', 'success');
            console.log('Undo completed, remaining history entries:', this.undoHistory.length);
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LayoutEditor.init());
} else {
    LayoutEditor.init();
}
