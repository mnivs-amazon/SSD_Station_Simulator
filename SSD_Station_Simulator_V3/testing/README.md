# Amazon Sub Same Day Station Simulator

A comprehensive HTML-based simulation tool for Amazon Sub Same Day (SSD) delivery station operations, featuring real-time package flow animation, customizable layouts, and operational analytics.

## 🚀 Features

### Core Simulation
- **Multi-Temperature Operations**: Support for chilled, frozen, ambient, and produce handling
- **Grocery-Specific Zones**: Chilled storage (45 doors), frozen storage (18 doors), produce areas
- **Temperature-Controlled Staging**: Separate staging for chilled (46 doors), frozen (18 doors), ambient (9 racks)
- **Unidirectional Package Flow**: Packages move in one direction only (Inbound → Storage → Staging → Loading)
- **Real-time Package Flow**: Animated package movement through all operational zones
- **Cart Management Systems**: SSD carts, grocery carts, and empty cart storage areas
- **Problem Resolution**: Dedicated problem solve and cage pick areas
- **Hazmat Handling**: Specialized hazmat storage and processing zones
- **Operational Metrics**: Live tracking of packages/hour, cycle times, capacity utilization
- **Zone Status Monitoring**: Real-time status indicators for all operational areas
- **Worker Simulation**: Animated associates moving between stations
- **Vehicle Operations**: Delivery truck simulation at loading docks

### Layout Customization
- **Drag-and-Drop Editor**: Intuitive interface to modify station layouts
- **Zone Management**: Add, resize, move, and delete operational zones
- **Background Import**: Upload facility floor plans as reference images
- **Grid Snap**: Precise positioning with optional grid alignment
- **Property Editor**: Detailed configuration for each zone

### Configuration Management
- **Scenario Templates**: Pre-built configurations for different operational volumes
- **Save/Load Templates**: Create and reuse custom station configurations
- **Import/Export**: JSON and CSV data exchange capabilities
- **Operational Parameters**: Adjustable package volumes, staffing, cycle times

### File Operations
- **Drag-and-Drop Support**: Easy file import by dropping onto the interface
- **Multiple Formats**: Support for JSON configurations, CSV data, and images
- **Background Images**: Import facility layouts and floor plans
- **Data Export**: Export configurations and operational data

## 📋 Getting Started

### Quick Start
1. Open `index.html` in a modern web browser
2. Click the **Play** button to start the simulation
3. Watch packages flow through the station in real-time
4. Use the **Layout Editor** tab to customize the station layout

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Minimum screen resolution: 1024x768
- Recommended: 1920x1080 or higher

## 🎮 User Interface

### Main Controls
- **Play/Pause**: Start or stop the simulation
- **Reset**: Clear all packages and restart
- **Step**: Advance simulation one frame (when paused)
- **Speed Control**: Adjust simulation speed (0.25x to 4x)

### View Modes
- **Simulation Mode**: Watch real-time operations
- **Layout Editor**: Customize station layout and zones

### Configuration Panel
- **Operational Tab**: Package volume, routes, staffing levels
- **Layout Tab**: Station size, loading docks, sort positions  
- **Scenarios Tab**: Quick configurations for different operational states

## 🏗️ Layout Editor

### Tools
- **Select**: Choose and inspect zones
- **Move**: Drag zones to new positions
- **Resize**: Adjust zone dimensions
- **Add Zone**: Create new operational areas

### Zone Types
- **Inbound**: Package receiving areas
- **Sort**: Package sorting stations
- **Staging**: Route-specific staging areas
- **Loading**: Truck loading docks
- **Office**: Administrative and support areas

### Editing Features
- **Grid Snapping**: Align zones to grid for precise positioning
- **Property Panel**: Edit zone properties (capacity, dimensions, etc.)
- **Duplicate**: Copy existing zones
- **Context Menu**: Right-click for additional options

## ⚙️ Configuration Options

### Operational Parameters
- **Package Volume**: 100-2000 packages per hour
- **Number of Routes**: 5-50 delivery routes
- **Staff Count**: 10-100 associates
- **Sort Cycle Time**: 20-180 seconds per package
- **Station Size**: 5,000-50,000 square feet
- **Loading Docks**: 2-20 dock doors
- **Sort Positions**: 4-30 sorting stations

### Scenario Presets
- **Normal Operations**: Typical daily volume (500 pkg/hr, 20 routes, 25 staff)
- **Peak Volume**: High-demand periods (1200 pkg/hr, 35 routes, 40 staff)  
- **Low Volume**: Off-peak operations (200 pkg/hr, 12 routes, 15 staff)
- **Custom**: User-defined parameters

## 📁 File Operations

### Supported File Types
- **JSON**: Configuration files (.json)
- **CSV**: Operational data (.csv)
- **Images**: Floor plans (.jpg, .png, .gif, .webp)
- **PDF**: Documentation (acknowledged, not parsed)

### Import Methods
1. **Drag and Drop**: Drag files onto the interface
2. **File Browser**: Click "Upload Layout" button
3. **Template Loading**: Use saved configuration templates

