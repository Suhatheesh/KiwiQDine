import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Plus, Edit, Search } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { StatusBadge } from '../components/StatusBadge';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';
import { createUserRoleRequest, fetchAllUserRoleRequest, fetchAllUsersByTenantRequest, updateUserRoleRequest } from '../features/userRoles/userRolesSlice';
import { toast } from 'react-toastify';
import { AllUserRoleResponse, CreateUserRequest } from '../features/userRoles/types';
import { SubmitHandler, useForm } from 'react-hook-form';
import { TenantStatus, UserRole, UserStatus } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import { validateNZPhoneNumber } from '../utils';

export const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();

  const { data: filteredUsers, isCreateUserRole } = useSelector((state: RootState) => state.userRole)
  const { data: tenants, } = useSelector((state: RootState) => state.tenants)
  const { data: restaurant, } = useSelector((state: RootState) => state.restaurant)

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

  const tenantId = watch('tenantId');
  const restaruntId = watch('restaurantId');
  const isPhoneNumberValid = validateNZPhoneNumber(watch('phoneNumber'));

  const filterTenant = tenants.filter(i =>
    i.status === TenantStatus.ACTIVE
  ).map((tenant) => {
    return {
      value: tenant.id,
      label: tenant.name
    }
  });

  const filterRestaurant = restaurant.filter((restaurant) => restaurant.tenantId === tenantId);

  const validateToasts = useCallback(() => {
    if (isCreateUserRole) {
      setIsModalOpen(false);
    }
  }, [isCreateUserRole])

  useLayoutEffect(() => {
    validateToasts();
  }, [validateToasts])

  useLayoutEffect(() => {
    if (user?.role === UserRole.TENANT_ADMIN) {
      dispatch(fetchAllUsersByTenantRequest({ page: 1, limit: 10, tenantId: user.tenantId }))
    } else {
      dispatch(fetchAllUserRoleRequest({ page: 1, limit: 10 }))
    }
  }, [dispatch, user])

  const handleEdit = (user: AllUserRoleResponse) => {
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
  };

  const handleAdd = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
    reset({ name: "" })
  };

  const handleCreateUserRole: SubmitHandler<CreateUserRequest> = (data) => {
    const normalizedData = { ...data, email: data.email.toLowerCase() };
    if (tenantId!.length <= 0) {
      toast.error("Please choose the relevant Tenant")
      return;
    }
    if (restaruntId.length <= 0) {
      toast.error("Please choose the relevant Restaurant")
      return;
    }
    if (selectedUser) {
      dispatch(updateUserRoleRequest(normalizedData))
    } else {
      dispatch(createUserRoleRequest(normalizedData))
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const roleStats = {
    super_admin: filteredUsers.filter((u) => u.role === UserRole.SUPER_ADMIN).length,
    tenant_admin: filteredUsers.filter((u) => u.role === UserRole.TENANT_ADMIN).length,
    manager: filteredUsers.filter((u) => u.role === UserRole.MANAGER).length,
    kitchen_staff: filteredUsers.filter((u) => u.role === UserRole.KITCHEN_STAFF).length,
    waiter: filteredUsers.filter((u) => u.role === UserRole.WAITER).length,
  };

  const filterUserRoleWise = useMemo(() => {
    if (roleFilter === 'all') return filteredUsers;
    return filteredUsers.filter(user => user.role === roleFilter);
  }, [filteredUsers, roleFilter]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User & Role Management</h1>
          <p className="text-gray-600">Manage users and their permissions</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(roleStats).map(([role, count]) => (
          <div key={role} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="text-2xl font-bold text-gray-900">{count}</div>
            <div className="text-xs text-gray-500 capitalize">{role.replace('_', ' ')}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
            <option value={UserRole.TENANT_ADMIN}>Tenant Admin</option>
            <option value={UserRole.MANAGER}>Manager</option>
            <option value={UserRole.KITCHEN_STAFF}>Kitchen Staff</option>
            <option value={UserRole.WAITER}>Waiter</option>
          </select>
        </div>
      </div>

      <DataTable
        data={filterUserRoleWise}
        columns={[
          {
            key: 'avatar',
            label: '',
            width: '60px',
            render: (user) => (
              <img
                src={user.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100'}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ),
          },
          {
            key: 'name',
            label: 'User',
            render: (user) => (
              <div>
                <div className="font-medium text-gray-900">{user.name}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
            ),
          },
          {
            key: 'role',
            label: 'Role',
            render: (user) => (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                {user.role?.replace('_', ' ')}
              </span>
            ),
          },
          {
            key: 'restaurant',
            label: 'Restaurant',
            render: (user) => {
              if (!user.restaurantId) {
                return <span className="text-sm text-gray-500">N/A</span>;
              }
              return <span className="text-sm text-gray-700">{restaurant.find((restarunt) => restarunt.id === user.restaurantId)?.name}</span>;
            },
          },
          {
            key: 'phone',
            label: 'Phone',
            render: (user) => <span className="text-sm text-gray-600">{user.phoneNumber || 'N/A'}</span>,
          },
          {
            key: 'status',
            label: 'Status',
            render: (user) => (
              <StatusBadge
                status={user.status ?? UserStatus.INACTIVE}
                type="subscription"
              />
            ),
          },
          {
            key: 'last_login',
            label: 'Last Login',
            render: (user) => (
              <span className="text-sm text-gray-600">
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleDateString()
                  : 'Never'}
              </span>
            ),
          },
          {
            key: 'actions',
            label: 'Actions',
            render: (user) => (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(user)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                {/* <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button> */}
              </div>
            ),
          },
        ]}
      />

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
              onKeyDown={preventMinus}
              placeholder="+94 XX XXX XXXX"
              error={watch('phoneNumber')?.length > 9 && !isPhoneNumberValid ? 'Invalid phone number format (e.g., 07XXXXXXXX or +947XXXXXXXX)' : undefined}
              {...register('phoneNumber')}
            />
            <Select
              label="Role"
              options={[
                { value: UserRole.SUPER_ADMIN, label: 'Super Admin' },
                { value: UserRole.TENANT_ADMIN, label: 'Tenant Admin' },
                { value: UserRole.MANAGER, label: 'Manager' },
                { value: UserRole.KITCHEN_STAFF, label: 'Kitchen Staff' },
                { value: UserRole.WAITER, label: 'Waiter' },
              ]}
              {...register('role')}
            />
            <Select
              label="Tenant"
              options={[
                { value: '', label: 'Select Tenant' },
                ...filterTenant,
              ]}
              {...register('tenantId')}
            />
            <Select
              label="Restaurant"
              options={[
                { value: '', label: 'Select Restaurant' },
                ...filterRestaurant.map((restaurant) => ({ value: restaurant.id!, label: restaurant.name! })),
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
  );
};
