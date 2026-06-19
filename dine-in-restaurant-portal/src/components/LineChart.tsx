interface LineChartProps {
    data: Array<{ label: string; value: number }>;
    title?: string;
    valuePrefix?: string;
    height?: number;
    color?: string;
}

export const LineChart = ({ data, title, valuePrefix = '', height = 300, color = '#3b82f6' }: LineChartProps) => {
    if (data.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {title && <h3 className="text-lg font-bold text-gray-900 mb-6">{title}</h3>}
                <div className="flex items-center justify-center" style={{ height }}>
                    <p className="text-gray-400">No data available</p>
                </div>
            </div>
        );
    }

    const maxValue = Math.max(...data.map((d) => d.value));
    const minValue = Math.min(...data.map((d) => d.value));
    const range = maxValue - minValue || 1;

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = 800;
    const chartHeight = height - padding.top - padding.bottom;
    const totalWidth = chartWidth + padding.left + padding.right;
    const totalHeight = height + padding.bottom;

    // Calculate points for the line
    const getX = (index: number) => padding.left + (index / (data.length - 1)) * chartWidth;
    const getY = (value: number) => padding.top + chartHeight - ((value - minValue) / range) * chartHeight;

    // Create smooth curve using quadratic bezier curves
    const createSmoothPath = () => {
        if (data.length === 0) return '';

        let path = `M ${getX(0)},${getY(data[0].value)}`;

        for (let i = 0; i < data.length - 1; i++) {
            const x1 = getX(i);
            const y1 = getY(data[i].value);
            const x2 = getX(i + 1);
            const y2 = getY(data[i + 1].value);

            const mx = (x1 + x2) / 2;

            path += ` Q ${x1},${y1} ${mx},${(y1 + y2) / 2}`;
            path += ` Q ${x2},${y2} ${x2},${y2}`;
        }

        return path;
    };

    const linePath = createSmoothPath();
    const areaPath = `${linePath} L ${getX(data.length - 1)},${padding.top + chartHeight} L ${padding.left},${padding.top + chartHeight} Z`;

    // Y-axis labels
    const yAxisSteps = 5;
    const yAxisLabels = Array.from({ length: yAxisSteps }, (_, i) => {
        const value = minValue + (range * (yAxisSteps - 1 - i)) / (yAxisSteps - 1);
        return Math.round(value);
    });

    return (
        <div className="p-6">
            {title && <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>}

            <div className="w-full overflow-x-auto">
                <svg
                    viewBox={`0 0 ${totalWidth} ${totalHeight}`}
                    className="w-full"
                    style={{ minHeight: height }}
                >
                    <defs>
                        <linearGradient id="lineChartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                        </linearGradient>
                        <filter id="shadow">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
                        </filter>
                    </defs>

                    {/* Horizontal grid lines */}
                    {yAxisLabels.map((_, i) => {
                        const y = padding.top + (chartHeight * i) / (yAxisSteps - 1);
                        return (
                            <line
                                key={i}
                                x1={padding.left}
                                y1={y}
                                x2={padding.left + chartWidth}
                                y2={y}
                                stroke="#f3f4f6"
                                strokeWidth="1"
                            />
                        );
                    })}

                    {/* Y-axis labels */}
                    {yAxisLabels.map((label, i) => {
                        const y = padding.top + (chartHeight * i) / (yAxisSteps - 1);
                        return (
                            <text
                                key={i}
                                x={padding.left - 10}
                                y={y + 4}
                                textAnchor="end"
                                className="fill-gray-500"
                                style={{ fontSize: '11px', fontWeight: '500' }}
                            >
                                {valuePrefix}{label.toLocaleString()}
                            </text>
                        );
                    })}

                    {/* Area fill */}
                    <path
                        d={areaPath}
                        fill="url(#lineChartGradient)"
                    />

                    {/* Line */}
                    <path
                        d={linePath}
                        fill="none"
                        stroke={color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Data points */}
                    {data.map((item, index) => {
                        const x = getX(index);
                        const y = getY(item.value);
                        return (
                            <g key={index}>
                                <circle
                                    cx={x}
                                    cy={y}
                                    r="5"
                                    fill="white"
                                    stroke={color}
                                    strokeWidth="2.5"
                                    className="hover:r-6 transition-all cursor-pointer"
                                    filter="url(#shadow)"
                                />
                                <circle
                                    cx={x}
                                    cy={y}
                                    r="2"
                                    fill={color}
                                />
                            </g>
                        );
                    })}

                    {/* X-axis labels */}
                    {data.map((item, index) => {
                        const x = getX(index);
                        const shouldShow = data.length <= 12 || index % Math.ceil(data.length / 12) === 0;
                        if (!shouldShow) return null;

                        return (
                            <text
                                key={index}
                                x={x}
                                y={padding.top + chartHeight + 20}
                                textAnchor="middle"
                                className="fill-gray-600"
                                style={{ fontSize: '11px', fontWeight: '500' }}
                            >
                                {item.label}
                            </text>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};
