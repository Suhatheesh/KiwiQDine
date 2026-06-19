import { Clock } from "lucide-react";
import { IOSSwitch } from "../../components/Switch";
import { RestaurantRequestResponse } from "../../features/restaurants/types";

interface OpenHoursTabProps {
    restaurantState: RestaurantRequestResponse | null;
    setRestaurantState: (restaurantState: RestaurantRequestResponse | null) => void;
    primaryColor: string;
}

function OpenHoursTab({ restaurantState, setRestaurantState, primaryColor }: OpenHoursTabProps) {
    return <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-orange-50 rounded-2xl shadow-sm">
                <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900">Weekly Schedule</h2>
                <p className="text-sm text-gray-400 font-medium">When is your restaurant open?</p>
            </div>
        </div>

        <div className="space-y-4">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                const dayKey = day.toLowerCase();
                const dayHours = restaurantState?.openHours?.[dayKey] || { open: '09:00', close: '22:00', closed: false };

                return (
                    <div key={day} className="flex flex-col md:flex-row items-center gap-6 p-5 bg-gray-50/50 rounded-2xl hover:bg-white hover:shadow-md transition-all duration-300 border border-transparent hover:border-gray-100 group">
                        <div className="w-32">
                            <span className="text-base font-semibold text-gray-900">{day}</span>
                        </div>

                        <div className="flex items-center gap-4 p-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <IOSSwitch
                                primaryColor={primaryColor}
                                checked={!dayHours.closed}
                                onChange={(e) => {
                                    const newOpenHours = {
                                        ...restaurantState?.openHours,
                                        [dayKey]: { ...dayHours, closed: !e.target.checked }
                                    };
                                    setRestaurantState({ ...restaurantState, openHours: newOpenHours });
                                }} />
                            <span className={`text-xs font-semibold uppercase tracking-widest ${!dayHours.closed ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {!dayHours.closed ? 'Open' : 'Closed'}
                            </span>
                        </div>

                        {!dayHours.closed && (
                            <div className="flex items-center gap-6 flex-1 animate-in fade-in slide-in-from-left-2 duration-300">
                                <div className="flex flex-col gap-1.5 flex-1 max-w-[180px]">
                                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-1">Opening Time</label>
                                    <input
                                        type="time"
                                        value={dayHours.open || '09:00'}
                                        onChange={(e) => {
                                            const newOpenHours = {
                                                ...restaurantState?.openHours,
                                                [dayKey]: { ...dayHours, open: e.target.value }
                                            };
                                            setRestaurantState({ ...restaurantState, openHours: newOpenHours });
                                        }}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 font-bold text-gray-900 transition-all shadow-xs" />
                                </div>
                                <div className="w-4 h-0.5 bg-gray-200 rounded-full mt-5" />
                                <div className="flex flex-col gap-1.5 flex-1 max-w-[180px]">
                                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-1">Closing Time</label>
                                    <input
                                        type="time"
                                        value={dayHours.close || '22:00'}
                                        onChange={(e) => {
                                            const newOpenHours = {
                                                ...restaurantState?.openHours,
                                                [dayKey]: { ...dayHours, close: e.target.value }
                                            };
                                            setRestaurantState({ ...restaurantState, openHours: newOpenHours });
                                        }}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 font-bold text-gray-900 transition-all shadow-xs" />
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    </div>;
}

export default OpenHoursTab;