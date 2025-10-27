import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { GridData } from "./types";
import { formatDistance, calculateGridBounds } from "./utils";

interface InfoPanelProps {
  gridData: GridData;
}

function StreamWord({ children, index, delay = 0 }: { children: React.ReactNode; index: number; delay?: number }) {
  const [isComplete, setIsComplete] = useState(false);
  return isComplete ? (
    <>{children}</>
  ) : (
    <motion.span
      key={index}
      initial={{ opacity: 0, color: "rgba(16,185,129,1)" }}
      animate={{ opacity: 1, color: "rgba(255,255,255,1)" }}
      transition={{
        type: "spring",
        bounce: 0,
        delay: index * 0.015 + 0.14 + delay,
        duration: 1,
      }}
      onAnimationComplete={() => setIsComplete(true)}
    >
      {children}
    </motion.span>
  );
}

function StreamText({ children, delay = 0 }: { children: string; delay?: number }) {
  const words = children.split(" ");
  return (
    <>
      {words.map((word, index) => (
        <StreamWord index={index} delay={delay} key={index}>
          {word}{" "}
        </StreamWord>
      ))}
    </>
  );
}

export function InfoPanel({ gridData }: InfoPanelProps) {
  const bounds = calculateGridBounds(gridData);

  const xCount = gridData.count_x ?? (gridData.created_x?.length || gridData.x?.length || 0);
  const yCount = gridData.count_y ?? (gridData.created_y?.length || gridData.y?.length || 0);
  const totalCount = gridData.count ?? xCount + yCount;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ bounce: 0.2, duration: 0.4, type: "spring" }}
        className="revit-grid-info-panel"
      >
        <h3>
          <StreamText>Revit Grids</StreamText>
        </h3>

        {xCount > 0 && (
          <div className="revit-grid-stat x-axis">
            <span className="revit-grid-stat-label">X-Axis:</span>
            <span className="revit-grid-stat-value">
              <StreamWord index={0} delay={0.1}>
                {xCount} {xCount === 1 ? "grid" : "grids"}
              </StreamWord>
            </span>
          </div>
        )}

        {yCount > 0 && (
          <div className="revit-grid-stat y-axis">
            <span className="revit-grid-stat-label">Y-Axis:</span>
            <span className="revit-grid-stat-value">
              <StreamWord index={0} delay={0.15}>
                {yCount} {yCount === 1 ? "grid" : "grids"}
              </StreamWord>
            </span>
          </div>
        )}

        {!xCount && !yCount && totalCount > 0 && (
          <div className="revit-grid-stat">
            <span className="revit-grid-stat-label">Total:</span>
            <span className="revit-grid-stat-value">
              <StreamWord index={0} delay={0.1}>
                {totalCount} {totalCount === 1 ? "grid" : "grids"}
              </StreamWord>
            </span>
          </div>
        )}

        <div className="revit-grid-range">
          <div className="revit-grid-range-title">Range (mm)</div>
          <div>X: {formatDistance(bounds.minX)} to {formatDistance(bounds.maxX)}</div>
          <div>Y: {formatDistance(bounds.minY)} to {formatDistance(bounds.maxY)}</div>
          <div style={{ marginTop: "0.5rem", fontSize: "0.7rem", opacity: 0.5 }}>
            Center: ({formatDistance(bounds.centerX)}, {formatDistance(bounds.centerY)})
          </div>
        </div>

        {gridData.range?.z !== undefined && (
          <div className="revit-grid-range" style={{ marginTop: "0.5rem" }}>
            <div className="revit-grid-range-title">Elevation</div>
            <div>Z: {formatDistance(gridData.range.z)}</div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
