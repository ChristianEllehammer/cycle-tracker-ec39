
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, Heart, Zap } from 'lucide-react';
import type { Notification } from '../../../server/src/schema';

interface NotificationCenterProps {
  notifications: Notification[];
  onUpdate: () => void;
}

export function NotificationCenter({ notifications }: NotificationCenterProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'period_start': return <Heart className="h-4 w-4 text-red-500" />;
      case 'ovulation': return <Zap className="h-4 w-4 text-purple-500" />;
      case 'pms': return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'fertile_window': return <Zap className="h-4 w-4 text-green-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'period_start': return 'bg-red-100 text-red-800 border-red-200';
      case 'ovulation': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pms': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'fertile_window': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatNotificationType = (type: string) => {
    switch (type) {
      case 'period_start': return 'Period Start';
      case 'ovulation': return 'Ovulation';
      case 'pms': return 'PMS Alert';
      case 'fertile_window': return 'Fertile Window';
      default: return type;
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Upcoming Notifications
        </CardTitle>
        <CardDescription>
          Stay informed about your cycle phases and important dates
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No upcoming notifications</p>
            <p className="text-sm text-gray-400">
              Notifications will appear here based on your cycle tracking and preferences
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification: Notification) => (
              <div
                key={notification.id}
                className="flex items-start gap-4 p-4 bg-gradient-to-r from-white to-pink-50/30 rounded-lg border"
              >
                <div className="shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <Badge className={getNotificationColor(notification.type)}>
                      {formatNotificationType(notification.type)}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm">{notification.message}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>Scheduled for: {notification.scheduled_date.toLocaleDateString()}</span>
                    {notification.is_sent && (
                      <Badge variant="outline" className="ml-2">
                        Sent
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-2">🔔 Notification Types</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              <span><strong>Period Start:</strong> Reminds you when your period is expected</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-500" />
              <span><strong>Ovulation:</strong> Alerts you during your fertile window</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <span><strong>PMS Alert:</strong> Prepares you for potential symptoms</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              <span><strong>Fertile Window:</strong> Tracks your most fertile days</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
