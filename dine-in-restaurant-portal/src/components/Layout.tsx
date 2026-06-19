import { type FC, useLayoutEffect, useState } from 'react';
import {
  LayoutDashboard,
  Store,
  Receipt,
  Users,
  Settings,
  BarChart3,
  Menu,
  X,
  LogOut,
  User,
  Banknote,
  Table2,
  QrCode,
  Pizza,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { OrderType, TenantType, UserRole } from '../utils/constants';
import { NavLink, Outlet } from 'react-router-dom';
import { RouteLinks } from '../routers/type';
import type { SideMenuListType } from '../models/BaseType';
import SocketService from '../services/SocketService';
import { hexToRgba } from '../utils';
import { fetchSubscriptionUsageRequest } from '../features/subscriptions/subscriptionsSlice';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../app/store';
import { SubscriptionBanner } from './SubscriptionBanner';
import { OrderAlerts } from './OrderAlerts';

const menuItems: SideMenuListType[] = [
  { id: RouteLinks.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { id: RouteLinks.ANALYTICS, label: 'Analytics', icon: BarChart3 },
  { id: RouteLinks.MENU_MANAGE, label: 'Manage Menu Items', icon: Store },
  { id: RouteLinks.CASHIER, label: 'Cashier', icon: Banknote },
  { id: RouteLinks.ORDERS, label: 'Orders', icon: User },
  { id: RouteLinks.TABLES, label: 'Tables', icon: Table2 },
  { id: RouteLinks.QRCODE, label: 'Qr Codes', icon: QrCode },
  { id: RouteLinks.INVOICES, label: 'Invoices', icon: Receipt },
  { id: RouteLinks.USERS, label: 'Staff', icon: Users },
  { id: RouteLinks.WAITER_CONFIRMATION, label: 'Waiter Confirmation', icon: CheckCircle },
  { id: RouteLinks.KITCHEN, label: 'Kitchen', icon: BarChart3 },
  { id: RouteLinks.SETTINGS, label: 'Settings', icon: Settings },
  { id: RouteLinks.WALLET, label: 'Wallet', icon: Banknote },
];

export const Layout: FC = () => {
  const { user, logout, primaryColor } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const socket = SocketService.getInstance();

  const EXCLUDED_ROUTES = [
    RouteLinks.WALLET,
    RouteLinks.SETTINGS,
    RouteLinks.INVOICES,
    RouteLinks.USERS,
  ];

  const roleAccess: Record<UserRole, string[]> = {
    [UserRole.KITCHEN_STAFF]: [RouteLinks.KITCHEN, RouteLinks.MENU_MANAGE, RouteLinks.WAITER_CONFIRMATION],
    [UserRole.WAITER]: [RouteLinks.ORDERS, RouteLinks.MENU_MANAGE, RouteLinks.TABLES, RouteLinks.WAITER_CONFIRMATION],
    [UserRole.MANAGER]: menuItems.map(item => item.id).filter(item => !EXCLUDED_ROUTES.includes(item)),
    [UserRole.SUPER_ADMIN]: menuItems.map(item => item.id),
    [UserRole.TENANT_ADMIN]: menuItems.map(item => item.id),
  };

  const allowed = roleAccess[user?.role as UserRole] ?? [];

  const isBar = user?.restaurant?.name?.toLowerCase().includes("bar");

  const filterMenuItemsBar = isBar ? menuItems.map(item => {
    if (item.id === RouteLinks.KITCHEN) {
      return { ...item, label: "BOT" };
    }
    return item;
  }) : menuItems;

  const filteredMenuItems = filterMenuItemsBar.filter(item => {
    if (!allowed.includes(item.id)) {
      return false;
    }
    if (item.id === RouteLinks.WAITER_CONFIRMATION && !user?.restaurant?.requireWaiterConfirmation) {
      return false;
    }
    return true;
  });

  const filterMenuItemsRestaurant =
    user?.tenant?.type === TenantType.FOOD_COURT
      ? [
        ...filteredMenuItems.slice(0, 5),
        { id: `${RouteLinks.MENU_LIST}/${OrderType.DINEIN}`, label: "Menu List", icon: Pizza },
        ...filteredMenuItems.slice(6),
      ]
      : filteredMenuItems;

  const handleLogout = () => {
    socket.disconnect("order-status");
    socket.disconnect("order-alerts");
    logout();
  }

  useLayoutEffect(() => {
    requestNotificationPermission();
    if (user?.restaurantId) {
      dispatch(fetchSubscriptionUsageRequest(user.restaurantId));
    }
  }, [dispatch, user?.restaurantId]);

  const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Notification permission granted");
    } else {
      console.log("Notification permission denied");
    }
  };

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden text-gray-600 hover:text-gray-900"
              >
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center gap-3">
                {user?.restaurant?.logo ? (
                  <img
                    src={user?.restaurant?.logo}
                    alt={user?.restaurant?.name}
                    className="w-12 h-12 object-cover"
                  />
                ) : (
                  <div className=" p-2 rounded-xl" style={{ backgroundColor: primaryColor }}>
                    <Store className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <p className="text-xl font-bold text-gray-900">{user?.restaurant?.name}</p>
                  <p className="text-xs text-gray-500">KiwiQDine Restaurant Portal</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* <button
                onClick={() => onHanldePress(RouteLinks.NOTIFICATIONS)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button> */}

              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                {user?.avatar && (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        <aside
          className={`
            fixed inset-y-0 left-0 z-30 w-64 min-h-screen bg-linear-to-b from-white to-gray-50 border-r border-gray-200 shadow-sm
            transform transition-transform duration-300 ease-in-out mt-16
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <nav className="p-3 space-y-6 h-full overflow-y-auto flex flex-col">
            {/* Primary Navigation Section */}
            <div className='flex-1 flex flex-col space-y-1'>
              {/* Main Operations */}
              <div className="mb-2">
                <h3 className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Main</h3>
                {(user?.role === UserRole.MANAGER || user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.TENANT_ADMIN ? filterMenuItemsRestaurant.slice(0, 2) : filterMenuItemsRestaurant).map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.id}
                      to={item.id}
                      replace
                      onClick={() => setIsSidebarOpen(false)}
                      style={({ isActive }) => ({
                        backgroundColor: isActive ? hexToRgba(primaryColor, 0.1) : 'transparent',
                        borderLeft: isActive ? `3px solid ${primaryColor}` : '3px solid transparent',
                      })}
                      className={({ isActive }) => `
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-r-lg text-sm font-medium
                        transition-all duration-200 group relative
                        ${isActive ? 'shadow-sm' : 'hover:bg-gray-100/80'}
                      `}
                    >
                      {({ isActive }) => (
                        <>
                          <div className={`p-1.5 rounded-lg transition-all duration-200 ${isActive
                            ? 'shadow-sm'
                            : 'group-hover:bg-white group-hover:shadow-sm'
                            }`} style={{ backgroundColor: isActive ? hexToRgba(primaryColor, 0.15) : 'transparent' }}>
                            <Icon className="w-4 h-4" style={{ color: isActive ? primaryColor : '#6b7280' }} />
                          </div>
                          <span style={{ color: isActive ? primaryColor : '#374151' }} className="font-semibold">
                            {item.label}
                          </span>
                          {isActive && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }}></div>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>

              {/* Orders & Operations */}
              {filterMenuItemsRestaurant.length >= 8 && (
                <div className="mb-2">
                  <h3 className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Operations</h3>
                  {filterMenuItemsRestaurant.slice(2, 8).map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.id}
                        to={item.id}
                        replace
                        onClick={() => setIsSidebarOpen(false)}
                        style={({ isActive }) => ({
                          backgroundColor: isActive ? hexToRgba(primaryColor, 0.1) : 'transparent',
                          borderLeft: isActive ? `3px solid ${primaryColor}` : '3px solid transparent',
                        })}
                        className={({ isActive }) => `
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-r-lg text-sm font-medium
                        transition-all duration-200 group relative
                        ${isActive ? 'shadow-sm' : 'hover:bg-gray-100/80'}
                      `}
                      >
                        {({ isActive }) => (
                          <>
                            <div className={`p-1.5 rounded-lg transition-all duration-200 ${isActive
                              ? 'shadow-sm'
                              : 'group-hover:bg-white group-hover:shadow-sm'
                              }`} style={{ backgroundColor: isActive ? hexToRgba(primaryColor, 0.15) : 'transparent' }}>
                              <Icon className="w-4 h-4" style={{ color: isActive ? primaryColor : '#6b7280' }} />
                            </div>
                            <span style={{ color: isActive ? primaryColor : '#374151' }} className="font-semibold">
                              {item.label}
                            </span>
                            {isActive && (
                              <div className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }}></div>
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}

              {/* Management */}
              {filterMenuItemsRestaurant.length > 8 && (
                <div>
                  <h3 className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Management</h3>
                  {filterMenuItemsRestaurant.slice(8).map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.id}
                        to={item.id}
                        replace
                        onClick={() => setIsSidebarOpen(false)}
                        style={({ isActive }) => ({
                          backgroundColor: isActive ? hexToRgba(primaryColor, 0.1) : 'transparent',
                          borderLeft: isActive ? `3px solid ${primaryColor}` : '3px solid transparent',
                        })}
                        className={({ isActive }) => `
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-r-lg text-sm font-medium
                          transition-all duration-200 group relative
                          ${isActive ? 'shadow-sm' : 'hover:bg-gray-100/80'}
                        `}
                      >
                        {({ isActive }) => (
                          <>
                            <div className={`p-1.5 rounded-lg transition-all duration-200 ${isActive
                              ? 'shadow-sm'
                              : 'group-hover:bg-white group-hover:shadow-sm'
                              }`} style={{ backgroundColor: isActive ? hexToRgba(primaryColor, 0.15) : 'transparent' }}>
                              <Icon className="w-4 h-4" style={{ color: isActive ? primaryColor : '#6b7280' }} />
                            </div>
                            <span style={{ color: isActive ? primaryColor : '#374151' }} className="font-semibold">
                              {item.label}
                            </span>
                            {isActive && (
                              <div className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }}></div>
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Settings - Bottom Section */}
            {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.MANAGER || user?.role === UserRole.TENANT_ADMIN) && (
              <div className="pt-3 border-t border-gray-200">
                <NavLink
                  to={RouteLinks.SETTINGS}
                  replace
                  onClick={() => setIsSidebarOpen(false)}
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? hexToRgba(primaryColor, 0.1) : 'transparent',
                    borderLeft: isActive ? `3px solid ${primaryColor}` : '3px solid transparent',
                  })}
                  className={({ isActive }) => `
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-r-lg text-sm font-medium
                    transition-all duration-200 group relative
                    ${isActive ? 'shadow-sm' : 'hover:bg-gray-100/80'}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <div className={`p-1.5 rounded-lg transition-all duration-200 ${isActive
                        ? 'shadow-sm'
                        : 'group-hover:bg-white group-hover:shadow-sm'
                        }`} style={{ backgroundColor: isActive ? hexToRgba(primaryColor, 0.15) : 'transparent' }}>
                        <Settings className="w-4 h-4" style={{ color: isActive ? primaryColor : '#6b7280' }} />
                      </div>
                      <span style={{ color: isActive ? primaryColor : '#374151' }} className="font-semibold">
                        Settings
                      </span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }}></div>
                      )}
                    </>
                  )}
                </NavLink>
              </div>
            )}
          </nav>
        </aside>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black opacity-50 z-20 lg:hidden mt-16"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}
      </div>

      <main className="pl-0 lg:pl-64">
        <div className='flex flex-1 flex-col p-4'>
          <OrderAlerts />
          <SubscriptionBanner />
          <Outlet />
        </div>
      </main>
    </div>
  );
};
