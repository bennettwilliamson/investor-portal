# Dynamic Tooltip Connector System

## Overview

The `useTooltipConnector` hook provides a robust, reusable solution for creating dynamic line connections between chart tooltips and metric cards. This system creates visual "bus lines" that connect multiple metric cards to a moving tooltip, providing clear visual context for data relationships.

## How It Works

### Visual Design Pattern

```
[Card 1]    [Card 2]    [Card 3]
    |           |           |
    |           |           |  <- Vertical lines from cards
    +===========+===========+  <- Horizontal "bus line"
                |
            [Tooltip]            <- Connection to tooltip
```

### Key Features

1. **Dynamic Positioning** - Lines adjust in real-time as tooltip moves
2. **Error Handling** - Graceful fallbacks if refs aren't available
3. **Performance Optimized** - Debounced resize events and efficient re-renders
4. **Type Safe** - Full TypeScript support with proper interfaces
5. **Reusable** - Works with any chart component or custom implementation

## Usage

### Basic Implementation

```tsx
import { useTooltipConnector } from './useTooltipConnector';

function MyChartComponent() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const chartAreaRef = React.useRef<HTMLDivElement>(null);
  const card1Ref = React.useRef<HTMLDivElement>(null);
  const card2Ref = React.useRef<HTMLDivElement>(null);
  const card3Ref = React.useRef<HTMLDivElement>(null);

  const {
    handleCursorPosition,
    resetPosition,
    renderConnectorOverlay,
  } = useTooltipConnector({
    containerRef,
    chartAreaRef,
    cardRefs: [
      { ref: card1Ref, key: 'card1' },
      { ref: card2Ref, key: 'card2' },
      { ref: card3Ref, key: 'card3' },
    ],
    busLineOffset: 15, // Distance below cards for horizontal line
  });

  return (
    <div ref={containerRef}>
      {/* Your metric cards with refs */}
      <div ref={card1Ref}>Card 1</div>
      <div ref={card2Ref}>Card 2</div>
      <div ref={card3Ref}>Card 3</div>
      
      {/* Chart area */}
      <div ref={chartAreaRef}>
        {/* Your chart implementation */}
        <ResponsiveContainer>
          <BarChart>
            <Tooltip 
              cursor={<CustomCursor onPositionUpdate={handleCursorPosition} />}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Render the connector overlay */}
      {renderConnectorOverlay()}
    </div>
  );
}
```

### Integration with Recharts

For Recharts integration, you need a custom cursor component:

```tsx
const DottedCursor: React.FC<any & { 
  onPositionUpdate?: (pos: { x: number; y: number }) => void 
}> = ({ x, width, height, points, onPositionUpdate }) => {
  const cx = x + (width ?? 0) / 2;
  const cursorY = points && points.length > 0 ? points[0].y : 0;
  
  React.useEffect(() => {
    if (onPositionUpdate) {
      onPositionUpdate({ x: cx, y: cursorY });
    }
  }, [cx, cursorY, onPositionUpdate]);

  return (
    <g>
      <line x1={cx} y1={0} x2={cx} y2={height} stroke="#666666" strokeWidth={1} />
    </g>
  );
};
```

## Configuration Options

### `UseTooltipConnectorProps`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `containerRef` | `React.RefObject<HTMLDivElement>` | Yes | Reference to the container element |
| `chartAreaRef` | `React.RefObject<HTMLDivElement>` | Yes | Reference to the chart area |
| `cardRefs` | `ConnectorCardRef[]` | Yes | Array of card references with keys |
| `busLineOffset` | `number` | No | Distance below cards for horizontal line (default: 10) |

### `ConnectorCardRef`

```tsx
interface ConnectorCardRef {
  ref: React.RefObject<HTMLDivElement>;
  key: string; // Unique identifier for the card
}
```

## Hook Return Values

| Property | Type | Description |
|----------|------|-------------|
| `cursorPos` | `ConnectorPosition \| null` | Current tooltip position |
| `cardAnchors` | `CardAnchor[]` | Calculated card anchor positions |
| `handleCursorPosition` | `(pos: ConnectorPosition) => void` | Function to update cursor position |
| `resetPosition` | `() => void` | Function to clear cursor position |
| `renderConnectorOverlay` | `() => React.ReactNode` | Function to render SVG overlay |

## Advanced Features

### Error Handling

The hook includes comprehensive error handling:
- Graceful fallbacks when refs aren't available
- Console warnings for debugging
- Try-catch blocks around DOM operations

### Performance Optimizations

- Debounced resize event handling (60fps)
- Efficient re-render patterns using `useCallback` and `useMemo`
- Conditional rendering to avoid unnecessary DOM updates

### Accessibility

- `pointerEvents: 'none'` on SVG overlay to avoid interaction conflicts
- Proper z-index layering
- No interference with existing chart interactions

## Styling Customization

The connector lines can be customized by modifying the SVG path properties in the hook:

```tsx
// In useTooltipConnector.tsx
<path
  d={path}
  stroke="#666666"     // Line color
  strokeWidth={1}      // Line thickness
  fill="none"
  opacity={0.8}        // Line transparency
/>
```

## Examples in Codebase

- `ReturnCombo.tsx` - Bar chart implementation
- `BalanceFlowChart.tsx` - Composed chart implementation  
- `TooltipConnectorExample.tsx` - Standalone demo

## Benefits

1. **Visual Clarity** - Clear connection between data points and metrics
2. **Real-time Feedback** - Immediate visual response to user interaction
3. **Consistent UX** - Standardized behavior across all chart components
4. **Maintainable** - Centralized logic reduces code duplication
5. **Extensible** - Easy to add new features or modify behavior
6. **Robust** - Error handling prevents crashes from DOM issues 