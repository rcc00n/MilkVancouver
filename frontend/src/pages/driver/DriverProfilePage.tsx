import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { changePassword, updateProfile } from "../../api/auth";
import NoAccess from "../../components/internal/NoAccess";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useAuth } from "../../context/AuthContext";
import { useSession } from "../../context/SessionContext";

function DriverProfilePage() {
  const { status, user, profile, capabilities, refresh } = useSession();
  const { me, refreshMe } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    const authProfile = me?.profile;

    if (profile || authProfile) {
      setFirstName(profile?.firstName || authProfile?.first_name || "");
      setLastName(profile?.lastName || authProfile?.last_name || "");
      setAddress(authProfile?.address_line1 || "");
      setCity(profile?.city || authProfile?.city || "");
      setPostalCode(profile?.postalCode || authProfile?.postal_code || "");
    }
    if (user || me?.user) {
      setEmail(user?.email || me?.user.email || "");
    }
  }, [profile, user, me]);

  if (status === "loading") {
    return (
      <div className="space-y-3">
        <div className="h-6 w-40 rounded-full bg-slate-200/70" />
        <div className="h-32 w-full rounded-2xl bg-slate-200/60" />
      </div>
    );
  }

  if (!capabilities.isDriver) {
    return <NoAccess role="driver" />;
  }

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileError(null);
    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        email,
        address_line1: address,
        city,
        postal_code: postalCode,
      });
      await refresh();
      await refreshMe();
      toast.success("Profile updated");
    } catch (err) {
      const message =
        (err as any)?.response?.data?.detail ||
        (err as Error).message ||
        "Could not update profile.";
      setProfileError(message);
      toast.error("Unable to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingPassword(true);
    setPasswordError(null);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      });
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
      toast.success("Password updated");
    } catch (err) {
      const message =
        (err as any)?.response?.data?.detail ||
        (err as Error).message ||
        "Could not change password.";
      setPasswordError(message);
      toast.error("Unable to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-slate-900">Personal info</h1>
          <p className="text-sm text-slate-600">
            Update your contact details and password for the driver console.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Driver account
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleSaveProfile}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Street and number"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="postal">Postal code</Label>
                  <Input
                    id="postal"
                    value={postalCode}
                    onChange={(event) => setPostalCode(event.target.value)}
                  />
                </div>
              </div>
              {profileError ? (
                <p className="text-sm font-semibold text-destructive">{profileError}</p>
              ) : null}
              <div className="flex justify-end">
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleChangePassword}>
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={newPasswordConfirm}
                    onChange={(event) => setNewPasswordConfirm(event.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              {passwordError ? (
                <p className="text-sm font-semibold text-destructive">{passwordError}</p>
              ) : null}
              <div className="flex justify-end">
                <Button type="submit" variant="outline" disabled={savingPassword}>
                  {savingPassword ? "Updating…" : "Update password"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DriverProfilePage;
