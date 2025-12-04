import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

import { requestPasswordReset } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";

type AuthTab = "login" | "signup";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  initialTab?: AuthTab;
};

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    const detail = (data as { detail?: string } | undefined)?.detail;
    if (detail) return detail;

    if (data && typeof data === "object") {
      const firstValue = Object.values(data).find(
        (value) => typeof value === "string" || (Array.isArray(value) && typeof value[0] === "string"),
      );
      if (typeof firstValue === "string") return firstValue;
      if (Array.isArray(firstValue) && typeof firstValue[0] === "string") {
        return firstValue[0] as string;
      }
    }

    return error.message || "Request failed";
  }
  if (error instanceof Error) return error.message;
  return "Unexpected error";
}

export default function AuthModal({ open, onClose, initialTab = "login" }: AuthModalProps) {
  const { login, register, authLoading, authError, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const loginEmailRef = useRef<HTMLInputElement>(null);
  const signupEmailRef = useRef<HTMLInputElement>(null);
  const resetEmailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      setLoginError(null);
      setSignupError(null);
      setLoginPassword("");
      setSignupPassword("");
      setSignupConfirm("");
      setResetMode(false);
      setResetEmail("");
      setResetError(null);
      setResetMessage(null);
      setResetLoading(false);
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (open) {
      const targetRef =
        activeTab === "login" ? (resetMode ? resetEmailRef : loginEmailRef) : signupEmailRef;
      requestAnimationFrame(() => targetRef.current?.focus());
    }
  }, [activeTab, open, resetMode, resetEmailRef]);

  useEffect(() => {
    if (open && isAuthenticated) {
      onClose();
    }
  }, [isAuthenticated, onClose, open]);

  useEffect(() => {
    if (activeTab !== "login") {
      setResetMode(false);
      setResetError(null);
      setResetMessage(null);
      setResetLoading(false);
    }
  }, [activeTab]);

  const combinedError = useMemo(() => {
    if (activeTab === "login") {
      return loginError || authError;
    }
    return signupError || authError;
  }, [activeTab, authError, loginError, signupError]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);

    try {
      await login(loginEmail, loginPassword);
      onClose();
    } catch (error) {
      setLoginError(getErrorMessage(error));
    }
  };

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignupError(null);

    if (signupPassword !== signupConfirm) {
      setSignupError("Passwords do not match.");
      return;
    }

    try {
      await register({
        email: signupEmail,
        password: signupPassword,
        first_name: signupFirstName || undefined,
        last_name: signupLastName || undefined,
      });
      onClose();
    } catch (error) {
      setSignupError(getErrorMessage(error));
    }
  };

  const handleResetRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetError(null);
    setResetMessage(null);

    const emailToSend = resetEmail.trim();
    if (!emailToSend) {
      setResetError("Enter the email associated with your account.");
      return;
    }

    setResetLoading(true);
    try {
      await requestPasswordReset(emailToSend);
      setResetMessage("If your email is registered, we just sent a link to reset your password.");
    } catch (error) {
      setResetError(getErrorMessage(error));
    } finally {
      setResetLoading(false);
    }
  };

  const openResetMode = () => {
    setResetMode(true);
    setResetEmail((loginEmail || "").trim());
    setResetError(null);
    setResetMessage(null);
  };

  const closeResetMode = () => {
    setResetMode(false);
    setResetError(null);
    setResetMessage(null);
    setResetLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-2xl font-semibold text-center">
            {activeTab === "login" ? "Welcome back" : "Create your account"}
          </DialogTitle>
          <DialogDescription className="text-center">
            Sign in to manage your orders or create a new account with your email.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as AuthTab)}
          className="w-full"
        >
          <div className="flex justify-center">
            <TabsList>
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="login">
            <Card>
              <CardContent className="space-y-5 pt-6">
                {resetMode ? (
                  <>
                    {resetError ? (
                      <Alert variant="destructive">
                        <AlertDescription>{resetError}</AlertDescription>
                      </Alert>
                    ) : null}
                    {resetMessage ? (
                      <Alert>
                        <AlertDescription>{resetMessage}</AlertDescription>
                      </Alert>
                    ) : null}
                    <div className="space-y-1 text-center">
                      <h3 className="text-lg font-semibold">Reset your password</h3>
                      <p className="text-sm text-muted-foreground">
                        Enter your email and we’ll send a secure link to set a new password.
                      </p>
                    </div>
                    <form className="space-y-3" onSubmit={handleResetRequest}>
                      <div className="grid gap-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          ref={resetEmailRef}
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                          autoComplete="email"
                        />
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          type="submit"
                          className="flex-1"
                          disabled={resetLoading || !resetEmail.trim()}
                        >
                          {resetLoading ? "Sending..." : "Send reset link"}
                        </Button>
                        <Button type="button" variant="outline" onClick={closeResetMode}>
                          Back to sign in
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        We’ll email you a secure link to choose a new password.
                      </p>
                    </form>
                  </>
                ) : (
                  <>
                    {combinedError ? (
                      <Alert variant="destructive">
                        <AlertDescription>{combinedError}</AlertDescription>
                      </Alert>
                    ) : null}
                    <form className="space-y-3" onSubmit={handleLogin}>
                      <div className="grid gap-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          ref={loginEmailRef}
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                          autoComplete="email"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
                          onClick={openResetMode}
                        >
                          Forgot password?
                        </button>
                      </div>
                      <Button type="submit" className="w-full" disabled={authLoading}>
                        {authLoading ? "Signing in..." : "Sign in"}
                      </Button>
                      <p className="text-center text-sm text-muted-foreground">
                        Don’t have an account?{" "}
                        <button
                          type="button"
                          className="font-semibold text-primary underline-offset-4 hover:underline"
                          onClick={() => setActiveTab("signup")}
                        >
                          Create one
                        </button>
                      </p>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardContent className="space-y-4 pt-6">
                {combinedError ? (
                  <Alert variant="destructive">
                    <AlertDescription>{combinedError}</AlertDescription>
                  </Alert>
                ) : null}
                <form className="space-y-3" onSubmit={handleSignup}>
                  <div className="grid gap-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      ref={signupEmailRef}
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="grid gap-2 md:grid-cols-2 md:gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="signup-first-name">First name</Label>
                      <Input
                        id="signup-first-name"
                        value={signupFirstName}
                        onChange={(e) => setSignupFirstName(e.target.value)}
                        autoComplete="given-name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="signup-last-name">Last name</Label>
                      <Input
                        id="signup-last-name"
                        value={signupLastName}
                        onChange={(e) => setSignupLastName(e.target.value)}
                        autoComplete="family-name"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="signup-confirm">Confirm password</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      value={signupConfirm}
                      onChange={(e) => setSignupConfirm(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={authLoading}>
                    {authLoading ? "Creating account..." : "Create account"}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="font-semibold text-primary underline-offset-4 hover:underline"
                      onClick={() => setActiveTab("login")}
                    >
                      Sign in
                    </button>
                  </p>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
