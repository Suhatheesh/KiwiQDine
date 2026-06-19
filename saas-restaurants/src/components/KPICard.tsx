import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  gradient: string;
  trend?: 'up' | 'down';
}

export const KPICard = ({ title, value, change, icon: Icon, gradient, trend }: KPICardProps) => {
  return (
    <div className={`group relative ${gradient} rounded-2xl p-6 text-white overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}>
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black opacity-5 rounded-full -ml-12 -mb-12"></div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm border border-white border-opacity-20">
            <Icon className="w-6 h-6 text-white" />
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-10 text-xs font-bold`}>
              <span className="text-white">
                {trend === 'up' ? '↑' : '↓'} {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-white text-opacity-80 mb-1 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-extrabold text-white tracking-tight">{value}</p>
          {change !== undefined && (
            <p className="text-[10px] mt-2 text-white text-opacity-60 font-medium">vs last month</p>
          )}
        </div>
      </div>
    </div>
  );
};
