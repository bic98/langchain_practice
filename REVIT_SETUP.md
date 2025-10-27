# Revit Integration Setup Guide

This guide explains how to connect the MCP server to your Revit instance using pyRevit.

## Architecture

```
ChatGPT ──MCP──> MCP Server ──HTTP──> pyRevit ──API──> Revit
                (Port 8000)          (172.17.7.178:48884)
```

## Prerequisites

1. **Autodesk Revit** installed and running
2. **pyRevit** extension installed in Revit
3. **Revit Automation Extension** loaded in pyRevit (the one at the provided path)

## Step 1: Verify pyRevit HTTP Server

Your pyRevit extension should be running at `http://172.17.7.178:48884` with the `junglim` API prefix.

### Check if pyRevit is running:

```bash
# Health check
curl http://172.17.7.178:48884/junglim/__health

# Expected response:
# {"status": "ok", "doc_open": true}
```

### List available operations:

```bash
curl http://172.17.7.178:48884/junglim/__ops

# Should return a list of operations including:
# - /grid/y
# - /grid/x
# - /grid/xy
# - /grid/set_heights
# - /grid/set_margins
# - /grid/remove_all_grids
```

## Step 2: Configure MCP Server

The MCP server will automatically connect to Revit at `172.17.7.178:48884`. You can customize this using environment variables.

### Option A: Use Default Configuration (Recommended)

The server is pre-configured to connect to `http://172.17.7.178:48884`:

```bash
cd revit_mcp_server
python3 main.py
```

### Option B: Custom Revit Server URL

```bash
export REVIT_SERVER_URL="http://your-revit-ip:port"
cd revit_mcp_server
python3 main.py
```

### Option C: Use Mock Mode (Testing without Revit)

```bash
export USE_MOCK=true
cd revit_mcp_server
python3 main.py
```

## Step 3: Test the Connection

### Test health endpoint from MCP server:

```bash
# In a new terminal
curl http://localhost:8000/health
```

### Test grid creation:

```bash
curl -X POST http://localhost:8000/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "params": {
      "name": "create-xy-grids",
      "arguments": {
        "x_count": 5,
        "x_spacing": 6000,
        "y_count": 4,
        "y_spacing": 7500,
        "dry_run": true
      }
    }
  }'
```

## Step 4: Use from ChatGPT

Once the MCP server is running and connected to Revit, you can use it from ChatGPT:

```
Create a 6x5 grid layout in Revit with 6m spacing on X-axis and 7.5m spacing on Y-axis
```

ChatGPT will:
1. Call the MCP server
2. MCP server forwards to pyRevit
3. pyRevit creates grids in Revit
4. Result is visualized in the widget

## Troubleshooting

### Issue: "Revit is not available"

**Solution:**
1. Ensure Revit is running
2. Check if pyRevit extension is loaded
3. Verify HTTP server is active: `curl http://172.17.7.178:48884/junglim/__health`
4. Check firewall settings

### Issue: "Connection timeout"

**Solution:**
1. Verify the IP address is correct (172.17.7.178)
2. Check port 8080 is accessible
3. Ensure pyRevit HTTP routes are registered

### Issue: "No document open"

**Solution:**
1. Open a Revit project file
2. Verify with: `curl http://172.17.7.178:48884/junglim/__health`
3. Look for `"doc_open": true` in response

### Issue: Mock mode always used

**Solution:**
1. Unset the `USE_MOCK` environment variable:
   ```bash
   unset USE_MOCK
   ```
2. Restart the MCP server

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REVIT_SERVER_URL` | `http://172.17.7.178:48884` | pyRevit HTTP server URL |
| `USE_MOCK` | `false` | Use mock responses instead of Revit |
| `PORT` | `8000` | MCP server port |
| `HOST` | `0.0.0.0` | MCP server host |

## API Endpoints

All pyRevit endpoints follow this pattern:

```
POST http://172.17.7.178:48884/junglim/<endpoint>
Content-Type: application/json

{
  "param1": value1,
  "param2": value2
}
```

### Available Endpoints:

- **`POST /junglim/grid/y`** - Create Y-axis grids
- **`POST /junglim/grid/x`** - Create X-axis grids
- **`POST /junglim/grid/xy`** - Create X & Y grids
- **`POST /junglim/grid/set_heights`** - Set vertical extents
- **`POST /junglim/grid/set_margins`** - Set grid margins
- **`POST /junglim/grid/remove_all_grids`** - Remove all grids

## Development

### Enable debug logging:

```python
# In revit_client.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Test direct pyRevit connection:

```python
from revit_client import get_revit_client

client = get_revit_client("http://172.17.7.178:48884")

# Health check
print(client.health_check())

# Create grids
result = client.create_xy_grids({
    "x_count": 3,
    "x_spacing": 6000,
    "y_count": 3,
    "y_spacing": 6000,
    "dry_run": False
})
print(result)
```

## Security Notes

1. The pyRevit HTTP server should only be accessible on your local network
2. For production, consider adding authentication
3. Use firewall rules to restrict access to trusted IPs
4. The MCP server adds CORS headers for development - restrict these in production

## Next Steps

- [ ] Test connection to pyRevit server
- [ ] Verify grid creation in Revit
- [ ] Test widget visualization in ChatGPT
- [ ] Configure firewall if needed
- [ ] Set up environment variables
- [ ] Document any custom endpoints

## Support

If you encounter issues:
1. Check pyRevit console for errors
2. Review MCP server logs
3. Test endpoints manually with curl
4. Verify Revit document is open and active
