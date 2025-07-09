/**
 * @framerDisableUnlink
 */

// @ts-nocheck

import * as React from "react"
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
} from "recharts"

// Types
interface PeriodData {
    period: number
    label: string
    year: number
    quarter: number
    beginningBalance: number
    returnRate: number // decimal, e.g. 0.12 for 12%
    returnDollar: number
    action: "Reinvested" | "Distributed"
    netFlow: number // +ve contribution, -ve withdrawal, 0 otherwise
    endingBalance: number
}

interface Props {
    style?: React.CSSProperties
}

// Helper: currency formatter
const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

// Helper: Normalize Framer font-weight keywords to valid CSS values
function convertFontWeight(weight: any): any {
    if (typeof weight === "string") {
        switch (weight.toLowerCase()) {
            case "regular":
                return "normal"
            case "medium":
                return 500
            case "semibold":
                return 600
            case "bold":
                return "bold"
            default:
                return weight
        }
    }
    return weight
}

// NEW: Time-frame options (order matters for the toggle UI)
const TIMEFRAME_OPTIONS = [
    { key: "1yr" as const, label: "1 YR" },
    { key: "5yr" as const, label: "5 YR" },
    { key: "all" as const, label: "All" },
]

// NEW: padding for the pill toggle (vertical, horizontal)
const TOGGLE_PILL_VERT = 2
const TOGGLE_PILL_HORZ = 16

function generateSimulation(): PeriodData[] {
    const rows: PeriodData[] = []
    let beginningBalance = 0

    // Map simulation to actual years 2015–2025 (11 years * 4 quarters)
    const START_YEAR = 2015
    const TOTAL_PERIODS = (2025 - START_YEAR + 1) * 4 // 44 periods

    // Pre-defined cash-flow schedule (period index → net cash-flow):
    //   • 0 years   (2015 Q1 / period 1):  +$100,000  ← initial contribution
    //   • +3 years  (2018 Q1 / period 13): +$100,000
    //   • +6 years  (2021 Q1 / period 25): +$50,000
    //   • +7 years  (2022 Q1 / period 29): −$100,000 (redemption)
    //   • +9 years  (2024 Q1 / period 37): +$200,000
    const flowsSchedule: Record<number, number> = {
        1: 100_000,
        13: 100_000,
        25: 50_000,
        29: -250_000,
        37: 200_000,
    }

    for (let i = 1; i <= TOTAL_PERIODS; i++) {
        // Deterministic sample: cycle returnRate 11%→15% and alternate action
        const returnRate = 0.11 + (((i - 1) % 5) * 0.01) // 0.11,0.12,0.13,0.14,0.15 repeat
        const returnDollar = beginningBalance * returnRate
        const action = i % 2 === 0 ? "Reinvested" : "Distributed"

        // Apply returns
        const afterReturn =
            action === "Reinvested" ? beginningBalance + returnDollar : beginningBalance

        // Apply any scheduled contribution/withdrawal for this period
        const netFlow = flowsSchedule[i] ?? 0

        const endingBalance = afterReturn + netFlow

        const yearIndex = Math.floor((i - 1) / 4)
        const yearNumber = START_YEAR + yearIndex
        const quarter = ((i - 1) % 4) + 1

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
        })

        beginningBalance = endingBalance
    }

    return rows
}

const ACCENT_BLUE = "#008AFF"
const DARK_BLUE = "#292929" // new background color for cards and toggle
const GRADIENT_START = "rgba(0,138,255,0.4)" // match V3 chart default
const GRADIENT_END = "rgba(0,138,255,0)"
const COLORS = {
    Reinvested: ACCENT_BLUE, // blue for reinvestment
    Distributed: "#003A57", // updated color for distributed returns
}

