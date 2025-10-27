"""Revit Grid MCP Server implemented with the Python FastMCP helper.

This server provides tools for creating and managing grids in Revit through
MCP protocol. Each tool returns structured data that can be visualized using
the revit-grid widget.
"""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional
from copy import deepcopy
import os

import mcp.types as types
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, ConfigDict, Field, ValidationError

# Import Revit API client
from revit_client import get_revit_client, is_revit_available


MIME_TYPE = "text/html+skybridge"
ASSETS_DIR = Path(__file__).resolve().parent.parent / "assets"


@dataclass(frozen=True)
class RevitWidget:
    identifier: str
    title: str
    template_uri: str
    invoking: str
    invoked: str
    html: str
    response_text: str


@lru_cache(maxsize=None)
def _load_widget_html(component_name: str) -> str:
    """Load widget HTML from assets directory."""
    html_path = ASSETS_DIR / f"{component_name}.html"
    if html_path.exists():
        return html_path.read_text(encoding="utf8")

    fallback_candidates = sorted(ASSETS_DIR.glob(f"{component_name}-*.html"))
    if fallback_candidates:
        return fallback_candidates[-1].read_text(encoding="utf8")

    raise FileNotFoundError(
        f'Widget HTML for "{component_name}" not found in {ASSETS_DIR}. '
        "Run the build process to generate the assets before starting the server."
    )


WIDGET = RevitWidget(
    identifier="revit-grid-viewer",
    title="Revit Grid Visualization",
    template_uri="ui://widget/revit-grid.html",
    invoking="Generating grid layout",
    invoked="Grid layout ready",
    html=_load_widget_html("revit-grid"),
    response_text="Grid visualization ready",
)


# Schema models for grid operations
class GridYInput(BaseModel):
    """Schema for Y-axis grid creation."""
    y0: float = Field(0, description="Starting Y coordinate in mm")
    count: int = Field(5, description="Number of grids")
    spacing: float = Field(6000, description="Spacing between grids in mm")
    mode: str = Field("uniform", description="Grid mode: 'uniform' or 'segments'")
    segments: List[float] = Field(default_factory=list, description="Segment lengths for non-uniform mode")
    labels: List[str] = Field(default_factory=list, description="Custom labels for grids")
    label_scheme: str = Field("numeric", description="Label scheme: 'numeric' or 'alpha'")
    x_min: float = Field(-20000, description="Minimum X extent in mm")
    x_max: float = Field(20000, description="Maximum X extent in mm")
    z: float = Field(0, description="Z elevation in mm")
    prefix: str = Field("G-", description="Prefix for grid labels")
    start: int = Field(1, description="Starting number/letter for labels")
    dry_run: bool = Field(False, description="Preview mode without creating grids")

    model_config = ConfigDict(populate_by_name=True, extra="allow")


class GridXInput(BaseModel):
    """Schema for X-axis grid creation."""
    x0: float = Field(0, description="Starting X coordinate in mm")
    count: int = Field(5, description="Number of grids")
    spacing: float = Field(6000, description="Spacing between grids in mm")
    mode: str = Field("uniform", description="Grid mode: 'uniform' or 'segments'")
    segments: List[float] = Field(default_factory=list, description="Segment lengths for non-uniform mode")
    labels: List[str] = Field(default_factory=list, description="Custom labels for grids")
    label_scheme: str = Field("numeric", description="Label scheme: 'numeric' or 'alpha'")
    y_min: float = Field(-20000, description="Minimum Y extent in mm")
    y_max: float = Field(20000, description="Maximum Y extent in mm")
    z: float = Field(0, description="Z elevation in mm")
    prefix: str = Field("G-", description="Prefix for grid labels")
    start: int = Field(1, description="Starting number/letter for labels")
    dry_run: bool = Field(False, description="Preview mode without creating grids")

    model_config = ConfigDict(populate_by_name=True, extra="allow")


class GridXYInput(BaseModel):
    """Schema for combined X and Y axis grid creation."""
    z: float = Field(0, description="Z elevation in mm")
    dry_run: bool = Field(False, description="Preview mode")
    margin: int = Field(3000, description="Margin for grid extents in mm")

    # X-axis configuration
    x_mode: str = Field("uniform", description="X-axis mode: 'uniform' or 'segments'")
    x0: float = Field(0, description="Starting X coordinate")
    x_count: int = Field(5, description="Number of X grids")
    x_spacing: float = Field(6000, description="X spacing in mm")
    x_segments: List[float] = Field(default_factory=list)
    x_labels: List[str] = Field(default_factory=list)
    x_label_scheme: str = Field("numeric", description="'numeric' or 'alpha'")
    x_prefix: str = Field("X-", description="Prefix for X labels")
    x_start: int = Field(1, description="Starting index for X labels")

    # Y-axis configuration
    y_mode: str = Field("uniform", description="Y-axis mode: 'uniform' or 'segments'")
    y0: float = Field(0, description="Starting Y coordinate")
    y_count: int = Field(5, description="Number of Y grids")
    y_spacing: float = Field(6000, description="Y spacing in mm")
    y_segments: List[float] = Field(default_factory=list)
    y_labels: List[str] = Field(default_factory=list)
    y_label_scheme: str = Field("alpha", description="'numeric' or 'alpha'")
    y_prefix: str = Field("Y-", description="Prefix for Y labels")
    y_start: int = Field(1, description="Starting index for Y labels")

    model_config = ConfigDict(populate_by_name=True, extra="allow")


