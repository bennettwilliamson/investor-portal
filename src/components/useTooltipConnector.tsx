import React from 'react';

export interface ConnectorCardRef {
  ref: React.RefObject<HTMLDivElement>;
  key: string;
}

export interface ConnectorPosition {
  x: number;
  y: number;
}

export interface CardAnchor extends ConnectorPosition {
  key: string;
}

export interface UseTooltipConnectorProps {
  containerRef: React.RefObject<HTMLDivElement>;
  chartAreaRef: React.RefObject<HTMLDivElement>;
  cardRefs: ConnectorCardRef[];
  busLineOffset?: number; // Offset below cards for the horizontal line
}

export interface UseTooltipConnectorReturn {
  cursorPos: ConnectorPosition | null;
  cardAnchors: CardAnchor[];
  handleCursorPosition: (posRelToChart: ConnectorPosition) => void;
  resetPosition: () => void;
  renderConnectorOverlay: () => React.ReactNode;
}

export function useTooltipConnector({
  containerRef,
  chartAreaRef,
  cardRefs,
  busLineOffset = 10,
}: UseTooltipConnectorProps): UseTooltipConnectorReturn {
  const [cursorPos, setCursorPos] = React.useState<ConnectorPosition | null>(null);
  const [cardAnchors, setCardAnchors] = React.useState<CardAnchor[]>([]);

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
        
        setCursorPos({
          x: chartRect.left - containerRect.left + posRelToChart.x,
          y: chartRect.top - containerRect.top + posRelToChart.y,
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

  // Update card anchor positions
  React.useLayoutEffect(() => {
    function updateAnchors() {
      if (!containerRef.current) {
        console.warn('Container ref not available for anchor positioning');
        return;
      }

      try {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newAnchors: CardAnchor[] = [];

        cardRefs.forEach(({ ref, key }) => {
          if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            newAnchors.push({
              key,
              x: rect.left - containerRect.left + rect.width / 2,
              y: rect.top - containerRect.top + rect.height,
            });
          }
        });

        setCardAnchors(newAnchors);
      } catch (error) {
        console.error('Error updating card anchors:', error);
      }
    }

    updateAnchors();

    // Update on window resize with proper debouncing
    let resizeTimeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeoutId);
      resizeTimeoutId = setTimeout(updateAnchors, 16); // ~60fps
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeoutId);
    };
  }, [containerRef, busLineOffset]); // Removed cardRefs from dependencies to prevent infinite loops

  // Update anchors when cardRefs change (separate effect to avoid infinite loops)
  React.useEffect(() => {
    const updateAnchors = () => {
      if (!containerRef.current) return;
      
      try {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newAnchors: CardAnchor[] = [];

        cardRefs.forEach(({ ref, key }) => {
          if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            newAnchors.push({
              key,
              x: rect.left - containerRect.left + rect.width / 2,
              y: rect.top - containerRect.top + rect.height,
            });
          }
        });

        setCardAnchors(newAnchors);
      } catch (error) {
        console.error('Error updating card anchors from cardRefs change:', error);
      }
    };

    // Small delay to ensure refs are mounted
    const timeoutId = setTimeout(updateAnchors, 10);
    return () => clearTimeout(timeoutId);
  }, [cardRefs.length]); // Only re-run when the number of cards changes

  // Render the connector overlay
  const renderConnectorOverlay = React.useCallback((): React.ReactNode => {
    if (!cursorPos || cardAnchors.length === 0) {
      return null;
    }

    // Calculate bus line Y position (lowest card Y + offset)
    const maxCardY = Math.max(...cardAnchors.map(anchor => anchor.y));
    const busLineY = maxCardY + busLineOffset;

    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        {/* Connector paths from cards to bus line to tooltip */}
        {cardAnchors.map((anchor) => {
          // Path: Card -> down to bus line -> horizontal to tooltip X -> up to tooltip
          const path = [
            `M ${anchor.x} ${anchor.y}`, // Start at card bottom center
            `L ${anchor.x} ${busLineY}`, // Vertical line down to bus line
            `L ${cursorPos.x} ${busLineY}`, // Horizontal line to tooltip X
            `L ${cursorPos.x} ${cursorPos.y}`, // Vertical line up to tooltip
          ].join(' ');

          return (
            <path
              key={anchor.key}
              d={path}
              stroke="#666666"
              strokeWidth={1}
              fill="none"
              opacity={0.8}
            />
          );
        })}

        {/* Optional: Add a small circle at the tooltip position */}
        <circle
          cx={cursorPos.x}
          cy={cursorPos.y}
          r={2}
          fill="#666666"
          opacity={0.6}
        />
      </svg>
    );
  }, [cursorPos, cardAnchors, busLineOffset]);

  return {
    cursorPos,
    cardAnchors,
    handleCursorPosition,
    resetPosition,
    renderConnectorOverlay,
  };
} 