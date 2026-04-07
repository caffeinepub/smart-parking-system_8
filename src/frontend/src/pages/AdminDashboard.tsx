import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Principal } from "@icp-sdk/core/principal";
import {
  Bike,
  Car,
  Loader2,
  LogOut,
  ParkingSquare,
  Plus,
  Settings,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type ParkingSession, UserRole, VehicleType } from "../backend";
import ReceiptModal from "../components/ReceiptModal";
import {
  useAddSlot,
  useAllSessions,
  useAssignRole,
  useAvailableSlots,
  useIncomeStats,
  usePricing,
  useRemoveSlot,
  useSetPricing,
} from "../hooks/useQueries";
import {
  formatCost,
  formatDateTime,
  formatDuration,
  formatVehicleType,
} from "../utils/formatters";

type SlotFilter = "all" | "twoWheeler" | "fourWheeler";

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [selectedSession, setSelectedSession] = useState<ParkingSession | null>(
    null,
  );
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [slotFilter, setSlotFilter] = useState<SlotFilter>("all");

  const incomeStats = useIncomeStats();
  const allSessions = useAllSessions();
  const availableSlots = useAvailableSlots();

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const sessions = allSessions.data ?? [];
  const activeSessions = sessions.filter((s) => !s.exitTime);
  const slots = availableSlots.data ?? [];

  const filteredSlots = slots.filter((s) => {
    if (slotFilter === "all") return true;
    return !s.vehicleType || s.vehicleType === slotFilter;
  });

  const handleViewReceipt = (session: ParkingSession) => {
    setSelectedSession(session);
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
            <p className="text-muted-foreground text-xs">
              Admin Control Center
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-foreground text-sm font-medium">
              {currentTime.toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </div>
            <div className="text-muted-foreground text-xs">
              {currentTime.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-border text-muted-foreground hover:text-foreground"
            onClick={onLogout}
            data-ocid="admin.logout_button"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Admin Dashboard
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor and manage your parking facility
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList
            className="bg-card border border-border"
            data-ocid="admin.tab"
          >
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="slots"
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Slots
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              History
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KpiCard
                title="Today's Income"
                value={
                  incomeStats.data
                    ? formatCost(incomeStats.data.dailyIncome)
                    : "—"
                }
                icon={<TrendingUp className="w-5 h-5 text-primary" />}
                loading={incomeStats.isLoading}
                ocid="admin.daily_income.card"
              />
              <KpiCard
                title="Monthly Income"
                value={
                  incomeStats.data
                    ? formatCost(incomeStats.data.monthlyIncome)
                    : "—"
                }
                icon={<TrendingUp className="w-5 h-5 text-primary" />}
                loading={incomeStats.isLoading}
                ocid="admin.monthly_income.card"
              />
              <KpiCard
                title="Active Sessions"
                value={String(activeSessions.length)}
                icon={<Users className="w-5 h-5 text-primary" />}
                loading={allSessions.isLoading}
                ocid="admin.active_sessions.card"
              />
            </div>

            {/* Parking Slot Grid */}
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-foreground text-base font-semibold flex items-center gap-2">
                  <Car className="w-4 h-4 text-primary" />
                  Parking Lot Overview
                </CardTitle>
                {/* Filter buttons */}
                <div className="flex gap-1" data-ocid="admin.slot_filter.tab">
                  {(["all", "twoWheeler", "fourWheeler"] as SlotFilter[]).map(
                    (f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setSlotFilter(f)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all border ${
                          slotFilter === f
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-muted-foreground border-border hover:text-foreground"
                        }`}
                      >
                        {f === "all"
                          ? "All"
                          : f === "twoWheeler"
                            ? "2-Wheeler"
                            : "4-Wheeler"}
                      </button>
                    ),
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {slots.length === 0 ? (
                  <div
                    className="text-center py-8 text-muted-foreground text-sm"
                    data-ocid="admin.slots.empty_state"
                  >
                    No parking slots configured. Add slots in the Slots tab.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-2">
                    {filteredSlots.map((slot, i) => (
                      <SlotTile key={slot.id} slot={slot} index={i + 1} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground text-base font-semibold">
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-72">
                  <SessionTable
                    sessions={sessions.slice(0, 15)}
                    slots={slots}
                    onViewReceipt={handleViewReceipt}
                    isAdmin
                  />
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Slots Tab */}
          <TabsContent value="slots" className="space-y-4">
            <AddSlotForm />
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground text-base font-semibold">
                  All Parking Slots
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <SlotList slots={slots} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground text-base font-semibold">
                  Session History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <SessionTable
                    sessions={sessions}
                    slots={slots}
                    onViewReceipt={handleViewReceipt}
                    isAdmin
                  />
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <PricingSettings />
            <RoleAssignment />
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
        session={selectedSession}
        slots={slots}
      />
    </div>
  );
}

// KPI Card
function KpiCard({
  title,
  value,
  icon,
  loading,
  ocid,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  loading?: boolean;
  ocid: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-card border-border shadow-xs" data-ocid={ocid}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">{title}</p>
              {loading ? (
                <div
                  className="h-8 w-24 bg-muted rounded animate-pulse mt-1"
                  data-ocid={`${ocid}.loading_state`}
                />
              ) : (
                <p className="text-3xl font-bold text-foreground mt-1">
                  {value}
                </p>
              )}
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">{icon}</div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Slot Tile — green=available, red=occupied
function SlotTile({
  slot,
  index,
}: {
  slot: {
    id: number;
    name: string;
    isOccupied: boolean;
    vehicleType?: VehicleType;
  };
  index: number;
}) {
  return (
    <div
      className={`rounded-lg p-2 border text-center text-xs font-medium transition-all ${
        slot.isOccupied
          ? "bg-red-50 border-red-200 text-red-600"
          : "bg-green-50 border-green-200 text-green-700"
      }`}
      data-ocid={`admin.slot.item.${index}`}
    >
      <div className="font-bold text-[11px] uppercase truncate">
        {slot.name}
      </div>
      <div className="mt-0.5 text-[10px]">
        {slot.vehicleType ? (
          slot.vehicleType === "twoWheeler" ? (
            <Bike className="w-3 h-3 inline" />
          ) : (
            <Car className="w-3 h-3 inline" />
          )
        ) : (
          "—"
        )}
      </div>
      <div
        className={`w-2 h-2 rounded-full mx-auto mt-1 ${
          slot.isOccupied ? "bg-red-500" : "bg-green-500"
        }`}
      />
    </div>
  );
}

// Session Table
function SessionTable({
  sessions,
  slots,
  onViewReceipt,
  isAdmin,
}: {
  sessions: ParkingSession[];
  slots: {
    id: number;
    name: string;
    isOccupied: boolean;
    vehicleType?: VehicleType;
  }[];
  onViewReceipt: (s: ParkingSession) => void;
  isAdmin?: boolean;
}) {
  if (sessions.length === 0) {
    return (
      <div
        className="text-center py-12 text-muted-foreground text-sm"
        data-ocid="admin.history.empty_state"
      >
        No sessions found.
      </div>
    );
  }

  return (
    <Table data-ocid="admin.history.table">
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent bg-muted/40">
          {isAdmin && (
            <TableHead className="text-muted-foreground text-xs uppercase tracking-wide font-semibold">
              Customer
            </TableHead>
          )}
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
          <TableHead className="text-muted-foreground text-xs uppercase tracking-wide font-semibold">
            Status
          </TableHead>
          <TableHead className="text-muted-foreground text-xs" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session, i) => {
          const slot = slots.find((s) => s.id === session.slotId);
          const isActive = !session.exitTime;
          return (
            <TableRow
              key={`${session.slotId}-${session.entryTime}`}
              className="border-border hover:bg-muted/30"
              data-ocid={`admin.history.row.${i + 1}`}
            >
              {isAdmin && (
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {session.customerId.toString().slice(0, 8)}...
                </TableCell>
              )}
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
                {session.exitTime ? formatDateTime(session.exitTime) : "—"}
              </TableCell>
              <TableCell className="text-xs text-foreground">
                {session.exitTime
                  ? formatDuration(session.entryTime, session.exitTime)
                  : "—"}
              </TableCell>
              <TableCell className="text-sm font-semibold text-foreground">
                {session.totalCost !== undefined
                  ? formatCost(session.totalCost)
                  : "—"}
              </TableCell>
              <TableCell>
                {isActive ? (
                  <Badge className="text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
                    Active
                  </Badge>
                ) : (
                  <Badge
                    className="text-xs bg-muted text-muted-foreground border-border hover:bg-muted"
                    variant="outline"
                  >
                    Done
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary hover:text-primary/80 hover:bg-primary/5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewReceipt(session);
                  }}
                  data-ocid={`admin.history.view_button.${i + 1}`}
                >
                  Receipt
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// Add Slot Form
function AddSlotForm() {
  const [slotName, setSlotName] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType | "any">("any");
  const addSlot = useAddSlot();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotName.trim()) {
      toast.error("Enter a slot name.");
      return;
    }
    try {
      await addSlot.mutateAsync({
        name: slotName,
        vehicleType:
          vehicleType === "any" ? null : (vehicleType as VehicleType),
      });
      toast.success(`Slot "${slotName}" added!`);
      setSlotName("");
    } catch {
      toast.error("Failed to add slot.");
    }
  };

  return (
    <Card className="bg-card border-border shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground text-base font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          Add Parking Slot
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Slot name (e.g. A1, B2)"
            value={slotName}
            onChange={(e) => setSlotName(e.target.value)}
            className="bg-white border-border text-foreground placeholder:text-muted-foreground"
            data-ocid="slots.name_input"
          />
          <Select
            value={vehicleType}
            onValueChange={(v) => setVehicleType(v as VehicleType | "any")}
          >
            <SelectTrigger
              className="bg-white border-border text-foreground w-48"
              data-ocid="slots.type_select"
            >
              <SelectValue placeholder="Vehicle Type" />
            </SelectTrigger>
            <SelectContent className="bg-white border-border">
              <SelectItem value="any">Any Vehicle</SelectItem>
              <SelectItem value={VehicleType.twoWheeler}>2-Wheeler</SelectItem>
              <SelectItem value={VehicleType.fourWheeler}>4-Wheeler</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="submit"
            className="bg-primary text-white hover:bg-primary/90"
            disabled={addSlot.isPending}
            data-ocid="slots.add_button"
          >
            {addSlot.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" /> Add Slot
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Slot List
function SlotList({
  slots,
}: {
  slots: {
    id: number;
    name: string;
    isOccupied: boolean;
    vehicleType?: VehicleType;
  }[];
}) {
  const removeSlot = useRemoveSlot();

  const handleRemove = async (slotId: number, name: string) => {
    try {
      await removeSlot.mutateAsync(slotId);
      toast.success(`Slot "${name}" removed.`);
    } catch {
      toast.error("Failed to remove slot.");
    }
  };

  if (slots.length === 0) {
    return (
      <div
        className="text-center py-12 text-muted-foreground text-sm"
        data-ocid="slots.empty_state"
      >
        No slots added yet.
      </div>
    );
  }

  return (
    <Table data-ocid="slots.table">
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent bg-muted/40">
          <TableHead className="text-muted-foreground text-xs uppercase tracking-wide font-semibold">
            Slot Name
          </TableHead>
          <TableHead className="text-muted-foreground text-xs uppercase tracking-wide font-semibold">
            Vehicle Type
          </TableHead>
          <TableHead className="text-muted-foreground text-xs uppercase tracking-wide font-semibold">
            Status
          </TableHead>
          <TableHead className="text-muted-foreground text-xs" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {slots.map((slot, i) => (
          <TableRow
            key={slot.id}
            className="border-border hover:bg-muted/30"
            data-ocid={`slots.item.${i + 1}`}
          >
            <TableCell className="font-semibold text-foreground">
              {slot.name}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {slot.vehicleType ? formatVehicleType(slot.vehicleType) : "Any"}
            </TableCell>
            <TableCell>
              {slot.isOccupied ? (
                <Badge className="text-xs bg-red-50 text-red-600 border-red-200 hover:bg-red-50">
                  Occupied
                </Badge>
              ) : (
                <Badge className="text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
                  Available
                </Badge>
              )}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-red-50"
                onClick={() => handleRemove(slot.id, slot.name)}
                disabled={removeSlot.isPending}
                data-ocid={`slots.delete_button.${i + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Pricing Settings
function PricingSettings() {
  const pricing = usePricing();
  const setPricingMut = useSetPricing();
  const [twoRate, setTwoRate] = useState("");
  const [fourRate, setFourRate] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (pricing.data && !initialized) {
      setTwoRate(String(Number(pricing.data[0]) / 100));
      setFourRate(String(Number(pricing.data[1]) / 100));
      setInitialized(true);
    }
  }, [pricing.data, initialized]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const two = Math.round(Number(twoRate) * 100);
    const four = Math.round(Number(fourRate) * 100);
    if (Number.isNaN(two) || Number.isNaN(four)) {
      toast.error("Invalid rates.");
      return;
    }
    try {
      await setPricingMut.mutateAsync({ two: BigInt(two), four: BigInt(four) });
      toast.success("Pricing updated!");
    } catch {
      toast.error("Failed to update pricing.");
    }
  };

  return (
    <Card className="bg-card border-border shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground text-base font-semibold flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          Pricing Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground text-sm font-medium">
                2-Wheeler Rate (₹/hour)
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 10"
                value={twoRate}
                onChange={(e) => setTwoRate(e.target.value)}
                className="bg-white border-border text-foreground"
                data-ocid="settings.two_rate_input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm font-medium">
                4-Wheeler Rate (₹/hour)
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 20"
                value={fourRate}
                onChange={(e) => setFourRate(e.target.value)}
                className="bg-white border-border text-foreground"
                data-ocid="settings.four_rate_input"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="bg-primary text-white hover:bg-primary/90"
            disabled={setPricingMut.isPending}
            data-ocid="settings.save_pricing_button"
          >
            {setPricingMut.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              "Save Pricing"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Role Assignment
function RoleAssignment() {
  const [principalText, setPrincipalText] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.admin);
  const assignRole = useAssignRole();

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!principalText.trim()) {
      toast.error("Enter a principal.");
      return;
    }
    try {
      const principal = Principal.fromText(principalText.trim());
      await assignRole.mutateAsync({ principal, role });
      toast.success(`Role "${role}" assigned!`);
      setPrincipalText("");
    } catch {
      toast.error("Invalid principal or assignment failed.");
    }
  };

  return (
    <Card className="bg-card border-border shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground text-base font-semibold flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Assign User Role
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAssign} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground text-sm font-medium">
              User Principal
            </Label>
            <Input
              placeholder="Enter principal ID (e.g. aaaaa-aa)"
              value={principalText}
              onChange={(e) => setPrincipalText(e.target.value)}
              className="bg-white border-border text-foreground font-mono text-sm"
              data-ocid="settings.principal_input"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground text-sm font-medium">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger
                className="bg-white border-border text-foreground"
                data-ocid="settings.role_select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-border">
                <SelectItem value={UserRole.admin}>Admin</SelectItem>
                <SelectItem value={UserRole.user}>User</SelectItem>
                <SelectItem value={UserRole.guest}>Guest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            className="bg-primary text-white hover:bg-primary/90"
            disabled={assignRole.isPending}
            data-ocid="settings.assign_role_button"
          >
            {assignRole.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Assigning...
              </>
            ) : (
              "Assign Role"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
