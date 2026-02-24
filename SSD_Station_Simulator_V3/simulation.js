// Amazon SSD Station Simulator - Core Simulation Engine

class StationSimulator {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        this.animationId = null;
        this.speed = 1;
        this.lastTime = 0;
        
        // Route cart management
        this.routeCarts = new Map(); // Track packages per route cart
        this.routeCartCapacity = 25; // Packages per cart
        
        // Station layout and zones - Updated for SSD flow with Route Carts
        this.stationLayout = {
            zones: [
                // Top row - Inbound to Induct
                { id: 'inbound', type: 'inbound', x: 50, y: 50, width: 150, height: 100, capacity: 100, current: 0 },
                { id: 'pick1', type: 'pick', x: 220, y: 50, width: 100, height: 80, capacity: 50, current: 0 },
                { id: 'pick2', type: 'pick', x: 220, y: 150, width: 100, height: 80, capacity: 50, current: 0 },
                { id: 'slam1', type: 'slam', x: 340, y: 50, width: 80, height: 60, capacity: 30, current: 0 },
                { id: 'slam2', type: 'slam', x: 340, y: 130, width: 80, height: 60, capacity: 30, current: 0 },
                { id: 'slam3', type: 'slam', x: 340, y: 210, width: 80, height: 60, capacity: 30, current: 0 },
                { id: 'conveyor', type: 'conveyor', x: 440, y: 110, width: 180, height: 50, capacity: 60, current: 0 },
                { id: 'induct1', type: 'induct', x: 640, y: 80, width: 80, height: 50, capacity: 25, current: 0 },
                { id: 'induct2', type: 'induct', x: 640, y: 150, width: 80, height: 50, capacity: 25, current: 0 },
                
                // Loading Docks
                { id: 'loading1', type: 'loading', x: 750, y: 450, width: 150, height: 60, capacity: 30, current: 0 },
                { id: 'loading2', type: 'loading', x: 750, y: 520, width: 150, height: 60, capacity: 30, current: 0 },
                { id: 'loading3', type: 'loading', x: 750, y: 590, width: 150, height: 60, capacity: 30, current: 0 },
                
                // Office
                { id: 'office', type: 'office', x: 50, y: 600, width: 100, height: 80, capacity: 15, current: 0 }
            ],
            conveyors: [
                { from: 'inbound', to: 'pick1', points: [{x: 230, y: 100}, {x: 280, y: 100}] },
                { from: 'inbound', to: 'pick2', points: [{x: 230, y: 110}, {x: 250, y: 200}, {x: 280, y: 230}] },
                { from: 'pick1', to: 'slam1', points: [{x: 400, y: 90}, {x: 450, y: 90}] },
                { from: 'pick2', to: 'slam2', points: [{x: 400, y: 230}, {x: 430, y: 200}, {x: 450, y: 200}] },
                { from: 'pick2', to: 'slam3', points: [{x: 400, y: 230}, {x: 430, y: 280}, {x: 450, y: 310}] },
                { from: 'slam1', to: 'conveyor', points: [{x: 550, y: 90}, {x: 580, y: 140}] },
                { from: 'slam2', to: 'conveyor', points: [{x: 550, y: 200}, {x: 580, y: 160}] },
                { from: 'slam3', to: 'conveyor', points: [{x: 550, y: 310}, {x: 580, y: 170}] },
                { from: 'conveyor', to: 'induct1', points: [{x: 780, y: 140}, {x: 800, y: 110}] },
                { from: 'conveyor', to: 'induct2', points: [{x: 780, y: 160}, {x: 800, y: 190}] },
                { from: 'staging1', to: 'loading1', points: [{x: 230, y: 370}, {x: 720, y: 340}] },
                { from: 'staging2', to: 'loading1', points: [{x: 460, y: 370}, {x: 720, y: 340}] },
                { from: 'staging3', to: 'loading2', points: [{x: 690, y: 370}, {x: 720, y: 440}] }
            ]
        };
        // Simulation entities
        this.packages = [];
        this.vehicles = [];
        this.workers = [];
        this.routes = [];
        
        // Configuration - Updated based on SSD Routing Guide
        this.config = {
            packageVolume: 500,
            numSectors: 15, // Sectors instead of routes
            staffCount: 25,
            sortCycleTime: 45,
            stationSize: 15000,
            loadingDocks: 8,
            sortPositions: 12,
            // SSD Route Constraints from guide
            maxVehicleCapacity: 25, // cu/ft
            maxPackageCount: 48,    // packages per route
            avgRouteLength: 240,    // 4 hours in minutes
            flexDrivers: true       // 100% Flex workforce
        };
        
        // Metrics
        this.metrics = {
            packagesProcessed: 0,
            totalProcessed: 0,
            packagesPerHour: 0,
            avgCycleTime: 0,
            activeRoutes: 0,
            trucksWaiting: 0,
            startTime: Date.now()
        };
        
