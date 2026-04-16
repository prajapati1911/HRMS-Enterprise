import { useState, useEffect } from "react";
import { useGetEmployeeDashboard, usePunchIn, usePunchOut, getGetEmployeeDashboardQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Clock, MapPin, CalendarDays, Wallet, AlertCircle, CheckCircle2, Navigation } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function EmployeeDashboard() {
  const { data: dashboard, isLoading } = useGetEmployeeDashboard();
  const { employee } = useAuth();
  const punchIn = usePunchIn();
  const punchOut = usePunchOut();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [liveTime, setLiveTime] = useState<string>("00:00:00");
  const [isLocating, setIsLocating] = useState(false);

  const isPunchedIn = dashboard?.todayAttendance?.punchIn && !dashboard?.todayAttendance?.punchOut;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPunchedIn && dashboard.todayAttendance?.punchIn) {
      const startTime = new Date(dashboard.todayAttendance.punchIn).getTime();
      
      interval = setInterval(() => {
        const now = new Date().getTime();
        const diff = now - startTime;
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setLiveTime(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    } else if (dashboard?.todayAttendance?.workingHours) {
      const hours = Math.floor(dashboard.todayAttendance.workingHours);
      const minutes = Math.floor((dashboard.todayAttendance.workingHours - hours) * 60);
      setLiveTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
    } else {
      setLiveTime("00:00:00");
    }

    return () => clearInterval(interval);
  }, [isPunchedIn, dashboard?.todayAttendance]);

  const handlePunch = async () => {
    setIsLocating(true);
    
    // Simulate getting location
    setTimeout(async () => {
      try {
        const location = { latitude: 37.7749, longitude: -122.4194 }; // Mock location
        
        if (isPunchedIn) {
          await punchOut.mutateAsync({ data: location });
          toast({ title: "Punched out successfully" });
        } else {
          await punchIn.mutateAsync({ data: location });
          toast({ title: "Punched in successfully" });
        }
        
        queryClient.invalidateQueries({ queryKey: getGetEmployeeDashboardQueryKey() });
      } catch (error) {
        toast({ 
          title: "Punch failed", 
          description: "Could not record attendance. Please try again.",
          variant: "destructive" 
        });
      } finally {
        setIsLocating(false);
      }
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-panel"><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Hero Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-8 md:p-10 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2000&q=80')] opacity-10 mix-blend-overlay object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/50" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Good morning, {employee?.firstName}!</h1>
            <p className="text-primary-foreground/80 text-lg">Ready to make an impact today?</p>
          </div>
          
          <div className="bg-background/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col items-center min-w-[240px]">
            <div className="text-sm font-medium text-primary-foreground/80 mb-1 uppercase tracking-wider">Working Hours</div>
            <div className="text-4xl font-mono font-bold tracking-tight mb-4">{liveTime}</div>
            
            <Button 
              size="lg" 
              className={`w-full rounded-xl font-semibold shadow-lg ${isPunchedIn ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : 'bg-white text-primary hover:bg-white/90'}`}
              onClick={handlePunch}
              disabled={isLocating || punchIn.isPending || punchOut.isPending || (dashboard.todayAttendance?.punchOut && true)}
            >
              {isLocating ? (
                <><Navigation className="mr-2 h-5 w-5 animate-pulse" /> Locating...</>
              ) : isPunchedIn ? (
                <><Clock className="mr-2 h-5 w-5" /> Punch Out</>
              ) : dashboard.todayAttendance?.punchOut ? (
                <><CheckCircle2 className="mr-2 h-5 w-5" /> Shift Completed</>
              ) : (
                <><MapPin className="mr-2 h-5 w-5" /> Punch In</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="glass-panel">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-chart-2/10 flex items-center justify-center text-chart-2">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Leave Balance</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold">{dashboard.leaveBalance.casual.remaining + dashboard.leaveBalance.paid.remaining}</h3>
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-chart-1/10 flex items-center justify-center text-chart-1">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Month's Overtime</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold">{dashboard.monthSummary.overtimeHours.toFixed(1)}</h3>
                <span className="text-sm text-muted-foreground">hrs</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-chart-3/10 flex items-center justify-center text-chart-3">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Next Payslip</p>
              {dashboard.payslip ? (
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold">${dashboard.payslip.netSalary}</h3>
                </div>
              ) : (
                <div className="text-sm font-medium text-muted-foreground mt-1">Processing...</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.recentAttendance.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div className="flex flex-col">
                    <span className="font-medium">{new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span className="text-xs text-muted-foreground">{record.status}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{record.workingHours?.toFixed(1) || '-'} hrs</div>
                    <div className="text-xs text-muted-foreground">
                      {record.punchIn ? new Date(record.punchIn).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '-'} 
                      {' - '} 
                      {record.punchOut ? new Date(record.punchOut).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.notifications.map((notif) => (
                <div key={notif.id} className="flex gap-3">
                  <AlertCircle className={`h-5 w-5 shrink-0 ${notif.isRead ? 'text-muted-foreground' : 'text-primary'}`} />
                  <div>
                    <p className={`text-sm ${notif.isRead ? 'text-muted-foreground' : 'font-medium'}`}>{notif.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                  </div>
                </div>
              ))}
              {dashboard.notifications.length === 0 && (
                <div className="text-center text-muted-foreground py-6">You're all caught up!</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
