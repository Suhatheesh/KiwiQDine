import { Car } from "lucide-react";
import { FC, useState } from "react";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

interface EnterVehicleDetailSectionProps {
    onConfirm: (vehicleDetails: { vehicleModel: string; vehicleNumber: string }) => void;
}

const EnterVehicleDetailSection: FC<EnterVehicleDetailSectionProps> = ({ onConfirm }) => {

    const [vehicleModel, setVehicleModel] = useState("");
    const [vehicleNumber, setVehicleNumber] = useState("");

    const handleConfirm = () => {
        onConfirm({ vehicleModel, vehicleNumber });
    };

    return (
        <div className="flex flex-col flex-1 p-5">
            <div className="flex flex-1 items-center justify-center space-x-2">
                <Car />
                <p className="text-xl font-medium">Vehicle Details</p>
            </div>
            <p className="text-sm text-gray-500 text-center p-4">Please enter your vehicle details for parking service</p>

            <div className="space-y-4">
                <Input
                    label="Vehicle Model"
                    placeholder="e.g. Toyota Prius"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="h-12"
                />

                <Input
                    label="Vehicle Number*"
                    placeholder="e.g. CAB-1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="h-12"
                />
            </div>

            <div className="mt-6 flex flex-col space-y-3">
                <Button
                    disabled={!vehicleNumber}
                    size="lg"
                    onClick={handleConfirm}
                    className="font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg w-full"
                >
                    <p>Confirm</p>
                </Button>
            </div>
        </div>
    );
};

export default EnterVehicleDetailSection;