### Export Options
- **Configuration Export**: Complete station setup as JSON
- **Layout Export**: Zone configuration and positioning
- **Data Export**: Operational metrics and statistics
- **CSV Export**: Zone data in spreadsheet format

## 📊 Metrics and Analytics

### Real-time Metrics
- **Packages per Hour**: Current processing rate
- **Total Processed**: Cumulative package count
- **Active Routes**: Routes currently receiving packages
- **Average Cycle Time**: Mean time from inbound to outbound
- **Station Capacity**: Overall utilization percentage
- **Trucks Waiting**: Vehicles queued for loading

### Zone Status Indicators
- **Green (●)**: Normal operations (< 60% capacity)
- **Yellow (●)**: High utilization (60-80% capacity)
- **Red (●)**: Overcapacity (> 80% capacity)

### Performance Tracking
- Package flow bottlenecks
- Zone utilization patterns
- Worker distribution
- Route assignment efficiency

## 🔧 Customization Guide

### Creating Custom Layouts
1. Switch to Layout Editor mode
2. Use zone tools to modify the layout
3. Adjust zone properties via the property panel
4. Save as template for future use

### Importing Floor Plans
1. Prepare floor plan image (PNG, JPG recommended)
2. Switch to Layout Editor mode
3. Drag image file onto the interface
4. Position zones over the background image

### Configuration Templates
1. Set up desired operational parameters
2. Click "Save Template" button
3. Enter template name and description
4. Template saved to browser local storage

### Data Integration
1. Export operational data as CSV
2. Analyze in Excel or other tools
3. Import modified configurations back
4. Compare different operational scenarios

## 🎯 Use Cases

### Training and Education
- Warehouse operations training
- Process flow demonstration
- Capacity planning exercises
- Operational efficiency concepts

### Planning and Design
- Station layout optimization
- Capacity requirement analysis
- Workflow bottleneck identification
- Equipment placement planning

### Analysis and Optimization
- Process improvement identification
- Resource allocation planning
- Performance benchmarking
- Scenario comparison

## 🛠️ Technical Details

### Architecture
- **Frontend-only**: Pure HTML, CSS, JavaScript
- **No dependencies**: Runs without external libraries
- **Canvas-based**: Smooth 60fps animations
- **Responsive**: Adapts to different screen sizes

### Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Performance
- Optimized rendering engine
- Efficient memory management
- Smooth animations up to 4x speed
- Handles 100+ simultaneous packages

### Data Storage
- Browser localStorage for templates
- JSON-based configuration format
- No server required
- Export for backup/sharing

## 📝 Configuration Examples

### Basic Station Layout
```json
{
  "zones": [
    {
      "id": "inbound",
      "type": "inbound",
      "x": 50,
      "y": 50,
      "width": 200,
      "height": 150,
      "capacity": 100
    },
    {
      "id": "sort1",
      "type": "sort",
      "x": 300,
      "y": 50,
      "width": 150,
      "height": 100,
      "capacity": 80
    }
  ]
}
```

### Operational Configuration
```json
{
  "config": {
    "packageVolume": 500,
    "numRoutes": 20,
    "staffCount": 25,
    "sortCycleTime": 45,
    "stationSize": 15000,
    "loadingDocks": 8
  }
}
```

### CSV Zone Import Format
```csv
id,type,x,y,width,height,capacity
inbound,inbound,50,50,200,150,100
sort1,sort,300,50,150,100,80
staging1,staging,500,50,180,120,60
```

## 🤝 Contributing

### Development Setup
1. Clone or download the project
2. Open `index.html` in browser
3. Modify JavaScript files for enhancements
4. Test across different browsers

### Code Structure
- `index.html`: Main application interface
- `styles.css`: Styling and layout
- `simulation.js`: Core simulation engine
- `config-manager.js`: Configuration management
- `layout-editor.js`: Visual layout editor
- `file-handler.js`: Import/export operations

### Adding Features
1. Identify the appropriate JavaScript module
2. Follow existing code patterns and naming
3. Add UI elements to `index.html` if needed
4. Update styles in `styles.css` for visual elements
5. Test thoroughly with different configurations

## 📄 License

This project is provided as-is for educational and demonstration purposes. 

## 🆘 Support

### Troubleshooting
- **Performance Issues**: Reduce package volume or simulation speed
- **Layout Problems**: Reset to default template and rebuild
- **File Import Errors**: Check file format and size limits
- **Browser Compatibility**: Use latest browser version

### FAQ
**Q: Can I run this offline?**  
A: Yes, all files are local - no internet connection required.

**Q: How do I backup my configurations?**  
A: Use the Export button to save configurations as JSON files.

**Q: Can I modify the code?**  
A: Yes, all source code is available and modifiable.

**Q: What's the maximum station size?**  
A: The simulator can handle stations up to 50,000 sq ft with 100+ zones.

### Getting Help
- Check browser console for error messages
- Verify file formats match supported types
- Ensure browser JavaScript is enabled
- Try resetting to default configuration

---

**Built for Amazon Sub Same Day Operations**  
*Simulate, Analyze, Optimize* 🚚📦
