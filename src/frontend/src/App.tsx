import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { UserProfile } from "./backend";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import AdminDashboard from "./pages/AdminDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import LoginPage from "./pages/LoginPage";
import ProfileSetupPage from "./pages/ProfileSetupPage";

type AppState = "loading" | "unauthenticated" | "setup" | "admin" | "customer";

export default function App() {
  const { identity, isInitializing, clear, loginStatus } =
    useInternetIdentity();
  const { actor, isFetching } = useActor();
  const [appState, setAppState] = useState<AppState>("loading");
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Determine app state after identity changes
  useEffect(() => {
    if (isInitializing) {
      setAppState("loading");
      return;
    }

    if (!identity) {
      setAppState("unauthenticated");
      return;
    }

    // Identity exists but actor may still be loading
    if (isFetching || !actor) {
      setAppState("loading");
      return;
    }

    // Check admin status and profile
    const checkAuth = async () => {
      try {
        const [isAdmin, userProfile] = await Promise.all([
          actor.isCallerAdmin(),
          actor.getCallerUserProfile(),
        ]);

        if (isAdmin) {
          setProfile(userProfile);
          setAppState("admin");
        } else if (userProfile) {
          setProfile(userProfile);
          setAppState("customer");
        } else {
          setAppState("setup");
        }
      } catch {
        setAppState("unauthenticated");
      }
    };

    checkAuth();
  }, [identity, isInitializing, actor, isFetching]);

  const handleLogout = () => {
    clear();
    setProfile(null);
    setAppState("unauthenticated");
  };

  const handleProfileComplete = async () => {
    if (!actor) return;
    const userProfile = await actor.getCallerUserProfile();
    setProfile(userProfile);
    setAppState("customer");
  };

  if (appState === "loading" || loginStatus === "logging-in") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <div className="text-foreground font-semibold text-lg">SmartPark</div>
          <div className="text-muted-foreground text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster richColors position="top-right" />
      {appState === "unauthenticated" && (
        <LoginPage
          onProfileNeeded={() => setAppState("setup")}
          onAdminLogin={() => setAppState("admin")}
          onCustomerLogin={() => setAppState("customer")}
        />
      )}
      {appState === "setup" && (
        <ProfileSetupPage
          onComplete={handleProfileComplete}
          onLogout={handleLogout}
        />
      )}
      {appState === "admin" && <AdminDashboard onLogout={handleLogout} />}
      {appState === "customer" && (
        <CustomerDashboard profile={profile} onLogout={handleLogout} />
      )}
    </>
  );
}
