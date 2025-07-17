'use client';

// @ts-nocheck

import React from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Cell,
    CartesianGrid,
    Line,
} from 'recharts';

interface QuarterData {
    quarter: number;
    quarterLabel: string;
    beginningBalance: number;
    returnRate: number;
    returnDollar: number;
    action: 'Reinvested' | 'Distributed';
    netFlow: number;
    endingBalance: number;
}

interface Props {
    /**
     * Optional array of QuarterData rows. If omitted the component will render its built-in simulated dataset.
     */
    data?: QuarterData[];
    style?: React.CSSProperties;
    /** Current return mode (realised vs total) */
    returnMode?: 'realised' | 'total';
    /** Callback when user switches return mode */
    onReturnModeChange?: (mode: 'realised' | 'total') => void;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function convertFontWeight(weight: any): any {
    if (typeof weight === 'string') {
        switch (weight.toLowerCase()) {
            case 'regular':
                return 'normal';
            case 'medium':
                return 500;
            case 'semibold':
                return 600;
            case 'bold':
                return 'bold';
            default:
                return weight;
        }
    }
    return weight;
}

function generateSimulation(): QuarterData[] {
    const rows: QuarterData[] = [];
    let beginningBalance = 0;

    const START_YEAR = 2015;
    const TOTAL_QUARTERS = 44;

    const flowsSchedule: Record<number, number> = {
        1: 100_000,
        13: 100_000,
        25: 50_000,
        29: -250_000,
        37: 200_000,
    };

    for (let i = 1; i <= TOTAL_QUARTERS; i++) {
        const returnRate = 0.11 + (((i - 1) % 5) * 0.01);
        const returnDollar = beginningBalance * returnRate;
        const action: 'Reinvested' | 'Distributed' = i % 2 === 0 ? 'Reinvested' : 'Distributed';

        const afterReturn = action === 'Reinvested' ? beginningBalance + returnDollar : beginningBalance;
        const netFlow = flowsSchedule[i] ?? 0;
        const endingBalance = afterReturn + netFlow;

        const yearNumber = START_YEAR + Math.floor((i - 1) / 4);
        const quarterNum = ((i - 1) % 4) + 1;

        rows.push({
            quarter: i,
            quarterLabel: `${yearNumber} Q${quarterNum}`,
            beginningBalance,
            returnRate,
            returnDollar,
            action,
            netFlow,
            endingBalance,
        });

        beginningBalance = endingBalance;
    }
    return rows;
}

const ACCENT_BLUE = '#008AFF';
const DARK_BLUE = '#292929';
const TOGGLE_PILL_VERT = 2;
const TOGGLE_PILL_HORZ = 16;

const COLORS = {
    Reinvested: ACCENT_BLUE,
    Distributed: '#003A57',
};

const TIMEFRAME_OPTIONS = [
    { key: '1yr' as const, label: '1 YR' },
    { key: '5yr' as const, label: '5 YR' },
    { key: 'all' as const, label: 'All' },
];

interface TooltipPayloadItem {
    name: string;
    value: number;
    color: string;
    payload: QuarterData;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadItem[];
    label?: string | number;
    onUpdate?: (quarter: QuarterData) => void;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, onUpdate }) => {
    // Keep parent component in sync with the hovered data point
    React.useEffect(() => {
        if (active && payload && payload.length > 0 && onUpdate) {
            onUpdate(payload[0].payload as QuarterData);
        }
    }, [active, payload, onUpdate]);

    // Show the quarter label in a minimal tooltip so users can quickly identify the period
    if (active && payload && payload.length > 0) {
        const row = payload[0].payload as QuarterData;
        return (
            <div
                style={{
                    background: '#262626',
                    color: '#FFFFFF',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontFamily: 'Utile Regular, sans-serif',
                    whiteSpace: 'nowrap',
                }}
            >
                {row.quarterLabel}
            </div>
        );
    }

    return null;
};

