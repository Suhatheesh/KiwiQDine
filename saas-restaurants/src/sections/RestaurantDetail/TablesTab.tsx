import { FC, useState, useLayoutEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import {
    Box,
    Grid,
    Typography,
    CircularProgress,
    useTheme,
    Button
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { Button as CustomButton } from '../../components/Button';
import { Select } from '../../components/Select';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Plus, RefreshCw, Download, ImageIcon, QrCode } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, CreateTableRequest } from '../../features/tables/types';
import { createTableRequest, deleteTableRequest, fetchTablesRequest, updateTableRequest } from '../../features/tables/tablesSlice';
import { AppDispatch, RootState } from '../../app/store';
import { OrderType, TableStatus, TenantType, QRTableType } from '../../utils/constants';
import TableCard from '../../components/TableCard';
import { downloadQRCode, downloadQRWithBackground } from '../../utils/qrImageComposer';
import qrBackgroundImage from '../../assets/qr_background.jpg';
import { fetchCanCreateTableRequest } from '../../features/subscriptions/subscriptionsSlice';
import WarningBanner from '../../components/WarningBanner';

interface TablesTabProps {
    restaurantId?: string;
    tenantId?: string;
}

export const TablesTab: FC<TablesTabProps> = ({ restaurantId: propRestaurantId }) => {

    const { id, tenantId, type } = useParams<{ id: string, tenantId: string, type: string }>();
    const restaurantId = propRestaurantId || id;
    const theme = useTheme();

    const dispatch = useDispatch<AppDispatch>();
    const { qr, loading: qrLoading } = useSelector((state: RootState) => state.qr);
    const { data, loading, isTableCreated, isTableUpdated, isTableDeleted, error } = useSelector((state: RootState) => state.tables);
    const { canCreateTable } = useSelector((state: RootState) => state.subscriptions);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [showDownloadOptions, setShowDownloadOptions] = useState<boolean>(false);
    const [selectTableType, setSelectTableType] = useState<number | null>(null);
    const qrCodeRef = useRef<HTMLDivElement>(null);

    const { register, handleSubmit, reset, watch } = useForm<CreateTableRequest>({
        defaultValues: {
            name: '',
            tableNumber: '',
            capacity: 1,
            location: {
                section: '',
                floor: 1,
            },
            restaurantId: restaurantId || '',
        },
    });

    useLayoutEffect(() => {
        if (isTableCreated || isTableUpdated || isTableDeleted || error) {
            setIsModalOpen(false);
            setSelectedTable(null);
            setSelectTableType(null);
        }
    }, [isTableCreated, isTableUpdated, isTableDeleted, error])

    useLayoutEffect(() => {
        if (!restaurantId) return;
        dispatch(fetchCanCreateTableRequest(restaurantId));
        dispatch(fetchTablesRequest({ restaurantId, page: 1, limit: 10 }));
    }, [restaurantId, dispatch]);

    const handleAdd = () => {
        setSelectedTable(null);
        reset({
            name: '',
            tableNumber: '',
            capacity: 0,
            location: {
                section: '',
                floor: 0,
            },
            restaurantId: restaurantId || '',
        });
        setIsModalOpen(true);
    };

    const handleViewQR = (table: Table) => {
        setSelectedTable(table);
        setIsQRModalOpen(true);
    }

    const handleTableTypeSelect = (type: number) => {
        setSelectTableType(type);
        setIsQRModalOpen(false)
    }

    const handleAvailabilityUpdateConfirm = () => {
        if (!selectedTable) return;
        handleDelete(selectedTable.id);
    }

    const handleEdit = () => {
        setIsQRModalOpen(false)
        reset({
            name: selectedTable?.name,
            tableNumber: selectedTable?.tableNumber,
            capacity: selectedTable?.capacity,
            location: selectedTable?.location,
            status: selectedTable?.status,
            restaurantId: selectedTable?.restaurantId,
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setShowDownloadOptions(false);
        setIsQRModalOpen(false);
        setSelectedTable(null);
        setSelectTableType(null);
    };

    const handleCreateTable: SubmitHandler<CreateTableRequest> = async (data) => {
        if (!restaurantId) return;
        const payload = {
            ...data,
            restaurantId: restaurantId,
            type: type === TenantType.RESTAURANT ? QRTableType.TABLE : QRTableType.FOOD_COURT,
        };
        if (selectedTable) {
            dispatch(updateTableRequest({ ...payload, tableId: selectedTable.id }));
            return;
        }
        dispatch(createTableRequest(payload));
    };

    const handleDelete = async (tableId: string) => {
        dispatch(deleteTableRequest({ tableId, restaurantId: restaurantId ?? '' }));
    };

    const getQRCodeValue = () => {
        if (!selectedTable) return '';
        const qrId = type === TenantType.RESTAURANT ? qr.find((i) => i.type === QRTableType.TABLE) : qr.find((i) => i.type === QRTableType.FOOD_COURT)
        return `${import.meta.env.VITE_CUSTOMER_QR_BASE_URL}/${type === TenantType.RESTAURANT ? 'restaurant' : 'foodcourt'}/qr/${tenantId}/${restaurantId}/${qrId?.id}/${OrderType.DINEIN}/${selectedTable.id}/${selectedTable.tableNumber}`;
    }

    const handleDownloadSimple = () => {
        if (!selectedTable) return;
        const svg = qrCodeRef.current?.querySelector('svg');
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        downloadQRCode(svgData, `${selectedTable.name}-table-qr.svg`);
    }

    const handleDownloadWithBackground = async () => {
        if (!selectedTable) return;
        const svg = qrCodeRef.current?.querySelector('svg');
        if (!svg) return;

        try {
            await downloadQRWithBackground(svg, {
                qrSize: 300,
                outputWidth: 900,
                outputHeight: 1200,
                fileName: `${selectedTable.name}-table-qr-card.png`,
                backgroundImage: qrBackgroundImage,
                centerText: `Table ${selectedTable.tableNumber}`,
                centerTextColor: '#ffffff',
                centerTextBgColor: '#3b82f6'
            });
        } catch (error) {
            console.error('Error downloading QR with background:', error);
        }
    }

    const disableSubmit = (!watch('name') || !watch('tableNumber') || !watch('capacity') || !watch('location.section'));

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                <Box>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: theme.palette.text.primary }}>
                        Tables
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage your restaurant tables and QR codes
                    </Typography>
                </Box>
                <Box>
                    <Button
                        startIcon={<RefreshCw size={18} />}
                        onClick={() => dispatch(fetchTablesRequest({ restaurantId }))}
                        sx={{ mr: 1, textTransform: 'none' }}
                        variant="outlined"
                        color="inherit"
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Plus size={18} />}
                        onClick={handleAdd}
                        sx={{
                            textTransform: 'none',
                            borderRadius: 2,
                            px: 3,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        Add Table
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {data?.map((table, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={table.id}>
                        <TableCard table={table} index={index} handleViewQR={() => handleViewQR(table)} />
                    </Grid>
                ))}
            </Grid>

            <Modal
                isOpen={selectTableType !== null}
                onClose={handleCloseModal}
                title={selectTableType === 1 ? 'Update Status' : 'Delete Table'}
                size="sm"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <CustomButton variant="ghost" onClick={handleCloseModal}>
                            Cancel
                        </CustomButton>
                        <CustomButton variant={selectTableType === 1 ? 'primary' : 'danger'} onClick={handleAvailabilityUpdateConfirm} isLoading={loading}>
                            Confirm
                        </CustomButton>
                    </div>
                }
            >
                <div className="text-gray-700">
                    <p className="font-medium mb-2">Changing availability will affect customer ordering.</p>
                    <p>Are you sure you want to {selectTableType === 1 ? 'make' : 'delete'} this table <span className="font-semibold">{selectedTable?.status}</span>?</p>
                </div>

            </Modal>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={selectedTable ? 'Edit Table' : 'Add Table'}
                size="sm"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <CustomButton variant="ghost" onClick={handleCloseModal}>
                            Cancel
                        </CustomButton>
                        <CustomButton onClick={handleSubmit(handleCreateTable)} disabled={disableSubmit}>
                            {selectedTable ? 'Save Changes' : 'Create Table'}
                        </CustomButton>
                    </div>
                }
            >
                {!selectTableType && (canCreateTable?.tableLimit ?? 0) <= (data?.length ?? 0) && (
                    <WarningBanner title="Table Limit Reached" message={`You've reached the maximum number of tables allowed in your current subscription plan. You will be charged ${canCreateTable?.plan?.overageChargePerTable}USD for each additional table.`} />
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
                            {...register('tableNumber', { required: true })}
                        />
                        <Input
                            label="Capacity"
                            type="number"
                            placeholder="Number of seats"
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

            {/* QR Code Modal */}
            <Modal
                isOpen={isQRModalOpen}
                onClose={handleCloseModal}
                title="Table QR Code"
                size="md"
                footer={
                    <div className="flex flex-col gap-3 w-full">
                        {/* Download Options Toggle */}
                        {!showDownloadOptions ? (
                            <div className="flex items-center gap-3 w-full">
                                <CustomButton variant="secondary" onClick={handleEdit} className="flex-1 ">
                                    Update
                                </CustomButton>
                                <CustomButton onClick={() => handleTableTypeSelect(0)} className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800">
                                    Delete
                                </CustomButton>
                                <CustomButton
                                    onClick={() => setShowDownloadOptions(true)}
                                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download QR
                                </CustomButton>
                            </div>
                        ) : (
                            <>
                                {/* Download Options */}
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
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

                        {/* Table Information */}
                        <div className="text-center space-y-2 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl w-full border border-blue-200">
                            {qrLoading ? (
                                <div className="flex flex-col items-center justify-center h-[280px] text-center">
                                    <CircularProgress size={40} className="mb-4" />
                                    <p className="text-gray-500">Loading QR configuration...</p>
                                </div>
                            ) : (
                                <>
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
                                </>
                            )}
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
        </Box>
    );
};
