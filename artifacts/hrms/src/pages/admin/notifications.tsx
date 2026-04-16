import { useListNotifications, useMarkAllNotificationsRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Bell, Check, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Notifications() {
  const { data: notifications, isLoading } = useListNotifications();
  const markAll = useMarkAllNotificationsRead();
  const queryClient = useQueryClient();

  const handleMarkAll = async () => {
    await markAll.mutateAsync();
    queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">Stay updated on your workspace activities.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleMarkAll} disabled={markAll.isPending}>
          <Check className="mr-2 h-4 w-4" /> Mark all as read
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
           [1,2,3].map(i => <Card key={i} className="glass-panel"><CardContent className="p-4"><Skeleton className="h-12 w-full"/></CardContent></Card>)
        ) : notifications?.map(notif => (
          <Card key={notif.id} className={`glass-panel transition-colors ${!notif.isRead ? 'border-primary/50 bg-primary/5' : ''}`}>
            <CardContent className="p-5 flex gap-4">
              <div className={`mt-0.5 rounded-full p-2 h-fit ${!notif.isRead ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className={`text-sm font-semibold ${!notif.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>{notif.title}</h4>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && (!notifications || notifications.length === 0) && (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="mx-auto h-12 w-12 opacity-20 mb-4" />
            <p>No notifications.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
