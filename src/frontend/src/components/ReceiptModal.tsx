import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Bike, Car, Printer } from "lucide-react";
import type { ParkingSession, ParkingSlot } from "../backend";
import {
  formatCost,
  formatDateTime,
  formatDuration,
  formatVehicleType,
} from "../utils/formatters";

interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  session: ParkingSession | null;
  slots: ParkingSlot[];
}

export default function ReceiptModal({
  open,
  onClose,
  session,
  slots,
}: ReceiptModalProps) {
  if (!session) return null;

  const slot = slots.find((s) => s.id === session.slotId);
  const slotName = slot ? slot.name : `Slot #${session.slotId}`;
  const duration = session.exitTime
    ? formatDuration(session.entryTime, session.exitTime)
    : "In Progress";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-sm bg-white border-border"
        data-ocid="receipt.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-center text-primary flex items-center justify-center gap-2">
            <span>🅿</span> Parking Receipt
          </DialogTitle>
        </DialogHeader>

        <div className="print-receipt space-y-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">SmartPark</div>
            <div className="text-muted-foreground text-xs">
              Automated Parking System
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="space-y-3">
            <ReceiptRow
              label="Vehicle No."
              value={session.vehicleNumber}
              bold
            />
            <ReceiptRow
              label="Vehicle Type"
              value={formatVehicleType(session.vehicleType)}
              icon={
                session.vehicleType === "twoWheeler" ? (
                  <Bike className="w-4 h-4 text-primary" />
                ) : (
                  <Car className="w-4 h-4 text-primary" />
                )
              }
            />
            <ReceiptRow label="Slot" value={slotName} />
            <ReceiptRow
              label="Entry Time"
              value={formatDateTime(session.entryTime)}
            />
            <ReceiptRow
              label="Exit Time"
              value={session.exitTime ? formatDateTime(session.exitTime) : "—"}
            />
            <ReceiptRow label="Duration" value={duration} />
          </div>

          <Separator className="bg-border" />

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-medium">
              Total Amount
            </span>
            <span className="text-xl font-bold text-primary">
              {session.totalCost !== undefined
                ? formatCost(session.totalCost)
                : "Pending"}
            </span>
          </div>

          <Separator className="bg-border" />

          <div className="text-center text-xs text-muted-foreground">
            Thank you for using SmartPark!
          </div>
        </div>

        <div className="flex gap-2 no-print">
          <Button
            variant="outline"
            className="flex-1 border-border text-foreground"
            onClick={onClose}
            data-ocid="receipt.close_button"
          >
            Close
          </Button>
          <Button
            className="flex-1 bg-primary text-white hover:bg-primary/90"
            onClick={() => window.print()}
            data-ocid="receipt.print_button"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReceiptRow({
  label,
  value,
  bold,
  icon,
}: {
  label: string;
  value: string;
  bold?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`flex items-center gap-1 ${
          bold ? "font-bold text-foreground" : "text-foreground/90"
        }`}
      >
        {icon}
        {value}
      </span>
    </div>
  );
}
