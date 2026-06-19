import { FC, useState, useLayoutEffect } from 'react';
import { Plus, MoreHorizontal, Phone, Mail, Clock, Key } from 'lucide-react';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { StatusBadge } from '../../components/StatusBadge';
import { UserRole, UserStatus } from '../../utils/constants';
import { useParams } from 'react-router-dom';
import { AllUserRoleResponse, CreateUserRequest } from '../../features/userRoles/types';
import { SubmitHandler, useForm } from 'react-hook-form';
import { createUserRoleRequest, fetchAllUsersByTenantRequest, resetUserPasswordRequest, resetUserRoleStatus, updateUserRoleRequest } from '../../features/userRoles/userRolesSlice';
import { AppDispatch, RootState } from '../../app/store';
import { useDispatch, useSelector } from 'react-redux';
import { formatPhoneNumber, isValidEmail, validateNZPhoneNumber } from '../../utils';
import { fetchCanUserCreateRequest } from '../../features/subscriptions/subscriptionsSlice';
import WarningBanner from '../../components/WarningBanner';

interface StaffTabProps {
    restaurantId?: string;
    tenantId?: string;
}

export const StaffTab: FC<StaffTabProps> = ({ restaurantId: propRestaurantId, tenantId }) => {
    const { id } = useParams<{ id: string }>();
    const restaurantId = propRestaurantId || id;

    const dispatch = useDispatch<AppDispatch>();

    const { data, loading, isCreateUserRole, isDeleteUserRole } = useSelector((state: RootState) => state.userRole);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<AllUserRoleResponse | null>(null);
    const [resettingPassword, setResettingPassword] = useState(false);

    const { canCreateUser } = useSelector((state: RootState) => state.subscriptions);

    const { register, handleSubmit, reset, watch } = useForm<CreateUserRequest>({
        defaultValues: {
            name: "",
            email: "",
            password: "",
            phoneNumber: "",
            restaurantId: "",
            role: UserRole.WAITER,
        },
    });

    const isPhoneNumberValid = validateNZPhoneNumber(watch('phoneNumber'));
    const isEmailValid = isValidEmail(watch('email'));

    useLayoutEffect(() => {
        if (isCreateUserRole || isDeleteUserRole) {
            handleCloseModal();
        }
    }, [isCreateUserRole, isDeleteUserRole])

    useLayoutEffect(() => {
        if (restaurantId) {
            dispatch(fetchCanUserCreateRequest(restaurantId))
        }
        dispatch(fetchAllUsersByTenantRequest({ tenantId, restaurantId, page: 1, limit: 10 }));
    }, [dispatch, tenantId, restaurantId])

    const handleAdd = () => {
        dispatch(resetUserRoleStatus());
        setSelectedStaff(null);
        reset({
            name: "",
            email: "",
            password: "",
            phoneNumber: "",
            restaurantId: restaurantId || "",
            role: UserRole.WAITER,
        });
        setIsModalOpen(true);
    };

    const handleEdit = (user: AllUserRoleResponse) => {
        dispatch(resetUserRoleStatus());
        setSelectedStaff(user);
        reset({
            name: user.name,
            email: user.email,
            password: user.password,
            phoneNumber: user.phoneNumber?.replace('+64', '0'),
            restaurantId: user.restaurantId,
            tenantId: user.tenantId,
            role: user.role,
            status: user.status,
            userId: user.id
        })
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedStaff(null);
        dispatch(resetUserRoleStatus());
    };

    const handleSaveStaff: SubmitHandler<CreateUserRequest> = async (data) => {
        const normalizedData = { ...data, email: data.email.toLowerCase() };
        if (selectedStaff) {
            dispatch(updateUserRoleRequest({ ...normalizedData, phoneNumber: formatPhoneNumber(data.phoneNumber) }))
        } else {
            dispatch(createUserRoleRequest({ ...normalizedData, tenantId, phoneNumber: formatPhoneNumber(data.phoneNumber) }))
        }
    };

    const handleResetPassword = (member: AllUserRoleResponse) => {
        setSelectedStaff(member);
        setIsResetPasswordModalOpen(true);
    };

    const handleConfirmResetPassword = async () => {
        if (!tenantId || !selectedStaff || !selectedStaff.id) return;
        dispatch(resetUserPasswordRequest({ tenantId, userId: selectedStaff.id }))
        setIsResetPasswordModalOpen(false);
        setSelectedStaff(null);
        setResettingPassword(false);
    };

    const handleCloseResetPasswordModal = () => {
        setIsResetPasswordModalOpen(false);
        setSelectedStaff(null);
    };

    const preventMinus = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            return;
        }
        if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
            return;
        }
        if (!/^[0-9+]$/.test(e.key)) {
            e.preventDefault();
        }
    };

    const isDisable = watch("email") === "" || watch("phoneNumber") === "" || watch('name') === "" || (!selectedStaff && watch("password") === "");

    if (loading && (!data || data.length === 0)) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    Loading staff members...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Team Members</h3>
                    <p className="text-sm text-gray-500">Manage your restaurant staff and their roles</p>
                </div>
                <Button disabled={!canCreateUser?.allowed} onClick={handleAdd}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Staff
                </Button>
            </div>

            {data?.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                    <p className="text-gray-500">No staff members yet. Add your first team member!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {data?.map((member) => (
                        <div key={member.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group">
                            <div className="flex justify-between items-start mb-4">
                                <StatusBadge
                                    status={member.status || UserStatus.INACTIVE}
                                    type="subscription"
                                />
                                <button
                                    onClick={() => handleEdit(member)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex flex-col items-center mb-6">
                                <div className="relative mb-3">
                                    <img
                                        src={member.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
                                        alt={member.name}
                                        className="w-20 h-20 rounded-full object-cover border-4 border-gray-50"
                                    />
                                    <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${member.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                                        }`}></div>
                                </div>
                                <h4 className="text-lg font-bold text-gray-900 text-center">{member.name}</h4>
                                <p className="text-sm text-blue-600 font-medium capitalize">
                                    {member.role?.replace('_', ' ')}
                                </p>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-gray-50">
                                <div className="flex items-center text-sm text-gray-600">
                                    <Mail className="w-4 h-4 mr-3 text-gray-400" />
                                    <span className="truncate">{member.email}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <Phone className="w-4 h-4 mr-3 text-gray-400" />
                                    <span>{member.phoneNumber || 'N/A'}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <Clock className="w-4 h-4 mr-3 text-gray-400" />
                                    <span>Joined {new Date(member.createdAt ?? '').toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-4 pt-4 border-t border-gray-50">
                                <button
                                    onClick={() => handleResetPassword(member)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                                >
                                    <Key className="w-4 h-4" />
                                    Reset Password
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={selectedStaff ? 'Edit Staff Member' : 'Add Staff Member'}
                size="lg"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit(handleSaveStaff)} disabled={isDisable} isLoading={loading}>
                            {selectedStaff ? 'Save Changes' : 'Add Staff'}
                        </Button>
                    </div>
                }
            >
                {!selectedStaff && (canCreateUser?.userLimit ?? 0) <= (data?.length ?? 0) && (
                    <WarningBanner title="User Limit Reached" message={`You've reached the maximum number of users allowed in your current subscription plan. You will be charged ${canCreateUser?.plan?.overageChargePerUser}USD for each additional user.`} />
                )}
                <form>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Full Name*"
                            placeholder="John Doe"
                            {...register('name', { required: true })}
                        />
                        <Input
                            label="Email*"
                            type="email"
                            placeholder="john@example.com"
                            {...register('email', { required: true })}
                            error={watch('email')?.length > 5 && !isEmailValid ? 'Invalid email format' : undefined}
                        />
                        {!selectedStaff && (
                            <Input
                                label="Password*"
                                placeholder="*************"
                                isPassword
                                {...register('password', { required: !selectedStaff })}
                            />
                        )}
                        <Input
                            label="Phone*"
                            type="tel"
                            placeholder="XXX XXX XXXX"
                            prefix="+64"
                            maxLength={10}
                            onKeyDown={preventMinus}
                            error={watch('phoneNumber')?.length > 9 && !isPhoneNumberValid ? 'Invalid phone number format (e.g., 02XXXXXXXXX or +647XXXXXXXXX)' : undefined}
                            {...register('phoneNumber', { required: true })}
                        />
                        <Select
                            label="Role"
                            options={[
                                { value: UserRole.TENANT_ADMIN, label: 'Tenant Admin' },
                                { value: UserRole.MANAGER, label: 'Manager' },
                                { value: UserRole.KITCHEN_STAFF, label: 'Kitchen Staff' },
                                { value: UserRole.WAITER, label: 'Waiter' },
                            ]}
                            {...register('role', { required: true })}
                        />
                        {selectedStaff && (
                            <Select
                                label="Status"
                                options={[
                                    { value: 'active', label: 'Active' },
                                    { value: 'inactive', label: 'Inactive' },
                                ]}
                                {...register('status')}
                            />
                        )}
                    </div>
                </form>
            </Modal>

            {/* Reset Password Confirmation Modal */}
            <Modal
                isOpen={isResetPasswordModalOpen}
                onClose={handleCloseResetPasswordModal}
                title="Reset Password"
                size="sm"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={handleCloseResetPasswordModal}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmResetPassword}
                            isLoading={resettingPassword}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Confirm Reset
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex-shrink-0">
                            <Key className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">Password Reset Confirmation</h4>
                            <p className="text-sm text-gray-600 mt-1">
                                Are you sure you want to reset the password for <span className="font-medium text-gray-900">{selectedStaff?.name}</span>?
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">Email:</span>
                            <span className="font-medium text-gray-900">{selectedStaff?.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600 ml-6">Role:</span>
                            <span className="font-medium text-gray-900 capitalize">{selectedStaff?.role?.replace('_', ' ')}</span>
                        </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> A new temporary password will be sent to the staff member's email address. They will be required to change it upon first login.
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