        // Colors for different elements - Updated for SSD process
        this.colors = {
            inbound: '#3498db',
            pick: '#e67e22',
            slam: '#8e44ad',
            conveyor: '#95a5a6',
            induct: '#f39c12',
            routecart: '#e74c3c',
            staging: '#2ecc71',
            loading: '#27ae60',
            office: '#9b59b6',
            package: '#3498db', // Blue packages as requested
            vehicle: '#4ecdc4',
            worker: '#45b7d1'
        };
        
        // Route cart management
        this.routeCarts = new Map(); // Track packages per route cart
        this.routeCartCapacity = 25; // Packages per cart
    }
    
    generateRouteCarts() {
        const carts = [];
        const startX = 50;
        const startY = 280;
        const cartWidth = 60;
        const cartHeight = 40;
        const cols = 5;
        
        for (let i = 0; i < 15; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = startX + col * (cartWidth + 10);
            const y = startY + row * (cartHeight + 10);
            
            const cart = {
                id: `cart${String(i + 1).padStart(2, '0')}`,
                type: 'routecart',
                x: x,
                y: y,
                width: cartWidth,
                height: cartHeight,
                capacity: this.routeCartCapacity,
                current: 0,
                routeId: `R${String(i + 1).padStart(3, '0')}`,
                status: 'filling' // filling, ready, moving
            };
            
            carts.push(cart);
            this.routeCarts.set(cart.id, []);
        }
        
        return carts;
    }
    
    generateStagingLocations() {
        const locations = [];
        const startX = 200;
        const startY = 450;
        const locationWidth = 50;
        const locationHeight = 35;
        const cols = 9;
        
        for (let i = 0; i < 45; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = startX + col * (locationWidth + 5);
            const y = startY + row * (locationHeight + 5);
            const routeIndex = Math.floor(i / 3) + 1; // 3 locations per route
            
            locations.push({
                id: `staging${String(i + 1).padStart(2, '0')}`,
                type: 'staging',
                x: x,
                y: y,
                width: locationWidth,
                height: locationHeight,
                capacity: 15,
                current: 0,
                routeId: `R${String(routeIndex).padStart(3, '0')}`
            });
        }
        
        return locations;
    }
    
    static init() {
        window.simulator = new StationSimulator();
        window.simulator.setupCanvas();
        window.simulator.setupControls();
        window.simulator.initializeStation();
        window.simulator.render();
    }
    
    setupCanvas() {
        this.canvas = document.getElementById('stationCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set up high DPI canvas
        const devicePixelRatio = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * devicePixelRatio;
        this.canvas.height = rect.height * devicePixelRatio;
        this.ctx.scale(devicePixelRatio, devicePixelRatio);
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }
    
    setupControls() {
        // Play/Pause button
        document.getElementById('playPause').addEventListener('click', () => {
            this.toggleSimulation();
        });
        
        // Reset button
        document.getElementById('reset').addEventListener('click', () => {
            this.resetSimulation();
        });
        
        // Step button
        document.getElementById('step').addEventListener('click', () => {
            if (!this.isRunning) {
                this.step();
            }
        });
        
        // Speed slider
        const speedSlider = document.getElementById('speedSlider');
        speedSlider.addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value);
            document.getElementById('speedValue').textContent = this.speed + 'x';
        });
        
        // Configuration button (will be handled by config manager)
        document.getElementById('loadTemplate').addEventListener('click', () => {
            this.showConfigModal();
        });
    }
    
    initializeStation() {
        // Load MVP flow layout
        this.loadGroceryTemplate();
        
        // Initialize sectors and routes - SSD uses sector-based routing
        this.sectors = [];
        this.routes = [];
        
        // Create sectors (geographic divisions)
        for (let i = 0; i < this.config.numSectors; i++) {
            this.sectors.push({
                id: `S${String(i + 1).padStart(2, '0')}`,
                name: `Sector ${i + 1}`,
                bounds: this.generateSectorBounds(i),
                activeRoute: null,
                totalRoutes: 0
            });
        }
        
        // Create initial open routes (one per sector)
        this.sectors.forEach(sector => {
            const route = this.createNewRoute(sector.id);
            sector.activeRoute = route.id;
            this.routes.push(route);
        });
        
        // Initialize workers
        for (let i = 0; i < this.config.staffCount; i++) {
            this.workers.push({
                id: `W${String(i + 1).padStart(3, '0')}`,
                x: Math.random() * 900 + 50,
                y: Math.random() * 400 + 50,
                targetX: 0,
                targetY: 0,
                task: 'idle',
                zone: null,
                speed: 2 + Math.random()
            });
        }
        
        // Start package generation
        this.startPackageGeneration();
    }
    
    loadGroceryTemplate() {
        // MVP layout following flow: Inbound → Sort → Induct → Route Carts → Staging → Loading
        this.stationLayout = {
            zones: [
                { id: 'inbound_01', type: 'inbound', x: 80, y: 80, width: 140, height: 90, capacity: 100, current: 0 },
                { id: 'sort_01', type: 'sort', x: 280, y: 80, width: 140, height: 90, capacity: 80, current: 0 },
                { id: 'induct_01', type: 'induct', x: 480, y: 80, width: 140, height: 90, capacity: 25, current: 0 },
                { id: 'route_cart_01', type: 'routecart', x: 700, y: 60, width: 120, height: 80, capacity: 25, current: 0, routeId: 'R001', status: 'filling' },
                { id: 'route_cart_02', type: 'routecart', x: 700, y: 160, width: 120, height: 80, capacity: 25, current: 0, routeId: 'R002', status: 'filling' },
                { id: 'staging_01', type: 'staging', x: 900, y: 80, width: 140, height: 90, capacity: 60, current: 0, routeId: 'R001' },
                { id: 'loading_01', type: 'loading', x: 1080, y: 80, width: 140, height: 90, capacity: 40, current: 0 }
            ],
            conveyors: [
                { from: 'inbound_01', to: 'sort_01', points: [{x: 220, y: 125}, {x: 280, y: 125}] },
                { from: 'sort_01', to: 'induct_01', points: [{x: 420, y: 125}, {x: 480, y: 125}] },
                { from: 'staging_01', to: 'loading_01', points: [{x: 1040, y: 125}, {x: 1080, y: 125}] }
            ]
        };
        
        // Update colors for new zone types
        this.colors.chilled = '#5dade2';
        this.colors.frozen = '#aed6f1';
        this.colors.ambient = '#f7dc6f';
        this.colors.produce = '#82e0aa';
        this.colors.chilled_staging = '#48c9b0';
        this.colors.frozen_staging = '#85c1e9';
        this.colors.ambient_staging = '#f8c471';
        this.colors.cart_storage = '#d5a6bd';
        this.colors.problem_solve = '#ec7063';
        this.colors.cage_pick = '#bb8fce';
        this.colors.hazmat = '#f1948a';
        
        // Initialize route cart tracking for explicit carts
        this.routeCarts = new Map();
        this.stationLayout.zones
            .filter(z => z.type === 'routecart')
            .forEach(cart => this.routeCarts.set(cart.id, []));
        
        console.log('MVP layout loaded');
    }
    
    generateSectorBounds(sectorIndex) {
        // Generate geographic bounds for each sector (simplified for simulation)
        const cols = 3;
        const rows = 5;
        const col = sectorIndex % cols;
        const row = Math.floor(sectorIndex / cols);
        
        return {
            minLat: 47.6000 + (row * 0.02),
            maxLat: 47.6000 + ((row + 1) * 0.02),
            minLng: -122.3000 + (col * 0.03),
            maxLng: -122.3000 + ((col + 1) * 0.03)
        };
    }
    
    createNewRoute(sectorId) {
        const sector = this.sectors.find(s => s.id === sectorId);
        if (sector) {
            sector.totalRoutes++;
            
            return {
                id: `${sectorId}R${String(sector.totalRoutes).padStart(2, '0')}`,
                sectorId: sectorId,
                packagesAssigned: 0,
                packagesLoaded: 0,
                status: 'open', // open, closed, dispatched
                createTime: Date.now(),
                estimatedDuration: 0, // in minutes
                cubicCapacity: 0, // cu/ft used
                flexDriver: null,
                stagingZone: this.getRandomStagingZone()
            };
        }
    }
    
    // Simulate continuous routing - package assignment to sector/route
    assignPackageToSector(packageObj) {
        // Simulate K-NN algorithm for sector assignment
        const randomSector = this.sectors[Math.floor(Math.random() * this.sectors.length)];
        const activeRoute = this.routes.find(r => r.id === randomSector.activeRoute && r.status === 'open');
        
        if (activeRoute) {
            packageObj.route = activeRoute.id;
            packageObj.sector = randomSector.id;
            activeRoute.packagesAssigned++;
            activeRoute.cubicCapacity += this.estimatePackageVolume(packageObj);
            
            // Check route closure conditions (from SSD guide)
            this.evaluateRouteForClosure(activeRoute);
        }
    }
    
    estimatePackageVolume(packageObj) {
        // Estimate cubic volume based on package size
        const volumes = { small: 0.3, medium: 0.7, large: 1.2 };
        return volumes[packageObj.size] || 0.5;
    }
    
    evaluateRouteForClosure(route) {
        let shouldClose = false;
        let closureReason = '';
        
        // Container planning route closure reasons (from guide)
        if (route.cubicCapacity >= this.config.maxVehicleCapacity) {
            shouldClose = true;
            closureReason = 'Max Vehicle Capacity';
        }
        
        if (route.packagesAssigned >= this.config.maxPackageCount) {
            shouldClose = true;
            closureReason = 'Max Package Count';
        }
        
        // Route duration limit (4 hours = 240 minutes)
        if (route.estimatedDuration >= this.config.avgRouteLength) {
            shouldClose = true;
            closureReason = 'Max Route Length';
        }
        
        if (shouldClose) {
            this.closeRoute(route, closureReason);
        }
    }
    
    closeRoute(route, reason) {
        route.status = 'closed';
        route.closureReason = reason;
        route.closeTime = Date.now();
        
        // Find the sector and create a new open route
        const sector = this.sectors.find(s => s.id === route.sectorId);
        if (sector) {
            const newRoute = this.createNewRoute(sector.id);
            sector.activeRoute = newRoute.id;
            this.routes.push(newRoute);
            
            console.log(`Route ${route.id} closed: ${reason}. New route ${newRoute.id} opened for sector ${sector.id}`);
        }
    }

    getRandomStagingZone() {
        const stagingZones = this.stationLayout.zones.filter(z => z.type === 'staging');
        return stagingZones[Math.floor(Math.random() * stagingZones.length)].id;
    }
    
    startPackageGeneration() {
        // Generate packages based on configuration
        const packagesPerSecond = this.config.packageVolume / 3600;
        const interval = 1000 / packagesPerSecond;
        
        this.packageGenerator = setInterval(() => {
            if (this.isRunning) {
                this.generatePackage();
            }
        }, interval / this.speed);
    }
    
    generatePackage() {
        const inboundZone = this.stationLayout.zones.find(z => z.type === 'inbound');
        if (inboundZone && inboundZone.current < inboundZone.capacity) {
            
            const packageObj = {
                id: `PKG${Date.now()}${Math.floor(Math.random() * 1000)}`,
                x: inboundZone.x + Math.random() * inboundZone.width,
                y: inboundZone.y + Math.random() * inboundZone.height,
                targetX: 0,
                targetY: 0,
                route: this.routes[Math.floor(Math.random() * this.routes.length)].id,
                status: 'received',
                zone: 'inbound',
                createTime: Date.now(),
                size: Math.random() > 0.8 ? 'large' : 'small', // 80% small, 20% large ratio
                priority: Math.random() > 0.9 ? 'urgent' : 'normal'
            };
            
            this.packages.push(packageObj);
            inboundZone.current++;
            this.processPackageFlow(packageObj);
        }
    }
    
    processPackageFlow(packageObj) {
        // Simulate package flow through the station - SSD Process
        setTimeout(() => {
            if (this.isRunning) {
                this.moveToPick(packageObj);
            }
        }, (2000 + Math.random() * 1000) / this.speed);
    }
    
    moveToPick(packageObj) {
        const pickZones = this.stationLayout.zones.filter(z => z.type === 'pick' && z.current < z.capacity);
        if (pickZones.length > 0) {
            const targetZone = pickZones[Math.floor(Math.random() * pickZones.length)];
            
            packageObj.targetX = targetZone.x + Math.random() * targetZone.width;
            packageObj.targetY = targetZone.y + Math.random() * targetZone.height;
            packageObj.status = 'picking';
            packageObj.zone = targetZone.id;
            
            // Update zone capacity
            const inboundZone = this.stationLayout.zones.find(z => z.id === 'inbound');
            inboundZone.current--;
            targetZone.current++;
            
            // Move to slam after pick
            setTimeout(() => {
                if (this.isRunning) {
                    this.moveToSlam(packageObj);
                }
            }, (4000 + Math.random() * 2000) / this.speed);
        }
    }
    
    moveToSlam(packageObj) {
        const slamZones = this.stationLayout.zones.filter(z => z.type === 'slam' && z.current < z.capacity);
        if (slamZones.length > 0) {
            const targetZone = slamZones[Math.floor(Math.random() * slamZones.length)];
            
            // Update zone capacity - get current zone before changing packageObj.zone
            const currentZone = this.stationLayout.zones.find(z => z.id === packageObj.zone);
            if (currentZone) {
                currentZone.current--;
            }
            
            packageObj.targetX = targetZone.x + Math.random() * targetZone.width;
            packageObj.targetY = targetZone.y + Math.random() * targetZone.height;
            packageObj.status = 'slam';
            packageObj.zone = targetZone.id;
            targetZone.current++;
            
            // Move to conveyor after slam
            setTimeout(() => {
                if (this.isRunning) {
                    this.moveToConveyor(packageObj);
                }
            }, (3000 + Math.random() * 1500) / this.speed);
        }
    }
    
    moveToConveyor(packageObj) {
        const conveyorZone = this.stationLayout.zones.find(z => z.type === 'conveyor');
        if (conveyorZone && conveyorZone.current < conveyorZone.capacity) {
            packageObj.targetX = conveyorZone.x + Math.random() * conveyorZone.width;
            packageObj.targetY = conveyorZone.y + Math.random() * conveyorZone.height;
            packageObj.status = 'conveyor';
            
            // Update zone capacity
            const currentZone = this.stationLayout.zones.find(z => z.id === packageObj.zone);
            currentZone.current--;
            conveyorZone.current++;
            packageObj.zone = conveyorZone.id;
            
            // Move to induct after conveyor
            setTimeout(() => {
                if (this.isRunning) {
                    this.moveToInduct(packageObj);
                }
            }, (5000 + Math.random() * 3000) / this.speed);
        }
    }
    
    moveToInduct(packageObj) {
        const inductZones = this.stationLayout.zones.filter(z => z.type === 'induct' && z.current < z.capacity);
        if (inductZones.length > 0) {
            const targetZone = inductZones[Math.floor(Math.random() * inductZones.length)];
            
            packageObj.targetX = targetZone.x + Math.random() * targetZone.width;
            packageObj.targetY = targetZone.y + Math.random() * targetZone.height;
            packageObj.status = 'inducted';
            packageObj.zone = targetZone.id;
            
            // Update zone capacity
            const conveyorZone = this.stationLayout.zones.find(z => z.type === 'conveyor');
            conveyorZone.current--;
            targetZone.current++;
            
            // SSD Continuous Routing - Assign package to sector immediately upon induct
            this.assignPackageToSector(packageObj);
            
            // Move to route cart after induct
            setTimeout(() => {
                if (this.isRunning) {
                    this.moveToRouteCart(packageObj);
                }
            }, (2000 + Math.random() * 1000) / this.speed);
        }
    }
    
    moveToRouteCart(packageObj) {
        // Find all available route carts (any cart with space)
        const availableCarts = this.stationLayout.zones.filter(z => 
            z.type === 'routecart' && z.current < z.capacity
        );
        
        if (availableCarts.length > 0) {
            // RANDOM ROUTE SELECTION - distribute packages across all available carts
            const randomIndex = Math.floor(Math.random() * availableCarts.length);
            const routeCart = availableCarts[randomIndex];
            
            // Update package route to match the randomly selected cart
            packageObj.route = routeCart.routeId;
            
            packageObj.targetX = routeCart.x + Math.random() * routeCart.width;
            packageObj.targetY = routeCart.y + Math.random() * routeCart.height;
            packageObj.status = 'routing';
            
            // Update zone capacity
            const currentZone = this.stationLayout.zones.find(z => z.id === packageObj.zone);
            if (currentZone) {
                currentZone.current--;
            }
            routeCart.current++;
            packageObj.zone = routeCart.id;
            
            // Add to route cart tracking
            if (!this.routeCarts.has(routeCart.id)) {
                this.routeCarts.set(routeCart.id, []);
            }
            this.routeCarts.get(routeCart.id).push(packageObj);
            
            // Check if cart is full and move to staging
            if (routeCart.current >= routeCart.capacity) {
                setTimeout(() => {
                    this.moveCartToStaging(routeCart);
                }, 1000); // Brief delay to show cart filling up
            }
            
            console.log(`Package ${packageObj.id} randomly assigned to route cart ${routeCart.id} (${routeCart.current}/${routeCart.capacity})`);
        } else {
            // No available carts, wait and retry
            setTimeout(() => {
                if (this.isRunning) {
                    this.moveToRouteCart(packageObj);
                }
            }, 2000 / this.speed);
        }
    }
    
    moveCartToStaging(routeCart) {
        // Find available staging location for this route
        const stagingZone = this.stationLayout.zones.find(z => 
            z.type === 'staging' && 
            z.routeId === routeCart.routeId && 
            z.current === 0 // Available staging location
        );
        
        if (stagingZone) {
            // Move all packages from cart to staging
            const packages = this.routeCarts.get(routeCart.id) || [];
            
            packages.forEach(pkg => {
                pkg.targetX = stagingZone.x + Math.random() * stagingZone.width;
                pkg.targetY = stagingZone.y + Math.random() * stagingZone.height;
                pkg.status = 'staged';
                pkg.zone = stagingZone.id;
                
                // Update metrics
                const route = this.routes.find(r => r.id === pkg.route);
                if (route) {
                    route.packagesAssigned++;
                }
            });
            
            // Update zone capacities
            routeCart.current = 0;
            stagingZone.current = packages.length;
            
            // Clear cart
            this.routeCarts.set(routeCart.id, []);
            routeCart.status = 'empty';
            
            // Schedule packages for loading
            packages.forEach(pkg => {
                setTimeout(() => {
                    if (this.isRunning) {
                        this.moveToLoading(pkg);
                    }
                }, (8000 + Math.random() * 12000) / this.speed);
            });
        }
    }
    
    moveToStaging(packageObj) {
        const route = this.routes.find(r => r.id === packageObj.route);
        if (route) {
            const stagingZone = this.stationLayout.zones.find(z => z.id === route.stagingZone);
            
            if (stagingZone && stagingZone.current < stagingZone.capacity) {
                packageObj.targetX = stagingZone.x + Math.random() * stagingZone.width;
                packageObj.targetY = stagingZone.y + Math.random() * stagingZone.height;
                packageObj.status = 'staged';
                
                // Update zone capacities
                const currentZone = this.stationLayout.zones.find(z => z.id === packageObj.zone);
                currentZone.current--;
                stagingZone.current++;
                packageObj.zone = stagingZone.id;
                
                route.packagesAssigned++;
                
                // Move to loading
                setTimeout(() => {
                    if (this.isRunning) {
                        this.moveToLoading(packageObj);
                    }
                }, (5000 + Math.random() * 10000) / this.speed);
            }
        }
    }
    
    moveToLoading(packageObj) {
        const loadingZones = this.stationLayout.zones.filter(z => z.type === 'loading' && z.current < z.capacity);
        if (loadingZones.length > 0) {
            const targetZone = loadingZones[Math.floor(Math.random() * loadingZones.length)];
            
            packageObj.targetX = targetZone.x + Math.random() * targetZone.width;
            packageObj.targetY = targetZone.y + Math.random() * targetZone.height;
            packageObj.status = 'loading';
            
            // Update zone capacities
            const currentZone = this.stationLayout.zones.find(z => z.id === packageObj.zone);
            currentZone.current--;
            targetZone.current++;
            packageObj.zone = targetZone.id;
            
            // Complete package after loading
            setTimeout(() => {
                this.completePackage(packageObj);
            }, (8000 + Math.random() * 7000) / this.speed);
        }
    }
    
    completePackage(packageObj) {
        const zone = this.stationLayout.zones.find(z => z.id === packageObj.zone);
        if (zone) {
            zone.current--;
        }
        
        // Remove package and update metrics
        const packageIndex = this.packages.indexOf(packageObj);
        if (packageIndex > -1) {
            this.packages.splice(packageIndex, 1);
            
            const cycleTime = (Date.now() - packageObj.createTime) / 1000;
            this.metrics.totalProcessed++;
            this.metrics.packagesProcessed++;
            
            // Update average cycle time
            if (this.metrics.totalProcessed === 1) {
                this.metrics.avgCycleTime = cycleTime;
            } else {
                this.metrics.avgCycleTime = (this.metrics.avgCycleTime * (this.metrics.totalProcessed - 1) + cycleTime) / this.metrics.totalProcessed;
            }
            
            // Update route metrics
            const route = this.routes.find(r => r.id === packageObj.route);
            if (route) {
                route.packagesLoaded++;
            }
        }
    }
    
    updateWorkers() {
        this.workers.forEach(worker => {
            // Simple worker movement simulation
            if (Math.random() < 0.01) { // 1% chance to get new task
                const zones = this.stationLayout.zones.filter(z => z.type !== 'office');
                const targetZone = zones[Math.floor(Math.random() * zones.length)];
                worker.targetX = targetZone.x + Math.random() * targetZone.width;
                worker.targetY = targetZone.y + Math.random() * targetZone.height;
                worker.task = targetZone.type;
                worker.zone = targetZone.id;
            }
            
            // Move towards target
            const dx = worker.targetX - worker.x;
            const dy = worker.targetY - worker.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 2) {
                worker.x += (dx / distance) * worker.speed;
                worker.y += (dy / distance) * worker.speed;
            }
        });
    }
    
    updatePackages() {
        this.packages.forEach(pkg => {
            // Animate package movement
            const dx = pkg.targetX - pkg.x;
            const dy = pkg.targetY - pkg.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 1) {
                const speed = 3;
                pkg.x += (dx / distance) * speed;
                pkg.y += (dy / distance) * speed;
            }
        });
    }
    
    updateMetrics() {
        const currentTime = Date.now();
        const elapsed = (currentTime - this.metrics.startTime) / 1000 / 3600; // hours
        
        if (elapsed > 0) {
            this.metrics.packagesPerHour = Math.round(this.metrics.totalProcessed / elapsed);
        }
        
        this.metrics.activeRoutes = this.routes.filter(r => r.packagesAssigned > 0).length;
        
        // Update UI
        document.getElementById('packagesPerHour').textContent = this.metrics.packagesPerHour;
        document.getElementById('totalProcessed').textContent = this.metrics.totalProcessed;
        document.getElementById('activeRoutes').textContent = this.metrics.activeRoutes;
        document.getElementById('avgCycleTime').textContent = Math.round(this.metrics.avgCycleTime) + 's';
        
        // Update zone status
        this.updateZoneStatus();
    }
    
    updateZoneStatus() {
        const zones = ['inbound', 'sort', 'staging', 'loading'];
        
        zones.forEach(zoneType => {
            const zoneElements = this.stationLayout.zones.filter(z => z.type === zoneType);
            const totalCapacity = zoneElements.reduce((sum, z) => sum + z.capacity, 0);
            const totalCurrent = zoneElements.reduce((sum, z) => sum + z.current, 0);
            const utilization = totalCapacity > 0 ? Math.round((totalCurrent / totalCapacity) * 100) : 0;
            
            const statusElement = document.getElementById(`${zoneType}Status`);
            const capacityElement = document.getElementById(`${zoneType}Capacity`);
            
            if (statusElement && capacityElement) {
                capacityElement.textContent = utilization + '%';
                
                statusElement.className = 'zone-status-indicator';
                if (utilization > 80) {
                    statusElement.classList.add('error');
                } else if (utilization > 60) {
                    statusElement.classList.add('warning');
                }
            }
        });
        
        // Station capacity
        const totalPackages = this.packages.length;
        const maxCapacity = this.stationLayout.zones.reduce((sum, z) => sum + z.capacity, 0);
        const stationCapacity = Math.round((totalPackages / maxCapacity) * 100);
        document.getElementById('stationCapacity').textContent = stationCapacity + '%';
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw zones
        this.drawZones();
        
        // Draw conveyors
        this.drawConveyors();
        
        // Draw packages
        this.drawPackages();
        
        // Draw workers - DISABLED per user request (blue W objects)
        // this.drawWorkers();
        
        // Draw vehicles
        this.drawVehicles();
    }
    
    drawZones() {
        this.stationLayout.zones.forEach(zone => {
            const color = this.colors[zone.type] || '#95a5a6'; // Fallback color
            const utilization = zone.capacity > 0 ? zone.current / zone.capacity : 0;
            
            // Zone background
            this.ctx.fillStyle = color + '20'; // 20% opacity
            this.ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
            
            // Zone border
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
            
            // Enhanced visualization for route carts
            if (zone.type === 'routecart') {
                // Route cart fill level visualization
                if (utilization > 0) {
                    // Fill from bottom up with gradient effect
                    const fillHeight = zone.height * utilization;
                    const gradient = this.ctx.createLinearGradient(0, zone.y + zone.height, 0, zone.y);
                    gradient.addColorStop(0, '#e74c3c'); // Red bottom
                    gradient.addColorStop(0.5, '#f39c12'); // Orange middle  
                    gradient.addColorStop(1, '#2ecc71'); // Green top
                    
                    this.ctx.fillStyle = gradient;
                    this.ctx.fillRect(zone.x, zone.y + zone.height - fillHeight, zone.width, fillHeight);
                }
                
                // Route cart border - thicker for visibility
                this.ctx.strokeStyle = '#e74c3c';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
                
                // Route ID label
                this.ctx.fillStyle = '#2c3e50';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(
                    zone.routeId,
                    zone.x + zone.width / 2,
                    zone.y + zone.height / 2 - 5
                );
                
                // Capacity with visual emphasis
                this.ctx.font = 'bold 8px Arial';
                const capacityText = `${zone.current}/${zone.capacity}`;
                this.ctx.fillStyle = utilization > 0.8 ? '#e74c3c' : '#2c3e50';
                this.ctx.fillText(
                    capacityText,
                    zone.x + zone.width / 2,
                    zone.y + zone.height / 2 + 8
                );
                
                // Full cart indicator
                if (zone.current >= zone.capacity) {
                    this.ctx.fillStyle = '#e74c3c';
                    this.ctx.font = 'bold 8px Arial';
                    this.ctx.fillText('FULL!', zone.x + zone.width / 2, zone.y - 5);
                }
                
            } else {
                // Standard utilization indicator for other zones
                if (utilization > 0) {
                    this.ctx.fillStyle = color + '40';
                    this.ctx.fillRect(zone.x, zone.y + zone.height - 5, zone.width * utilization, 5);
                }
                
                // Zone label - adjust font size based on zone width
                this.ctx.fillStyle = '#2c3e50';
                const fontSize = Math.min(12, zone.width / 8); // Scale font with zone width
                this.ctx.font = `${fontSize}px Arial`;
                this.ctx.textAlign = 'center';
                
                // Zone name on first line
                const zoneName = zone.id.toUpperCase();
                this.ctx.fillText(
                    zoneName,
                    zone.x + zone.width / 2,
                    zone.y + zone.height / 2 - 5
                );
                
                // Capacity info on second line (smaller font)
                this.ctx.font = `${Math.max(8, fontSize - 2)}px Arial`;
                this.ctx.fillText(
                    `${zone.current}/${zone.capacity}`,
                    zone.x + zone.width / 2,
                    zone.y + zone.height / 2 + 8
                );
            }
        });
    }
    
    drawConveyors() {
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([]);
        
        this.stationLayout.conveyors.forEach(conveyor => {
            // Draw the main conveyor line
            this.ctx.beginPath();
            conveyor.points.forEach((point, index) => {
                if (index === 0) {
                    this.ctx.moveTo(point.x, point.y);
                } else {
                    this.ctx.lineTo(point.x, point.y);
                }
            });
            this.ctx.stroke();
            
            // Draw arrows to show direction
            for (let i = 0; i < conveyor.points.length - 1; i++) {
                const start = conveyor.points[i];
                const end = conveyor.points[i + 1];
                
                // Calculate arrow position (middle of segment)
                const midX = (start.x + end.x) / 2;
                const midY = (start.y + end.y) / 2;
                
                // Calculate arrow direction
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                
                if (length > 0) {
                    const unitX = dx / length;
                    const unitY = dy / length;
                    
                    // Draw arrow head
                    const arrowSize = 8;
                    this.ctx.fillStyle = '#e74c3c'; // Red arrow
                    this.ctx.beginPath();
                    this.ctx.moveTo(midX, midY);
                    this.ctx.lineTo(
                        midX - arrowSize * unitX + arrowSize * unitY * 0.5,
                        midY - arrowSize * unitY - arrowSize * unitX * 0.5
                    );
                    this.ctx.lineTo(
                        midX - arrowSize * unitX - arrowSize * unitY * 0.5,
                        midY - arrowSize * unitY + arrowSize * unitX * 0.5
                    );
                    this.ctx.closePath();
                    this.ctx.fill();
                }
            }
        });
        
        // Draw process flow labels
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        
        // Main flow indicators
        this.ctx.fillText('INBOUND → PICK', 150, 40);
        this.ctx.fillText('PICK → SLAM', 280, 40);
        this.ctx.fillText('SLAM → CONVEYOR', 400, 40);
        this.ctx.fillText('CONVEYOR → INDUCT', 560, 40);
        this.ctx.fillText('INDUCT → ROUTE CART', 400, 250);
        this.ctx.fillText('ROUTE CARTS → STAGING', 350, 400);
        this.ctx.fillText('STAGING → DRIVER LOADING', 650, 400);
    }
    
    drawPackages() {
        this.packages.forEach(pkg => {
            let color = this.colors.package;
            let size = 6;
            
            // Different colors/sizes based on package properties
            if (pkg.priority === 'urgent') {
                color = '#e74c3c';
            }
            
            if (pkg.size === 'large') {
                size = 8;
            } else if (pkg.size === 'small') {
                size = 4;
            }
            
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(pkg.x, pkg.y, size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Status indicator
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '8px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(pkg.status[0].toUpperCase(), pkg.x, pkg.y + 2);
        });
    }
    
    drawWorkers() {
        this.workers.forEach(worker => {
            this.ctx.fillStyle = this.colors.worker;
            this.ctx.beginPath();
            this.ctx.arc(worker.x, worker.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Worker ID
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '6px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('W', worker.x, worker.y + 1);
        });
    }
    
    drawVehicles() {
        // Draw delivery vehicles at loading docks
        const loadingZones = this.stationLayout.zones.filter(z => z.type === 'loading');
        loadingZones.forEach((zone, index) => {
            if (Math.random() < 0.7) { // 70% chance of vehicle presence
                const vehicleX = zone.x + zone.width + 10;
                const vehicleY = zone.y + zone.height / 2;
                
                this.ctx.fillStyle = this.colors.vehicle;
                this.ctx.fillRect(vehicleX, vehicleY - 8, 20, 16);
                
                // Vehicle label
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '8px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('V', vehicleX + 10, vehicleY + 2);
            }
        });
    }
    
    toggleSimulation() {
        this.isRunning = !this.isRunning;
        const button = document.getElementById('playPause');
        
        if (this.isRunning) {
            button.textContent = '⏸ Pause';
            button.classList.remove('btn-primary');
            button.classList.add('btn-secondary');
            this.animate();
        } else {
            button.textContent = '▶ Play';
            button.classList.remove('btn-secondary');
            button.classList.add('btn-primary');
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
        }
    }
    
    animate() {
        if (!this.isRunning) return;
        
        const currentTime = Date.now();
        if (currentTime - this.lastTime >= (16 / this.speed)) { // ~60fps adjusted for speed
            this.updatePackages();
            // this.updateWorkers(); // DISABLED per user request (blue W objects)
            this.updateMetrics();
            this.render();
            this.lastTime = currentTime;
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    step() {
        this.updatePackages();
        this.updateWorkers();
        this.updateMetrics();
        this.render();
    }
    
    resetSimulation() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Reset all data
        this.packages = [];
        this.vehicles = [];
        this.metrics = {
            packagesProcessed: 0,
            totalProcessed: 0,
            packagesPerHour: 0,
            avgCycleTime: 0,
            activeRoutes: 0,
            trucksWaiting: 0,
            startTime: Date.now()
        };
        
        // Reset zone capacities
        this.stationLayout.zones.forEach(zone => {
            zone.current = 0;
        });
        
        // Reset routes
        this.routes.forEach(route => {
            route.packagesAssigned = 0;
            route.packagesLoaded = 0;
        });
        
        // Reset UI
        const button = document.getElementById('playPause');
        button.textContent = '▶ Play';
        button.classList.remove('btn-secondary');
        button.classList.add('btn-primary');
        
        this.updateMetrics();
        this.render();
        
        console.log('Simulation reset');
    }
    
    showConfigModal() {
        document.getElementById('configModal').style.display = 'flex';
    }
    
    updateConfig(newConfig) {
        const prevNumSectors = this.config.numSectors;
        Object.assign(this.config, newConfig);
        
        // Update sectors/routes if sector count changed
        if (this.config.numSectors !== prevNumSectors) {
            this.sectors = [];
            this.routes = [];
            
            for (let i = 0; i < this.config.numSectors; i++) {
                this.sectors.push({
                    id: `S${String(i + 1).padStart(2, '0')}`,
                    name: `Sector ${i + 1}`,
                    bounds: this.generateSectorBounds(i),
                    activeRoute: null,
                    totalRoutes: 0
                });
            }
            
            this.sectors.forEach(sector => {
                const route = this.createNewRoute(sector.id);
                sector.activeRoute = route.id;
                this.routes.push(route);
            });
        }
        
        // Update workers if count changed
        if (this.workers.length !== this.config.staffCount) {
            this.workers = [];
            for (let i = 0; i < this.config.staffCount; i++) {
                this.workers.push({
                    id: `W${String(i + 1).padStart(3, '0')}`,
                    x: Math.random() * 900 + 50,
                    y: Math.random() * 400 + 50,
                    targetX: 0,
                    targetY: 0,
                    task: 'idle',
                    zone: null,
                    speed: 2 + Math.random()
                });
            }
        }
        
        // Restart package generation with new volume
        if (this.packageGenerator) {
            clearInterval(this.packageGenerator);
        }
        this.startPackageGeneration();
        
        console.log('Configuration updated:', this.config);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => StationSimulator.init());
} else {
    StationSimulator.init();
}
