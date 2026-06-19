import { ChevronDown, Lock } from "lucide-react";
import { FC, useState } from "react";
import { Input } from "../components/Input";
import flag from "../assets/NZ FLAG.png";
import { Button } from "../components/Button";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../app/store";
import { createCustomerOTPRequest } from "../features/Customer/customerSlice";
import { CustomerOTPRequest } from "../features/Customer/types";

interface EnterUserDetailSectionProps {
    isNameRequired?: boolean;
    onConfirm: (value?: CustomerOTPRequest) => void;
}

const EnterUserDetailSection: FC<EnterUserDetailSectionProps> = ({
    isNameRequired = true,
    onConfirm
}) => {
    const dispatch = useDispatch<AppDispatch>();

    const { loading } = useSelector((state: RootState) => state.customer);
    const { loading: orderLoading } = useSelector((state: RootState) => state.order);

    const [userData, setUserData] = useState<CustomerOTPRequest>({
        name: "",
        phoneNumber: ""
    });

    const handleConfirm = () => {
        let phoneNumber = userData.phoneNumber.trim();

        if (!phoneNumber.startsWith("0")) {
            phoneNumber = "0" + phoneNumber;
        }

        const payload = {
            ...userData,
            phoneNumber
        };

        dispatch(createCustomerOTPRequest(payload));
        onConfirm(payload);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserData((prev) => ({
            ...prev,
            name: e.target.value
        }));
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserData((prev) => ({
            ...prev,
            phoneNumber: e.target.value
        }));
    };

    const preventMinus = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (
            [
                "Backspace",
                "Delete",
                "Tab",
                "Escape",
                "Enter",
                "ArrowLeft",
                "ArrowRight",
                "ArrowUp",
                "ArrowDown"
            ].includes(e.key)
        ) {
            return;
        }

        if ((e.ctrlKey || e.metaKey) && ["a", "c", "v", "x"].includes(e.key.toLowerCase())) {
            return;
        }

        if (!/^[0-9+]$/.test(e.key)) {
            e.preventDefault();
        }
    };

    return (
        <div className="flex flex-col flex-1 p-5">
            <div className="flex flex-1 items-center justify-center space-x-2">
                <Lock />
                <p className="text-xl font-medium">Secure Your Order</p>
            </div>

            <p className="text-sm text-gray-500 text-center p-4">
                We’ll send one-time code to verify your number
            </p>

            {isNameRequired && (
                <Input
                    label="Your Name*"
                    placeholder="e.g. John Doe"
                    value={userData?.name}
                    onChange={handleNameChange}
                    className="h-12"
                />
            )}

            <div className="flex flex-1 items-center space-x-4 py-3">
                <div className="space-y-2 -mt-1.5">
                    <p className="text-sm">Country</p>
                    <div className="flex items-center border border-gray-300 rounded-lg h-12 px-2.5 space-x-2">
                        <img src={flag} className="w-5 h-5" />
                        <ChevronDown className="w-8 h-8" />
                    </div>
                </div>

                <Input
                    type="tel"
                    label="Phone Number"
                    placeholder="e.g. 0211234567"
                    value={userData?.phoneNumber}
                    maxLength={11}
                    onChange={handlePhoneChange}
                    onKeyDown={preventMinus}
                    className="h-12"
                />
            </div>

            <Button
                disabled={
                    userData?.phoneNumber.length < 11 ||
                    userData?.name.length === 0 ||
                    loading
                }
                size="lg"
                onClick={handleConfirm}
                isLoading={loading || orderLoading}
                className="font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
            >
                <p>Send OTP</p>
            </Button>
        </div>
    );
};

export default EnterUserDetailSection;