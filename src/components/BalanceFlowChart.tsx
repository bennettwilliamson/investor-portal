'use client';

// @ts-nocheck

import React from 'react';
import {
    ResponsiveContainer,
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    Cell,
    CartesianGrid,
    Area,
    ReferenceLine,
    Tooltip,
} from 'recharts';

// Types
interface PeriodData {
    period: number;
    label: string;
    year: number;
    quarter: number;
    beginningBalance: number;
    returnRate: number; // decimal, e.g. 0.12 for 12%
    returnDollar: number;
    action: 'Reinvested' | 'Distributed';
    netFlow: number; // +ve contribution, -ve withdrawal, 0 otherwise
    endingBalance: number;
}

interface Props {
    /**
     * Optional array of PeriodData rows. If omitted the component will render its built-in simulated dataset.
     */
    data?: PeriodData[];
    /**
     * Optional style prop to allow parent containers to dictate sizing.
     * When used inside Next.js pages you can also wrap with a div that sets height.
     */
    style?: React.CSSProperties;
}

// Helper: currency formatter
const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

// Helper: Normalize Framer font-weight keywords to valid CSS values
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

// ---------- Chart configuration helpers ----------
const TIMEFRAME_OPTIONS = [
    { key: '1yr' as const, label: '1 YR' },
    { key: '5yr' as const, label: '5 YR' },
    { key: 'all' as const, label: 'All' },
];

const TOGGLE_PILL_VERT = 2;
const TOGGLE_PILL_HORZ = 16;

