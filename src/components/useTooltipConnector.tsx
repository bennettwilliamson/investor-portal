import React from 'react';

export interface ConnectorPosition {
  x: number;
  y: number;
}

export interface UseTooltipConnectorProps {
  containerRef: React.RefObject<HTMLDivElement>;
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
      if (!chartAreaRef.current || !containerRef.current) {
        console.warn('Chart area or container ref not available for cursor positioning');
        return;
      }

      try {
        const chartRect = chartAreaRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // Anchor the tooltip label to the very top of the cursor line (top of the chart area)
        setCursorPos({
          x: chartRect.left - containerRect.left + posRelToChart.x,
          // We want the label positioned at the top of the chart, not relative to the hovered bar
          y: chartRect.top - containerRect.top,
        });
      } catch (error) {
        console.error('Error updating cursor position:', error);
      }
    },
    [chartAreaRef, containerRef]
  );

  // Reset cursor position
  const resetPosition = React.useCallback(() => {
    setCursorPos(null);
  }, []);

  // Render the simple date label above the cursor line
  const renderConnectorOverlay = React.useCallback((dateLabel?: string): React.ReactNode => {
    if (!cursorPos || !dateLabel) {
      return null;
    }

    return (
      <div
        style={{
          position: 'absolute',
          left: cursorPos.x,
          top: cursorPos.y, // Top of the chart area
          /*
           * Centre horizontally and shift the label up by 100% of its height so that
           * its bottom edge rests directly on the tooltip line. This creates a flush
           * connection with no visible gap.
           */
          transform: 'translate(-50%, -100%)',
          background: '#666666', // Same colour as the tooltip line
          color: '#FFFFFF',
          padding: '4px 8px',
          borderRadius: 4,
          fontSize: 12,
          fontFamily: 'Utile Regular, sans-serif',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 15, // Above other elements
          border: '1px solid #777777',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        }}
      >
        {dateLabel}
      </div>
    );
  }, [cursorPos]);

  return {
    cursorPos,
    handleCursorPosition,
    resetPosition,
    renderConnectorOverlay,
  };
} 