"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoMark } from "@/components/logo";
import { MockupGlow } from "@/components/mockup-glow";
import { useAppState } from "@/components/providers/app-state-provider";
import { toast } from "sonner";

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
        className="grid w-full max-w-[640px] grid-cols-1 gap-0 rounded-2xl border-border/60 bg-popover p-6 sm:max-w-[640px] sm:grid-cols-[220px_1fr] sm:gap-8 sm:p-8"
      >
        <div className="mb-4 flex items-center gap-2 sm:hidden">
          <LogoMark className="h-6 w-6" />
          <span className="text-sm font-semibold">loku</span>
        </div>

        <div className="hidden items-center justify-center sm:flex">
          <MockupGlow />
        </div>

        <div>
          <div className="mb-4 hidden items-center gap-2 sm:flex">
            <LogoMark className="h-6 w-6" />
            <span className="text-sm font-semibold">loku</span>
          </div>

          {authMode === "signin" ? (
            <form onSubmit={handleLogIn} className="space-y-3">
              <DialogTitle className="text-center text-lg font-semibold">
                Sign In
              </DialogTitle>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 rounded-full"
                onClick={handleGoogle}
              >
                <GoogleIcon />
                Continue with Google
              </Button>

              <p className="text-center text-xs text-muted-foreground">or</p>

              <Input
                type="email"
                required
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                placeholder="Email"
                aria-label="Email"
                className="rounded-lg"
              />

              <Input
                type="password"
                required
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                placeholder="Password"
                aria-label="Password"
                className="rounded-lg"
              />

              <button
                type="button"
                onClick={() => toast("Password reset is coming soon.")}
                className="block w-full text-right text-xs text-primary hover:underline"
              >
                Reset password
              </button>

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
            <form onSubmit={handleCreateAccount} className="space-y-3">
              <DialogTitle className="text-center text-lg font-semibold">
                Create your account
              </DialogTitle>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 rounded-full"
                onClick={handleGoogle}
              >
                <GoogleIcon />
                Continue with Google
              </Button>

              <p className="text-center text-xs text-muted-foreground">or</p>

              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                aria-label="Name"
                className="rounded-lg"
              />

              <Input
                type="email"
                required
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                placeholder="Email"
                aria-label="Email"
                className="rounded-lg"
              />

              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="password"
                  required
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="Password"
                  aria-label="Password"
                  className="rounded-lg"
                />
                <Input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm"
                  aria-label="Confirm password"
                  className="rounded-lg"
                />
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
