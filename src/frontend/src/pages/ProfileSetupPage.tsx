import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ParkingSquare } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { VehicleType } from "../backend";
import { useSaveProfile } from "../hooks/useQueries";

interface ProfileSetupPageProps {
  onComplete: () => void;
  onLogout: () => void;
}

export default function ProfileSetupPage({
  onComplete,
  onLogout,
}: ProfileSetupPageProps) {
  const [username, setUsername] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>(
    VehicleType.twoWheeler,
  );
  const saveProfile = useSaveProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !vehicleNumber.trim()) {
      toast.error("Please fill all fields.");
      return;
    }
    try {
      await saveProfile.mutateAsync({ username, vehicleNumber, vehicleType });
      toast.success("Profile saved! Welcome to SmartPark.");
      onComplete();
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <ParkingSquare className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Complete Your Profile
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Set up your vehicle information to get started
          </p>
        </div>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-foreground">
              Vehicle Registration
            </CardTitle>
            <CardDescription>
              This information will appear on your parking receipts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-foreground text-sm font-medium"
                >
                  Username
                </Label>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  data-ocid="profile.input"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="vehicleNumber"
                  className="text-foreground text-sm font-medium"
                >
                  Vehicle Number
                </Label>
                <input
                  id="vehicleNumber"
                  type="text"
                  placeholder="e.g. MH12AB1234"
                  value={vehicleNumber}
                  onChange={(e) =>
                    setVehicleNumber(e.target.value.toUpperCase())
                  }
                  className="w-full h-10 px-3 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  data-ocid="profile.vehicle_input"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground text-sm font-medium">
                  Vehicle Type
                </Label>
                <Select
                  value={vehicleType}
                  onValueChange={(v) => setVehicleType(v as VehicleType)}
                >
                  <SelectTrigger
                    className="bg-white border-border text-foreground"
                    data-ocid="profile.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-border">
                    <SelectItem value={VehicleType.twoWheeler}>
                      🏍 2-Wheeler (Bike/Scooter)
                    </SelectItem>
                    <SelectItem value={VehicleType.fourWheeler}>
                      🚗 4-Wheeler (Car/SUV)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-white hover:bg-primary/90 mt-2"
                disabled={saveProfile.isPending}
                data-ocid="profile.submit_button"
              >
                {saveProfile.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save & Continue"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={onLogout}
                data-ocid="profile.cancel_button"
              >
                Logout
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
