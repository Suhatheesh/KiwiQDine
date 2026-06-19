import { AlertTriangle, CheckSquare } from "lucide-react"
import { IOSSwitch } from "../../components/Switch"

interface WaiterConfirmationTabProps {
    primaryColor: string;
    restaurantState: any;
    setRestaurantState: any;
}

const WaiterConfirmationTab = ({ primaryColor, restaurantState, setRestaurantState }: WaiterConfirmationTabProps) => {
    return <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-teal-50 rounded-2xl shadow-sm">
                <CheckSquare className="w-6 h-6 text-teal-600" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900">Waiter Confirmation</h2>
                <p className="text-sm text-gray-400 font-medium">Control order confirmation workflow</p>
            </div>
        </div>

        <div className="space-y-6">
            <div className="flex items-center justify-between p-6 bg-gray-50/80 rounded-3xl border border-gray-100 group transition-all hover:bg-white hover:shadow-md">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                        <CheckSquare className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Require Waiter Confirmation</h3>
                        <p className="text-xs text-gray-500 font-medium">When enabled, orders must be confirmed by a waiter before being sent to the kitchen.</p>
                    </div>
                </div>
                <IOSSwitch
                    primaryColor={primaryColor}
                    checked={restaurantState?.requireWaiterConfirmation ?? false}
                    onChange={(e) => setRestaurantState({ ...restaurantState, requireWaiterConfirmation: e.target.checked })}
                />
            </div>

            {restaurantState?.requireWaiterConfirmation && (
                <div className="p-8 bg-teal-50/30 rounded-3xl border-2 border-dashed border-teal-100 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-teal-100">
                            <AlertTriangle className="w-6 h-6 text-teal-600" />
                        </div>
                        <div>
                            <h4 className="text-md font-bold text-gray-900 mb-2">How it works</h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-600 font-bold mt-0.5">•</span>
                                    <span>Customers can place orders through the app</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-600 font-bold mt-0.5">•</span>
                                    <span>Orders will be queued and require waiter confirmation before being sent to the kitchen</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-600 font-bold mt-0.5">•</span>
                                    <span>Waiters can review and confirm orders from their dashboard</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-600 font-bold mt-0.5">•</span>
                                    <span>Once confirmed, orders proceed to the kitchen for preparation</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
}

export default WaiterConfirmationTab