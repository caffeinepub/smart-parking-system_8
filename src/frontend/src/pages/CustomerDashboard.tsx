import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bike,
  Car,
  Loader2,
  LogOut,
  MapPin,
  ParkingSquare,
  Timer,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type ParkingSession, type UserProfile, VehicleType } from "../backend";
import ReceiptModal from "../components/ReceiptModal";
import {
  useAvailableSlots,
  useCustomerSessions,
  useFinalizeSession,
  useRegisterSession,
} from "../hooks/useQueries";
import {
  formatCost,
  formatDateTime,
  formatDuration,
  formatVehicleType,
  getElapsedTime,
} from "../utils/formatters";

interface CustomerDashboardProps {
  profile: UserProfile | null;
  onLogout: () => void;
}

export default function CustomerDashboard({
  profile,
  onLogout,
}: CustomerDashboardProps) {
  const [receiptSession, setReceiptSession] = useState<ParkingSession | null>(
    null,
  );
  const [receiptOpen, setReceiptOpen] = useState(false);

  const customerSessions = useCustomerSessions();
  const availableSlots = useAvailableSlots();

  const sessions = customerSessions.data ?? [];
  const slots = availableSlots.data ?? [];
  const activeSession = sessions.find((s) => !s.exitTime);
  const pastSessions = sessions.filter((s) => !!s.exitTime);

  const handleViewReceipt = (session: ParkingSession) => {
    setReceiptSession(session);
    setReceiptOpen(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ParkingSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-foreground font-bold text-lg leading-none">
              SmartPark
            </h1>
            <p className="text-muted-foreground text-xs">Customer Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {profile && (
            <div className="text-right hidden sm:block">
              <div className="text-foreground text-sm font-semibold">
                {profile.username}
              </div>
              <div className="text-muted-foreground text-xs font-mono">
                {profile.vehicleNumber}
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="border-border text-muted-foreground hover:text-foreground"
            onClick={onLogout}
            data-ocid="customer.logout_button"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Welcome, {profile?.username ?? "Customer"} 👋
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {formatVehicleType(profile?.vehicleType ?? "twoWheeler")} •{" "}
            {profile?.vehicleNumber}
          </p>
        </div>

        <Tabs defaultValue="park" className="space-y-6">
          <TabsList
            className="bg-card border border-border"
            data-ocid="customer.tab"
          >
            <TabsTrigger
              value="park"
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Park
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              <Timer className="w-4 h-4 mr-2" />
              My History
            </TabsTrigger>
          </TabsList>

          {/* Park Tab */}
          <TabsContent value="park" className="space-y-4">
            {customerSessions.isLoading ? (
              <div
                className="flex items-center justify-center py-12"
                data-ocid="customer.park.loading_state"
              >
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : activeSession ? (
              <ActiveSessionCard
                session={activeSession}
                slots={slots}
                onExit={(session) => handleViewReceipt(session)}
              />
            ) : (
              <ParkingForm profile={profile} slots={slots} />
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground text-base font-semibold">
                  My Parking History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {pastSessions.length === 0 ? (
                  <div
                    className="text-center py-12 text-muted-foreground text-sm"
                    data-ocid="customer.history.empty_state"
                  >
                    No parking history yet.
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <Table data-ocid="customer.history.table">
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent bg-muted/40">
                          <TableHead className="text-muted-foreground text-xs uppercase tracking-wide font-semibold">
                            Vehicle No.
                          </TableHead>
                          <TableHead className="text-muted-foreground text-xs uppercase tracking-wide font-semibold">
                            Type
                          </TableHead>
                          <TableHead className="text-muted-foreground text-xs uppercase tracking-wide font-semibold">
                            Slot
                          </TableHead>
                          <TableHead className="text-muted-foreground text-xs uppercase tracking-wide font-semibold">
                            Entry
                          </TableHead>
                          <TableHead className="text-muted-foreground text-xs uppercase tracking-wide font-semibold">
                            Exit
                          </TableHead>
                          <TableHead className="text-muted-foreground text-xs uppercase tracking-wide font-semibold">
                            Duration
                          </TableHead>
                          <TableHead className="text-muted-foreground text-xs uppercase tracking-wide font-semibold">
                            Cost
                          </TableHead>
                          <TableHead className="text-muted-foreground text-xs" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pastSessions.map((session, i) => {
                          const slot = slots.find(
                            (s) => s.id === session.slotId,
                          );
                          return (
                            <TableRow
                              key={`${session.slotId}-${session.entryTime}`}
                              className="border-border hover:bg-muted/30"
                              data-ocid={`customer.history.row.${i + 1}`}
                            >
                              <TableCell className="font-mono text-sm text-foreground font-semibold">
                                {session.vehicleNumber}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {formatVehicleType(session.vehicleType)}
                              </TableCell>
                              <TableCell className="text-xs text-foreground font-medium">
                                {slot ? slot.name : `#${session.slotId}`}
                              </TableCell>
                              <TableCell className="text-xs text-foreground">
                                {formatDateTime(session.entryTime)}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {session.exitTime
                                  ? formatDateTime(session.exitTime)
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-xs text-foreground">
                                {session.exitTime
                                  ? formatDuration(
                                      session.entryTime,
                                      session.exitTime,
                                    )
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-sm font-semibold text-foreground">
                                {session.totalCost !== undefined
                                  ? formatCost(session.totalCost)
                                  : "—"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-primary hover:text-primary/80 hover:bg-primary/5"
                                  onClick={() => handleViewReceipt(session)}
                                  data-ocid={`customer.history.view_button.${i + 1}`}
                                >
                                  Receipt
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border py-4 px-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="text-primary hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          caffeine.ai
        </a>
      </footer>

      <ReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        session={receiptSession}
        slots={slots}
      />
    </div>
  );
}

// Active Session Card
function ActiveSessionCard({
  session,
  slots,
  onExit,
}: {
  session: ParkingSession;
  slots: {
    id: number;
    name: string;
    isOccupied: boolean;
    vehicleType?: VehicleType;
  }[];
  onExit: (s: ParkingSession) => void;
}) {
  const [elapsed, setElapsed] = useState(getElapsedTime(session.entryTime));
  const finalizeSession = useFinalizeSession();
  const slot = slots.find((s) => s.id === session.slotId);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(getElapsedTime(session.entryTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [session.entryTime]);

  const handleExit = async () => {
    try {
      const finalized = await finalizeSession.mutateAsync(
        `${session.slotId}-${session.entryTime}`,
      );
      toast.success("Parking session ended!");
      onExit(finalized);
    } catch {
      toast.error("Failed to end session. Please try again.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card
        className="bg-card border-primary/30 border-2 shadow-xs"
        data-ocid="customer.active_session.card"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2 text-base font-semibold">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              Active Parking Session
            </CardTitle>
            <Badge className="text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
              In Progress
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="Vehicle" value={session.vehicleNumber} mono />
            <InfoCard
              label="Type"
              value={formatVehicleType(session.vehicleType)}
              icon={
                session.vehicleType === "twoWheeler" ? (
                  <Bike className="w-4 h-4 text-primary" />
                ) : (
                  <Car className="w-4 h-4 text-primary" />
                )
              }
            />
            <InfoCard
              label="Slot"
              value={slot ? slot.name : `#${session.slotId}`}
            />
            <InfoCard
              label="Entry Time"
              value={formatDateTime(session.entryTime)}
            />
          </div>

          <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 text-center">
            <div className="text-muted-foreground text-sm mb-1">
              Time Elapsed
            </div>
            <div className="text-4xl font-bold text-primary font-mono">
              {elapsed}
            </div>
          </div>

          <Button
            className="w-full bg-destructive text-white hover:bg-destructive/90 py-5"
            onClick={handleExit}
            disabled={finalizeSession.isPending}
            data-ocid="customer.exit_button"
          >
            {finalizeSession.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
              </>
            ) : (
              "🚗 Exit & Pay"
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Parking Form (no active session)
function ParkingForm({
  profile,
  slots,
}: {
  profile: UserProfile | null;
  slots: {
    id: number;
    name: string;
    isOccupied: boolean;
    vehicleType?: VehicleType;
  }[];
}) {
  const [vehicleNumber, setVehicleNumber] = useState(
    profile?.vehicleNumber ?? "",
  );
  const [vehicleType, setVehicleType] = useState<VehicleType>(
    profile?.vehicleType ?? VehicleType.twoWheeler,
  );
  const [slotId, setSlotId] = useState<string>("");
  const registerSession = useRegisterSession();

  const filteredSlots = slots.filter(
    (s) => !s.isOccupied && (!s.vehicleType || s.vehicleType === vehicleType),
  );

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNumber.trim()) {
      toast.error("Enter vehicle number.");
      return;
    }
    if (!slotId) {
      toast.error("Select a parking slot.");
      return;
    }
    try {
      await registerSession.mutateAsync({
        slotId: Number(slotId),
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        vehicleType,
      });
      toast.success("Parking session started!");
    } catch {
      toast.error("Failed to start session. Please try again.");
    }
  };

  return (
    <Card
      className="bg-card border-border shadow-xs"
      data-ocid="customer.park.card"
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground text-base font-semibold flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Start Parking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleStart} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground text-sm font-medium">
              Vehicle Number
            </Label>
            <input
              type="text"
              placeholder="e.g. MH12AB1234"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              className="w-full h-10 px-3 rounded-lg border border-border bg-white text-foreground font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              data-ocid="customer.vehicle_number_input"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground text-sm font-medium">
              Vehicle Type
            </Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setVehicleType(VehicleType.twoWheeler)}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                  vehicleType === VehicleType.twoWheeler
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-white border-border text-muted-foreground hover:text-foreground"
                }`}
                data-ocid="customer.two_wheeler_toggle"
              >
                <Bike className="w-4 h-4" /> 2-Wheeler
              </button>
              <button
                type="button"
                onClick={() => setVehicleType(VehicleType.fourWheeler)}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                  vehicleType === VehicleType.fourWheeler
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-white border-border text-muted-foreground hover:text-foreground"
                }`}
                data-ocid="customer.four_wheeler_toggle"
              >
                <Car className="w-4 h-4" /> 4-Wheeler
              </button>
            </div>
          </div>

          {/* Available slot grid */}
          <div className="space-y-2">
            <Label className="text-foreground text-sm font-medium">
              Select Slot{" "}
              <span className="text-muted-foreground font-normal">
                ({filteredSlots.length} available)
              </span>
            </Label>
            {filteredSlots.length === 0 ? (
              <div
                className="text-sm text-muted-foreground bg-muted/50 border border-border rounded-lg p-4 text-center"
                data-ocid="customer.slots.empty_state"
              >
                No available slots for this vehicle type.
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {filteredSlots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSlotId(String(slot.id))}
                    className={`rounded-lg p-2.5 border text-center text-xs font-semibold transition-all ${
                      slotId === String(slot.id)
                        ? "bg-primary border-primary text-white shadow-sm"
                        : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    {slot.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-white hover:bg-primary/90 py-5 text-base font-semibold"
            disabled={registerSession.isPending}
            data-ocid="customer.start_parking_button"
          >
            {registerSession.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting...
              </>
            ) : (
              "🅿 Start Parking"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function InfoCard({
  label,
  value,
  mono,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 border border-border">
      <div className="text-muted-foreground text-xs mb-1">{label}</div>
      <div
        className={`text-foreground font-semibold flex items-center gap-1 text-sm ${
          mono ? "font-mono" : ""
        }`}
      >
        {icon}
        {value}
      </div>
    </div>
  );
}
