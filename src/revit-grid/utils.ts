import type { GridData, GridBounds, GridItem } from "./types";

/**
 * Calculate the bounds of all grids for auto-fitting the view
 */
export function calculateGridBounds(gridData: GridData): GridBounds {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  const allXGrids = [...(gridData.created_x || []), ...(gridData.x || [])];
  const allYGrids = [...(gridData.created_y || []), ...(gridData.y || [])];

  allXGrids.forEach(g => {
    if (g.x !== undefined) {
      minX = Math.min(minX, g.x);
      maxX = Math.max(maxX, g.x);
    }
  });

  allYGrids.forEach(g => {
    if (g.y !== undefined) {
      minY = Math.min(minY, g.y);
      maxY = Math.max(maxY, g.y);
    }
  });

  const range = gridData.range;
  if (range) {
    minX = Math.min(minX, range.x_min);
    maxX = Math.max(maxX, range.x_max);
    minY = Math.min(minY, range.y_min);
    maxY = Math.max(maxY, range.y_max);
  }

  // Fallback to default if no data
  if (!isFinite(minX)) minX = -10000;
  if (!isFinite(maxX)) maxX = 10000;
  if (!isFinite(minY)) minY = -10000;
  if (!isFinite(maxY)) maxY = 10000;

  return {
    minX,
    maxX,
    minY,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Convert millimeters to screen pixels with a scale factor
 */
export function mmToPixels(mm: number, scale: number = 0.05): number {
  return mm * scale;
}

/**
 * Format distance in millimeters for display
 */
export function formatDistance(mm: number): string {
  if (Math.abs(mm) >= 1000) {
    return `${(mm / 1000).toFixed(2)}m`;
  }
  return `${mm.toFixed(0)}mm`;
}

/**
 * Get all grid items regardless of the response format
 */
export function getAllGrids(gridData: GridData): { xGrids: GridItem[]; yGrids: GridItem[] } {
  return {
    xGrids: [...(gridData.created_x || []), ...(gridData.x || [])],
    yGrids: [...(gridData.created_y || []), ...(gridData.y || [])],
  };
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Generate a color based on grid type
 */
export function getGridColor(type: "x" | "y", theme: "light" | "dark" = "dark"): string {
  if (theme === "dark") {
    return type === "x" ? "#3b82f6" : "#10b981"; // blue-500 : emerald-500
  }
  return type === "x" ? "#2563eb" : "#059669"; // blue-600 : emerald-600
}
