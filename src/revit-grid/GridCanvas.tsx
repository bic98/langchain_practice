import { useRef, useEffect, useState } from "react";
import type { GridData, ViewState } from "./types";
import { calculateGridBounds, mmToPixels, getAllGrids, clamp, getGridColor } from "./utils";

interface GridCanvasProps {
  gridData: GridData;
  width: number;
  height: number;
}

export function GridCanvas({ gridData, width, height }: GridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewState, setViewState] = useState<ViewState>({
    pan: { x: 0, y: 0 },
    zoom: 1,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
  });

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setViewState(prev => ({
      ...prev,
      zoom: clamp(prev.zoom * delta, 0.1, 5),
    }));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setViewState(prev => ({
      ...prev,
      isDragging: true,
      dragStart: { x: e.clientX - prev.pan.x, y: e.clientY - prev.pan.y },
    }));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!viewState.isDragging) return;
    setViewState(prev => ({
      ...prev,
      pan: {
        x: e.clientX - prev.dragStart.x,
        y: e.clientY - prev.dragStart.y,
      },
    }));
  };

  const handleMouseUp = () => {
    setViewState(prev => ({ ...prev, isDragging: false }));
  };

  const resetView = () => {
    setViewState({
      pan: { x: 0, y: 0 },
      zoom: 1,
      isDragging: false,
      dragStart: { x: 0, y: 0 },
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    // Set canvas size
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);

    // Calculate bounds
    const bounds = calculateGridBounds(gridData);
    const scale = 0.05;

    // Apply transformations
    ctx.save();
    ctx.translate(width / 2 + viewState.pan.x, height / 2 + viewState.pan.y);
    ctx.scale(viewState.zoom, viewState.zoom);

    // Draw grid background
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 0.5;
    const gridSpacing = 1000; // 1 meter
    for (let x = -20000; x <= 20000; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x * scale, -20000 * scale);
      ctx.lineTo(x * scale, 20000 * scale);
      ctx.stroke();
    }
    for (let y = -20000; y <= 20000; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(-20000 * scale, -y * scale);
      ctx.lineTo(20000 * scale, -y * scale);
      ctx.stroke();
    }

    // Draw origin axes
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20000 * scale, 0);
    ctx.lineTo(20000 * scale, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -20000 * scale);
    ctx.lineTo(0, 20000 * scale);
    ctx.stroke();

    // Draw origin label
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 10px system-ui";
    ctx.save();
    ctx.translate(10, -10);
    ctx.scale(1, -1);
    ctx.fillText("(0, 0)", 0, 0);
    ctx.restore();

    // Get all grids
    const { xGrids, yGrids } = getAllGrids(gridData);

    // Draw Y-axis grids (horizontal lines)
    ctx.strokeStyle = getGridColor("y");
    ctx.lineWidth = 2;
    ctx.font = "12px system-ui";
    ctx.fillStyle = getGridColor("y");

    yGrids.forEach(grid => {
      if (grid.y === undefined) return;
      const y = -grid.y * scale;
      const xStart = (bounds.minX - 2000) * scale;
      const xEnd = (bounds.maxX + 2000) * scale;

      // Draw line
      ctx.beginPath();
      ctx.moveTo(xStart, y);
      ctx.lineTo(xEnd, y);
      ctx.stroke();

      // Draw label
      ctx.save();
      ctx.translate(xStart - 50, y + 5);
      ctx.scale(1, -1);
      ctx.fillText(grid.name, 0, 0);
      ctx.restore();

      // Draw label on the right side too
      ctx.save();
      ctx.translate(xEnd + 10, y + 5);
      ctx.scale(1, -1);
      ctx.fillText(grid.name, 0, 0);
      ctx.restore();
    });

    // Draw X-axis grids (vertical lines)
    ctx.strokeStyle = getGridColor("x");
    ctx.fillStyle = getGridColor("x");

    xGrids.forEach(grid => {
      if (grid.x === undefined) return;
      const x = grid.x * scale;
      const yStart = -(bounds.maxY + 2000) * scale;
      const yEnd = -(bounds.minY - 2000) * scale;

      // Draw line
      ctx.beginPath();
      ctx.moveTo(x, yStart);
      ctx.lineTo(x, yEnd);
      ctx.stroke();

      // Draw label
      ctx.save();
      ctx.translate(x - 15, yStart - 10);
      ctx.scale(1, -1);
      ctx.fillText(grid.name, 0, 0);
      ctx.restore();

      // Draw label at the bottom too
      ctx.save();
      ctx.translate(x - 15, yEnd + 20);
      ctx.scale(1, -1);
      ctx.fillText(grid.name, 0, 0);
      ctx.restore();
    });

    // Draw grid intersection points
    ctx.fillStyle = "#f59e0b";
    xGrids.forEach(xGrid => {
      yGrids.forEach(yGrid => {
        if (xGrid.x === undefined || yGrid.y === undefined) return;
        const x = xGrid.x * scale;
        const y = -yGrid.y * scale;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    ctx.restore();
  }, [gridData, width, height, viewState]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`revit-grid-canvas ${viewState.isDragging ? "dragging" : ""}`}
      />
      <div className="revit-grid-controls">
        <button className="revit-grid-control-button" onClick={resetView}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          Reset View
        </button>
        <div className="revit-grid-zoom-info">
          Zoom: {viewState.zoom.toFixed(2)}x
          <br />
          Pan: {Math.round(viewState.pan.x)}, {Math.round(viewState.pan.y)}
        </div>
      </div>
      <div className="revit-grid-legend">
        <div className="revit-grid-legend-title">Legend</div>
        <div className="revit-grid-legend-item">
          <div className="revit-grid-legend-color x-axis"></div>
          <span>X-Axis Grids</span>
        </div>
        <div className="revit-grid-legend-item">
          <div className="revit-grid-legend-color y-axis"></div>
          <span>Y-Axis Grids</span>
        </div>
        <div className="revit-grid-legend-item">
          <div className="revit-grid-legend-color origin"></div>
          <span>Origin Axes</span>
        </div>
      </div>
    </div>
  );
}
