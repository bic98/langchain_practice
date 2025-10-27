# Revit MCP Server

A Model Context Protocol (MCP) server for creating and managing grids in Autodesk Revit, with interactive visualization in ChatGPT.

## Overview

This project provides a FastMCP-based server that exposes Revit grid creation APIs as MCP tools. It includes a React/TypeScript widget for visualizing the created grids in an interactive 2D canvas within ChatGPT.

## Features

- **Grid Creation Tools**
  - Create X-axis grids (vertical lines)
  - Create Y-axis grids (horizontal lines)
  - Create combined X & Y grids
  - Support for uniform and non-uniform (segmented) spacing
  - Custom labeling with numeric or alphabetic schemes

- **Grid Management**
  - Set vertical extents (heights) for all grids
  - Adjust grid margins and extents
  - Remove all grids

- **Interactive Visualization**
  - 2D canvas rendering with pan and zoom
  - Grid intersection highlighting
  - Real-time preview mode (dry-run)
  - Responsive layout with fullscreen support

## Project Structure

```
.
├── src/
│   ├── revit-grid/         # React widget components
│   │   ├── index.tsx       # Entry point
│   │   ├── revit-grid.tsx  # Main component
│   │   ├── GridCanvas.tsx  # Canvas rendering
│   │   ├── InfoPanel.tsx   # Information display
│   │   ├── types.ts        # TypeScript types
│   │   ├── utils.ts        # Utility functions
│   │   └── revit-grid.css  # Styles
│   ├── types.ts            # Global types
│   ├── use-*.ts            # React hooks
│   └── index.css           # Global styles
├── revit_mcp_server/
│   ├── main.py             # MCP server implementation
│   └── requirements.txt    # Python dependencies
├── assets/                 # Built widget HTML (generated)
├── package.json            # Node dependencies
├── vite.config.mts         # Vite build configuration
├── tsconfig.json           # TypeScript configuration
└── tailwind.config.ts      # Tailwind CSS configuration
```

## Setup

### Prerequisites

- **Python 3.9+** (for MCP server)
- **Node.js 18+** and **npm/pnpm** (for widget build)
- **Revit** (optional, for actual grid creation; mock implementation provided)

### Installation

1. **Install Node dependencies:**

```bash
npm install
# or
pnpm install
```

2. **Install Python dependencies:**

```bash
cd revit_mcp_server
pip install -r requirements.txt
# or use a virtual environment:
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Development

### Build the Widget

Build the React widget to generate HTML assets:

```bash
npm run build
```

This creates `assets/revit-grid.html` and related files.

### Run the Widget Dev Server

For widget development with hot reload:

```bash
npm run dev
```

Visit http://localhost:4444/revit-grid.html to preview the widget.

### Run the MCP Server

Start the MCP server (after building the widget):

```bash
cd revit_mcp_server
python main.py
```

The server runs on http://localhost:8000.

## Usage

### Available MCP Tools

1. **create-y-grids** - Create horizontal grids
   - Uniform or segmented spacing
   - Custom labels and prefixes
   - Preview mode support

2. **create-x-grids** - Create vertical grids
   - Uniform or segmented spacing
   - Custom labels and prefixes
   - Preview mode support

3. **create-xy-grids** - Create combined X & Y grids
   - Independent configuration for each axis
   - Auto-calculated extents with margins
   - Preview mode support

4. **set-grid-heights** - Set vertical extents
   - Bottom and top height in mm
   - Applies to all grids

5. **set-grid-margins** - Adjust grid margins
   - Independent control for all four sides
   - Extends or reduces grid lines

6. **remove-all-grids** - Delete all grids
   - Destructive operation (marked as such)
   - Preview mode support

### Example: Create Combined Grids

```python
# Via MCP tool call
{
  "tool": "create-xy-grids",
  "arguments": {
    "x_count": 6,
    "x_spacing": 6000,
    "x_prefix": "A-",
    "y_count": 5,
    "y_spacing": 7500,
    "y_prefix": "Y-",
    "y_label_scheme": "alpha",
    "margin": 3000,
    "dry_run": false
  }
}
```

The result will be visualized in the interactive widget showing all grid lines, labels, and intersections.

## Integration with Revit

The MCP server connects to your Revit instance via **pyRevit's HTTP routes API**.

### Architecture

```
ChatGPT ──MCP──> MCP Server ──HTTP──> pyRevit ──API──> Revit
                (Port 8000)          (172.17.7.178:48884)
```

### Quick Start

1. **Ensure pyRevit is running in Revit** at `http://172.17.7.178:48884`
2. **Test the connection**:
   ```bash
   python3 test_revit_connection.py
   ```
3. **Start the MCP server**:
   ```bash
   cd revit_mcp_server
   python3 main.py
   ```

The server will automatically connect to Revit and forward all requests.

### Configuration

**Default configuration** (connects to Revit at 172.17.7.178:8080):
```bash
cd revit_mcp_server
python3 main.py
```

**Custom Revit server URL**:
```bash
export REVIT_SERVER_URL="http://your-ip:port"
python3 main.py
```

**Mock mode** (testing without Revit):
```bash
export USE_MOCK=true
python3 main.py
```

See [REVIT_SETUP.md](REVIT_SETUP.md) for detailed integration guide.

## Configuration

### Grid Parameters

All measurements are in **millimeters (mm)**.

- **Spacing**: Distance between consecutive grids
- **Margins**: Extension beyond the calculated range
- **Heights**: Vertical extents (Z-axis range)
- **Labels**: Custom naming with prefixes and schemes (numeric/alpha)

### Display Modes

The widget supports three display modes:
- **inline**: Embedded in chat (default)
- **pip**: Picture-in-picture
- **fullscreen**: Full viewport

## Tech Stack

- **Backend**: FastMCP (Python), Uvicorn, Pydantic
- **Frontend**: React 18, TypeScript, Framer Motion
- **Build**: Vite, Tailwind CSS
- **Canvas**: HTML5 Canvas API

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Build and test
5. Submit a pull request

## Troubleshooting

### Widget not loading

- Ensure `npm run build` has been run
- Check that `assets/revit-grid.html` exists
- Verify CORS settings if accessing from different origin

### MCP server connection issues

- Confirm server is running on port 8000
- Check Python dependencies are installed
- Review server logs for errors

### Grid visualization issues

- Verify grid data format matches expected schema
- Check browser console for JavaScript errors
- Ensure coordinates are in mm and within reasonable ranges

## Contact

For questions or issues, please open a GitHub issue.
