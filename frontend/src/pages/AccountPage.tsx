import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import axios from "axios";

import * as authApi from "../api/auth";
import { fetchOrders } from "../api/orders";
import AuthModal from "../components/auth/AuthModal";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useAuth } from "../context/AuthContext";
import type { OrderDetail, OrderStatus } from "../types/orders";

type TabKey = "personal" | "orders" | "security";

function AccountPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { me, isAuthenticated, authLoading, refreshMe } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>("personal");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileUpdated, setProfileUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("Canada");

  const [requestingVerification, setRequestingVerification] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verificationStarted, setVerificationStarted] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const phoneVerified = useMemo(
    () => Boolean(me?.profile.phone_verified_at),
    [me?.profile.phone_verified_at],
  );

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab") as TabKey | null;
    if (tabParam) {
      setActiveTab(tabParam);
    } else if (location.hash === "#orders") {
      setActiveTab("orders");
    } else if (location.hash === "#security") {
      setActiveTab("security");
    }
  }, [location.hash, location.search]);

  useEffect(() => {
    if (me) {
      setFirstName(me.profile.first_name || "");
      setLastName(me.profile.last_name || "");
      setEmail(me.user.email || "");
      setPhone(me.profile.phone || "");
      setAddress1(me.profile.address_line1 || "");
      setAddress2(me.profile.address_line2 || "");
      setCity(me.profile.city || "");
      setPostalCode(me.profile.postal_code || "");
    }
  }, [me]);

  useEffect(() => {
    if (isAuthenticated) {
      setAuthModalOpen(false);
    }
  }, [isAuthenticated]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setProfileUpdated(null);
    setError(null);
    try {
      await authApi.updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone,
        address_line1: address1,
        address_line2: address2,
        city,
        postal_code: postalCode,
      });
      await refreshMe();
      setProfileUpdated("Profile updated");
    } catch (err) {
      const message =
        (err as any)?.response?.data?.detail ||
        (err as Error).message ||
        "Could not update profile.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleRequestVerification = async () => {
    setRequestingVerification(true);
    setVerificationError(null);
    setVerificationMessage(null);
    try {
      const { detail } = await authApi.requestPhoneVerification(phone || undefined);
      setVerificationStarted(true);
      setVerificationMessage(detail || "Verification code sent.");
    } catch (err) {
      const message =
        (err as any)?.response?.data?.detail ||
        (err as Error).message ||
        "Unable to send verification code.";
      setVerificationError(message);
    } finally {
      setRequestingVerification(false);
    }
  };

  const handleVerifyCode = async () => {
    setVerifyingCode(true);
    setVerificationError(null);
    setVerificationMessage(null);
    try {
      const { detail } = await authApi.verifyPhone(verificationCode.trim());
      setVerificationMessage(detail || "Phone verified.");
      setVerificationStarted(false);
      setVerificationCode("");
      await refreshMe();
    } catch (err) {
      const message =
        (err as any)?.response?.data?.detail ||
        (err as Error).message ||
        "Verification failed.";
      setVerificationError(message);
    } finally {
      setVerifyingCode(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "orders" || !isAuthenticated || ordersRefreshKey === 0) return;

    const loadOrders = async () => {
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const data = await fetchOrders();
        setOrders(data);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          setOrdersError("Please sign in to view your orders.");
          setAuthModalOpen(true);
        } else {
          const message =
            (err as any)?.response?.data?.detail ||
            (err as Error).message ||
            "Unable to load orders.";
          setOrdersError(message);
        }
      } finally {
        setOrdersLoading(false);
      }
    };

    loadOrders();
  }, [activeTab, isAuthenticated, ordersRefreshKey]);

  useEffect(() => {
    if (!isAuthenticated) {
      setOrders([]);
      setOrdersRefreshKey(0);
    }
  }, [isAuthenticated]);

  const currentStatuses: OrderStatus[] = ["pending", "paid", "in_progress", "ready"];
  const pastStatuses: OrderStatus[] = ["completed", "cancelled"];

  const currentOrders = orders.filter((order) => currentStatuses.includes(order.status));
  const pastOrders = orders.filter((order) => pastStatuses.includes(order.status));

  const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const toggleOrder = (id: number) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      setPasswordError("All fields are required.");
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const { detail } = await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      });
      setPasswordSuccess(detail || "Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
    } catch (err) {
      const message =
        (err as any)?.response?.data?.detail ||
        (err as Error).message ||
        "Unable to update password.";
      setPasswordError(message);
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!isAuthenticated && !authLoading) {
    return (
      <div className="container py-12 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Sign in to view your account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              You need to sign in to manage your profile, orders, and security preferences.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setAuthModalOpen(true)}>Sign in</Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                Back to home
              </Button>
            </div>
          </CardContent>
        </Card>
        <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} initialTab="login" />
      </div>
    );
  }

  if (authLoading || !me) {
    return (
      <div className="container py-12 flex items-center gap-3 text-muted-foreground">
        <Loader2 className="animate-spin" />
        <span>Loading your account...</span>
      </div>
    );
  }

  return (
    <div className="container py-10 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">My account</h1>
        <p className="text-muted-foreground">Manage your profile, orders, and security.</p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as TabKey);
          if (value === "orders") {
            setOrdersRefreshKey((prev) => prev + 1);
          }
        }}
      >
        <TabsList>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {profileUpdated && (
                <Alert>
                  <AlertDescription>{profileUpdated}</AlertDescription>
                </Alert>
              )}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form className="space-y-4" onSubmit={handleSave}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First name</Label>
                    <Input
                      id="first-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last name</Label>
                    <Input
                      id="last-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} readOnly />
                  <p className="text-xs text-muted-foreground">Email changes are managed by support.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="relative w-full">
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          autoComplete="tel"
                          className={phoneVerified ? "pr-24" : undefined}
                        />
                        {phoneVerified ? (
                          <div className="absolute inset-y-0 right-3 flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                            <CheckCircle2 className="size-4" />
                            Verified
                          </div>
                        ) : null}
                      </div>
                      {!phoneVerified && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRequestVerification}
                          disabled={requestingVerification || !phone.trim()}
                        >
                          {requestingVerification ? "Sending..." : "Verify"}
                        </Button>
                      )}
                    </div>
                    {!phoneVerified && verificationStarted && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="verification-code">Verification code</Label>
                          <Input
                            id="verification-code"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            placeholder="123456"
                          />
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Button
                            type="button"
                            onClick={handleVerifyCode}
                            disabled={verifyingCode || verificationCode.trim().length !== 6}
                          >
                            {verifyingCode ? "Verifying..." : "Verify code"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={handleRequestVerification}
                            disabled={requestingVerification}
                          >
                            Resend code
                          </Button>
                        </div>
                        {verificationError && (
                          <p className="text-sm text-destructive">{verificationError}</p>
                        )}
                        {verificationMessage && (
                          <p className="text-sm text-emerald-700">{verificationMessage}</p>
                        )}
                      </div>
                    )}
                    {!phoneVerified && !verificationStarted && verificationMessage && (
                      <p className="text-sm text-emerald-700">{verificationMessage}</p>
                    )}
                    {!phoneVerified && verificationError && !verificationStarted && (
                      <p className="text-sm text-destructive">{verificationError}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="address-line1">Address line 1</Label>
                    <Input
                      id="address-line1"
                      value={address1}
                      onChange={(e) => setAddress1(e.target.value)}
                      autoComplete="address-line1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address-line2">Address line 2</Label>
                    <Input
                      id="address-line2"
                      value={address2}
                      onChange={(e) => setAddress2(e.target.value)}
                      autoComplete="address-line2"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal">Postal code</Label>
                    <Input
                      id="postal"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      autoComplete="postal-code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      autoComplete="country-name"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ordersLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Loading your orders...</span>
                </div>
              )}
              {ordersError && (
                <Alert variant="destructive">
                  <AlertDescription>{ordersError}</AlertDescription>
                </Alert>
              )}

              {!ordersLoading && !ordersError && orders.length === 0 && (
                <p className="text-muted-foreground">You have not placed any orders yet.</p>
              )}

              {currentOrders.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Current orders
                  </h3>
                  <div className="grid gap-3">
                    {currentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-lg border p-4 transition hover:border-primary/60"
                      >
                        <button
                          type="button"
                          className="flex w-full items-start gap-3 text-left"
                          onClick={() => toggleOrder(order.id)}
                        >
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">Order #{order.id}</span>
                              <Badge variant="secondary">{order.status.replace("_", " ")}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                              <span>{formatMoney(order.total_cents)}</span>
                              {order.estimated_delivery_at ? (
                                <span>ETA {formatDate(order.estimated_delivery_at)}</span>
                              ) : null}
                            </div>
                          </div>
                          <ChevronRight
                            className={`size-4 text-muted-foreground transition-transform ${
                              expandedOrderId === order.id ? "rotate-90" : ""
                            }`}
                          />
                        </button>
                        {expandedOrderId === order.id && (
                          <div className="mt-3 space-y-3 border-t pt-3 text-sm">
                            <div>
                              <div className="font-semibold">Items</div>
                              <ul className="mt-1 space-y-1">
                                {order.items.map((item) => (
                                  <li key={item.id} className="flex justify-between">
                                    <span>
                                      {item.product_name} × {item.quantity}
                                    </span>
                                    <span>{formatMoney(item.total_cents)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="grid gap-2 md:grid-cols-2">
                              <div>
                                <div className="font-semibold">Contact</div>
                                <p className="text-muted-foreground">
                                  {order.full_name}
                                  <br />
                                  {order.phone}
                                </p>
                              </div>
                              <div>
                                <div className="font-semibold">Delivery</div>
                                <p className="text-muted-foreground">
                                  {order.address_line1}
                                  {order.address_line2 ? <><br />{order.address_line2}</> : null}
                                  <br />
                                  {[order.city, order.postal_code].filter(Boolean).join(" ")}
                                </p>
                              </div>
                            </div>
                            <div className="text-muted-foreground">
                              <div className="font-semibold text-foreground">Notes</div>
                              <p>{order.notes || order.delivery_notes || "None"}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pastOrders.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Past orders
                  </h3>
                  <div className="grid gap-3">
                    {pastOrders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-lg border p-4 transition hover:border-primary/60"
                      >
                        <button
                          type="button"
                          className="flex w-full items-start gap-3 text-left"
                          onClick={() => toggleOrder(order.id)}
                        >
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">Order #{order.id}</span>
                              <Badge variant={order.status === "cancelled" ? "outline" : "secondary"}>
                                {order.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                              <span>{formatMoney(order.total_cents)}</span>
                              {order.delivered_at ? (
                                <span>Delivered {formatDate(order.delivered_at)}</span>
                              ) : null}
                            </div>
                          </div>
                          <ChevronRight
                            className={`size-4 text-muted-foreground transition-transform ${
                              expandedOrderId === order.id ? "rotate-90" : ""
                            }`}
                          />
                        </button>
                        {expandedOrderId === order.id && (
                          <div className="mt-3 space-y-3 border-t pt-3 text-sm">
                            <div>
                              <div className="font-semibold">Items</div>
                              <ul className="mt-1 space-y-1">
                                {order.items.map((item) => (
                                  <li key={item.id} className="flex justify-between">
                                    <span>
                                      {item.product_name} × {item.quantity}
                                    </span>
                                    <span>{formatMoney(item.total_cents)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="grid gap-2 md:grid-cols-2">
                              <div>
                                <div className="font-semibold">Contact</div>
                                <p className="text-muted-foreground">
                                  {order.full_name}
                                  <br />
                                  {order.phone}
                                </p>
                              </div>
                              <div>
                                <div className="font-semibold">Delivery</div>
                                <p className="text-muted-foreground">
                                  {order.address_line1}
                                  {order.address_line2 ? <><br />{order.address_line2}</> : null}
                                  <br />
                                  {[order.city, order.postal_code].filter(Boolean).join(" ")}
                                </p>
                              </div>
                            </div>
                            <div className="text-muted-foreground">
                              <div className="font-semibold text-foreground">Notes</div>
                              <p>{order.notes || order.delivery_notes || "None"}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Reset password</h3>
                <p className="text-muted-foreground text-sm">
                  Update your password to keep your account secure.
                </p>
              </div>

              {passwordSuccess && (
                <Alert>
                  <AlertDescription>{passwordSuccess}</AlertDescription>
                </Alert>
              )}
              {passwordError && (
                <Alert variant="destructive">
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}

              <form className="space-y-3" onSubmit={handleChangePassword}>
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="submit" disabled={passwordSaving}>
                    {passwordSaving ? "Updating..." : "Update password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AccountPage;
