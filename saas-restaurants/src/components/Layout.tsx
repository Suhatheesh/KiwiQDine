import { FC, useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Store,
  CreditCard,
  Receipt,
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../utils/constants';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { RouteLinks } from '../routers/type';
import { SideMenuListType } from '../models/BaseType';
import logo from '../assets/MINI LOGO.png';

const menuItems: SideMenuListType[] = [
  { id: RouteLinks.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { id: RouteLinks.TENANT, label: 'Tenants', icon: User },
  { id: RouteLinks.RESTAURANTS, label: 'Restaurants', icon: Store },
  { id: RouteLinks.SUBSCRIPTIONS, label: 'Subscription Plans', icon: CreditCard },
  { id: RouteLinks.INVOICES, label: 'Invoices', icon: Receipt },
  // { id: RouteLinks.USERS, label: 'Users & Roles', icon: Users },
  // { id: RouteLinks.REPORTS, label: 'Reports', icon: BarChart3 },
  // { id: RouteLinks.NOTIFICATIONS, label: 'Notifications', icon: Bell },
  // { id: RouteLinks.SETTINGS, label: 'Settings', icon: Settings },
];

export const Layout: FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  // const navigation = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Reset sidebar state on route changes to prevent persistence
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const filteredMenuItems = menuItems.filter(item => {
    if (user?.role === UserRole.SUPER_ADMIN) return true;
    if (item.id === RouteLinks.SUBSCRIPTIONS) return false;
    if (item.id === RouteLinks.USERS) return false;
    if (item.id === RouteLinks.SETTINGS) return user?.role === UserRole.MANAGER;
    return true;
  });

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
        <div className="px-4 sm:px-6 lg:px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden text-gray-600 hover:text-gray-900"
              >
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center gap-3">
                <img src={logo} className='w-24 h-16 -mr-2' />
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">KiwiQDine</h1>
                  <p className="text-xs text-gray-500">Super Admin Panel</p>
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
                  <p className="text-xs text-gray-500 capitalize">{user?.role.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav >

      <div className="flex pt-16">
        <aside
          className={`
            fixed inset-y-0 left-0 z-30 w-64 min-h-screen bg-white border-r border-gray-200
            transform transition-transform duration-300 ease-in-out mt-16
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <nav className="p-4 space-y-1 h-full overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.id}
                  to={item.id}
                  replace
                  onClick={() => {
                    setIsSidebarOpen(false);
                  }}
                  className={({ isActive }) => `
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {isSidebarOpen && (
          <div
            className="fixed top-16 bottom-0 left-0 right-0 bg-black bg-opacity-40 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}
      </div>

      <main className="pl-0 lg:pl-64 ">
        <div className='flex flex-1 flex-col p-4'>
          <Outlet />
        </div>
      </main>
    </div >
  );
};
