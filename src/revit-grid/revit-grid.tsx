import { useWidgetProps } from "../use-widget-props";
import { useMaxHeight } from "../use-max-height";
import { useDisplayMode } from "../use-display-mode";
import { GridCanvas } from "./GridCanvas";
import { InfoPanel } from "./InfoPanel";
import type { GridData } from "./types";
import "./revit-grid.css";

const ExpandIcon = () => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4.33496 11C4.33496 10.6327 4.63273 10.335 5 10.335C5.36727 10.335 5.66504 10.6327 5.66504 11V14.335H9L9.13379 14.3486C9.43692 14.4106 9.66504 14.6786 9.66504 15C9.66504 15.3214 9.43692 15.5894 9.13379 15.6514L9 15.665H5C4.63273 15.665 4.33496 15.3673 4.33496 15V11ZM14.335 9V5.66504H11C10.6327 5.66504 10.335 5.36727 10.335 5C10.335 4.63273 10.6327 4.33496 11 4.33496H15L15.1338 4.34863C15.4369 4.41057 15.665 4.67857 15.665 5V9C15.665 9.36727 15.3673 9.66504 15 9.66504C14.6327 9.66504 14.335 9.36727 14.335 9Z" />
    </svg>
  );
};

const GridIcon = () => {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
};

function RevitGridViewer() {
  const props = useWidgetProps<GridData>({});
  const maxHeight = useMaxHeight() ?? undefined;
  const displayMode = useDisplayMode();

  // Extract grid data from props
  const gridData: GridData = {
    created_x: props.created_x,
    created_y: props.created_y,
    x: props.x,
    y: props.y,
    range: props.range,
    count_x: props.count_x,
    count_y: props.count_y,
    count: props.count,
    grids: props.grids,
    items: props.items,
  };

  const hasData =
    gridData.created_x?.length ||
    gridData.created_y?.length ||
    gridData.x?.length ||
    gridData.y?.length ||
    gridData.grids?.length ||
    gridData.items?.length;

  const canvasWidth = displayMode === "fullscreen" ? window.innerWidth : 640;
  const canvasHeight = displayMode === "fullscreen" ? window.innerHeight : 480;

  return (
    <div
      className={`revit-grid-container ${
        displayMode !== "fullscreen"
          ? "aspect-[640/480] sm:aspect-[640/400]"
          : ""
      }`}
      style={{
        maxHeight,
        height: displayMode === "fullscreen" ? maxHeight : undefined,
      }}
    >
      {displayMode !== "fullscreen" && (
        <button
          className="expand-button"
          onClick={() => {
            window.webplus?.requestDisplayMode?.({ mode: "fullscreen" });
          }}
          title="Expand to fullscreen"
        >
          <ExpandIcon />
        </button>
      )}

      <div className="relative w-full h-full z-10">
        {hasData ? (
          <>
            <GridCanvas
              gridData={gridData}
              width={canvasWidth}
              height={canvasHeight}
            />
            <InfoPanel gridData={gridData} />
          </>
        ) : (
          <div className="revit-grid-empty">
            <GridIcon />
            <div>No grid data available</div>
            <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>
              Create grids using the Revit MCP tools
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return <RevitGridViewer />;
}
