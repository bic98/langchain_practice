"""Revit API Client for communicating with pyRevit HTTP server."""

import requests
from typing import Dict, Any, Optional
from requests.exceptions import RequestException, Timeout, ConnectionError


class RevitAPIClient:
    """Client for communicating with pyRevit's HTTP routes API."""

    def __init__(self, base_url: str = "http://127.0.0.1:48884", api_prefix: str = "junglim"):
        """
        Initialize the Revit API client.

        Args:
            base_url: Base URL of the pyRevit HTTP server
            api_prefix: API prefix configured in pyRevit (from startup.py)
        """
        self.base_url = base_url.rstrip("/")
        self.api_prefix = api_prefix
        self.timeout = 30  # seconds

    def _build_url(self, endpoint: str) -> str:
        """Build the full URL for an API endpoint."""
        endpoint = endpoint.lstrip("/")
        return f"{self.base_url}/{self.api_prefix}/{endpoint}"

    def health_check(self) -> Dict[str, Any]:
        """Check if the pyRevit server is healthy and has an active document."""
        try:
            url = self._build_url("/__health")
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {
                "status": "error",
                "doc_open": False,
                "error": str(e)
            }

    def list_operations(self) -> Dict[str, Any]:
        """List all available operations from the pyRevit server."""
        try:
            url = self._build_url("/__ops")
            response = requests.get(url, timeout=self.timeout)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {
                "operations": [],
                "error": str(e)
            }

    def call_endpoint(self, endpoint: str, data: Dict[str, Any], method: str = "POST") -> Dict[str, Any]:
        """
        Call a pyRevit API endpoint.

        Args:
            endpoint: API endpoint path (e.g., "/grid/xy")
            data: Request payload
            method: HTTP method (POST, GET, etc.)

        Returns:
            Response data from pyRevit server
        """
        url = self._build_url(endpoint)

        try:
            if method.upper() == "POST":
                response = requests.post(url, json=data, timeout=self.timeout)
            elif method.upper() == "GET":
                response = requests.get(url, params=data, timeout=self.timeout)
            else:
                response = requests.request(method, url, json=data, timeout=self.timeout)

            response.raise_for_status()
            return response.json()

        except Timeout:
            return {
                "ok": False,
                "status": "error",
                "message": f"Request to Revit server timed out after {self.timeout}s"
            }
        except ConnectionError:
            return {
                "ok": False,
                "status": "error",
                "message": f"Could not connect to Revit server at {self.base_url}. Is Revit running with pyRevit?"
            }
        except RequestException as e:
            error_detail = str(e)
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_detail = e.response.json()
                except:
                    error_detail = e.response.text or str(e)

            return {
                "ok": False,
                "status": "error",
                "message": f"Revit API error: {error_detail}"
            }
        except Exception as e:
            return {
                "ok": False,
                "status": "error",
                "message": f"Unexpected error: {str(e)}"
            }

    # Grid operations
    def create_y_grids(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create Y-axis grids (horizontal)."""
        return self.call_endpoint("/grid/y", data, method="POST")

    def create_x_grids(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create X-axis grids (vertical)."""
        return self.call_endpoint("/grid/x", data, method="POST")

    def create_xy_grids(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create both X and Y grids."""
        return self.call_endpoint("/grid/xy", data, method="POST")

    def set_grid_heights(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Set vertical extents for all grids."""
        return self.call_endpoint("/grid/set_heights", data, method="POST")

    def set_grid_margins(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Set margins for all grids."""
        return self.call_endpoint("/grid/set_margins", data, method="POST")

    def remove_all_grids(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Remove all grids from the document."""
        return self.call_endpoint("/grid/remove_all_grids", data, method="POST")


# Singleton instance
_client: Optional[RevitAPIClient] = None


def get_revit_client(base_url: str = "http://127.0.0.1:48884") -> RevitAPIClient:
    """Get or create the singleton Revit API client."""
    global _client
    if _client is None:
        _client = RevitAPIClient(base_url=base_url)
    return _client


def is_revit_available() -> bool:
    """Check if Revit is available and has an active document."""
    client = get_revit_client()
    health = client.health_check()
    return health.get("status") == "ok" and health.get("doc_open", False)