function generateSimulation(): PeriodData[] {
    const rows: PeriodData[] = [];
    let beginningBalance = 0;

    // Map simulation to actual years 2015–2025 (11 years * 4 quarters)
    const START_YEAR = 2015;
    const TOTAL_PERIODS = (2025 - START_YEAR + 1) * 4; // 44 periods

    // Pre-defined cash-flow schedule (period index → net cash-flow):
    const flowsSchedule: Record<number, number> = {
        1: 100_000,
        13: 100_000,
        25: 50_000,
        29: -250_000,
        37: 200_000,
    };

    for (let i = 1; i <= TOTAL_PERIODS; i++) {
        // Deterministic sample: cycle returnRate 11%→15% and alternate action
        const returnRate = 0.11 + (((i - 1) % 5) * 0.01); // 0.11,0.12,... repeat
        const returnDollar = beginningBalance * returnRate;
        const action = i % 2 === 0 ? 'Reinvested' : 'Distributed';

        // Apply returns
        const afterReturn =
            action === 'Reinvested' ? beginningBalance + returnDollar : beginningBalance;

        // Apply any scheduled contribution/withdrawal for this period
        const netFlow = flowsSchedule[i] ?? 0;

        const endingBalance = afterReturn + netFlow;

        const yearIndex = Math.floor((i - 1) / 4);
        const yearNumber = START_YEAR + yearIndex;
        const quarter = ((i - 1) % 4) + 1;

        rows.push({
            period: i,
            label: `${yearNumber} Q${quarter}`,
            year: yearNumber,
            quarter,
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
const DARK_BLUE = '#292929'; // new background color for cards and toggle
const GRADIENT_START = 'rgba(0,138,255,0.4)';
const GRADIENT_END = 'rgba(0,138,255,0)';
const COLORS = {
    Reinvested: ACCENT_BLUE,
    Distributed: '#003A57',
};

// Helper: abbreviate number to ≤3 digits plus suffix
function abbreviateNumber(value: number): string {
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    const format = (num: number) => {
        if (num >= 100) return num.toFixed(0);
        if (num >= 10) return num.toFixed(1);
        return num.toFixed(2);
    };

    if (abs >= 1e9) return `${sign}${format(abs / 1e9)}B`;
    if (abs >= 1e6) return `${sign}${format(abs / 1e6)}M`;
    if (abs >= 1e3) return `${sign}${format(abs / 1e3)}K`;
    return value.toString();
}

// ---------------- Tooltip & Cursor helpers ----------------
interface TooltipPayloadItem {
    name: string;
    value: number;
    color: string;
    payload: PeriodData;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadItem[];
    label?: string | number;
    onUpdate?: (row: PeriodData) => void;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, onUpdate }) => {
    React.useEffect(() => {
        if (active && payload && payload.length > 0 && onUpdate) {
            onUpdate(payload[0].payload as PeriodData);
        }
    }, [active, payload, onUpdate]);

    return null;
};

const DottedCursor: React.FC<
    any & { onPositionUpdate?: (pos: { x: number; y: number }) => void; showBelow?: boolean }
> = ({ x, width, height, points, onPositionUpdate, showBelow }) => {
    // For some chart types (e.g., ComposedChart), x can be undefined – fall back to points array
    let cx: number = 0;
    if (points && points.length > 0 && typeof (points[0] as any).x === "number") {
        cx = (points[0] as any).x;
    } else if (typeof x === "number") {
        cx = x + ((width ?? 0) / 2);
    }

    const pointY = points && points.length > 0 ? (points[0] as any).y : 0;
    const dotRadius = 6;

    let dashedEndY = height;
    if (showBelow && points) {
        const barInfo = (points as any[]).find((p) => typeof p.height === "number") as any;
        if (barInfo && barInfo.y > pointY) {
            dashedEndY = barInfo.y - 1;
        }
    }

    const dashStartY = pointY + dotRadius;

    const currentPayload = points && points.length > 0 ? (points[0] as any).payload : null;
    const lastPayloadRef = React.useRef<any>();

    // Notify parent after render commit to avoid nested updates loop
    React.useEffect(() => {
        if (onPositionUpdate && currentPayload && currentPayload !== lastPayloadRef.current) {
            onPositionUpdate({ x: cx, y: pointY });
            lastPayloadRef.current = currentPayload;
        }
    }, [cx, pointY, onPositionUpdate, currentPayload]);

    return (
        <g>
            {showBelow && (
                <line
                    x1={cx}
                    y1={dashStartY}
                    x2={cx}
                    y2={dashedEndY}
                    stroke="#666666"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                />
            )}
        </g>
    );
};

// ---------------- Main Component ----------------
export default function BalanceFlowChart(props: Props) {
    const { style } = props;
    type TimeFrameKey = 'all' | '1yr' | '5yr';
    const [timeFrame, setTimeFrame] = React.useState<TimeFrameKey>('all');

    // ---------- Refs & state used for dynamic connector paths ----------
    const containerRef = React.useRef<HTMLDivElement>(null);
    const chartAreaRef = React.useRef<HTMLDivElement>(null);

    const beginningCardRef = React.useRef<HTMLDivElement>(null);
    const endingCardRef = React.useRef<HTMLDivElement>(null);
    const returnCardRef = React.useRef<HTMLDivElement>(null);

    const [cursorPos, setCursorPos] = React.useState<{ x: number; y: number } | null>(null);
    const [cardAnchors, setCardAnchors] = React.useState({
        return: null as { x: number; y: number } | null,
        begin: null as { x: number; y: number } | null,
        end: null as { x: number; y: number } | null,
    });

    const [activeBarIndex, setActiveBarIndex] = React.useState<number | null>(null);
    const [hoverPeriod, setHoverPeriod] = React.useState<number | null>(null);

    // Resolve the dataset: prefer caller-supplied data, otherwise fall back to the internal simulation.
    const data = React.useMemo<PeriodData[]>(() => {
        if (props.data && props.data.length) return props.data
        return generateSimulation()
    }, [props.data])

    // Slice data according to selected time-frame
    const visibleData = React.useMemo(() => {
        switch (timeFrame) {
            case '1yr': {
                const lastFour = data.slice(-4);
                return lastFour.length ? lastFour : data;
            }
            case '5yr': {
                const latestYear = data[data.length - 1].year;
                return data.filter((d) => d.year >= latestYear - 4);
            }
            case 'all':
            default:
                return data;
        }
    }, [data, timeFrame]);

    const hasFlow = React.useMemo(() => {
        if (activeBarIndex === null) return false;
        const row = visibleData[activeBarIndex];
        return !!row && row.netFlow !== 0;
    }, [activeBarIndex, visibleData]);

    const [selectedData, setSelectedData] = React.useState<PeriodData>(() => visibleData[visibleData.length - 1]);

    React.useEffect(() => {
        if (visibleData.length > 0) {
            setSelectedData(visibleData[visibleData.length - 1]);
        }
    }, [visibleData]);

    const handleCursorPosition = React.useCallback(
        (posRelToChart: { x: number; y: number }) => {
            if (!chartAreaRef.current || !containerRef.current) return;
            const chartRect = chartAreaRef.current.getBoundingClientRect();
            const containerRect = containerRef.current.getBoundingClientRect();
            setCursorPos({
                x: chartRect.left - containerRect.left + posRelToChart.x,
                y: chartRect.top - containerRect.top + posRelToChart.y,
            });
        },
        [],
    );

    React.useLayoutEffect(() => {
        function updateAnchors() {
            if (!containerRef.current) return;
            const containerRect = containerRef.current.getBoundingClientRect();

            const getAnchor = (ref: React.RefObject<HTMLDivElement>) => {
                if (!ref.current) return null;
                const rect = ref.current.getBoundingClientRect();
                return {
                    x: rect.left - containerRect.left + rect.width / 2,
                    y: rect.top - containerRect.top + rect.height,
                };
            };

            setCardAnchors({
                return: getAnchor(returnCardRef),
                begin: getAnchor(beginningCardRef),
                end: getAnchor(endingCardRef),
            });
        }

        updateAnchors();
        window.addEventListener('resize', updateAnchors);
        return () => window.removeEventListener('resize', updateAnchors);
    }, []);

    // Compute dynamic Y-axis ticks aiming for 5–8 labels
    const baseStep = 100_000;
    const valuesExtent = visibleData.reduce(
        (acc, d) => {
            acc.max = Math.max(acc.max, d.endingBalance, d.netFlow);
            acc.min = Math.min(acc.min, d.netFlow);
            return acc;
        },
        { max: 0, min: 0 },
    );

    let upperTick = Math.ceil(valuesExtent.max / baseStep) * baseStep;
    let lowerTick = Math.floor(valuesExtent.min / baseStep) * baseStep;

    let step = baseStep;
    const minTicks = 5;
    const maxTicks = 8;

    const countTicks = (st: number) => Math.floor((upperTick - lowerTick) / st) + 1;

    while (countTicks(step) > maxTicks) {
        step *= 2;
    }
    while (countTicks(step) < minTicks && step > 1_000) {
        step = Math.max(step / 2, 1_000);
    }

    lowerTick = Math.floor(lowerTick / step) * step;

    const yTicks: number[] = [];
    for (let v = lowerTick; v <= upperTick; v += step) {
        yTicks.push(v);
    }

    const axisTickStyle = {
        fill: '#888888',
        fontSize: 12,
        fontFamily: 'Utile Regular, sans-serif',
        fontWeight: convertFontWeight('normal'),
    } as const;

    // ---------------- Responsive X-axis tick selection ----------------
    const chartContainerRef = React.useRef<HTMLDivElement>(null);
    const [visibleTicks, setVisibleTicks] = React.useState<number[]>([]);
    const isOneYear = timeFrame === '1yr';
    const isAllTime = timeFrame === 'all';

    React.useEffect(() => {
        function computeTicks(width: number) {
            if (isOneYear) {
                setVisibleTicks(visibleData.map((d) => d.period));
                return;
            }
            if (isAllTime) {
                setVisibleTicks(visibleData.filter((d) => d.quarter === 1).map((d) => d.period));
                return;
            }
            const YEARS = visibleData.length / 4;
            const MIN_TICK_SPACING = 60;
            const maxTicks = Math.floor(width / MIN_TICK_SPACING);
            let ticksPerYear = 1;
            if (maxTicks >= YEARS * 4) {
                ticksPerYear = 4;
            } else if (maxTicks >= YEARS * 2) {
                ticksPerYear = 2;
            }
            const stepWithinYear = Math.floor(4 / ticksPerYear);
            const ticks: number[] = [];
            for (let y = 0; y < YEARS; y++) {
                for (let q = 0; q < ticksPerYear; q++) {
                    const periodIndex = y * 4 + q * stepWithinYear;
                    if (periodIndex < visibleData.length) {
                        ticks.push(visibleData[periodIndex].period);
                    }
                }
            }
            setVisibleTicks(ticks);
        }

        const el = chartContainerRef.current;
        if (!el) return;
        computeTicks(el.offsetWidth);
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentRect) {
                    computeTicks(entry.contentRect.width);
                }
            }
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [visibleData, isOneYear, isAllTime]);

    // ---------------- JSX ----------------
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
            {/* Header cards */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0 0 8px 0',
                    pointerEvents: 'none',
                }}
            >
                {/* Metric cards */}
                <div style={{ display: 'flex', gap: 16 }}>
                    {(() => {
                        const cardBase: React.CSSProperties = {
                            background: DARK_BLUE,
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
                            background: ACCENT_BLUE,
                            margin: '8px 0',
                        };
                        const labelStyle: React.CSSProperties = {
                            fontSize: 14,
                            color: '#C0C0C0',
                        };
                        return (
                            <>
                                <div style={cardBase} ref={beginningCardRef}>
                                    <div style={valueStyle}>{currencyFormatter.format(selectedData.beginningBalance)}</div>
                                    <div style={lineStyle} />
                                    <div style={labelStyle}>Beginning Balance</div>
                                </div>
                                <div style={cardBase} ref={endingCardRef}>
                                    <div style={valueStyle}>{currencyFormatter.format(selectedData.endingBalance)}</div>
                                    <div style={lineStyle} />
                                    <div style={labelStyle}>Ending Balance</div>
                                </div>
                                <div style={cardBase} ref={returnCardRef}>
                                    <div style={valueStyle}>{currencyFormatter.format(selectedData.netFlow)}</div>
                                    <div style={lineStyle} />
                                    <div style={labelStyle}>Net Flow</div>
                                </div>
                            </>
                        );
                    })()}
                </div>
                {/* Time-frame toggle */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 10,
                        pointerEvents: 'auto',
                        marginLeft: 'auto',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            background: DARK_BLUE,
                            padding: 2,
                            borderRadius: 9999,
                        }}
                    >
                        {TIMEFRAME_OPTIONS.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setTimeFrame(key)}
                                style={{
                                    padding: `${TOGGLE_PILL_VERT + 2}px ${TOGGLE_PILL_HORZ + 6}px`,
                                    background: timeFrame === key ? ACCENT_BLUE : 'transparent',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontFamily: 'Utile Regular, sans-serif',
                                    fontSize: 18,
                                    borderRadius: 9999,
                                    transition: 'background 0.25s ease, color 0.25s ease',
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chart area */}
            <div style={{ flex: 1, position: 'relative', padding: 0, paddingBottom: 64 }} ref={chartAreaRef}>
                <div style={{ display: 'none' }}>
                    {/* Time-frame toggle */}
                    <div
                        style={{
                            display: 'flex',
                            background: DARK_BLUE,
                            padding: 2,
                            borderRadius: 9999,
                        }}
                    >
                        {TIMEFRAME_OPTIONS.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setTimeFrame(key)}
                                style={{
                                    padding: `${TOGGLE_PILL_VERT + 2}px ${TOGGLE_PILL_HORZ + 6}px`,
                                    background: timeFrame === key ? ACCENT_BLUE : 'transparent',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontFamily: 'Utile Regular, sans-serif',
                                    fontSize: 18,
                                    borderRadius: 9999,
                                    transition: 'background 0.25s ease, color 0.25s ease',
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={visibleData}
                        margin={{ top: 24, right: 0, left: 0, bottom: 8 }}
                        onMouseMove={(state: any) => {
                            if (state && state.isTooltipActive) {
                                setActiveBarIndex(state.activeTooltipIndex);
                                if (state.activeTooltipIndex != null) {
                                    const p = visibleData[state.activeTooltipIndex];
                                    if (p) setHoverPeriod(p.period);
                                }
                            }
                        }}
                        onMouseLeave={() => {
                            setSelectedData(visibleData[visibleData.length - 1]);
                            setCursorPos(null);
                            setActiveBarIndex(null);
                            setHoverPeriod(null);
                        }}
                    >
                        {hoverPeriod !== null && (
                            <ReferenceLine
                                segment={[{ x: hoverPeriod, y: upperTick }, { x: hoverPeriod, y: selectedData.endingBalance }]}
                                stroke="#666666"
                                strokeWidth={1}
                                ifOverflow="extendDomain"
                            />
                        )}
                        {hoverPeriod !== null && (
                            <ReferenceLine
                                key="dashed-ref"
                                segment={[
                                    { x: hoverPeriod, y: selectedData.endingBalance + 0.01 },
                                    {
                                        x: hoverPeriod,
                                        y: hasFlow ? (selectedData.netFlow > 0 ? selectedData.netFlow : 0) : selectedData.endingBalance + 0.01,
                                    },
                                ]}
                                stroke="#666666"
                                strokeWidth={1}
                                strokeDasharray="3 3"
                                strokeOpacity={hasFlow ? 1 : 0}
                                ifOverflow="extendDomain"
                            />
                        )}
                        <CartesianGrid strokeDasharray="3 3" stroke="#333333" opacity={0.3} />
                        <XAxis
                            type="number"
                            dataKey="period"
                            domain={["dataMin - 0.5", "dataMax + 0.5"]}
                            axisLine={false}
                            tickLine={false}
                            tick={axisTickStyle}
                            allowDecimals={false}
                            padding={{ left: 0, right: 0 }}
                            ticks={visibleTicks}
                            tickFormatter={(val: number) => {
                                const row = visibleData.find((d) => d.period === val);
                                if (!row) return '';
                                return row.quarter === 1 ? `${row.year}` : `Q${row.quarter}`;
                            }}
                        />
                        <YAxis
                            tickFormatter={abbreviateNumber}
                            axisLine={false}
                            tickLine={false}
                            tick={axisTickStyle}
                            domain={[lowerTick, upperTick]}
                            ticks={yTicks}
                        />
                        <defs>
                            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={GRADIENT_START} />
                                <stop offset="100%" stopColor={GRADIENT_END} />
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="endingBalance" stroke="none" fill="url(#balanceGradient)" fillOpacity={1} />
                        <Bar dataKey="netFlow" name="Net Flow" barSize={20}>
                            {visibleData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.netFlow >= 0 ? COLORS.Reinvested : COLORS.Distributed}
                                    fillOpacity={activeBarIndex !== null && index !== activeBarIndex ? 0.1 : 1}
                                />
                            ))}
                        </Bar>
                        <Line type="monotone" dataKey="endingBalance" name="Balance" stroke={ACCENT_BLUE} strokeWidth={2} dot={false} />
                        <ReferenceLine y={0} stroke="#666666" strokeWidth={1} />
                        <Tooltip
                            // Cast tooltip props to any to bypass Recharts' loose generic typing
                            content={(tooltipProps) => (
                                <CustomTooltip {...(tooltipProps as any)} onUpdate={setSelectedData} />
                            )}
                            cursor={<DottedCursor onPositionUpdate={handleCursorPosition} showBelow={false} />}
                            labelFormatter={(label) => `${label}`}
                            position={{ y: 0 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 24,
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '16px',
                    fontSize: '12px',
                    lineHeight: '1.4',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: COLORS.Reinvested, borderRadius: '2px' }} />
                    <span style={{ color: '#C0C0C0', fontFamily: 'Utile Regular, sans-serif' }}>Contribution</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: COLORS.Distributed, borderRadius: '2px' }} />
                    <span style={{ color: '#C0C0C0', fontFamily: 'Utile Regular, sans-serif' }}>Redemptions</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '2px', backgroundColor: ACCENT_BLUE }} />
                    <span style={{ color: '#C0C0C0', fontFamily: 'Utile Regular, sans-serif' }}>Balance</span>
                </div>
            </div>

            {/* SVG overlay for connector curves */}
            {cursorPos && cardAnchors && (
                <>
                    <svg
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                    >
                        {(['return', 'begin', 'end'] as const).map((key) => {
                            const anchor = (cardAnchors as any)[key];
                            if (!anchor) return null;
                            const breakY = anchor.y + 10;
                            const d = `M ${cursorPos.x} ${cursorPos.y} L ${cursorPos.x} ${breakY} L ${anchor.x} ${breakY} L ${anchor.x} ${anchor.y}`;
                            return <path key={key} d={d} stroke="#666666" strokeWidth={1} fill="none" />;
                        })}
                    </svg>
                    {cardAnchors.return && (
                        <div
                            style={{
                                position: 'absolute',
                                left: cursorPos.x,
                                top: (() => {
                                    const breakY = cardAnchors.return!.y + 10;
                                    const offset = 12;
                                    return breakY + offset;
                                })(),
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
                            {selectedData.label}
                        </div>
                    )}
                </>
            )}
        </div>
    );
} 