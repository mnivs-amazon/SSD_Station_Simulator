# SSD Station Simulator V2

## Project Overview
Professional Amazon SSD (Same-Day Delivery) Station Simulator with advanced layout editing capabilities and comprehensive workflow management.

## Version 2 Features

### 🎯 Area Selection & Multi-Zone Operations
- **Trackpad Area Selection**: Click and drag to create selection rectangles
- **Real-time Highlighting**: Zones highlight as selection area overlaps them
- **Multi-Selection Support**: Cmd/Ctrl+click to add individual zones
- **Visual Feedback**: Blue selection rectangle with red dashed zone outlines

### ⌨️ Professional Keyboard Shortcuts
- **Delete**: Removes selected zones (single or multiple with confirmation)
- **Cmd+= / Ctrl+=**: Duplicates last created zone type at smart position
- **Cmd+- / Ctrl+-**: Alternative delete shortcut
- **Cmd+Z / Ctrl+Z**: Comprehensive undo (50-state history)
- **Escape**: Universal reset to select tool
- **Cmd+A / Ctrl+A**: Select all zones
- **Cmd+D / Ctrl+D**: Duplicate selected zones
- **Cmd+C / Ctrl+C**: Copy zones to clipboard

### 🔧 Advanced Tools
- **🖱 Select Tool**: Primary selection with area drag capability
- **✋ Move Tool**: Individual and group movement with snap-to-grid
- **🔄 Resize Tool**: Zone resizing with handles and minimum size constraints
- **🗑️ Delete Tool**: Point-and-click deletion with custom cursor
- **➕ Add Zones**: 17 zone types for complete Amazon SSD operations

### 🎨 Intelligent Tool Auto-Application
- **Area Select → Tool Click**: Instantly applies tools to all selected zones
- **Smart Detection**: Automatically handles single vs. multi-zone operations
- **Group Operations**: Move, delete, duplicate multiple zones simultaneously

### 📁 Template Management
- **Save Templates**: Name, describe, and version control layouts
- **Load Templates**: Access saved layouts from browser storage
- **Import/Export**: JSON file support for sharing layouts
- **Auto-Save**: Session persistence prevents work loss

### 🚫 Clean Simulation
- **No Distractions**: Removed blue "W" worker objects per user request
- **Package Flow Focus**: Clear red package visualization through zones
- **Real-time Metrics**: Capacity utilization and throughput monitoring

## File Structure
```
SSD Station Simulator V2/
├── index.html              # Main application entry point
├── simulation.js           # Core simulation engine
├── layout-editor.js        # Advanced layout editor with area selection
├── config-manager.js       # Configuration and template management
├── file-handler.js         # File import/export functionality
├── styles.css             # Application styling
├── templates/             # Pre-built station templates
│   ├── default-ssd-station.json
│   └── sfl1-grocery-station.json
└── README_V2.md           # This documentation
```

## Quick Start
1. Open `index.html` in a web browser
2. Switch between Simulation and Layout Editor modes
3. Use area selection: drag rectangle → click tool → instant application
4. Press Escape anytime to reset to clean select state
5. Use Cmd+= to duplicate the last created zone type

## Amazon SSD Workflow Support
- **Route Closure Integration**: Cart staging and van loading workflows  
- **Multi-Temperature Operations**: Chilled, frozen, ambient, and produce zones
- **Capacity Management**: Real-time zone utilization tracking
- **Scalable Design**: Support for various station sizes and configurations

## Technical Highlights
- **50-State Undo System**: Comprehensive history tracking
- **Cross-Platform Shortcuts**: Full Mac (Cmd) and PC (Ctrl) support
- **Performance Optimized**: Smooth animation and responsive interactions
- **Error-Free Operation**: Robust handling of all edge cases
- **Professional UI**: CAD-like editing experience

## Development Notes
This V2 version represents a complete professional-grade layout design tool optimized for Amazon SSD station operations. All core functionality has been implemented and tested, ready for advanced feature development.

---
**Created**: December 9, 2025  
**Version**: 2.0  
**Status**: Production Ready
