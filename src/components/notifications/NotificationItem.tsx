
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, CreditCard, Settings, Mail, Video, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notification } from "@/services/notificationService";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const getIcon = () => {
    switch (notification.type) {
      case 'video':
        return <Video className="h-4 w-4 text-blue-500" />;
      case 'payment':
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case 'account':
        return <Settings className="h-4 w-4 text-orange-500" />;
      case 'newsletter':
        return <Mail className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead(notification.id);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  return (
    <div 
      className={`p-4 border-b transition-colors relative ${
        notification.is_read ? 'bg-background' : 'bg-muted/30'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h4 className={`text-sm font-medium ${notification.is_read ? '' : 'font-semibold'}`}>
            {notification.title}
          </h4>
          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
      
      <div 
        className={`absolute right-4 top-4 flex gap-1 transition-opacity ${
          isHovered || !notification.is_read ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {!notification.is_read && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={handleMarkAsRead}
            aria-label="Mark as read"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
          aria-label="Delete notification"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
