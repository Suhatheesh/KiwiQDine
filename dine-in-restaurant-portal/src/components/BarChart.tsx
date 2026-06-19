interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  title?: string;
  valuePrefix?: string;
  height?: number;
  color?: string;
}

export const BarChart = ({ data, title, valuePrefix = '', height = 300, color = '#3b82f6' }: BarChartProps) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="p-6">
      {title && <h3 className="text-lg font-bold text-gray-900 mb-6">{title}</h3>}

      <div className="space-y-4" style={{ height }}>
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{item.label}</span>
                <span className="font-bold text-gray-900">
                  {valuePrefix}{item.value.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${percentage}%`, backgroundColor: color }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
