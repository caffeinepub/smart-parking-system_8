import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ParkingSquare } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface LoginPageProps {
  onProfileNeeded: () => void;
  onAdminLogin: () => void;
  onCustomerLogin: () => void;
}

export default function LoginPage({
  onProfileNeeded,
  onAdminLogin,
  onCustomerLogin,
}: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [userType, setUserType] = useState<"customer" | "admin">("customer");
  const { login, isLoggingIn } = useInternetIdentity();
  const { actor } = useActor();

  const handleLogin = async () => {
    try {
      await login();
      setTimeout(async () => {
        if (!actor) return;
        const [isAdmin, profile] = await Promise.all([
          actor.isCallerAdmin(),
          actor.getCallerUserProfile(),
        ]);
        if (isAdmin) {
          onAdminLogin();
        } else if (profile) {
          onCustomerLogin();
        } else {
          onProfileNeeded();
        }
      }, 1000);
    } catch {
      toast.error("Login failed. Please try again.");
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
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <ParkingSquare className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            SmartPark
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Intelligent Parking Management System
          </p>
        </div>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-4">
            {/* User type toggle */}
            <div className="flex rounded-lg bg-muted p-1 gap-1">
              <button
                type="button"
                onClick={() => setUserType("customer")}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  userType === "customer"
                    ? "bg-white text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-ocid="login.customer_tab"
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setUserType("admin")}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  userType === "admin"
                    ? "bg-white text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-ocid="login.admin_tab"
              >
                Admin
              </button>
            </div>

            {userType === "customer" && (
              <div className="flex rounded-lg bg-muted p-1 gap-1 mt-2">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                    mode === "login"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-ocid="login.login_tab"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                    mode === "register"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-ocid="login.register_tab"
                >
                  Register
                </button>
              </div>
            )}

            <CardTitle className="text-center text-foreground mt-3 text-lg">
              {userType === "admin"
                ? "Admin Login"
                : mode === "login"
                  ? "Customer Login"
                  : "Create Account"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700">
              {userType === "admin" ? (
                <p>
                  🔒 Admin access via Internet Identity. Ensure your principal
                  has been granted admin privileges.
                </p>
              ) : mode === "login" ? (
                <p>
                  🔑 Sign in securely using Internet Identity. Your account will
                  be identified automatically.
                </p>
              ) : (
                <p>
                  🆕 Create your SmartPark account. After verifying with
                  Internet Identity, you&apos;ll set up your vehicle profile.
                </p>
              )}
            </div>

            <Button
              className="w-full bg-primary text-white hover:bg-primary/90 font-semibold h-11"
              onClick={handleLogin}
              disabled={isLoggingIn}
              data-ocid="login.primary_button"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <span className="mr-2">🔐</span>
                  {userType === "admin"
                    ? "Login as Admin"
                    : mode === "login"
                      ? "Sign In"
                      : "Create Account"}
                </>
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground pt-1">
              Powered by Internet Computer • Secure &amp; Decentralized
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            caffeine.ai
          </a>
        </div>
      </motion.div>
    </div>
  );
}
