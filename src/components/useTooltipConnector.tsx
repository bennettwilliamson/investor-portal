import React from 'react';
import { createPortal } from 'react-dom';

export interface ConnectorPosition {
  x: number;
  y: number;
}

export interface UseTooltipConnectorProps {
  containerRef: React.RefObject<HTMLDivElement>; // kept for backward-compatibility but no longer needed for positioning
  chartAreaRef: React.RefObject<HTMLDivElement>;
}

export interface UseTooltipConnectorReturn {
  cursorPos: ConnectorPosition | null;
  handleCursorPosition: (posRelToChart: ConnectorPosition) => void;
  resetPosition: () => void;
  renderConnectorOverlay: (dateLabel?: string) => React.ReactNode;
}

export function useTooltipConnector({
  containerRef,
  chartAreaRef,
}: UseTooltipConnectorProps): UseTooltipConnectorReturn {
  const [cursorPos, setCursorPos] = React.useState<ConnectorPosition | null>(null);

  // Handle cursor position updates from chart tooltip
  const handleCursorPosition = React.useCallback(
    (posRelToChart: ConnectorPosition) => {
      if (!chartAreaRef.current) {
        console.warn('Chart area ref not available for cursor positioning');
        return;
      }

      // Position horizontally at the cursor X, but always stick the label to the very top of the plot area (y = 0)
      setCursorPos({
        x: posRelToChart.x,
        y: 0,
      });
    },
    [chartAreaRef]
  );

  // Reset cursor position
  const resetPosition = React.useCallback(() => {
    setCursorPos(null);
  }, []);

  // Render the simple date label above the cursor line
  const renderConnectorOverlay = React.useCallback((dateLabel?: string): React.ReactNode => {
    if (!cursorPos || !dateLabel || !chartAreaRef.current) {
      return null;
    }

    const overlay = (
      <div
        style={{
          position: 'absolute',
          left: cursorPos.x,
          top: cursorPos.y,
          transform: 'translate(-50%, -100%)',
          background: '#666666', // Same colour as cursor line
          color: '#FFFFFF',
          padding: '4px 8px',
          borderRadius: 4,
          fontSize: 12,
          fontFamily: 'Utile Regular, sans-serif',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 15,
          border: '1px solid #777777',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        }}
      >
        {dateLabel}
      </div>
    );

    // Mount directly inside the chart area so we don't need to account for outer margins/offsets
    return createPortal(overlay, chartAreaRef.current);
  }, [cursorPos, chartAreaRef]);

  return {
    cursorPos,
    handleCursorPosition,
    resetPosition,
    renderConnectorOverlay,
  };
} 