// Type definitions for Revit Grid MCP Server

export interface GridItem {
  id?: number;
  name: string;
  x?: number;
  y?: number;
}

export interface GridRange {
  x_min: number;
  x_max: number;
  y_min: number;
  y_max: number;
  z?: number;
}

export interface GridData {
  // For /grid/xy endpoint
  created_x?: GridItem[];
  created_y?: GridItem[];
  count_x?: number;
  count_y?: number;
  range?: GridRange;

  // For /grid/x or /grid/y endpoints
  x?: GridItem[];
  y?: GridItem[];
  count?: number;

  // For preview mode
  grids?: GridItem[];
  items?: GridItem[];
}

export interface RevitGridProps {
  gridData?: GridData;
  mode?: "preview" | "created";
  status?: "ok" | "preview" | "error";
}

export interface ViewState {
  pan: { x: number; y: number };
  zoom: number;
  isDragging: boolean;
  dragStart: { x: number; y: number };
}

export interface GridBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}
