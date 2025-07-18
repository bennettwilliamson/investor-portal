import React from 'react';
import { useTooltipConnector } from './useTooltipConnector';

interface ExampleProps {
  style?: React.CSSProperties;
}

export default function TooltipConnectorExample({ style }: ExampleProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const chartAreaRef = React.useRef<HTMLDivElement>(null);
  const card1Ref = React.useRef<HTMLDivElement>(null);
  const card2Ref = React.useRef<HTMLDivElement>(null);
  const card3Ref = React.useRef<HTMLDivElement>(null);

  const [tooltipData, setTooltipData] = React.useState({
    value1: '$125,000',
    value2: '$45,000', 
    value3: '$170,000',
    label: '2024 Q3'
  });

  const {
    cursorPos,
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
    busLineOffset: 15,
  });

  // Simulate mouse movement in chart area
  const handleChartMouseMove = (event: React.MouseEvent) => {
    if (!chartAreaRef.current) return;
    
    const rect = chartAreaRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    handleCursorPosition({ x, y });
    
    // Simulate data updates based on position
    const progress = x / rect.width;
    setTooltipData({
      value1: `$${Math.round(100000 + progress * 50000).toLocaleString()}`,
      value2: `$${Math.round(30000 + progress * 30000).toLocaleString()}`,
      value3: `$${Math.round(130000 + progress * 80000).toLocaleString()}`,
      label: `2024 Q${Math.floor(progress * 4) + 1}`
    });
  };

  const cardStyle: React.CSSProperties = {
    background: '#292929',
    borderRadius: 8,
    padding: '12px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 140,
    textAlign: 'center',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 500,
    color: '#FFFFFF',
  };

  const lineStyle: React.CSSProperties = {
    width: '100%',
    height: 2,
    background: '#008bce',
    margin: '8px 0',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#C0C0C0',
  };

  return (
    <div
      ref={containerRef}
      style={{
        ...style,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '400px',
        fontFamily: 'Utile Regular, sans-serif',
        background: '#1a1a1a',
        color: '#FFFFFF',
        position: 'relative',
        padding: '20px',
      }}
    >
      {/* Header cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={cardStyle} ref={card1Ref}>
          <div style={valueStyle}>{tooltipData.value1}</div>
          <div style={lineStyle} />
          <div style={labelStyle}>Beginning Balance</div>
        </div>
        <div style={cardStyle} ref={card2Ref}>
          <div style={valueStyle}>{tooltipData.value2}</div>
          <div style={lineStyle} />
          <div style={labelStyle}>Return Amount</div>
        </div>
        <div style={cardStyle} ref={card3Ref}>
          <div style={valueStyle}>{tooltipData.value3}</div>
          <div style={lineStyle} />
          <div style={labelStyle}>Ending Balance</div>
        </div>
      </div>

      {/* Simulated chart area */}
      <div
        ref={chartAreaRef}
        style={{
          flex: 1,
          background: '#2a2a2a',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'crosshair',
          position: 'relative',
          border: '1px solid #444',
        }}
        onMouseMove={handleChartMouseMove}
        onMouseLeave={resetPosition}
      >
        <div style={{ color: '#888', textAlign: 'center' }}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>Interactive Chart Area</div>
          <div style={{ fontSize: 14 }}>Move your mouse around to see the dynamic connector lines</div>
          {cursorPos && (
            <div style={{ 
              position: 'absolute',
              left: cursorPos.x - 50,
              top: cursorPos.y - 30,
              background: '#666666',
              color: '#FFFFFF',
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 12,
              whiteSpace: 'nowrap',
              transform: 'translateX(-50%)',
            }}>
              {tooltipData.label}
            </div>
          )}
        </div>
      </div>

      {/* Render connector overlay */}
      {renderConnectorOverlay()}
    </div>
  );
} 