class GridHeightsInput(BaseModel):
    """Schema for setting grid vertical extents."""
    bottom_height: float = Field(0, description="Bottom height in mm")
    top_height: float = Field(8000, description="Top height in mm")
    dry_run: bool = Field(False, description="Preview mode")

    model_config = ConfigDict(populate_by_name=True, extra="allow")


class GridMarginsInput(BaseModel):
    """Schema for setting grid margins."""
    left_margin: float = Field(3000, description="Left margin in mm")
    right_margin: float = Field(3000, description="Right margin in mm")
    top_margin: float = Field(3000, description="Top margin in mm")
    bottom_margin: float = Field(3000, description="Bottom margin in mm")
    dry_run: bool = Field(False, description="Preview mode")

    model_config = ConfigDict(populate_by_name=True, extra="allow")


class RemoveAllGridsInput(BaseModel):
    """Schema for removing all grids."""
    dry_run: bool = Field(False, description="Preview mode")

    model_config = ConfigDict(populate_by_name=True, extra="allow")


# Initialize FastMCP server
mcp = FastMCP(
    name="revit-grid-python",
    stateless_http=True,
)


def _tool_meta(widget: RevitWidget) -> Dict[str, Any]:
    """Generate tool metadata for MCP."""
    return {
        "openai/outputTemplate": widget.template_uri,
        "openai/toolInvocation/invoking": widget.invoking,
        "openai/toolInvocation/invoked": widget.invoked,
        "openai/widgetAccessible": True,
        "openai/resultCanProduceWidget": True,
    }


def _embedded_widget_resource(widget: RevitWidget) -> types.EmbeddedResource:
    """Create an embedded widget resource."""
    return types.EmbeddedResource(
        type="resource",
        resource=types.TextResourceContents(
            uri=widget.template_uri,
            mimeType=MIME_TYPE,
            text=widget.html,
            title=widget.title,
        ),
    )


def _resource_description(widget: RevitWidget) -> str:
    """Generate resource description."""
    return f"{widget.title} widget markup"


# Get Revit server URL from environment or use default
REVIT_SERVER_URL = os.getenv("REVIT_SERVER_URL", "http://127.0.0.1:48884")
USE_MOCK = os.getenv("USE_MOCK", "false").lower() == "true"

