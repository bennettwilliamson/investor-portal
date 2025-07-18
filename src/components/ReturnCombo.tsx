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
// No longer need HTML overlay; we embed label inside the SVG.

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

    // Suppress the HTML tooltip – label now rendered inside SVG.
    return null;
};

const CURSOR_COLOR = '#666666';

interface RC_CursorProps {
    x?: number;
    width?: number;
    height?: number;
    points?: any[];
    label?: string;
}

const DottedCursor: React.FC<RC_CursorProps> = ({ x = 0, width = 0, height = 0, points, label = '' }) => {
    const cx = x + (width ?? 0) / 2;

    let labelText = label;
    if (!labelText && points && points.length > 0 && typeof (points[0] as any).payload?.quarterLabel === 'string') {
        labelText = (points[0] as any).payload.quarterLabel as string;
    }

    // Sizing heuristics
    const FONT_SIZE = 14; // standardized to 14px to match other chart
    const PADDING_X = 8;
    const PADDING_Y = 4;
    const AVG_CHAR_WIDTH = FONT_SIZE * 0.6;
    const textWidth = labelText.length * AVG_CHAR_WIDTH;
    const rectWidth = textWidth + PADDING_X * 2;
    const rectHeight = FONT_SIZE + PADDING_Y * 2;

    return (
        <g pointerEvents="none">
            <line x1={cx} y1={0} x2={cx} y2={height} stroke={CURSOR_COLOR} strokeWidth={1} />

            {labelText && (
                <g transform={`translate(${cx}, 0)`}>
                    <rect
                        x={-rectWidth / 2}
                        y={0}
                        width={rectWidth}
                        height={rectHeight}
                        rx={4}
                        ry={4}
                        fill={CURSOR_COLOR}
                    />
                    <text
                        x={0}
                        y={rectHeight / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#FFFFFF"
                        fontSize={FONT_SIZE}
                        fontFamily="Utile Regular, sans-serif"
                    >
                        {labelText}
                    </text>
                </g>
            )}
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

    // Tooltip connector removed – label is now inside SVG.

    const [activeBarIndex, setActiveBarIndex] = React.useState<number | null>(null);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                fontFamily: 'Utile Regular, sans-serif',
                boxSizing: 'border-box',
                background: 'transparent',
                color: '#FFFFFF',
                position: 'relative',
                height: 550,
                ...(style || {}),
            }}
        >
            {/* Header row */}
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', padding: '0 0 8px 0', pointerEvents: 'none' }}>
                <div style={{ display: 'flex', gap: 16 }}>
                    {(() => {
                        const cardBase: React.CSSProperties = { background: DARK_BLUE, borderRadius: 8, padding: '12px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 140, textAlign: 'center' };
                        const valueStyle: React.CSSProperties = { fontSize: 20, fontWeight: 500, color: '#FFFFFF' };
                        const lineStyle: React.CSSProperties = { width: '100%', height: 2, background: '#ffffff', margin: '8px 0' };
                        const labelStyle: React.CSSProperties = { fontSize: 14, color: '#C0C0C0' };
                        return (
                            <>
                                <div style={cardBase}>
                                    <div style={valueStyle}>{currencyFormatter.format(selectedData.beginningBalance)}</div>
                                    <div style={lineStyle} />
                                    <div style={labelStyle}>Beginning Balance</div>
                                </div>
                                <div style={cardBase}>
                                    <div style={valueStyle}>{returnValue}</div>
                                    <div style={lineStyle} />
                                    <div style={labelStyle}>{viewMode === 'dollar' ? 'Realized Return ($)' : 'Realized Return (%)'}</div>
                                </div>
                                <div style={cardBase}>
                                    <div style={valueStyle}>{currencyFormatter.format(selectedData.endingBalance)}</div>
                                    <div style={lineStyle} />
                                    <div style={labelStyle}>Ending Balance</div>
                                </div>
                            </>
                        );
                    })()}
                </div>
                {/* Toggle controls - keeping existing implementation */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, pointerEvents: 'auto' }}>
                    {/* Legend (hidden – moved below chart) */}
                    <div style={{ display: 'none', flexDirection: 'row', gap: '24px', fontSize: '12px', lineHeight: '1.4', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '12px', height: '12px', backgroundColor: COLORS.Reinvested, borderRadius: '2px' }} />
                            <span style={{ color: '#C0C0C0', fontFamily: 'Utile Regular, sans-serif' }}>Reinvested Returns</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '12px', height: '12px', backgroundColor: COLORS.Distributed, borderRadius: '2px' }} />
                            <span style={{ color: '#C0C0C0', fontFamily: 'Utile Regular, sans-serif' }}>Distributed Returns</span>
                        </div>
                    </div>
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
            <div style={{ flex: 1, position: 'relative', padding: 0, paddingBottom: 0 }}> {/* chart area */}
                {/* Hidden duplicate toggle controls - keeping existing implementation */}
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
                            cursor={<DottedCursor label={selectedData.quarterLabel} /> as any}
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

            {/* Legend below chart */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: 12, marginLeft: 24, pointerEvents: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 12, height: 12, backgroundColor: COLORS.Reinvested, borderRadius: 2 }} />
                    <span style={{ color: '#C0C0C0', fontFamily: 'Utile Regular, sans-serif' }}>Reinvested Returns</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 12, height: 12, backgroundColor: COLORS.Distributed, borderRadius: 2 }} />
                    <span style={{ color: '#C0C0C0', fontFamily: 'Utile Regular, sans-serif' }}>Distributed Returns</span>
                </div>
            </div>

            {/* Date label rendered within SVG via DottedCursor */}
        </div>
    );
} 