const DottedCursor: React.FC<
    any & { onPositionUpdate?: (pos: { x: number; y: number }) => void }
> = ({ x, width, height, points, onPositionUpdate }) => {
    // Compute coordinates every render
    const cx = x + (width ?? 0) / 2;
    const barTopY = points && points.length > 0 ? points[0].y : 0;
    const currentPayload = points && points.length > 0 ? (points[0] as any).payload : null;
    const lastPayloadRef = React.useRef<any>();

    // Notify parent *after* render commit to avoid nested updates
    React.useEffect(() => {
        if (onPositionUpdate && currentPayload && currentPayload !== lastPayloadRef.current) {
            onPositionUpdate({ x: cx, y: barTopY });
            lastPayloadRef.current = currentPayload;
        }
    }, [cx, barTopY, onPositionUpdate, currentPayload]);

    return (
        <g>
            <line x1={cx} y1={0} x2={cx} y2={height} stroke="#666666" strokeWidth={1} />
        </g>
    );
};

export default function ReturnCombo(props: Props) {
    const { style, returnMode = 'total', onReturnModeChange } = props;
    const [viewMode, setViewMode] = React.useState<'dollar' | 'percent'>('dollar');
    type TimeFrameKey = 'all' | '1yr' | '5yr';
    const [timeFrame, setTimeFrame] = React.useState<TimeFrameKey>('all');
    const [isAnimationEnabled, setIsAnimationEnabled] = React.useState(true);

    React.useEffect(() => {
        const timer = setTimeout(() => setIsAnimationEnabled(false), 1000); // Disable animation after initial load
        return () => clearTimeout(timer);
    }, []);

    // Resolve dataset: use caller-supplied data if present, otherwise fall back to internal simulation.
    const data = React.useMemo<QuarterData[]>(() => {
        if (props.data && props.data.length) return props.data;
        return generateSimulation();
    }, [props.data]);

    const visibleData = React.useMemo(() => {
        switch (timeFrame) {
            case '1yr': {
                const lastFour = data.slice(-4);
                return lastFour.length ? lastFour : data;
            }
            case '5yr': {
                const latestYear = parseInt(data[data.length - 1].quarterLabel.split(' ')[0], 10);
                return data.filter((d) => {
                    const yr = parseInt(d.quarterLabel.split(' ')[0], 10);
                    return yr >= latestYear - 4;
                });
            }
            case 'all':
            default:
                return data;
        }
    }, [data, timeFrame]);

    // Convert quarterly rate to annualised percentage for display (×4 then %)
    const chartData = visibleData.map((d) => ({
        ...d,
        returnPercentValue: d.returnRate * 4 * 100,
    }));

    const axisTickStyle = {
        fill: '#888888',
        fontSize: 12,
        fontFamily: 'Utile Regular, sans-serif',
        fontWeight: convertFontWeight('normal'),
    } as const;

    const [selectedData, setSelectedData] = React.useState<QuarterData>(() => visibleData[visibleData.length - 1]);
    React.useEffect(() => {
        if (visibleData.length > 0) {
            setSelectedData(visibleData[visibleData.length - 1]);
        }
    }, [visibleData]);

    const returnValue = viewMode === 'dollar'
        ? currencyFormatter.format(selectedData.returnDollar)
        : `${(selectedData.returnRate * 4 * 100).toFixed(2)}%`;

    // ---------- Refs & state for connector paths ----------
    const containerRef = React.useRef<HTMLDivElement>(null);
    const chartAreaRef  = React.useRef<HTMLDivElement>(null);

    // Store refs to each metric card in a map so we can measure them dynamically
    const cardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
    const setCardRef = React.useMemo(() => {
        const cache = new Map<string, (el: HTMLDivElement | null) => void>();
        return (id: string) => {
            if (!cache.has(id)) {
                cache.set(id, (el: HTMLDivElement | null) => {
                    cardRefs.current[id] = el;
                });
            }
            return cache.get(id)!;
        };
    }, []);

    const [cursorPos, setCursorPos] = React.useState<{ x: number; y: number } | null>(null);
    const [activeBarIndex, setActiveBarIndex] = React.useState<number | null>(null);
    const [cardAnchors, setCardAnchors] = React.useState<Array<{ id: string; x: number; y: number }>>([]);

    const handleCursorPosition = React.useCallback((posRelToChart: { x: number; y: number }) => {
        if (!chartAreaRef.current || !containerRef.current) return;
        const chartRect = chartAreaRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        setCursorPos({
            x: chartRect.left - containerRect.left + posRelToChart.x,
            y: chartRect.top - containerRect.top + posRelToChart.y,
        });
    }, []);

    React.useLayoutEffect(() => {
        const updateAnchors = () => {
            if (!containerRef.current) return;
            const containerRect = containerRef.current.getBoundingClientRect();
            const anchors: Array<{ id: string; x: number; y: number }> = [];
            Object.entries(cardRefs.current).forEach(([id, el]) => {
                if (!el) return;
                const rect = el.getBoundingClientRect();
                anchors.push({ id, x: rect.left - containerRect.left + rect.width / 2, y: rect.top - containerRect.top + rect.height });
            });

            anchors.sort((a, b) => a.id.localeCompare(b.id));

            setCardAnchors((prev) => {
                if (
                    prev.length === anchors.length &&
                    prev.every((p, i) => p.id === anchors[i].id && p.x === anchors[i].x && p.y === anchors[i].y)
                ) {
                    return prev;
                }
                return anchors;
            });
        };

        updateAnchors();
        window.addEventListener('resize', updateAnchors);
        return () => window.removeEventListener('resize', updateAnchors);
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                fontFamily: 'Utile Regular, sans-serif',
                boxSizing: 'border-box',
                background: 'transparent',
                color: '#FFFFFF',
                position: 'relative',
            }}
        >
            {/* Header row */}
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', padding: '0 0 48px 0', pointerEvents: 'none' }}>
                <div style={{ display: 'flex', gap: 16 }}>
                    {(() => {
                        const cardBase: React.CSSProperties = { background: DARK_BLUE, borderRadius: 8, padding: '12px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 140, textAlign: 'center' };
                        const valueStyle: React.CSSProperties = { fontSize: 20, fontWeight: 500, color: '#FFFFFF' };
                        const lineStyle: React.CSSProperties = { width: '100%', height: 2, background: '#ffffff', margin: '8px 0' };
                        const labelStyle: React.CSSProperties = { fontSize: 14, color: '#C0C0C0' };
                        return (
                            <>
                                <div style={cardBase} ref={setCardRef('begin')}>
                                    <div style={valueStyle}>{currencyFormatter.format(selectedData.beginningBalance)}</div>
                                    <div style={lineStyle} />
                                    <div style={labelStyle}>Beginning Balance</div>
                                </div>
                                <div style={cardBase} ref={setCardRef('return')}>
                                    <div style={valueStyle}>{returnValue}</div>
                                    <div style={lineStyle} />
                                    <div style={labelStyle}>{viewMode === 'dollar' ? 'Realized Return ($)' : 'Realized Return (%)'}</div>
                                </div>
                                <div style={cardBase} ref={setCardRef('end')}>
                                    <div style={valueStyle}>{currencyFormatter.format(selectedData.endingBalance)}</div>
                                    <div style={lineStyle} />
                                    <div style={labelStyle}>Ending Balance</div>
                                </div>
                            </>
                        );
                    })()}
                </div>
                {/* Toggle controls */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, pointerEvents: 'auto' }}>
                    {/* Realised / Total toggle */}
                    <div style={{ display: 'flex', background: DARK_BLUE, padding: 2, borderRadius: 9999 }}>
                        {([
                            { key: 'realised', label: 'REALISED' },
                            { key: 'total', label: 'TOTAL' },
                        ] as const).map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => onReturnModeChange && onReturnModeChange(key)}
                                style={{ padding: `${TOGGLE_PILL_VERT + 2}px ${TOGGLE_PILL_HORZ + 6}px`, background: returnMode === key ? ACCENT_BLUE : 'transparent', color: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Utile Regular, sans-serif', fontSize: 18, borderRadius: 9999, transition: 'background 0.25s ease, color 0.25s ease' }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {/* Time-frame toggle */}
                    <div style={{ display: 'flex', background: DARK_BLUE, padding: 2, borderRadius: 9999 }}>
                        {TIMEFRAME_OPTIONS.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setTimeFrame(key)}
                                style={{ padding: `${TOGGLE_PILL_VERT + 2}px ${TOGGLE_PILL_HORZ + 6}px`, background: timeFrame === key ? ACCENT_BLUE : 'transparent', color: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Utile Regular, sans-serif', fontSize: 18, borderRadius: 9999, transition: 'background 0.25s ease, color 0.25s ease' }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {/* Dollar / Percent toggle */}
                    <div style={{ display: 'flex', background: DARK_BLUE, padding: 2, borderRadius: 9999 }}>
                        {([
                            { key: 'dollar', label: '$' },
                            { key: 'percent', label: '%' },
                        ] as const).map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setViewMode(key)}
                                style={{ padding: `${TOGGLE_PILL_VERT + 2}px ${TOGGLE_PILL_HORZ + 6}px`, background: viewMode === key ? ACCENT_BLUE : 'transparent', color: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Utile Regular, sans-serif', fontSize: 18, borderRadius: 9999, transition: 'background 0.25s ease, color 0.25s ease' }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chart area */}
            <div style={{ flex: 1, position: 'relative', padding: 0, paddingBottom: 0 }} ref={chartAreaRef}>
                <div style={{ display: 'none' }}>
                    {/* Time-frame toggle */}
                    <div style={{ display: 'flex', background: DARK_BLUE, padding: 2, borderRadius: 9999 }}>
                        {TIMEFRAME_OPTIONS.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setTimeFrame(key)}
                                style={{ padding: `${TOGGLE_PILL_VERT + 2}px ${TOGGLE_PILL_HORZ + 6}px`, background: timeFrame === key ? ACCENT_BLUE : 'transparent', color: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Utile Regular, sans-serif', fontSize: 18, borderRadius: 9999, transition: 'background 0.25s ease, color 0.25s ease' }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {/* Dollar / Percent toggle */}
                    <div style={{ display: 'flex', background: DARK_BLUE, padding: 2, borderRadius: 9999 }}>
                        {([
                            { key: 'dollar', label: '$' },
                            { key: 'percent', label: '%' },
                        ] as const).map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setViewMode(key)}
                                style={{ padding: `${TOGGLE_PILL_VERT + 2}px ${TOGGLE_PILL_HORZ + 6}px`, background: viewMode === key ? ACCENT_BLUE : 'transparent', color: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Utile Regular, sans-serif', fontSize: 18, borderRadius: 9999, transition: 'background 0.25s ease, color 0.25s ease' }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 48, right: 24, left: 24, bottom: 8 }}
                        barCategoryGap={2}
                        onMouseMove={(state: any) => {
                            if (state && state.isTooltipActive) {
                                setActiveBarIndex(state.activeTooltipIndex);
                            }
                        }}
                        onMouseLeave={() => {
                            setSelectedData(visibleData[visibleData.length - 1]);
                            setCursorPos(null);
                            setActiveBarIndex(null);
                        }}
                    >
                        <XAxis dataKey="quarterLabel" axisLine={{ stroke: '#333333', strokeWidth: 1 }} tickLine={false} tick={axisTickStyle} />
                        <YAxis
                            tickFormatter={(v: number) => {
                                if (viewMode === 'dollar') {
                                    const rounded = Math.round(v / 50000) * 50000;
                                    return currencyFormatter.format(rounded);
                                }
                                const rounded = Math.round(v / 5) * 5;
                                return `${rounded}%`;
                            }}
                            axisLine={{ stroke: '#333333', strokeWidth: 1 }}
                            tickLine={false}
                            tick={axisTickStyle}
                            domain={[0, (dataMax: number) => dataMax * 1.1]}
                        />
                        <CartesianGrid strokeDasharray="3 3" stroke="#333333" opacity={0.3} />
                        <Tooltip
                            content={(tooltipProps) => (
                                <CustomTooltip {...(tooltipProps as any)} onUpdate={setSelectedData} />
                            )}
                            cursor={<DottedCursor onPositionUpdate={handleCursorPosition} />}
                            labelFormatter={(label) => `${label}`}
                            position={{ y: 0 }}
                        />
                        <Bar
                            dataKey={viewMode === 'dollar' ? 'returnDollar' : 'returnPercentValue'}
                            name={viewMode === 'dollar' ? 'Return ($)' : 'Return (%)'}
                            isAnimationActive={isAnimationEnabled}
                            animationDuration={600}
                            animationEasing="ease-out"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.action]} fillOpacity={activeBarIndex !== null && index !== activeBarIndex ? 0.1 : 1} />
                            ))}
                        </Bar>
                        <Line
                            type="monotone"
                            dataKey={viewMode === 'dollar' ? 'returnDollar' : 'returnPercentValue'}
                            stroke="transparent"
                            dot={false}
                            activeDot={{ r: 7, stroke: '#FFFFFF', strokeWidth: 4, fill: '#ffffff' }}
                            isAnimationActive={isAnimationEnabled}
                            animationDuration={600}
                            animationEasing="ease-out"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div style={{ padding: '24px 0 0 0', display: 'flex', flexDirection: 'row', gap: '24px', fontSize: '12px', lineHeight: '1.4', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: COLORS.Reinvested, borderRadius: '2px' }} />
                    <span style={{ color: '#C0C0C0', fontFamily: 'Utile Regular, sans-serif' }}>Reinvested Returns</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: COLORS.Distributed, borderRadius: '2px' }} />
                    <span style={{ color: '#C0C0C0', fontFamily: 'Utile Regular, sans-serif' }}>Distributed Returns</span>
                </div>
            </div>

            {/* SVG overlay for connector curves */}
            {cursorPos && cardAnchors.length > 0 && (() => {
                const busY = Math.min(...cardAnchors.map(a => a.y)) + 24; // Position bus line below all cards
                const minX = Math.min(...cardAnchors.map(a => a.x));
                const maxX = Math.max(...cardAnchors.map(a => a.x));

                return (
                    <>
                        <svg
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                        >
                            {/* Main vertical line from cursor to bus */}
                            <path d={`M ${cursorPos.x} ${cursorPos.y} V ${busY}`} stroke="#666666" strokeWidth={1} fill="none" />
                            {/* Horizontal bus line */}
                            <path d={`M ${minX} ${busY} H ${maxX}`} stroke="#666666" strokeWidth={1} fill="none" />
                            {/* Stems from cards to bus */}
                            {cardAnchors.map((anchor) => (
                                <path key={anchor.id} d={`M ${anchor.x} ${anchor.y} V ${busY}`} stroke="#666666" strokeWidth={1} fill="none" />
                            ))}
                        </svg>
                        <div
                            style={{
                                position: 'absolute',
                                left: cursorPos.x,
                                top: busY + 12,
                                transform: 'translateX(-50%)',
                                background: '#666666',
                                color: '#FFFFFF',
                                padding: '4px 8px',
                                borderRadius: 4,
                                fontSize: 16,
                                fontFamily: 'Utile Regular, sans-serif',
                                whiteSpace: 'nowrap',
                                pointerEvents: 'none',
                            }}
                        >
                            {selectedData.quarterLabel}
                        </div>
                    </>
                );
            })()}
        </div>
    );
} 