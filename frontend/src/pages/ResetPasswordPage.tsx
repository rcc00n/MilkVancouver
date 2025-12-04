import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, Lock, Mail } from "lucide-react";
import axios from "axios";

import * as authApi from "../api/auth";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

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

type PasswordCheck = {
  label: string;
  valid: boolean;
};

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = (searchParams.get("token") || "").trim();
  const navigate = useNavigate();

  const [validating, setValidating] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setTokenError("This reset link is missing a token. Request a new one to continue.");
      setValidating(false);
      return;
    }

    const validate = async () => {
      setValidating(true);
      setTokenError(null);
      try {
        const data = await authApi.validatePasswordResetToken(token);
        setAccountEmail(data.email || null);
      } catch (error) {
        setTokenError(getErrorMessage(error));
      } finally {
        setValidating(false);
      }
    };

    void validate();
  }, [token]);

  const passwordChecks: PasswordCheck[] = useMemo(
    () => [
      { label: "At least 8 characters", valid: newPassword.length >= 8 },
      { label: "Includes a letter", valid: /[A-Za-z]/.test(newPassword) },
      { label: "Includes a number", valid: /\d/.test(newPassword) },
    ],
    [newPassword],
  );

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const canSubmit =
    !validating &&
    !tokenError &&
    token.length > 0 &&
    passwordsMatch &&
    passwordChecks.every((check) => check.valid) &&
    !submitting;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!token) {
      setSubmitError("This reset link is invalid or has expired.");
      return;
    }

    if (!passwordsMatch) {
      setSubmitError("Passwords must match.");
      return;
    }

    setSubmitting(true);
    try {
      const { detail } = await authApi.resetPassword({
        token,
        new_password: newPassword,
        new_password_confirm: confirmPassword,
      });
      setSubmitSuccess(detail || "Password updated. Redirecting you home...");
      setTimeout(() => navigate("/", { replace: true }), 900);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="text-center space-y-2">
          <p className="eyebrow">Security</p>
          <h1 className="text-3xl font-bold">Create a new password</h1>
          <p className="text-muted-foreground">
            Choose a strong password to keep your deliveries and account safe.
          </p>
        </div>

        <Card className="shadow-[0_18px_46px_-30px_rgba(15,23,42,0.35)] border-border/80">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="size-5 text-primary" />
              Reset password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {validating ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                <span>Checking your reset link...</span>
              </div>
            ) : null}

            {!validating && tokenError ? (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertDescription>{tokenError}</AlertDescription>
                </Alert>
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link to="/">Go to home</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/">Request a new link</Link>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tip: open “Sign in” and choose “Forgot password?” to get a fresh reset link.
                </p>
              </div>
            ) : null}

            {!validating && !tokenError ? (
              <>
                <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-slate-50 px-3 py-2">
                  <Mail className="size-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">
                      {accountEmail || "Your account email"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Resetting the password for this account.
                    </p>
                  </div>
                </div>

                {submitError ? (
                  <Alert variant="destructive">
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                ) : null}
                {submitSuccess ? (
                  <Alert>
                    <AlertDescription>{submitSuccess}</AlertDescription>
                  </Alert>
                ) : null}

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">New password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm new password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    {confirmPassword && !passwordsMatch ? (
                      <p className="text-sm text-destructive">Passwords must match.</p>
                    ) : null}
                  </div>

                  <div className="grid gap-2 rounded-lg border border-border/60 bg-slate-50 p-3 text-sm">
                    <p className="font-semibold text-foreground">Password tips</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {passwordChecks.map((check) => (
                        <div key={check.label} className="flex items-center gap-2">
                          <CheckCircle2
                            className={`size-4 ${check.valid ? "text-emerald-600" : "text-slate-400"}`}
                          />
                          <span className={check.valid ? "text-foreground" : "text-muted-foreground"}>
                            {check.label}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-slate-400" />
                        <span className="text-muted-foreground">
                          New password should be different from your old one.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" disabled={!canSubmit}>
                      {submitting ? "Updating..." : "Update password"}
                    </Button>
                    <Button type="button" variant="ghost" asChild>
                      <Link to="/">Cancel</Link>
                    </Button>
                  </div>
                </form>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
