interface PieChartData {
    label: string;
    value: number;
    color: string;
    percentage?: number;
    subLabel?: string;
}

interface PieChartProps {
    data: PieChartData[];
    title?: string;
    height?: number;
    valuePrefix?: string;
}

export const PieChart = ({ data, title, valuePrefix = '' }: PieChartProps) => {

    const total = data.reduce((sum, item) => sum + item.value, 0);
    const size = 200;
    const center = size / 2;
    const radius = size / 2 - 10;

    let currentAngle = -90; // Start from top

    const slices = data.map((item) => {
        const calculatedPercentage = (item.value / total) * 100;
        const angle = (item.value / total) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;

        currentAngle = endAngle;

        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = center + radius * Math.cos(startRad);
        const y1 = center + radius * Math.sin(startRad);
        const x2 = center + radius * Math.cos(endRad);
        const y2 = center + radius * Math.sin(endRad);

        const largeArc = angle > 180 ? 1 : 0;

        return {
            path: `M ${center},${center} L ${x1},${y1} A ${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`,
            color: item.color,
            label: item.label,
            value: item.value,
            percentage: item.percentage ?? calculatedPercentage,
            subLabel: item.subLabel
        };
    });

    return (
        <div className="p-6">
            {title && <h3 className="text-lg font-bold text-gray-900 mb-6">{title}</h3>}

            <div className="flex flex-col lg:flex-row items-center gap-6">
                {/* Pie Chart */}
                <div className="shrink-0">
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                        <defs>
                            <filter id="pieShadow">
                                <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
                            </filter>
                        </defs>
                        {slices.map((slice, index) => (
                            <path
                                key={index}
                                d={slice.path}
                                fill={slice.color}
                                className="hover:opacity-90 transition-all cursor-pointer"
                                filter="url(#pieShadow)"
                                style={{ transformOrigin: 'center' }}
                            >
                                <title>{`${slice.label}: ${valuePrefix}${slice.value.toLocaleString()} (${slice.percentage.toFixed(1)}%)`}</title>
                            </path>
                        ))}
                    </svg>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-3">
                    {slices.map((slice, index) => (
                        <div key={index} className="flex items-center justify-between hover:bg-gray-50 p-2 rounded transition-colors">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-4 h-4 rounded shadow-sm"
                                    style={{ backgroundColor: slice.color }}
                                ></div>
                                <div>
                                    <span className="text-sm font-medium text-gray-700 block">{slice.label}</span>
                                    {slice.subLabel && (
                                        <span className="text-xs text-gray-500">{slice.subLabel}</span>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-gray-900">{slice.percentage.toFixed(1)}%</div>
                                <div className="text-xs text-gray-500">{valuePrefix}{slice.value.toLocaleString()}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
