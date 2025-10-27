# Revit MCP Server

Python FastMCP server for Revit grid operations.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run server
python main.py
```

Server will start on http://localhost:8000

## Configuration

### Environment Variables

- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)

### Widget Assets

The server expects widget HTML files in `../assets/revit-grid.html`. Build the widget first:

```bash
cd ..
npm run build
```

## API Endpoints

The server exposes MCP protocol endpoints:

- `POST /mcp/tools/list` - List available tools
- `POST /mcp/tools/call` - Call a tool
- `POST /mcp/resources/list` - List resources
- `POST /mcp/resources/read` - Read a resource

## Tools

### create-y-grids

Create horizontal grids (parallel to X-axis).

**Parameters:**
- `y0`: Starting Y coordinate (mm)
- `count`: Number of grids
- `spacing`: Spacing between grids (mm)
- `mode`: "uniform" or "segments"
- `segments`: Array of segment lengths (for non-uniform)
- `labels`: Custom label array
- `label_scheme`: "numeric" or "alpha"
- `x_min`, `x_max`: Grid extent in X direction (mm)
- `z`: Elevation (mm)
- `prefix`: Label prefix
- `start`: Starting number/letter
- `dry_run`: Preview without creating

### create-x-grids

Create vertical grids (parallel to Y-axis).

Similar parameters to `create-y-grids` but with `x0`, `x_count`, `y_min`, `y_max`.

### create-xy-grids

Create both X and Y grids in one operation.

**Parameters:**
- `x_mode`, `y_mode`: "uniform" or "segments"
- `x0`, `y0`: Starting coordinates
- `x_count`, `y_count`: Grid counts
- `x_spacing`, `y_spacing`: Grid spacing (mm)
- `x_segments`, `y_segments`: Segment arrays
- `x_labels`, `y_labels`: Custom labels
- `x_label_scheme`, `y_label_scheme`: Label schemes
- `x_prefix`, `y_prefix`: Label prefixes
- `x_start`, `y_start`: Starting indices
- `margin`: Auto-calculated extent margin (mm)
- `z`: Elevation (mm)
- `dry_run`: Preview mode

### set-grid-heights

Set vertical extents for all grids.

**Parameters:**
- `bottom_height`: Bottom elevation (mm)
- `top_height`: Top elevation (mm)
- `dry_run`: Preview mode

### set-grid-margins

Adjust grid margins.

**Parameters:**
- `left_margin`, `right_margin`: Horizontal margins (mm)
- `top_margin`, `bottom_margin`: Vertical margins (mm)
- `dry_run`: Preview mode

### remove-all-grids

Delete all grids from the project.

**Parameters:**
- `dry_run`: Preview mode

## Response Format

All tools return structured data in this format:

```json
{
  "ok": true,
  "status": "ok" | "preview" | "error",
  "count": 10,
  "created_x": [
    {"id": 1, "name": "A-1", "x": 0},
    ...
  ],
  "created_y": [
    {"id": 1, "name": "Y-A", "y": 0},
    ...
  ],
  "range": {
    "x_min": -3000,
    "x_max": 33000,
    "y_min": -3000,
    "y_max": 33000,
    "z": 0
  }
}
```

This data is automatically passed to the widget for visualization.

## Development

### Mock Mode

The server currently runs in mock mode, returning simulated data. To integrate with Revit:

1. Import your Revit API modules
2. Replace `mock_*` functions with actual Revit calls
3. Handle Revit document context and transactions

### Adding New Tools

1. Define a Pydantic model for input validation
2. Implement the handler function
3. Register in `_list_tools()` and `_call_tool_request()`

Example:

```python
class NewToolInput(BaseModel):
    param1: str = Field(..., description="Description")
    param2: int = Field(0, description="Description")

    model_config = ConfigDict(populate_by_name=True, extra="allow")

def handle_new_tool(data: Dict[str, Any]) -> Dict[str, Any]:
    # Implementation
    return {"ok": True, "result": "..."}

# Register in _call_tool_request()
if tool_name == "new-tool":
    payload = NewToolInput.model_validate(arguments)
    result_data = handle_new_tool(payload.model_dump())
```

## Dependencies

- `fastmcp`: FastMCP framework
- `uvicorn`: ASGI server
- `pydantic`: Data validation
- `mcp`: MCP protocol types
- `starlette`: CORS middleware

## License

MIT
