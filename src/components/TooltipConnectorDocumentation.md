# Dynamic Tooltip Date Label System

## Overview

The `useTooltipConnector` hook provides a simple, elegant solution for displaying date labels above chart tooltips. This system creates a small, styled date component that follows the tooltip cursor and stays perfectly centered above the vertical cursor line.

## How It Works

### Visual Design Pattern

```
        [2024 Q1]  <- Date label component
            |
            |      <- Vertical cursor line
        [Tooltip]  <- Chart tooltip
```

### Key Features

1. **Dynamic Positioning** - Date label follows cursor in real-time
2. **Perfect Centering** - Always centered above the cursor line
3. **Consistent Styling** - Background matches cursor line color (#666666)
4. **Performance Optimized** - Lightweight implementation with minimal overhead
5. **Type Safe** - Full TypeScript support with proper interfaces
6. **Zero Dependencies** - No complex card tracking or SVG paths needed

## Usage

### Basic Implementation

```tsx
import { useTooltipConnector } from './useTooltipConnector';

function MyChartComponent() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const chartAreaRef = React.useRef<HTMLDivElement>(null);
  const [selectedData, setSelectedData] = React.useState(/* your data */);

  const {
    handleCursorPosition,
    resetPosition,
    renderConnectorOverlay,
  } = useTooltipConnector({
    containerRef,
    chartAreaRef,
  });

  return (
    <div ref={containerRef}>
      {/* Your metric cards (no refs needed) */}
      <div>Card 1</div>
      <div>Card 2</div>
      <div>Card 3</div>
      
      {/* Chart area */}
      <div ref={chartAreaRef}>
        {/* Your chart implementation */}
        <ResponsiveContainer>
          <BarChart>
            <Tooltip 
              cursor={<CustomCursor onPositionUpdate={handleCursorPosition} />}
              content={<CustomTooltip onUpdate={setSelectedData} />}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Render the date label */}
      {renderConnectorOverlay(selectedData.quarterLabel)}
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

## Hook Return Values

| Property | Type | Description |
|----------|------|-------------|
| `cursorPos` | `ConnectorPosition \| null` | Current tooltip position |
| `handleCursorPosition` | `(pos: ConnectorPosition) => void` | Function to update cursor position |
| `resetPosition` | `() => void` | Function to clear cursor position |
| `renderConnectorOverlay` | `(dateLabel?: string) => React.ReactNode` | Function to render date label |

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

The date label can be customized by modifying the div styles in the hook:

```tsx
// In useTooltipConnector.tsx
<div
  style={{
    background: '#666666',        // Background color (matches cursor line)
    color: '#FFFFFF',            // Text color
    padding: '4px 8px',          // Padding
    borderRadius: 4,             // Border radius
    fontSize: 12,                // Font size
    fontFamily: 'Utile Regular, sans-serif', // Font family
    border: '1px solid #777777', // Border
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)', // Shadow
  }}
>
  {dateLabel}
</div>
```

## Examples in Codebase

- `ReturnCombo.tsx` - Bar chart implementation with quarterly labels
- `BalanceFlowChart.tsx` - Composed chart implementation with period labels

## Benefits

1. **Visual Clarity** - Clear identification of data points with date context
2. **Real-time Feedback** - Immediate visual response to user interaction
3. **Consistent UX** - Standardized date display across all chart components
4. **Lightweight** - Minimal overhead with simple DOM elements
5. **Maintainable** - Clean, simple implementation easy to understand
6. **Robust** - Simplified logic reduces potential for errors
7. **Accessible** - Uses semantic HTML elements instead of complex SVG 