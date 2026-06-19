import { FC, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "../components/Button";
import { Download, Plus, QrCode, Trash, Image as ImageIcon } from "lucide-react";
import QRCard from "../components/QRCard";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../app/store";
import { CreateQRRquest, QR } from "../features/qr/types";
import { Input } from "../components/Input";
import { Modal } from "../components/Modal";
import { QRTableType, QRStatus, OrderType, TenantType } from "../utils/constants";
import { SubmitHandler, useForm } from "react-hook-form";
import { createQRRequest, deleteQRRequest, fetchAllQRRequest, updateQRRequest } from "../features/qr/qrSlice";
import { useAuth } from "../hooks/useAuth";
import { QRCardSkeleton } from "../components/CustomSkeleton";
import { QRCodeSVG } from "qrcode.react";
import { downloadQRCode, downloadQRWithBackground } from "../utils/qrImageComposer";
import qrBackgroundImage from "../assets/qr_background.png";
import logo from "../assets/logo.png";
import { hexToRgba } from "../utils";
import { Select } from "../components/Select";
import { fetchCanCreateTableRequest, fetchCanQRCreateRequest } from "../features/subscriptions/subscriptionsSlice";

const QRTable: FC = () => {

    const tableCategories = useMemo(() => ["All", "Active", "Inactive"], []);
    const qrCodeRef = useRef<HTMLDivElement>(null);
    const [selectCategory, setSelectCategory] = useState<string>(tableCategories[0])
    const [selectQR, setSelectQR] = useState<QR | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isQRView, setQRView] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isActivateQRModalOpen, setIsActivateQRModalOpen] = useState<boolean>(false);
    const [showDownloadOptions, setShowDownloadOptions] = useState<boolean>(false);

    const { user, primaryColor } = useAuth();
    const dispatch = useDispatch<AppDispatch>();

    const { qr, loading, isCreateQR, isDeleteQR } = useSelector((state: RootState) => state.qr);
    const { canCreateQR, canCreateTable } = useSelector((state: RootState) => state.subscription);

    const { register, handleSubmit, reset, watch } = useForm<CreateQRRquest>({
        defaultValues: {
            name: "",
            description: "",
            type: user?.tenant?.type === TenantType.FOOD_COURT ? QRTableType.FOOD_COURT : QRTableType.TAKE_AWAY
        }
    });

    const tableName = watch('name')
    const description = watch('description')

    useLayoutEffect(() => {
        if (user?.tenant?.type === TenantType.FOOD_COURT && user?.restaurantId) {
            dispatch(fetchCanQRCreateRequest(user?.restaurantId))
            dispatch(fetchAllQRRequest({ tenantId: user?.tenantId, page: 1, limit: 10 }));
        } else {
            if (user?.restaurantId) {
                dispatch(fetchCanCreateTableRequest(user?.restaurantId))
                dispatch(fetchAllQRRequest({ restaurantId: user?.restaurantId, page: 1, limit: 10 }));
            }
        }
    }, [dispatch])

    useLayoutEffect(() => {
        if (isCreateQR || isDeleteQR) {
            setIsModalOpen(false);
            setSelectQR(undefined)
            setQRView(false);
            setIsDeleteModalOpen(false);
        }
    }, [isCreateQR, qr, isDeleteQR])

    const handleAdd = () => {
        reset()
        setIsModalOpen(true)
    }

    const onHandleType = (item: string) => {
        setSelectCategory(item)
    }

    const handleQRClick = (item: QR) => {
        if (item.status === QRStatus.ACTIVE) {
            setSelectQR(item)
        }
    }

    const handleCloseModal = () => {
        setQRView(false);
        setIsModalOpen(false)
        setIsDeleteModalOpen(false)
        setIsActivateQRModalOpen(false);
        setShowDownloadOptions(false);
    }

    const handleQRViewModel = (qr: QR) => {
        setSelectQR(qr)
        setQRView(true);
    }

    const handleCreateQR: SubmitHandler<CreateQRRquest> = (data) => {
        dispatch(createQRRequest({ ...data, restaurantId: user!.restaurantId! }))
    }

    const handleConfirmUpdateStatus = () => {
        if (selectQR) {
            dispatch(updateQRRequest({ id: selectQR.id, status: selectQR.status === QRStatus.ACTIVE ? QRStatus.INACTIVE : QRStatus.ACTIVE }))
            setIsActivateQRModalOpen(false)
        }
    }

    const handleDelete = () => {
        setIsDeleteModalOpen(true)
    }

    const handleDeleteConfirm = () => {
        dispatch(deleteQRRequest(selectQR?.id ?? ""))
    }

    const filterQRList = useMemo(() => {
        if (user?.tenant?.type === TenantType.RESTAURANT) {
            return qr.filter((i) => i.type !== QRTableType.TABLE && (i.restaurant && i.restaurant.tenantId) === user?.tenantId)
        }
        return qr.filter((i) => i.type !== QRTableType.TABLE && (i.restaurant && i.restaurant.tenantId) === user?.tenantId)
    }, [qr])

    const filterQRTableList = useMemo(() => {
        if (selectCategory.toLowerCase() === tableCategories[0].toLowerCase()) {
            return filterQRList;
        }

        if (selectCategory.toLowerCase() === tableCategories[2].toLowerCase()) {
            return filterQRList.filter((i) => i.status === QRStatus.INACTIVE);
        }

        if (selectCategory.toLowerCase() === tableCategories[1].toLowerCase()) {
            return filterQRList.filter((i) => i.status === QRStatus.ACTIVE);
        }

        return filterQRList;
    }, [filterQRList, selectCategory, tableCategories]);

    const handleDownloadSimple = () => {
        if (!selectQR) return;
        const svg = qrCodeRef.current?.querySelector('svg');
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        downloadQRCode(svgData, `${selectQR.name}-qr.svg`);
    }

    const handleDownloadWithBackground = async () => {
        if (!selectQR) return;
        const svg = qrCodeRef.current?.querySelector('svg');
        if (!svg) return;

        try {
            await downloadQRWithBackground(svg, {
                qrY: 390,
                qrSize: 450,
                outputWidth: 900,
                outputHeight: 1200,
                fileName: `${selectQR.name}-qr-card.png`,
                backgroundImage: qrBackgroundImage,
                centerImageSrc: logo,
                centerImageWidth: 140
            });
        } catch (error) {
            console.error('Error downloading QR with background:', error);
        }
    }

    const handleEdit = (qr: QR) => {
        setIsActivateQRModalOpen(true)
        setSelectQR(qr)
    }

    const getQRCodeValue = () => {
        if (!selectQR) return '';
        if (user?.tenant?.type === TenantType.RESTAURANT) {
            return `${import.meta.env.VITE_CUSTOMER_QR_BASE_URL}/restaurant/qr/${user?.tenantId}/${user?.restaurantId}/${selectQR?.id}/${selectQR?.type.includes(QRTableType.TAKE_AWAY) ? OrderType.TAKEAWAY : OrderType.PARKING}`;
        }
        return `${import.meta.env.VITE_CUSTOMER_QR_BASE_URL}/foodcourt/qr/${user?.tenantId}/${user?.restaurantId}/${selectQR?.id}/${selectQR?.type.includes(QRTableType.FOOD_COURT) ? OrderType.DINEIN : OrderType.PARKING}`;
    }

    const handleCreateButtonDisabled = (): boolean => {
        return !tableName?.trim() || !description?.trim();
    };

    const handleDisableCreateButton = (): boolean => {
        if (user?.tenant?.type === TenantType.RESTAURANT) {
            return filterQRList.length >= 2 || !canCreateTable?.allowed;
        }
        return filterQRList.length >= 2 || !canCreateQR?.allowed;
    }

    return (
        <div className="space-y-6">
            <div className="flex-1 flex md:flex-row flex-col items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{user?.tenant?.type === TenantType.FOOD_COURT ? "QR Code Management" : "QR Code Management"}</h1>
                    <p className="text-sm text-gray-500">Create and manage scannable QR codes for {user?.tenant?.type === TenantType.FOOD_COURT ? "food court" : "takeaway"} orders</p>
                </div>
                <Button
                    className="w-full md:w-auto md:mt-0 mt-4 bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-md font-semibold"
                    disabled={handleDisableCreateButton()}
                    onClick={handleAdd}
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Create New QR Code
                </Button>
            </div>


            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 flex flex-1 space-x-2 md:flex-row flex-col md:gap-0 gap-2">
                {tableCategories.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => onHandleType(item)}
                        className={`px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-1 ${item === selectCategory
                            ? 'bg-linear-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        {item}
                    </button>
                ))}
            </div>

            <div className="h-[calc(100vh-300px)] overflow-y-auto grid grid-cols-1 2xl:grid-cols-5 md:grid-cols-4 grid-flow-row gap-4 mt-4">
                {loading ? (
                    Array.from({ length: 8 }).map((_, index) => (
                        <QRCardSkeleton key={index} />
                    ))
                ) : filterQRTableList.length === 0 ? (
                    <div className="col-span-full flex items-center justify-center h-full">
                        <div className="max-w-md text-center">
                            <div style={{ background: `linear-gradient(to bottom right, ${hexToRgba(primaryColor, 0.1)}, ${hexToRgba(primaryColor, 0.15)})` }} className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6">
                                <svg style={{ color: primaryColor }} className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                {selectCategory === 'All' ? 'No QR Codes Yet' : `No ${selectCategory} QR Codes`}
                            </h3>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                {selectCategory === 'All'
                                    ? "Get started by creating your first QR code. QR codes make it easy for customers to access your menu and place orders."
                                    : `No ${selectCategory.toLowerCase()} QR codes found. Try switching to a different category or create a new QR code.`
                                }
                            </p>
                            {selectCategory === 'All' && (
                                <Button
                                    onClick={handleAdd}
                                    className="text-white px-6 py-3"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Create Your First QR Code
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    filterQRTableList.map((item, index) => (
                        <QRCard
                            key={index} data={item}
                            onClick={handleQRClick}
                            onView={handleQRViewModel}
                            onEdit={handleEdit}
                        />
                    ))
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={'Add New QR'}
                size="sm"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit(handleCreateQR)} isLoading={loading} disabled={handleCreateButtonDisabled()}>
                            Create QR
                        </Button>
                    </div>
                }
            >
                <form>
                    <div className="space-y-3">
                        <Select
                            label="Type"
                            options={[
                                ...(user?.tenant?.type === TenantType.RESTAURANT ? [{ value: QRTableType.TAKE_AWAY, label: "Take away" }] : [{ value: QRTableType.FOOD_COURT, label: "Food court" }]),
                                { value: QRTableType.PARKING, label: "Parking" }
                            ]}
                            {...register('type')}
                        />
                        <Input
                            label="QR Name"
                            placeholder="Name"
                            type="text"
                            {...register('name')}
                        />
                        <Input
                            label="Description"
                            placeholder="Description"
                            type="text"
                            {...register('description')}
                        />
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isQRView}
                onClose={handleCloseModal}
                title={`QR Code`}
                size="sm"
                footer={
                    <div className="flex flex-col gap-3 w-full">
                        {/* Download Options Toggle */}
                        {!showDownloadOptions ? (
                            <div className="flex items-center gap-3 w-full">
                                <Button
                                    onClick={() => setShowDownloadOptions(true)}
                                    className="flex-1 justify-center text-white border-0"
                                >
                                    <Download className="w-5 h-5 mr-2" />
                                    Download QR
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleDelete}
                                    isLoading={loading}
                                    className="flex-1 justify-center bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0"
                                >
                                    <Trash className="w-5 h-5 mr-2" />
                                    Delete QR
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Download Options */}
                                <div style={{ background: `linear-gradient(to bottom right, ${hexToRgba(primaryColor, 0.05)}, ${hexToRgba(primaryColor, 0.1)})`, borderColor: hexToRgba(primaryColor, 0.3) }} className="p-4 rounded-xl border-2">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <Download style={{ color: primaryColor }} className="w-4 h-4" />
                                        Download Format
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={handleDownloadSimple}
                                            style={{ borderColor: hexToRgba(primaryColor, 0.4) }}
                                            className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border-2 hover:shadow-md transition-all group"
                                        >
                                            <QrCode style={{ color: primaryColor }} className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                            <span className="text-sm font-semibold text-gray-800">Simple QR</span>
                                            <span className="text-xs text-gray-500">SVG Format</span>
                                        </button>
                                        <button
                                            onClick={handleDownloadWithBackground}
                                            style={{ borderColor: hexToRgba(primaryColor, 0.4) }}
                                            className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border-2 hover:shadow-md transition-all group"
                                        >
                                            <ImageIcon style={{ color: primaryColor }} className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                            <span className="text-sm font-semibold text-gray-800">QR Card</span>
                                            <span className="text-xs text-gray-500">PNG with Background</span>
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowDownloadOptions(false)}
                                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                                >
                                    Back to actions
                                </button>
                            </>
                        )}
                    </div>
                }>
                <div className="space-y-6">
                    {/* QR Info Card */}
                    <div className="bg-linear-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{selectQR?.name}</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {selectQR && selectQR?.description && selectQR?.description.length <= 0
                                        ? "Scan this QR code to access the menu"
                                        : selectQR?.description}
                                </p>
                            </div>
                            <div className={`${selectQR?.status === QRStatus.ACTIVE
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                                } px-4 py-2 rounded-full text-sm font-bold shadow-sm`}>
                                {selectQR?.status === QRStatus.ACTIVE ? 'Active' : 'Inactive'}
                            </div>
                        </div>
                    </div>

                    {/* QR Code Display */}
                    <div className="relative">
                        {/* Gradient Border Container */}
                        <div style={{ background: `linear-gradient(to bottom right, ${hexToRgba(primaryColor, 0.5)}, ${hexToRgba(primaryColor, 0.8)})` }} className="absolute -inset-1 rounded-2xl blur opacity-25"></div>

                        {/* Main QR Container */}
                        <div className="relative bg-white rounded-2xl p-8 shadow-xl">
                            {/* Decorative Corner Accents */}
                            <div style={{ borderColor: primaryColor }} className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 rounded-tl-lg"></div>
                            <div style={{ borderColor: primaryColor }} className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 rounded-tr-lg"></div>
                            <div style={{ borderColor: primaryColor }} className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 rounded-bl-lg"></div>
                            <div style={{ borderColor: primaryColor }} className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 rounded-br-lg"></div>

                            {/* QR Code Image */}
                            <div ref={qrCodeRef} className="flex items-center justify-center">
                                <QRCodeSVG
                                    value={getQRCodeValue()}
                                    size={280}
                                    level="H"
                                    includeMargin={true}
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                />
                            </div>

                            {/* Scan Instruction */}
                            <div className="text-center mt-4">
                                <p className="text-sm text-gray-500 font-medium">
                                    📱 Scan with your phone camera
                                </p>
                            </div>
                        </div>


                    </div>
                    <div style={{ background: `linear-gradient(to right, ${hexToRgba(primaryColor, 0.05)}, ${hexToRgba(primaryColor, 0.1)})`, borderColor: hexToRgba(primaryColor, 0.3) }} className="text-center space-y-2 p-6 rounded-xl w-full border">
                        <div className="flex items-center justify-center gap-2">
                            <QrCode style={{ color: primaryColor }} className="w-5 h-5" />
                            <h3 className="text-xl font-bold text-gray-800">{selectQR?.name}</h3>
                        </div>
                        <p className="text-sm text-gray-600">Description: <span className="font-semibold text-gray-800">{selectQR?.description}</span></p>
                        <div style={{ borderColor: hexToRgba(primaryColor, 0.3) }} className="mt-4 pt-4 border-t">
                            <p className="text-xs text-gray-500 mb-1">Scan this QR code to access the menu</p>
                            <p className="text-xs font-mono text-gray-400 break-all px-4">{getQRCodeValue()}</p>
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseModal}
                title={"Delete QR"}
                size="sm"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDeleteConfirm} isLoading={loading}>
                            Confirm
                        </Button>
                    </div>
                }
            >
                <div className="text-gray-700">
                    <p className="font-medium mb-2">⚠️ This action cannot be undone</p>
                    <p className="mb-2">This will permanently delete the QR code <span className="font-semibold">{selectQR?.name}</span>.</p>
                    <p className="text-sm text-gray-600">Any active sessions will be ended and customers will no longer be able to scan this QR code.</p>
                </div>
            </Modal>

            <Modal
                isOpen={isActivateQRModalOpen}
                onClose={handleCloseModal}
                title={selectQR && selectQR.status === QRStatus.ACTIVE ? 'Inactivate QR' : 'Activate QR'}
                size="sm"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmUpdateStatus} isLoading={loading}>
                            {selectQR && selectQR.status === QRStatus.ACTIVE ? 'Inactivate' : 'Activate'}
                        </Button>
                    </div>
                }
            >
                <div className="text-gray-700">
                    {selectQR && selectQR.status === QRStatus.ACTIVE ? (
                        <>
                            <p className="font-medium mb-2">Mark QR as inactive?</p>
                            <p>This will make <span className="font-semibold">{selectQR?.name}</span> inactive.</p>
                        </>
                    ) : (
                        <>
                            <p className="font-medium mb-2">Mark QR as active?</p>
                            <p>Make sure <span className="font-semibold">{selectQR?.name}</span> is active.</p>
                        </>
                    )}
                </div>
            </Modal>

        </div>
    )
}

export default QRTable;