import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Plus } from "lucide-react";

export default function AdminGeofence() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Geo-fencing</h2>
          <p className="text-muted-foreground">Configure allowed locations for attendance punch-in.</p>
        </div>
        <Button className="rounded-xl shadow-lg"><Plus className="mr-2 h-4 w-4"/> Add Location</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card className="glass-panel border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h4 className="font-semibold">HQ Office</h4>
                <p className="text-xs text-muted-foreground">Radius: 100m</p>
              </div>
              <MapPin className="text-primary h-5 w-5" />
            </CardContent>
          </Card>
          <Card className="glass-panel">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Branch A</h4>
                <p className="text-xs text-muted-foreground">Radius: 50m</p>
              </div>
              <MapPin className="text-muted-foreground h-5 w-5" />
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card className="glass-panel h-[500px] flex items-center justify-center bg-muted/20 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('https://maps.wikimedia.org/maps/osm/12/655/1583.png')] bg-cover bg-center mix-blend-luminosity"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="h-48 w-48 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center relative">
                <MapPin className="text-primary h-8 w-8 absolute -mt-4" />
              </div>
              <p className="mt-4 text-sm font-medium text-primary bg-background/80 px-3 py-1 rounded-full backdrop-blur-sm">Simulated Map View</p>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
