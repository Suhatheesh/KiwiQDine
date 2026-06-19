import { FC, useCallback, useState } from "react";
import { AllUserRoleResponse, CreateUserRequest } from "../../features/userRoles/types";
import { Button } from "../../components/Button";
import { Plus, MoreHorizontal, Phone, Mail, Clock, Building2 } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { UserRole, UserStatus } from "../../utils/constants";
import { StatusBadge } from "../../components/StatusBadge";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { Select } from "../../components/Select";
import { Tenant } from "../../features/tenants/types";
import { Restaurant } from "../../features/restaurants/types";
import { toast } from "react-toastify";
import { createUserRoleRequest, updateUserRoleRequest } from "../../features/userRoles/userRolesSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../app/store";

interface UserSectionProps {
    tenant?: Tenant;
    dataList: AllUserRoleResponse[];
    restaurant: Restaurant[];
    loading?: boolean;
}

const UserSection: FC<UserSectionProps> = ({ dataList, tenant, restaurant, loading }) => {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const dispatch = useDispatch<AppDispatch>();

    const { register, handleSubmit, reset, watch } = useForm<CreateUserRequest>({
        defaultValues: {
            name: "",
            email: "",
            password: "",
            phoneNumber: "",
            restaurantId: "",
            tenantId: ""
        },
    });

    const restaurantId = watch('restaurantId');

    const handleAdd = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
        reset({ name: "" })
    }

    const handleEdit = useCallback((user: AllUserRoleResponse) => {
        setSelectedUser(user);
        setIsModalOpen(true);
        reset({
            name: user.name,
            email: user.email,
            password: user.password,
            phoneNumber: user.phoneNumber,
            restaurantId: user.restaurantId,
            tenantId: user.tenantId,
            role: user.role,
            status: user.status,
            userId: user.id
        })
    }, [reset])

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    const handleCreateUserRole: SubmitHandler<CreateUserRequest> = useCallback((data) => {
        if (restaurantId.length <= 0) {
            toast.error("Please choose the relevant Restaurant")
            return;
        }
        setIsModalOpen(false);
        if (selectedUser) {
            dispatch(updateUserRoleRequest(data))
        } else {
            dispatch(createUserRoleRequest({ ...data, tenantId: tenant!.id }))
        }
    }, [dispatch, restaurantId, selectedUser, tenant])

    // Filter users based on search and role
    const filteredUsers = dataList.filter((user) => {
        const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    if (loading && dataList.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Loading users...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Team Members</h3>
                    <p className="text-sm text-gray-500">Manage users and their roles</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                        <option value="all">All Roles</option>
                        <option value={UserRole.TENANT_ADMIN}>Tenant Admin</option>
                        <option value={UserRole.MANAGER}>Manager</option>
                        <option value={UserRole.KITCHEN_STAFF}>Kitchen Staff</option>
                        <option value={UserRole.WAITER}>Waiter</option>
                    </select>
                    <Button onClick={handleAdd}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add User
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredUsers.map((user) => {
                    const userRestaurant = restaurant.find(r => r.id === user.restaurantId);

                    return (
                        <div key={user.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group">
                            <div className="flex justify-between items-start mb-4">
                                <StatusBadge
                                    status={user.status ?? UserStatus.INACTIVE}
                                    type="subscription"
                                />
                                <button
                                    onClick={() => handleEdit(user)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex flex-col items-center mb-6">
                                <div className="relative mb-3">
                                    <img
                                        src={user.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'}
                                        alt={user.name}
                                        className="w-20 h-20 rounded-full object-cover border-4 border-gray-50"
                                    />
                                    <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${user.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                                        }`}></div>
                                </div>
                                <h4 className="text-lg font-bold text-gray-900 text-center">{user.name}</h4>
                                <p className="text-sm text-blue-600 font-medium capitalize">
                                    {user.role?.replace('_', ' ')}
                                </p>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-gray-50">
                                <div className="flex items-center text-sm text-gray-600">
                                    <Mail className="w-4 h-4 mr-3 text-gray-400" />
                                    <span className="truncate">{user.email}</span>
                                </div>
                                {user.phoneNumber && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Phone className="w-4 h-4 mr-3 text-gray-400" />
                                        <span>{user.phoneNumber}</span>
                                    </div>
                                )}
                                {userRestaurant && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Building2 className="w-4 h-4 mr-3 text-gray-400" />
                                        <span className="truncate">{userRestaurant.name}</span>
                                    </div>
                                )}
                                <div className="flex items-center text-sm text-gray-600">
                                    <Clock className="w-4 h-4 mr-3 text-gray-400" />
                                    <span>
                                        {user.lastLoginAt
                                            ? `Last: ${new Date(user.lastLoginAt).toLocaleDateString()}`
                                            : 'Never logged in'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredUsers.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                    <p className="text-gray-500">No users found</p>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={selectedUser ? 'Edit User' : 'Add User'}
                size="lg"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit(handleCreateUserRole)}>
                            {selectedUser ? 'Save Changes' : 'Create User'}
                        </Button>
                    </div>
                }
            >
                <form>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Full Name"
                            placeholder="John Doe"
                            {...register('name')}
                        />
                        <Input
                            label="Email"
                            type="email"
                            placeholder="john@example.com"
                            {...register('email')}
                        />
                        {!selectedUser && (
                            <Input
                                label="Password"
                                type="password"
                                placeholder="*************"
                                {...register('password')}
                            />
                        )}
                        <Input
                            label="Phone"
                            type="tel"
                            placeholder="+1-555-0000"
                            {...register('phoneNumber')}
                        />
                        <Select
                            label="Role"
                            options={[
                                { value: UserRole.TENANT_ADMIN, label: 'Tenant Admin' },
                                { value: UserRole.MANAGER, label: 'Manager' },
                                { value: UserRole.KITCHEN_STAFF, label: 'Kitchen Staff' },
                                { value: UserRole.WAITER, label: 'Waiter' },
                            ]}
                            {...register('role')}
                        />
                        <Select
                            label="Restaurant"
                            options={[
                                { value: '', label: 'Select Restaurant' },
                                ...restaurant.map((restaurant) => ({ value: restaurant.id!, label: restaurant.name! })),
                            ]}
                            {...register('restaurantId')}
                        />
                        {selectedUser && (
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
        </div>
    )
}

export default UserSection;