// Helper: abbreviate number to ≤3 digits plus suffix
function abbreviateNumber(value: number): string {
    const abs = Math.abs(value)
    const sign = value < 0 ? "-" : ""

    const format = (num: number) => {
        if (num >= 100) return num.toFixed(0)
        if (num >= 10) return num.toFixed(1)
        return num.toFixed(2)
    }

    if (abs >= 1e9) return `${sign}${format(abs / 1e9)}B`
    if (abs >= 1e6) return `${sign}${format(abs / 1e6)}M`
    if (abs >= 1e3) return `${sign}${format(abs / 1e3)}K`
    return value.toString()
}

// ---------------- Custom Tooltip & Cursor (mirrors ReturnCombo) ----------------

interface TooltipPayloadItem {
    name: string
    value: number
    color: string
    payload: PeriodData
}

interface CustomTooltipProps {
    active?: boolean
    payload?: TooltipPayloadItem[]
    label?: string | number
    onUpdate?: (row: PeriodData) => void
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, onUpdate }) => {
    if (active && payload && payload.length > 0 && onUpdate) {
        onUpdate(payload[0].payload as PeriodData)
    }
    // Render nothing – metric cards handle the display
    return null
}

const DottedCursor: React.FC<any & { onPositionUpdate?: (pos: { x: number; y: number }) => void; showBelow?: boolean }> = ({ x, width, height, points, onPositionUpdate, showBelow }) => {
    // For some chart types (e.g., ComposedChart), x can be undefined – fall back to points array
    let cx: number = 0
    if (points && points.length > 0 && typeof (points[0] as any).x === "number") {
        cx = (points[0] as any).x
    } else if (typeof x === "number") {
        cx = x + ((width ?? 0) / 2)
    }

    const pointY = points && points.length > 0 ? (points[0] as any).y : 0
    const dotRadius = 6 // approximate radius of active dot marker

    // Determine bar top to clamp dashed segment
    let dashedEndY = height
    if (showBelow && points) {
        const barInfo = (points as any[]).find((p) => typeof p.height === "number") as any
        if (barInfo && barInfo.y > pointY) {
            dashedEndY = barInfo.y - 1 // stop 1px above bar
        }
    }

    const dashStartY = pointY + dotRadius // start just below the blue dot

    if (onPositionUpdate) {
        onPositionUpdate({ x: cx, y: pointY })
    }

    return (
        <g>
            {/* Dashed segment only below the point if needed */}
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
    )
}
// ---------------- End helpers ----------------

