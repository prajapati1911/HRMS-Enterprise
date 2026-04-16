import { useListHolidays } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CalendarRange, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminHolidays() {
  const { data: holidays, isLoading } = useListHolidays();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Holidays</h2>
          <p className="text-muted-foreground">Manage organization-wide holidays.</p>
        </div>
        <Button className="rounded-xl shadow-lg"><Plus className="mr-2 h-4 w-4"/> Add Holiday</Button>
      </div>

      <Card className="glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/40 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Holiday Name</th>
                <th className="px-6 py-4 font-medium">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                  </tr>
                ))
              ) : holidays?.map((holiday) => (
                <tr key={holiday.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-medium">
                    {new Date(holiday.date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{holiday.name}</div>
                    {holiday.description && <div className="text-xs text-muted-foreground mt-0.5">{holiday.description}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="capitalize bg-muted/50">{holiday.type}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && (!holidays || holidays.length === 0) && (
            <div className="text-center py-16">
              <CalendarRange className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No holidays configured.</p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
