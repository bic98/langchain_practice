#!/usr/bin/env python3
"""Test script to verify Revit connection."""

import sys
sys.path.insert(0, 'revit_mcp_server')

from revit_client import get_revit_client, is_revit_available

def main():
    print("Testing Revit connection...")
    print("=" * 50)
    
    # Test health
    client = get_revit_client()
    health = client.health_check()
    
    print("\n1. Health Check:")
    print(f"   Status: {health.get('status')}")
    print(f"   Doc Open: {health.get('doc_open')}")
    if 'error' in health:
        print(f"   Error: {health['error']}")
    
    # Check availability
    available = is_revit_available()
    print(f"\n2. Revit Available: {available}")
    
    if not available:
        print("\n❌ Revit is not available!")
        print("\nPlease ensure:")
        print("  1. Revit is running")
        print("  2. pyRevit extension is loaded")
        print("  3. HTTP server is active at 127.0.0.1:48884")
        return 1
    
    # List operations
    print("\n3. Available Operations:")
    ops = client.list_operations()
    if 'operations' in ops:
        for op in ops['operations'][:5]:
            print(f"   - {op.get('method', 'POST')} {op.get('path', 'N/A')}: {op.get('title', 'N/A')}")
    
    # Test dry-run grid creation
    print("\n4. Testing Grid Creation (dry-run):")
    result = client.create_xy_grids({
        "x_count": 3,
        "x_spacing": 6000,
        "y_count": 3,
        "y_spacing": 6000,
        "dry_run": True
    })
    
    if result.get('ok'):
        print(f"   ✓ Success!")
        print(f"   X-grids: {result.get('count_x', 0)}")
        print(f"   Y-grids: {result.get('count_y', 0)}")
    else:
        print(f"   ✗ Failed: {result.get('message', 'Unknown error')}")
        return 1
    
    print("\n" + "=" * 50)
    print("✓ All tests passed! Revit connection is working.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