export default function BalanceFlowChart(props: Props) {
    const { style } = props
    // NEW: selected time-frame (defaults to all)
    type TimeFrameKey = "all" | "1yr" | "5yr"
    const [timeFrame, setTimeFrame] = React.useState<TimeFrameKey>("all")
    
    // ---------- Refs & state used for dynamic connector paths ----------
    const containerRef = React.useRef<HTMLDivElement>(null)
    const chartAreaRef = React.useRef<HTMLDivElement>(null)

    const beginningCardRef = React.useRef<HTMLDivElement>(null)
    const endingCardRef = React.useRef<HTMLDivElement>(null)
    const returnCardRef = React.useRef<HTMLDivElement>(null)

    const [cursorPos, setCursorPos] = React.useState<{ x: number; y: number } | null>(null)
    const [cardAnchors, setCardAnchors] = React.useState<{ return: { x: number; y: number } | null; begin: { x: number; y: number } | null; end: { x: number; y: number } | null }>({
        return: null,
        begin: null,
        end: null,
    })
    
    // Track which bar index is currently active (for dimming other bars)
    const [activeBarIndex, setActiveBarIndex] = React.useState<number | null>(null)
    // period value of hovered bar/point for ReferenceLine
    const [hoverPeriod, setHoverPeriod] = React.useState<number | null>(null)

    // Generate simulation once per mount
    const dataRef = React.useRef<PeriodData[]>([])
    if (dataRef.current.length === 0) {
        dataRef.current = generateSimulation()
    }
    const data = dataRef.current

    // NEW: slice data according to time-frame
    const visibleData = React.useMemo(() => {
        switch (timeFrame) {
            case "1yr": {
                // Grab the most recent 4 quarters to represent the last year
                const lastFour = data.slice(-4)
                return lastFour.length ? lastFour : data
            }
            case "5yr": {
                // Determine latest calendar year in the dataset
                const latestYear = data[data.length - 1].year
                // Keep rows whose year value is within the last 5 years (inclusive)
                return data.filter((d) => d.year >= latestYear - 4)
            }
            case "all":
            default:
                return data
        }
    }, [data, timeFrame])

    // Convenience: does the active bar contain a non-zero net flow?
    const hasFlow = React.useMemo(() => {
        if (activeBarIndex === null) return false
        const row = visibleData[activeBarIndex]
        return !!row && row.netFlow !== 0
    }, [activeBarIndex, visibleData])
    
    // Track which period's values are currently displayed in the header cards.
    const [selectedData, setSelectedData] = React.useState<PeriodData>(() => visibleData[visibleData.length - 1])

    // When the visibleData window changes, reset the selectedData to the latest point
    React.useEffect(() => {
        if (visibleData.length > 0) {
            setSelectedData(visibleData[visibleData.length - 1])
        }
    }, [visibleData])

    // Callback from cursor component – translate chart-relative coords into container-relative coords
    const handleCursorPosition = React.useCallback(
        (posRelToChart: { x: number; y: number }) => {
            if (!chartAreaRef.current || !containerRef.current) return
            const chartRect = chartAreaRef.current.getBoundingClientRect()
            const containerRect = containerRef.current.getBoundingClientRect()
            setCursorPos({
                x: chartRect.left - containerRect.left + posRelToChart.x,
                y: chartRect.top - containerRect.top + posRelToChart.y,
            })
        },
        []
    )

    // Measure metric card positions so we can connect paths to them
    React.useLayoutEffect(() => {
        function updateAnchors() {
            if (!containerRef.current) return
            const containerRect = containerRef.current.getBoundingClientRect()

            const getAnchor = (ref: React.RefObject<HTMLDivElement>) => {
                if (!ref.current) return null
                const rect = ref.current.getBoundingClientRect()
                return {
                    x: rect.left - containerRect.left + rect.width / 2,
                    y: rect.top - containerRect.top + rect.height, // bottom-center of the card
                }
            }

            setCardAnchors({
                return: getAnchor(returnCardRef),
                begin: getAnchor(beginningCardRef),
                end: getAnchor(endingCardRef),
            })
        }

        updateAnchors()
        window.addEventListener("resize", updateAnchors)
        return () => window.removeEventListener("resize", updateAnchors)
    }, [])

    // Compute rounded Y-axis ticks aiming for 5–8 labels
    const baseStep = 100_000 // base increment 100k
    const valuesExtent = visibleData.reduce(
        (acc, d) => {
            acc.max = Math.max(acc.max, d.endingBalance, d.netFlow)
            acc.min = Math.min(acc.min, d.netFlow)
            return acc
        },
        { max: 0, min: 0 }
    )

    // Initial bounds rounded to baseStep
    let upperTick = Math.ceil(valuesExtent.max / baseStep) * baseStep
    let lowerTick = Math.floor(valuesExtent.min / baseStep) * baseStep

    // Dynamically pick step so tick count between 5 and 8
    let step = baseStep
    const minTicks = 5
    const maxTicks = 8

    const countTicks = (st: number) => Math.floor((upperTick - lowerTick) / st) + 1

    // Increase step if too many ticks
    while (countTicks(step) > maxTicks) {
        step *= 2
    }
    // Decrease step if too few ticks (but not below 1k)
    while (countTicks(step) < minTicks && step > 1_000) {
        step = Math.max(step / 2, 1_000)
    }

    // Align lowerTick to step
    lowerTick = Math.floor(lowerTick / step) * step

    const yTicks: number[] = []
    for (let v = lowerTick; v <= upperTick; v += step) {
        yTicks.push(v)
    }

    // Styles for axis/tooltip
    const axisTickStyle = {
        fill: "#888888",
        fontSize: 12,
        fontFamily: "Utile Regular, sans-serif",
        fontWeight: convertFontWeight("normal"),
    }

    const tooltipContentStyle = {
        background: "#262626",
        border: "none",
        color: "#FFFFFF",
        fontSize: 12,
        fontFamily: "Utile Regular, sans-serif",
    }

    const tooltipLabelStyle = {
        color: "#FFFFFF",
        fontFamily: "Utile Regular, sans-serif",
        fontSize: 12,
        fontWeight: convertFontWeight("bold"),
    }

    const tooltipItemStyle = {
        color: "#FFFFFF",
        fontFamily: "Utile Regular, sans-serif",
        fontSize: 12,
        fontWeight: convertFontWeight("normal"),
    }

    // ---------------- Responsive X-axis tick selection ----------------
    const chartContainerRef = React.useRef<HTMLDivElement>(null)
    const [visibleTicks, setVisibleTicks] = React.useState<number[]>([])
    const isOneYear = timeFrame === "1yr"
    const isAllTime = timeFrame === "all"

    React.useEffect(() => {
        function computeTicks(width: number) {
            // Special cases ----------------------------------------------------
            if (isOneYear) {
                setVisibleTicks(visibleData.map((d) => d.period))
                return
            }

            if (isAllTime) {
                // Show Q1 (first quarter) of every year
                setVisibleTicks(
                    visibleData
                        .filter((d) => d.quarter === 1)
                        .map((d) => d.period)
                )
                return
            }

            // 5-year dynamic tick density ------------------------------------
            const YEARS = visibleData.length / 4 // 4 quarters per year
            const MIN_TICK_SPACING = 60 // px
            const maxTicks = Math.floor(width / MIN_TICK_SPACING)

            // Decide ticks per year (1,2,4)
            let ticksPerYear = 1
            if (maxTicks >= YEARS * 4) {
                ticksPerYear = 4
            } else if (maxTicks >= YEARS * 2) {
                ticksPerYear = 2
            }

            const stepWithinYear = Math.floor(4 / ticksPerYear)
            const ticks: number[] = []
            for (let y = 0; y < YEARS; y++) {
                for (let q = 0; q < ticksPerYear; q++) {
                    const periodIndex = y * 4 + q * stepWithinYear
                    if (periodIndex < visibleData.length) {
                        ticks.push(visibleData[periodIndex].period)
                    }
                }
            }
            setVisibleTicks(ticks)
        }

        const el = chartContainerRef.current
        if (!el) return

        computeTicks(el.offsetWidth)

        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentRect) {
                    computeTicks(entry.contentRect.width)
                }
            }
        })
        ro.observe(el)

        return () => ro.disconnect()
    }, [visibleData, isOneYear, isAllTime])
    // ---------------- End responsive tick logic ----------------

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
                fontFamily: "Utile Regular, sans-serif",
                boxSizing: "border-box",
                background: "transparent", // transparent background per design
                color: "#FFFFFF", // default white text for dark themes
                position: "relative", // anchor for absolute SVG overlay
            }}
        >
            {/* Metric Cards (left) + Toggle (right) in header row */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "0 0 16px 0",
                    pointerEvents: "none",
                }}
            >
                {/* Cards left-aligned */}
                <div style={{ display: "flex", gap: 16 }}>
                    {(() => {
                        const cardBase: React.CSSProperties = {
                            background: DARK_BLUE,
                            borderRadius: 8,
                            padding: "12px 20px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            minWidth: 140,
                            textAlign: "center",
                        }
                        const valueStyle: React.CSSProperties = {
                            fontSize: 20,
                            fontWeight: 500,
                            color: "#FFFFFF",
                            textAlign: "center",
                        }
                        const lineStyle: React.CSSProperties = {
                            width: "100%",
                            height: 2,
                            background: ACCENT_BLUE,
                            margin: "8px 0",
                        }
                        const labelStyle: React.CSSProperties = {
                            fontSize: 14,
                            color: "#C0C0C0",
                            textAlign: "center",
                        }

                        return (
                            <>
                                                            {/* Beginning Balance (first card) */}
                            <div style={cardBase} ref={beginningCardRef}>
                                <div style={valueStyle}>{currencyFormatter.format(selectedData.beginningBalance)}</div>
                                <div style={lineStyle} />
                                <div style={labelStyle}>Beginning Balance</div>
                            </div>

                            {/* Ending Balance (last card) */}
                            <div style={cardBase} ref={endingCardRef}>
                                <div style={valueStyle}>{currencyFormatter.format(selectedData.endingBalance)}</div>
                                <div style={lineStyle} />
                                <div style={labelStyle}>Ending Balance</div>
                            </div>

                            {/* Net Flow (middle card) */}
                            <div style={cardBase} ref={returnCardRef}>
                                <div style={valueStyle}>{currencyFormatter.format(selectedData.netFlow)}</div>
                                <div style={lineStyle} />
                                <div style={labelStyle}>Net Flow</div>
                            </div>
                            </>
                        )
                    })()}
                </div>
                {/* Toggle right-aligned */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 10,
                        pointerEvents: "auto",
                    }}
                >
                    {/* Time-frame toggle */}
                    <div
                        style={{
                            display: "flex",
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
                                    background: timeFrame === key ? ACCENT_BLUE : "transparent",
                                    color: "#FFFFFF",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontFamily: "Utile Regular, sans-serif",
                                    fontSize: 18,
                                    borderRadius: 9999,
                                    transition: "background 0.25s ease, color 0.25s ease",
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                </div>
            </div>

            {/* Chart Area */}
            <div 
                style={{ 
                    flex: 1, 
                    position: "relative",
                    padding: 0,
                }} 
                ref={chartAreaRef}
            >
                <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart
                            data={visibleData}
                            margin={{ top: 24, right: 0, left: 0, bottom: 8 }}
                            onMouseMove={(state: any) => {
                                if (state && state.isTooltipActive) {
                                    setActiveBarIndex(state.activeTooltipIndex)
                                    if (state.activeTooltipIndex != null) {
                                        const p = visibleData[state.activeTooltipIndex]
                                        if (p) setHoverPeriod(p.period)
                                    }
                                }
                            }}
                            onMouseLeave={() => {
                                setSelectedData(visibleData[visibleData.length - 1])
                                setCursorPos(null)
                                setActiveBarIndex(null)
                                setHoverPeriod(null)
                            }}
                        >
                        {/* Always-on solid vertical indicator (clamped to data-point) */}
                        {hoverPeriod !== null && (
                            <ReferenceLine
                                segment={[
                                    { x: hoverPeriod, y: upperTick },
                                    { x: hoverPeriod, y: selectedData.endingBalance },
                                ]}
                                stroke="#666666"
                                strokeWidth={1}
                                ifOverflow="extendDomain"
                            />
                        )}

                        {/* Dashed continuation – always mounted to avoid chart reflow */}
                        {hoverPeriod !== null && (
                            <ReferenceLine
                                key="dashed-ref"
                                segment={[
                                    { x: hoverPeriod, y: selectedData.endingBalance + 0.01 }, // start just below point
                                    {
                                        x: hoverPeriod,
                                        y: hasFlow
                                            ? (selectedData.netFlow > 0 ? selectedData.netFlow : 0)
                                            : selectedData.endingBalance + 0.01, // zero-length if no bar
                                    },
                                ]}
                                stroke="#666666"
                                strokeWidth={1}
                                strokeDasharray="3 3"
                                strokeOpacity={hasFlow ? 1 : 0}
                                isAnimationActive={false}
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
                                const row = visibleData.find((d) => d.period === val)
                                if (!row) return ""
                                // If first quarter show just the year, else show Q2/Q3/Q4
                                return row.quarter === 1 ? `${row.year}` : `Q${row.quarter}`
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

                        {/* Area under balance line */}
                        <Area
                            type="monotone"
                            dataKey="endingBalance"
                            stroke="none"
                            fill="url(#balanceGradient)"
                            fillOpacity={1}
                            isAnimationActive={false}
                        />

                        {/* Bars for contributions/withdrawals */}
                        <Bar
                            dataKey="netFlow"
                            name="Net Flow"
                            barSize={20}
                            isAnimationActive={false}
                        >
                            {visibleData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.netFlow >= 0 ? COLORS.Reinvested : COLORS.Distributed}
                                    fillOpacity={activeBarIndex !== null && index !== activeBarIndex ? 0.1 : 1}
                                />
                            ))}
                        </Bar>

                        {/* Line for ending balance */}
                        <Line
                            type="monotone"
                            dataKey="endingBalance"
                            name="Balance"
                            stroke={ACCENT_BLUE}
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                        />

                        {/* Zero baseline for withdrawals */}
                        <ReferenceLine y={0} stroke="#666666" strokeWidth={1} />

                        <Tooltip
                            content={(props) => <CustomTooltip {...props} onUpdate={setSelectedData} />}
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
                    padding: "0px",
                    display: "flex",
                    flexDirection: "row",
                    gap: "16px",
                    fontSize: "12px",
                    lineHeight: "1.4",
                    justifyContent: "flex-start",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                        style={{
                            width: "12px",
                            height: "12px",
                            backgroundColor: COLORS.Reinvested,
                            borderRadius: "2px",
                        }}
                    />
                    <span style={{ color: "#C0C0C0", fontFamily: "Utile Regular, sans-serif" }}>
                        Contribution
                    </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                        style={{
                            width: "12px",
                            height: "12px",
                            backgroundColor: COLORS.Distributed,
                            borderRadius: "2px",
                        }}
                    />
                    <span style={{ color: "#C0C0C0", fontFamily: "Utile Regular, sans-serif" }}>
                        Redemptions
                    </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                        style={{
                            width: "12px",
                            height: "2px",
                            backgroundColor: ACCENT_BLUE,
                        }}
                    />
                    <span style={{ color: "#C0C0C0", fontFamily: "Utile Regular, sans-serif" }}>
                        Balance
                    </span>
                </div>
            </div>

            {/* ---------- SVG overlay for connector curves ---------- */}
            {cursorPos && cardAnchors && (
                <>
                    <svg
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            pointerEvents: "none",
                        }}
                    >
                        {(["return", "begin", "end"] as const).map((key) => {
                            const anchor = (cardAnchors as any)[key]
                            if (!anchor) return null
                            // Orthogonal elbow: down from cursor, horizontal, down to card anchor
                            const breakY = anchor.y + 10 // 10px below card anchor
                            const d = `M ${cursorPos.x} ${cursorPos.y} L ${cursorPos.x} ${breakY} L ${anchor.x} ${breakY} L ${anchor.x} ${anchor.y}`
                            return (
                                <path
                                    key={key}
                                    d={d}
                                    stroke="#666666"
                                    strokeWidth={1}
                                    fill="none"
                                />
                            )
                        })}
                    </svg>
                    {/* Bubble label at the first elbow */}
                    {cardAnchors.return && (
                        <div
                            style={{
                                position: "absolute",
                                left: cursorPos.x,
                                top: (() => {
                                    const breakY = cardAnchors.return!.y + 10
                                    const offset = 12
                                    return breakY + offset
                                })(),
                                transform: "translateX(-50%)",
                                background: "#666666",
                                color: "#FFFFFF",
                                padding: "4px 8px",
                                borderRadius: 4,
                                fontSize: 16,
                                fontFamily: "Utile Regular, sans-serif",
                                whiteSpace: "nowrap",
                                pointerEvents: "none",
                            }}
                        >
                            {selectedData.label}
                        </div>
                    )}
                </>
            )}
        </div>
    )
} 