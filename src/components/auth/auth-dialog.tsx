"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoMark } from "@/components/logo";
import { useAppState } from "@/components/providers/app-state-provider";
import { toast } from "sonner";
import { Sparkles, MousePointer2 } from "lucide-react";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.88-3.02c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.94H1.27v3.11A11.99 11.99 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.29a7.2 7.2 0 0 1 0-4.58V6.6H1.27a12 12 0 0 0 0 10.8l4.01-3.11z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.6l4.01 3.11C6.23 6.86 8.88 4.75 12 4.75z"
      />
    </svg>
  );
}

function IllustrationPanel() {
  return (
    <div className="relative hidden w-[280px] shrink-0 flex-col justify-between overflow-hidden rounded-l-2xl bg-gradient-to-br from-[#3d2b90] via-[#6C5CE7] to-[#8E51FF] p-6 sm:flex">
      <div className="flex items-center gap-2 text-white">
        <LogoMark className="h-7 w-7 bg-white/15" />
        <span className="text-sm font-semibold">loku</span>
      </div>
      <div className="space-y-3">
        <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
          <div className="mb-2 h-2 w-2/3 rounded-full bg-white/40" />
          <div className="mb-3 h-2 w-1/2 rounded-full bg-white/25" />
          <div className="grid grid-cols-3 gap-2">
            <div className="h-10 rounded-md bg-white/20" />
            <div className="h-10 rounded-md bg-white/30" />
            <div className="h-10 rounded-md bg-white/20" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-white/80">
          <MousePointer2 className="h-4 w-4" />
          <Sparkles className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export function AuthDialog() {
  const { authOpen, authMode, closeAuth, setAuthMode, signIn } = useAppState();
  const router = useRouter();

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [name, setName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function handleGoogle() {
    toast("Google sign-in is coming soon.");
  }

  function handleLogIn(e: React.FormEvent) {
    e.preventDefault();
    const displayName = signInEmail.split("@")[0] || "there";
    signIn(displayName);
    router.push("/dashboard");
  }

  function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    if (confirmPassword !== signUpPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    signIn(name || signUpEmail.split("@")[0] || "there");
    router.push("/dashboard");
  }

  return (
    <Dialog open={authOpen} onOpenChange={(open) => !open && closeAuth()}>
      <DialogContent
        showCloseButton
        className="flex max-h-[90vh] w-full max-w-[640px] flex-col gap-0 overflow-y-auto rounded-2xl border-border/60 bg-popover p-0 sm:flex-row"
      >
        <DialogTitle className="sr-only">
          {authMode === "signin" ? "Sign In" : "Create your account"}
        </DialogTitle>
        <IllustrationPanel />

        <div className="flex-1 p-8">
          {authMode === "signin" ? (
            <form onSubmit={handleLogIn} className="space-y-4">
              <h2 className="text-xl font-semibold">Sign In</h2>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 rounded-full"
                onClick={handleGoogle}
              >
                <GoogleIcon />
                Continue with Google
              </Button>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                or
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  required
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="signin-password">Password</Label>
                  <button
                    type="button"
                    onClick={() => toast("Password reset is coming soon.")}
                    className="text-xs text-primary hover:underline"
                  >
                    Reset password
                  </button>
                </div>
                <Input
                  id="signin-password"
                  type="password"
                  required
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] text-white hover:opacity-90"
              >
                Log In
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                No account?{" "}
                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className="font-medium text-primary hover:underline"
                >
                  Create one
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <h2 className="text-xl font-semibold">Create your account</h2>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 rounded-full"
                onClick={handleGoogle}
              >
                <GoogleIcon />
                Continue with Google
              </Button>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                or
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-name">Name</Label>
                <Input
                  id="signup-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  required
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-confirm">Confirm</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] text-white hover:opacity-90"
              >
                Create Account
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setAuthMode("signin")}
                  className="font-medium text-primary hover:underline"
                >
                  Log in
                </button>
              </p>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
