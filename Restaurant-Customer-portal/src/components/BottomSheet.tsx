import { FC, ReactNode, useRef } from "react";

interface BottomSheetProps {
    isOpen: boolean;
    onClose?: () => void;
    children: ReactNode;
}

const BottomSheet: FC<BottomSheetProps> = ({ isOpen, onClose, children }) => {

    const ref = useRef<HTMLDivElement>(null);
    const startY = useRef<number | null>(null);

    const handlePointerDown = (e: React.PointerEvent) => {
        startY.current = e.clientY;
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (startY.current === null) return;
        const deltaY = e.clientY - startY.current;
        if (deltaY > 12 && onClose) {
            onClose();
        }
    };

    const handlePointerUp = () => {
        startY.current = null;
    };

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black opacity-50 z-60"
                    onClick={onClose}
                ></div>
            )}

            {/* Bottom Sheet */}
            <div
                ref={ref}
                className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg transition-transform duration-300 ease-in-out z-70
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                <div className="flex justify-center">
                    <div className='flex justify-center py-2'>
                        <div className='w-14 h-2 bg-gray-300 rounded-full mt-2' />
                    </div>
                </div>
                {children}
            </div>
        </>
    );
};

export default BottomSheet;