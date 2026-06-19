import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Plus, QrCode, Download, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../components/Modal';
import { Sheet } from '../components/Sheet';
import { Input } from '../components/Input';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';
import {
    fetchTablesRequest,
    createTableRequest,
    updateTableRequest,
    deleteTableRequest,
    updateTableStatusRequest
} from '../features/tables/tablesSlice';
import { CreateTableRequest, Table } from '../features/tables/types';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import { Select } from '../components/Select';
import { OrderType, QRTableType, TableStatus, TenantType } from '../utils/constants';
import { useNavigate } from 'react-router-dom';
import { RouteLinks } from '../routers/type';
import { downloadQRCode as downloadQRCodeSimple, downloadQRWithBackground } from '../utils/qrImageComposer';
import TableCard from '../components/TableCard';
import SelectedTablePanel from '../sections/Tabel/SelectedTablePanel';
import qrBackgroundImage from '../assets/qr_background.png';
import logo from '../assets/logo.png';
import { hexToRgba } from '../utils';
import { TableCardSkeleton } from '../components/CustomSkeleton';
import { fetchCanCreateTableRequest } from '../features/subscriptions/subscriptionsSlice';
import WarningBanner from '../components/WarningBanner';

type TabType = 'all' | 'vacant' | 'occupied';

export const Tables = () => {

    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectTableType, setSelectTableType] = useState<string | null>(null);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [showDownloadOptions, setShowDownloadOptions] = useState<boolean>(false);

    const qrCodeRef = useRef<HTMLDivElement>(null);

    const dispatch = useDispatch<AppDispatch>();
    const { user, primaryColor } = useAuth();

    const { data: tables, loading, isTableCreated, isTableUpdated, isTableDeleted } = useSelector(
        (state: RootState) => state.tables
    );
    const { qr } = useSelector((state: RootState) => state.qr);
    const { canCreateTable } = useSelector((state: RootState) => state.subscription);

    const isTrial = canCreateTable?.plan.name === "Trial";

    const { register, handleSubmit, reset, watch } = useForm<CreateTableRequest>({
        defaultValues: {
            name: '',
            tableNumber: '',
            capacity: 1,
            location: {
                section: '',
                floor: 1,
            },
            restaurantId: user?.restaurantId || '',
        },
    });

    useLayoutEffect(() => {
        if (user?.restaurantId) {
            dispatch(fetchCanCreateTableRequest(user.restaurantId));
            dispatch(fetchTablesRequest({ restaurantId: user.restaurantId }));
        }
    }, [dispatch, user]);

    useLayoutEffect(() => {
        if (isTableCreated) {
            setIsModalOpen(false);
            reset();
        }
        if (isTableUpdated || isTableDeleted) {
            setIsModalOpen(false);
            setIsEditMode(false);
            setSelectedTable(null);
            setSelectTableType(null);
            reset();
        }
    }, [isTableCreated, isTableUpdated, isTableDeleted, reset]);

    const handleEdit = (table: Table | null) => {
        setIsEditMode(true);
        setIsModalOpen(true);
        reset({
            name: table?.name,
            tableNumber: table?.tableNumber,
            capacity: table?.capacity,
            location: {
                section: table?.location.section,
                floor: table?.location.floor,
            },
            status: table?.status,
            restaurantId: user?.restaurantId || '',
        });
        setSelectedTable(table);
    };

    const handleAdd = () => {
        setSelectedTable(null);
        setIsEditMode(false);
        setIsModalOpen(true);
        reset({
            name: '',
            tableNumber: '',
            capacity: 1,
            location: {
                section: '',
                floor: 1,
            },
            restaurantId: user?.restaurantId || '',
        });
    };

    const handleCreateTable: SubmitHandler<CreateTableRequest> = (data) => {
        if (!user?.restaurantId) {
            toast.error('Please select a restaurant');
            return;
        }

        const payload = {
            ...data,
            restaurantId: user.restaurantId,
            type: user?.tenant?.type === TenantType.RESTAURANT ? QRTableType.TABLE : QRTableType.FOOD_COURT,
        };

        if (isEditMode && selectedTable) {
            dispatch(updateTableRequest({ ...payload, tableId: selectedTable.id }));
        } else {
            dispatch(createTableRequest(payload));
        }
    };

    const handleDelete = () => {
        setSelectTableType('');
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsEditMode(false);
        setSelectTableType(null);
        reset();
    };

    const filteredTables = useMemo(() => {
        if (tables) {
            return tables.filter((table) => {
                if (activeTab === 'all') return true;
                if (activeTab === 'vacant') return table.status === TableStatus.AVAILABLE;
                if (activeTab === 'occupied') return table.status === TableStatus.OCCUPIED;
                return true;
            });
        }
        return []
    }, [tables, activeTab]);

    const handleTableSelect = (tableType: string) => {
        setSelectTableType(tableType);
    };

    const handleAvailabilityUpdateConfirm = () => {
        if (selectTableType && selectTableType?.length > 0) {
            dispatch(updateTableStatusRequest({
                tableId: selectedTable?.id || '',
                status: selectTableType || '',
                restaurantId: user?.restaurantId || ''
            }));
        } else {
            const qrId = qr.find((i) => i.type === QRTableType.TABLE)
            dispatch(deleteTableRequest({ tableId: selectedTable?.id || '', restaurantId: user?.restaurantId || '', qrId: qrId?.id || '' }));
        }
    };

    const handlePlaceOrder = (orderType: OrderType) => {
        if (orderType === OrderType.DINEIN) {
            navigate(`${RouteLinks.TABLES}${RouteLinks.MENU_LIST}/${selectedTable?.tableNumber}/${selectedTable?.id}/${orderType}`, { state: { order: undefined } });
        } else {
            navigate(`${RouteLinks.TABLES}${RouteLinks.MENU_LIST}/${orderType}`, { state: { order: undefined } });
        }
        setSelectedTable(null);
    }

    const handleTabSelect = (tab: TabType) => {
        setSelectedTable(null)
        setActiveTab(tab);
    }

    const handleAction = (action: 'edit' | 'delete' | 'viewQR') => {
        if (action === 'edit') {
            handleEdit(selectedTable);
        } else if (action === 'delete') {
            handleDelete();
        } else if (action === 'viewQR') {
            handleViewQRCode();
        }
    }

    const handleViewQRCode = () => {
        setIsQRModalOpen(true);
    }

    const handleCloseQRModal = () => {
        setIsQRModalOpen(false);
        setShowDownloadOptions(false);
    }

    const handleDownloadSimple = () => {
        if (!selectedTable) return;
        const svg = qrCodeRef.current?.querySelector('svg');
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        downloadQRCodeSimple(svgData, `${selectedTable.name}-table-qr.svg`);
    }

    const handleDownloadWithBackground = async () => {
        if (!selectedTable) return;
        const svg = qrCodeRef.current?.querySelector('svg');
        if (!svg) return;

        try {
            await downloadQRWithBackground(svg, {
                qrY: 390,
                qrSize: 450,
                outputWidth: 900,
                outputHeight: 1200,
                fileName: `${selectedTable.name}-table-qr-card.png`,
                backgroundImage: qrBackgroundImage,
                centerImageSrc: logo,
                centerImageWidth: 140
            });
        } catch (error) {
            console.error('Error downloading QR with background:', error);
        }
    }

    const getQRCodeValue = () => {
        if (!selectedTable) return '';
        const qrId = user?.tenant?.type === TenantType.RESTAURANT ? qr.find((i) => i.type === QRTableType.TABLE) : qr.find((i) => i.type === QRTableType.FOOD_COURT)
        return `${import.meta.env.VITE_CUSTOMER_QR_BASE_URL}/${user?.tenant?.type === TenantType.RESTAURANT ? 'restaurant' : 'foodcourt'}/qr/${user?.tenantId}/${user?.restaurantId}/${qrId?.id}/${OrderType.DINEIN}/${selectedTable.id}/${selectedTable.tableNumber}`;
    }

    const disableSubmit = (!watch('name') || !watch('tableNumber') || !watch('capacity') || !watch('location.section'));

    const handleRefresh = () => {
        if (user?.restaurantId) {
            dispatch(fetchTablesRequest({ restaurantId: user.restaurantId }));
        }
    };

    const handleViewOrder = () => {
        if (!selectedTable) return;
        navigate(`${RouteLinks.TABLES}${RouteLinks.VIEW_TABLE_ONGOING_ORDERS}`, {
            state: {
                orderStatus: selectedTable.orderStatus
            }
        });
        setSelectedTable(null);
    };

    const preventMinus = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (['e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault();
        }
    };

    return (
        <div className="flex flex-col flex-1 space-y-6">
            {/* Header */}
            <div className="flex w-full md:items-center justify-between md:flex-row flex-col">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Table Management</h1>
                    <p className="text-sm text-gray-600 mt-1">Manage your restaurant seating</p>
                </div>
                <div className='gap-3 flex md:flex-row flex-col'>
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button variant="outline" onClick={() => handlePlaceOrder(OrderType.TAKEAWAY)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Take away order
                    </Button>
                    <Button disabled={isTrial && (canCreateTable?.tableLimit ?? 0) <= (tables?.length ?? 0)} onClick={handleAdd}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Table
                    </Button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex flex-col flex-1">
                <div className="flex flex-col flex-1">
                    {/* Tab Filters */}
                    <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200 w-fit">
                        {(['all', 'vacant', 'occupied'] as TabType[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabSelect(tab)}
                                style={{ backgroundColor: activeTab === tab ? hexToRgba(primaryColor, 0.1) : 'transparent', color: activeTab === tab ? primaryColor : '#4a5565' }}
                                className={`px-6 py-2 rounded-md text-sm font-medium transition-all capitalize`}
                            >
                                {tab === 'all' ? 'All Tables' : tab}
                            </button>
                        ))}
                    </div>

                    {/* Tables Grid */}
                    <div className="h-[calc(100vh-20rem)] pt-6">
                        {loading && (!tables || tables.length === 0) ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {[...Array(8)].map((_, i) => (
                                    <TableCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : filteredTables.length === 0 ? (
                            <div className="rounded-xl p-12 text-center flex flex-1 items-center justify-center">
                                <div className="max-w-sm">
                                    <div style={{ backgroundColor: hexToRgba(primaryColor, 0.1) }} className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
                                        <Plus color={primaryColor} className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        No tables found
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-6">
                                        {activeTab === 'all'
                                            ? "Get started by adding your first table to organize your seating arrangement."
                                            : `No ${activeTab} tables available. Try switching to a different tab or add a new table.`
                                        }
                                    </p>
                                    <Button onClick={handleAdd} className="bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Your First Table
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-40">
                                {filteredTables.map((table, index) => (
                                    <TableCard
                                        key={table.id}
                                        table={table}
                                        index={index}
                                        selectedTable={selectedTable}
                                        setSelectedTable={setSelectedTable}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bottom Status Bar */}
                    <footer className="fixed bottom-0 left-0 lg:left-64 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] py-3 px-6 z-30">
                        <div className="max-w-7xl mx-auto h-[60px] flex items-center justify-between">
                            {/* Left Side - Status Indicators */}
                            <div className="flex items-center gap-8">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-red-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-gray-700">Occupied</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-green-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-gray-700">Vacant</span>
                                </div>
                            </div>

                            {/* Right Side - Removed as it's now in the side sheet */}
                        </div>
                    </footer>
                </div>
            </div>

            {/* Selected Table Panel Sheet */}
            <Sheet
                isOpen={!!selectedTable}
                onClose={() => setSelectedTable(null)}
            >
                {selectedTable && (
                    <SelectedTablePanel
                        selectedTable={selectedTable}
                        onAction={handleAction}
                        onPlaceOrder={() => handlePlaceOrder(OrderType.DINEIN)}
                        onViewOrder={() => handleViewOrder()}
                        onClose={() => setSelectedTable(null)}
                        onHandleTableStatusChange={handleTableSelect}
                    />
                )}
            </Sheet>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={isEditMode ? 'Edit Table' : 'Add Table'}
                size="sm"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit(handleCreateTable)} disabled={disableSubmit}>
                            {isEditMode ? 'Save Changes' : 'Create Table'}
                        </Button>
                    </div>
                }
            >
                {!isEditMode && (canCreateTable?.tableLimit ?? 0) <= (tables?.length ?? 0) && (
                    <WarningBanner title="Table Limit Reached" message={`You've reached the maximum number of tables allowed in your current subscription plan. You will be charged ${canCreateTable?.plan.overageChargePerTable}USD for each additional table.`} />
                )}
                <form>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Table Name"
                            placeholder="e.g., Window Table 1"
                            {...register('name', { required: true })}
                        />
                        <Input
                            label="Table Number"
                            placeholder="e.g., T-01"
                            type='number'
                            {...register('tableNumber', { required: true })}
                        />
                        <Input
                            label="Capacity"
                            type="number"
                            placeholder="Number of seats"
                            onKeyDown={preventMinus}
                            {...register('capacity', { required: true, min: 1 })}
                        />
                        <Input
                            label="Section"
                            placeholder="e.g., Window Area, VIP Section"
                            {...register('location.section', { required: true })}
                        />
                        <Input
                            label="Floor"
                            type="number"
                            placeholder="Floor number"
                            onKeyDown={preventMinus}
                            {...register('location.floor', { required: true, min: 1 })}
                        />
                        {selectedTable && (
                            <Select
                                label="Status"
                                options={[
                                    { value: TableStatus.AVAILABLE, label: 'Available' },
                                    { value: TableStatus.OCCUPIED, label: 'Occupied' },
                                    { value: TableStatus.RESERVED, label: 'Reserved' },
                                    { value: TableStatus.MAINTENANCE, label: 'Maintenance' },
                                ]}
                                {...register('status', { required: true })}
                            />
                        )}
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={selectTableType !== null}
                onClose={handleCloseModal}
                title={selectTableType && selectTableType?.length > 0 ? 'Update Status' : 'Delete Table'}
                size="sm"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button variant={selectTableType && selectTableType?.length > 0 ? 'primary' : 'danger'} onClick={handleAvailabilityUpdateConfirm} isLoading={loading}>
                            Confirm
                        </Button>
                    </div>
                }
            >
                <div className="text-gray-700">
                    <p className="font-medium mb-2">Changing availability will affect customer ordering.</p>
                    <p>Are you sure you want to {selectTableType && selectTableType?.length > 0 ? 'make' : 'delete'} this table <span className="font-semibold">{selectTableType}</span>?</p>
                </div>

            </Modal>

            {/* QR Code Modal */}
            <Modal
                isOpen={isQRModalOpen}
                onClose={handleCloseQRModal}
                title="Table QR Code"
                size="md"
                footer={
                    <div className="flex flex-col gap-3 w-full">
                        {/* Download Options Toggle */}
                        {!showDownloadOptions ? (
                            <div className="flex items-center gap-3 w-full">
                                <Button variant="ghost" onClick={handleCloseQRModal} className="flex-1">
                                    Close
                                </Button>
                                <Button
                                    onClick={() => setShowDownloadOptions(true)}
                                    className="flex-1 bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download QR
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Download Options */}
                                <div className="bg-linear-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <Download className="w-4 h-4 text-blue-600" />
                                        Download Format
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={handleDownloadSimple}
                                            className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border-2 border-blue-300 hover:border-blue-500 hover:shadow-md transition-all group"
                                        >
                                            <QrCode className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform" />
                                            <span className="text-sm font-semibold text-gray-800">Simple QR</span>
                                            <span className="text-xs text-gray-500">SVG Format</span>
                                        </button>
                                        <button
                                            onClick={handleDownloadWithBackground}
                                            className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border-2 border-purple-300 hover:border-purple-500 hover:shadow-md transition-all group"
                                        >
                                            <ImageIcon className="w-8 h-8 text-purple-600 group-hover:scale-110 transition-transform" />
                                            <span className="text-sm font-semibold text-gray-800">QR Card</span>
                                            <span className="text-xs text-gray-500">PNG with Table Number</span>
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
                }
            >
                {selectedTable && (
                    <div className="flex flex-col items-center space-y-6 py-6">
                        {/* QR Code Display */}
                        <div ref={qrCodeRef} className="bg-white p-8 rounded-2xl shadow-lg border-4 border-gray-100">
                            <QRCodeSVG
                                value={getQRCodeValue()}
                                size={280}
                                level="H"
                                includeMargin={true}
                                bgColor="#ffffff"
                                fgColor="#000000"
                            />
                        </div>

                        {/* Premium Header with Indigo-Purple Gradient */}
                        <div className="relative p-6 pb-8 bg-linear-to-br from-gray-50 via-gray-100 to-gray-50 rounded-xl w-full border border-blue-200">
                            <div className="flex items-center justify-center gap-2">
                                <QrCode className="w-5 h-5 text-purple-600" />
                                <h3 className="text-xl font-bold text-gray-800">{selectedTable.name}</h3>
                            </div>
                            <p className="text-sm text-gray-600">Table Number: <span className="font-semibold text-gray-800">{selectedTable.tableNumber}</span></p>
                            <p className="text-sm text-gray-600">Capacity: <span className="font-semibold text-gray-800">{selectedTable.capacity} guests</span></p>
                            <div className="mt-4 pt-4 border-t border-blue-200">
                                <p className="text-xs text-gray-500 mb-1">Scan this QR code to access the menu</p>
                                <p className="text-xs font-mono text-gray-400 break-all px-4">{getQRCodeValue()}</p>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <p className="text-sm font-semibold text-amber-800 mb-2">📱 How to use:</p>
                            <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
                                <li>Download the QR code using the button below</li>
                                <li>Print or display the QR code at the table</li>
                                <li>Customers can scan to access your menu</li>
                            </ol>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

