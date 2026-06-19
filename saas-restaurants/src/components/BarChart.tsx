interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  title?: string;
  valuePrefix?: string;
  height?: number;
}

export const BarChart = ({ data, title, valuePrefix = '', height = 300 }: BarChartProps) => {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {title && <h3 className="text-lg font-bold text-gray-900 mb-6">{title}</h3>}

      <div className="space-y-4" style={{ height }}>
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;

          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{item.label}</span>
                <span className="font-bold text-gray-900">
                  {valuePrefix}{item.value.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
