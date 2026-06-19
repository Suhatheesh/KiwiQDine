import React, { useState, useRef, FC, useLayoutEffect } from 'react';

interface OTPInputProps {
    initialOTP?: string;
    isReset?: boolean;
    isError?: boolean;
    length?: number;
    onComplete?: (value: string) => void
}

const OTPInput: FC<OTPInputProps> = ({ length = 6, onComplete, isReset, isError, initialOTP }) => {
    const [otp, setOtp] = useState<string[]>(initialOTP ? initialOTP.split('') : new Array(length).fill(''));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useLayoutEffect(() => {
        if (isReset || isError) {
            resetOTP();
        }
    }, [isReset, isError]);

    const resetOTP = () => {
        setOtp(new Array(length).fill(''));
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    };

    const handleChange = (value: string, index: number) => {
        // Only allow digits
        if (value && !/^\d+$/.test(value)) return;

        const newOtp = [...otp];
        // Take only the last character entered
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Notify parent if complete
        const otpValue = newOtp.join('');
        if (otpValue.length === length && onComplete) {
            onComplete(otpValue);
        }

        // Focus next input
        if (value && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                // If current is empty, move focus back and clear that one
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
                inputRefs.current[index - 1]?.focus();

                if (onComplete) onComplete(newOtp.join(''));
            } else if (otp[index]) {
                // Just clear current
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
                if (onComplete) onComplete(newOtp.join(''));
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').trim();
        if (!/^\d+$/.test(data)) return;

        const pasteData = data.substring(0, length).split('');
        const newOtp = [...otp];

        pasteData.forEach((char, idx) => {
            if (idx < length) {
                newOtp[idx] = char;
            }
        });

        setOtp(newOtp);

        // Focus the appropriate input after paste
        const nextIndex = Math.min(pasteData.length, length - 1);
        inputRefs.current[nextIndex]?.focus();

        if (newOtp.join('').length === length && onComplete) {
            onComplete(newOtp.join(''));
        }
    };

    return (
        <div className={`flex gap-3 justify-center items-center ${isError ? 'animate-shake' : ''}`}>
            {otp.map((data, index) => (
                <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d*"
                    maxLength={1}
                    value={data}
                    onPaste={handlePaste}
                    onChange={e => handleChange(e.target.value, index)}
                    onKeyDown={e => handleKeyDown(e, index)}
                    ref={el => {
                        inputRefs.current[index] = el;
                    }}
                    className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl transition-all duration-200 outline-none
                        ${isError
                            ? 'border-red-500 bg-red-50 text-red-600'
                            : 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200'
                        }
                    `}
                />
            ))}
        </div>
    );
};

export default OTPInput;