def get_revit_response(operation: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get response from Revit server or use mock if unavailable.

    Args:
        operation: Operation type ("create_y", "create_x", "create_xy", etc.)
        data: Request data

    Returns:
        Response dictionary
    """
    if USE_MOCK:
        return _mock_response(operation, data)

    client = get_revit_client(REVIT_SERVER_URL)

    # Check if Revit is available
    if not is_revit_available():
        return {
            "ok": False,
            "status": "error",
            "message": f"Revit is not available at {REVIT_SERVER_URL}. Please ensure Revit is running with pyRevit and the HTTP server is active."
        }

    # Call appropriate endpoint
    try:
        if operation == "create_y":
            return client.create_y_grids(data)
        elif operation == "create_x":
            return client.create_x_grids(data)
        elif operation == "create_xy":
            return client.create_xy_grids(data)
        elif operation == "set_heights":
            return client.set_grid_heights(data)
        elif operation == "set_margins":
            return client.set_grid_margins(data)
        elif operation == "remove_all":
            return client.remove_all_grids(data)
        else:
            return {
                "ok": False,
                "status": "error",
                "message": f"Unknown operation: {operation}"
            }
    except Exception as e:
        return {
            "ok": False,
            "status": "error",
            "message": f"Error calling Revit API: {str(e)}"
        }


def _mock_response(operation: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate mock responses for testing without Revit."""
    if operation == "create_y":
        y0, count, spacing = data.get("y0", 0), data.get("count", 5), data.get("spacing", 6000)
        items = [{"name": f"Y-{data.get('start', 1) + i}", "y": y0 + i * spacing} for i in range(count)]
        if data.get("dry_run"):
            return {"ok": True, "status": "preview", "count": len(items), "items": items}
        return {"ok": True, "status": "ok", "count": len(items), "grids": [{"id": i, **item} for i, item in enumerate(items)]}

    elif operation == "create_x":
        x0, count, spacing = data.get("x0", 0), data.get("count", 5), data.get("spacing", 6000)
        items = [{"name": f"X-{data.get('start', 1) + i}", "x": x0 + i * spacing} for i in range(count + 1)]
        if data.get("dry_run"):
            return {"ok": True, "status": "preview", "count": len(items), "items": items}
        return {"ok": True, "status": "ok", "count": len(items), "grids": [{"id": i, **item} for i, item in enumerate(items)]}

    elif operation == "create_xy":
        x0, x_count, x_spacing = data.get("x0", 0), data.get("x_count", 5), data.get("x_spacing", 6000)
        y0, y_count, y_spacing = data.get("y0", 0), data.get("y_count", 5), data.get("y_spacing", 6000)
        x_items = [{"name": f"{data.get('x_prefix', 'X-')}{data.get('x_start', 1) + i}", "x": x0 + i * x_spacing} for i in range(x_count)]
        y_items = [{"name": f"{data.get('y_prefix', 'Y-')}{chr(65 + i)}", "y": y0 + i * y_spacing} for i in range(y_count)]

        margin = data.get("margin", 3000)
        x_min = min([item["x"] for item in x_items]) - margin if x_items else -margin
        x_max = max([item["x"] for item in x_items]) + margin if x_items else margin
        y_min = min([item["y"] for item in y_items]) - margin if y_items else -margin
        y_max = max([item["y"] for item in y_items]) + margin if y_items else margin

        return {
            "ok": True,
            "status": "preview" if data.get("dry_run") else "ok",
            "range": {"x_min": x_min, "x_max": x_max, "y_min": y_min, "y_max": y_max, "z": data.get("z", 0)},
            "created_x": [{"id": i, **item} for i, item in enumerate(x_items)],
            "created_y": [{"id": i, **item} for i, item in enumerate(y_items)],
            "count_x": len(x_items),
            "count_y": len(y_items),
        }

    return {"ok": True, "message": "Mock response"}


# MCP Protocol handlers
@mcp._mcp_server.list_tools()
async def _list_tools() -> List[types.Tool]:
    """List all available Revit grid tools."""
    tools = [
        types.Tool(
            name="create-y-grids",
            title="Create Y-Axis Grids",
            description="Create horizontal grids parallel to the X-axis in Revit",
            inputSchema=GridYInput.model_json_schema(),
            _meta=_tool_meta(WIDGET),
            annotations={
                "destructiveHint": False,
                "openWorldHint": False,
                "readOnlyHint": False,
            },
        ),
        types.Tool(
            name="create-x-grids",
            title="Create X-Axis Grids",
            description="Create vertical grids parallel to the Y-axis in Revit",
            inputSchema=GridXInput.model_json_schema(),
            _meta=_tool_meta(WIDGET),
            annotations={
                "destructiveHint": False,
                "openWorldHint": False,
                "readOnlyHint": False,
            },
        ),
        types.Tool(
            name="create-xy-grids",
            title="Create X & Y Grids",
            description="Create both X and Y axis grids in a single operation",
            inputSchema=GridXYInput.model_json_schema(),
            _meta=_tool_meta(WIDGET),
            annotations={
                "destructiveHint": False,
                "openWorldHint": False,
                "readOnlyHint": False,
            },
        ),
        types.Tool(
            name="set-grid-heights",
            title="Set Grid Vertical Extents",
            description="Set the vertical range (bottom and top) for all grids",
            inputSchema=GridHeightsInput.model_json_schema(),
            _meta=_tool_meta(WIDGET),
            annotations={
                "destructiveHint": False,
                "openWorldHint": False,
                "readOnlyHint": False,
            },
        ),
        types.Tool(
            name="set-grid-margins",
            title="Set Grid Margins",
            description="Extend or reduce grid margins in all directions",
            inputSchema=GridMarginsInput.model_json_schema(),
            _meta=_tool_meta(WIDGET),
            annotations={
                "destructiveHint": False,
                "openWorldHint": False,
                "readOnlyHint": False,
            },
        ),
        types.Tool(
            name="remove-all-grids",
            title="Remove All Grids",
            description="Delete all grids from the project (cannot be undone)",
            inputSchema=RemoveAllGridsInput.model_json_schema(),
            _meta=_tool_meta(WIDGET),
            annotations={
                "destructiveHint": True,
                "openWorldHint": False,
                "readOnlyHint": False,
            },
        ),
    ]
    return tools


@mcp._mcp_server.list_resources()
async def _list_resources() -> List[types.Resource]:
    """List available widget resources."""
    return [
        types.Resource(
            name=WIDGET.title,
            title=WIDGET.title,
            uri=WIDGET.template_uri,
            description=_resource_description(WIDGET),
            mimeType=MIME_TYPE,
            _meta=_tool_meta(WIDGET),
        )
    ]


@mcp._mcp_server.list_resource_templates()
async def _list_resource_templates() -> List[types.ResourceTemplate]:
    """List resource templates."""
    return [
        types.ResourceTemplate(
            name=WIDGET.title,
            title=WIDGET.title,
            uriTemplate=WIDGET.template_uri,
            description=_resource_description(WIDGET),
            mimeType=MIME_TYPE,
            _meta=_tool_meta(WIDGET),
        )
    ]


async def _handle_read_resource(req: types.ReadResourceRequest) -> types.ServerResult:
    """Handle resource read requests."""
    resource_uri = str(req.params.uri)

    if resource_uri != WIDGET.template_uri:
        return types.ServerResult(
            types.ReadResourceResult(
                contents=[],
                _meta={"error": f"Unknown resource: {req.params.uri}"},
            )
        )

    contents = [
        types.TextResourceContents(
            uri=WIDGET.template_uri,
            mimeType=MIME_TYPE,
            text=WIDGET.html,
            _meta=_tool_meta(WIDGET),
        )
    ]

    return types.ServerResult(types.ReadResourceResult(contents=contents))


async def _call_tool_request(req: types.CallToolRequest) -> types.ServerResult:
    """Handle tool call requests."""
    tool_name = req.params.name
    arguments = req.params.arguments or {}

    # Route to appropriate handler
    try:
        if tool_name == "create-y-grids":
            payload = GridYInput.model_validate(arguments)
            result_data = get_revit_response("create_y", payload.model_dump())
        elif tool_name == "create-x-grids":
            payload = GridXInput.model_validate(arguments)
            result_data = get_revit_response("create_x", payload.model_dump())
        elif tool_name == "create-xy-grids":
            payload = GridXYInput.model_validate(arguments)
            result_data = get_revit_response("create_xy", payload.model_dump())
        elif tool_name == "set-grid-heights":
            payload = GridHeightsInput.model_validate(arguments)
            result_data = get_revit_response("set_heights", payload.model_dump())
        elif tool_name == "set-grid-margins":
            payload = GridMarginsInput.model_validate(arguments)
            result_data = get_revit_response("set_margins", payload.model_dump())
        elif tool_name == "remove-all-grids":
            payload = RemoveAllGridsInput.model_validate(arguments)
            result_data = get_revit_response("remove_all", payload.model_dump())
        else:
            return types.ServerResult(
                types.CallToolResult(
                    content=[
                        types.TextContent(
                            type="text",
                            text=f"Unknown tool: {tool_name}",
                        )
                    ],
                    isError=True,
                )
            )
    except ValidationError as exc:
        return types.ServerResult(
            types.CallToolResult(
                content=[
                    types.TextContent(
                        type="text",
                        text=f"Input validation error: {exc.errors()}",
                    )
                ],
                isError=True,
            )
        )

    # Check for errors
    if not result_data.get("ok", True) or result_data.get("status") == "error":
        return types.ServerResult(
            types.CallToolResult(
                content=[
                    types.TextContent(
                        type="text",
                        text=result_data.get("message", "Unknown error occurred"),
                    )
                ],
                isError=True,
            )
        )

    # Generate response with widget
    widget_resource = _embedded_widget_resource(WIDGET)
    meta: Dict[str, Any] = {
        "openai.com/widget": widget_resource.model_dump(mode="json"),
        "openai/outputTemplate": WIDGET.template_uri,
        "openai/toolInvocation/invoking": WIDGET.invoking,
        "openai/toolInvocation/invoked": WIDGET.invoked,
        "openai/widgetAccessible": True,
        "openai/resultCanProduceWidget": True,
    }

    # Build message
    status = result_data.get('status', 'ok')
    message = f"Grid operation completed: {status}"

    if result_data.get("count"):
        message += f" ({result_data['count']} grids)"
    elif result_data.get("count_x") or result_data.get("count_y"):
        count_x = result_data.get("count_x", 0)
        count_y = result_data.get("count_y", 0)
        message += f" ({count_x} X-grids, {count_y} Y-grids)"

    # Add Revit server info to message
    if not USE_MOCK:
        message += f"\n\n✓ Connected to Revit at {REVIT_SERVER_URL}"

    return types.ServerResult(
        types.CallToolResult(
            content=[
                types.TextContent(
                    type="text",
                    text=message,
                )
            ],
            structuredContent=result_data,
            _meta=meta,
        )
    )


# Register custom handlers
mcp._mcp_server.request_handlers[types.CallToolRequest] = _call_tool_request
mcp._mcp_server.request_handlers[types.ReadResourceRequest] = _handle_read_resource

# Create HTTP app
app = mcp.streamable_http_app()

# Add CORS middleware
try:
    from starlette.middleware.cors import CORSMiddleware

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
        allow_credentials=False,
    )
except Exception:
    pass


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
