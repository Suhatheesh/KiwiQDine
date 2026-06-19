import { Bell, Check, Trash2 } from 'lucide-react';

export const Notifications = () => {

  /* TODO :: NEED TO APPLY ACTUAL VALUES THAT COMMING FROM APIs */

  const unreadCount = 2;

  const getNotificationIcon = (type: string) => {
    const iconClasses = 'w-5 h-5';
    switch (type) {
      case 'order':
        return <Bell className={iconClasses} />;
      case 'invoice':
        return <Bell className={iconClasses} />;
      case 'subscription':
        return <Bell className={iconClasses} />;
      default:
        return <Bell className={iconClasses} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'bg-blue-100 text-blue-600';
      case 'invoice':
        return 'bg-yellow-100 text-yellow-600';
      case 'subscription':
        return 'bg-green-100 text-green-600';
      case 'alert':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
        <p className="text-gray-600">
          {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-200">
        {[{ id: 1, title: "", message: "", type: "", is_read: true, created_at: 0, restaurant_id: 1 }].map((notification) => (
          <div
            key={notification.id}
            className={`p-6 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50/30' : ''
              }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${getNotificationColor(notification.type)}`}>
                {getNotificationIcon(notification.type)}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                  {!notification.is_read && (
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{new Date(notification.created_at).toLocaleString()}</span>
                  <span className="capitalize">{notification.type}</span>
                  {notification.restaurant_id && (
                    <span>
                      1
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                  <Check className="w-4 h-4" />
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
