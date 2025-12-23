import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import axios from "axios";

import * as authApi from "../api/auth";
import { fetchOrders } from "../api/orders";
import AuthModal from "../components/auth/AuthModal";
import type { CheckoutFormValues } from "../components/checkout/CheckoutForm";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useProducts } from "../context/ProductsContext";
import type { OrderDetail, OrderStatus } from "../types/orders";

type TabKey = "personal" | "orders" | "security";

const CHECKOUT_PREFILL_KEY = "md_checkout_prefill";

function AccountPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { me, isAuthenticated, authLoading, refreshMe } = useAuth();
  const { addItem, clear } = useCart();
  const { products } = useProducts();

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

  const [requestingPhoneVerification, setRequestingPhoneVerification] = useState(false);
  const [verifyingPhoneCode, setVerifyingPhoneCode] = useState(false);
  const [phoneVerificationStarted, setPhoneVerificationStarted] = useState(false);
  const [phoneVerificationCode, setPhoneVerificationCode] = useState("");
  const [phoneVerificationError, setPhoneVerificationError] = useState<string | null>(null);
  const [phoneVerificationMessage, setPhoneVerificationMessage] = useState<string | null>(null);

  const [requestingEmailVerification, setRequestingEmailVerification] = useState(false);
  const [verifyingEmailCode, setVerifyingEmailCode] = useState(false);
  const [emailVerificationStarted, setEmailVerificationStarted] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [emailVerificationError, setEmailVerificationError] = useState<string | null>(null);
  const [emailVerificationMessage, setEmailVerificationMessage] = useState<string | null>(null);

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

  const emailVerified = useMemo(
    () => Boolean(me?.profile.email_verified_at),
    [me?.profile.email_verified_at],
  );
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
    if (!emailVerified) return;
    setEmailVerificationStarted(false);
    setEmailVerificationCode("");
    setEmailVerificationMessage(null);
    setEmailVerificationError(null);
  }, [emailVerified]);

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

  const handleRequestEmailVerification = async () => {
    setRequestingEmailVerification(true);
    setEmailVerificationError(null);
    setEmailVerificationMessage(null);
    try {
      const { detail } = await authApi.requestEmailVerification();
      setEmailVerificationStarted(true);
      setEmailVerificationMessage(detail || "Verification email sent.");
    } catch (err) {
      const message =
        (err as any)?.response?.data?.detail ||
        (err as Error).message ||
        "Unable to send verification email.";
      setEmailVerificationError(message);
    } finally {
      setRequestingEmailVerification(false);
    }
  };

  const handleVerifyEmailCode = async () => {
    setVerifyingEmailCode(true);
    setEmailVerificationError(null);
    setEmailVerificationMessage(null);
    try {
      const { detail } = await authApi.verifyEmail(emailVerificationCode.trim());
      setEmailVerificationMessage(detail || "Email verified.");
      setEmailVerificationStarted(false);
      setEmailVerificationCode("");
      await refreshMe();
    } catch (err) {
      const message =
        (err as any)?.response?.data?.detail ||
        (err as Error).message ||
        "Verification failed.";
      setEmailVerificationError(message);
    } finally {
      setVerifyingEmailCode(false);
    }
  };

  const handleRequestPhoneVerification = async () => {
    setRequestingPhoneVerification(true);
    setPhoneVerificationError(null);
    setPhoneVerificationMessage(null);
    try {
      const { detail } = await authApi.requestPhoneVerification(phone || undefined);
      setPhoneVerificationStarted(true);
      setPhoneVerificationMessage(detail || "Verification code sent.");
    } catch (err) {
      const message =
        (err as any)?.response?.data?.detail ||
        (err as Error).message ||
        "Unable to send verification code.";
      setPhoneVerificationError(message);
    } finally {
      setRequestingPhoneVerification(false);
    }
  };

  const handleVerifyPhoneCode = async () => {
    setVerifyingPhoneCode(true);
    setPhoneVerificationError(null);
    setPhoneVerificationMessage(null);
    try {
      const { detail } = await authApi.verifyPhone(phoneVerificationCode.trim());
      setPhoneVerificationMessage(detail || "Phone verified.");
      setPhoneVerificationStarted(false);
      setPhoneVerificationCode("");
      await refreshMe();
    } catch (err) {
      const message =
        (err as any)?.response?.data?.detail ||
        (err as Error).message ||
        "Verification failed.";
      setPhoneVerificationError(message);
    } finally {
      setVerifyingPhoneCode(false);
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
  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const formatDate = (value?: string | null, withTime = true) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      ...(withTime
        ? {
            hour: "numeric",
            minute: "2-digit",
          }
        : {}),
    });
  };

  const toggleOrder = (id: number) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  const handleReorder = (order: OrderDetail) => {
    clear();
    order.items.forEach((item) => {
      const product =
        productMap.get(item.product_id) || {
          id: item.product_id,
          name: item.product_name,
          slug: `product-${item.product_id}`,
          description: "",
          price_cents: item.unit_price_cents,
          image_url: item.image_url ?? undefined,
          main_image_url: item.image_url ?? undefined,
          is_popular: false,
          images: [],
        };
      addItem(product, item.quantity);
    });

    if (typeof window !== "undefined") {
      const prefill: Partial<CheckoutFormValues> = {
        order_type: "delivery",
        full_name: order.full_name || "",
        email: order.email || "",
        phone: order.phone || "",
        region_code: order.region || "",
        address_line1: order.address_line1 || "",
        address_line2: order.address_line2 || "",
        buzz_code: order.buzz_code || "",
        city: order.city || "",
        postal_code: order.postal_code || "",
        notes: order.notes || order.delivery_notes || "",
      };
      try {
        sessionStorage.setItem(CHECKOUT_PREFILL_KEY, JSON.stringify(prefill));
      } catch (error) {
        console.error("Failed to store checkout prefill", error);
      }
    }

    navigate("/checkout");
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
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative w-full">
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        readOnly
                        className={emailVerified ? "pr-24" : undefined}
                      />
                      {emailVerified ? (
                        <div className="absolute inset-y-0 right-3 flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                          <CheckCircle2 className="size-4" />
                          Verified
                        </div>
                      ) : null}
                    </div>
                    {!emailVerified && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRequestEmailVerification}
                        disabled={requestingEmailVerification || !email.trim()}
                      >
                        {requestingEmailVerification ? "Sending..." : "Verify"}
                      </Button>
                    )}
                  </div>
                  {!emailVerified && emailVerificationStarted && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="email-verification-code">Verification code</Label>
                        <Input
                          id="email-verification-code"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          value={emailVerificationCode}
                          onChange={(e) => setEmailVerificationCode(e.target.value)}
                          placeholder="Enter the 6-digit code"
                        />
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          type="button"
                          onClick={handleVerifyEmailCode}
                          disabled={
                            verifyingEmailCode || !/^[0-9]{6}$/.test(emailVerificationCode.trim())
                          }
                        >
                          {verifyingEmailCode ? "Verifying..." : "Verify code"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleRequestEmailVerification}
                          disabled={requestingEmailVerification}
                        >
                          Resend code
                        </Button>
                      </div>
                      {emailVerificationError && (
                        <p className="text-sm text-destructive">{emailVerificationError}</p>
                      )}
                      {emailVerificationMessage && (
                        <p className="text-sm text-emerald-700">{emailVerificationMessage}</p>
                      )}
                    </div>
                  )}
                  {!emailVerified && !emailVerificationStarted && emailVerificationMessage && (
                    <p className="text-sm text-emerald-700">{emailVerificationMessage}</p>
                  )}
                  {!emailVerified && emailVerificationError && !emailVerificationStarted && (
                    <p className="text-sm text-destructive">{emailVerificationError}</p>
                  )}
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
                          onClick={handleRequestPhoneVerification}
                          disabled={requestingPhoneVerification || !phone.trim()}
                        >
                          {requestingPhoneVerification ? "Sending..." : "Verify"}
                        </Button>
                      )}
                    </div>
                    {!phoneVerified && phoneVerificationStarted && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="phone-verification-code">Verification code</Label>
                          <Input
                            id="phone-verification-code"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={phoneVerificationCode}
                            onChange={(e) => setPhoneVerificationCode(e.target.value)}
                            placeholder="123456"
                          />
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Button
                            type="button"
                            onClick={handleVerifyPhoneCode}
                            disabled={verifyingPhoneCode || phoneVerificationCode.trim().length !== 6}
                          >
                            {verifyingPhoneCode ? "Verifying..." : "Verify code"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={handleRequestPhoneVerification}
                            disabled={requestingPhoneVerification}
                          >
                            Resend code
                          </Button>
                        </div>
                        {phoneVerificationError && (
                          <p className="text-sm text-destructive">{phoneVerificationError}</p>
                        )}
                        {phoneVerificationMessage && (
                          <p className="text-sm text-emerald-700">{phoneVerificationMessage}</p>
                        )}
                      </div>
                    )}
                    {!phoneVerified && !phoneVerificationStarted && phoneVerificationMessage && (
                      <p className="text-sm text-emerald-700">{phoneVerificationMessage}</p>
                    )}
                    {!phoneVerified && phoneVerificationError && !phoneVerificationStarted && (
                      <p className="text-sm text-destructive">{phoneVerificationError}</p>
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
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            className="flex flex-1 items-start gap-3 text-left"
                            onClick={() => toggleOrder(order.id)}
                            aria-expanded={expandedOrderId === order.id}
                            aria-controls={`order-details-${order.id}`}
                          >
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Order #{order.id}</span>
                                <Badge variant="secondary">{order.status.replace("_", " ")}</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                                <span>{formatMoney(order.total_cents)}</span>
                                {order.expected_delivery_date ? (
                                  <span>ETA {formatDate(order.expected_delivery_date, false)}</span>
                                ) : order.estimated_delivery_at ? (
                                  <span>ETA {formatDate(order.estimated_delivery_at)}</span>
                                ) : null}
                              </div>
                            </div>
                          </button>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleReorder(order)}
                            >
                              Reorder
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => toggleOrder(order.id)}
                              aria-label={
                                expandedOrderId === order.id ? "Collapse order" : "Expand order"
                              }
                              aria-expanded={expandedOrderId === order.id}
                              aria-controls={`order-details-${order.id}`}
                            >
                              <ChevronRight
                                className={`size-4 text-muted-foreground transition-transform ${
                                  expandedOrderId === order.id ? "rotate-90" : ""
                                }`}
                              />
                            </Button>
                          </div>
                        </div>
                        {expandedOrderId === order.id && (
                          <div
                            id={`order-details-${order.id}`}
                            className="mt-3 space-y-3 border-t pt-3 text-sm"
                          >
                            <div>
                              <div className="font-semibold">Items</div>
                              <ul className="mt-1 space-y-2">
                                {order.items.map((item) => (
                                  <li key={item.id} className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      {item.image_url ? (
                                        <img
                                          src={item.image_url}
                                          alt={item.product_name}
                                          className="h-12 w-12 rounded-md border object-cover"
                                        />
                                      ) : (
                                        <div className="h-12 w-12 rounded-md border border-dashed border-slate-300 bg-white" />
                                      )}
                                      <div>
                                        <div className="font-semibold text-slate-800">{item.product_name}</div>
                                        <div className="text-xs text-slate-500">Qty {item.quantity}</div>
                                      </div>
                                    </div>
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
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            className="flex flex-1 items-start gap-3 text-left"
                            onClick={() => toggleOrder(order.id)}
                            aria-expanded={expandedOrderId === order.id}
                            aria-controls={`order-details-${order.id}`}
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
                          </button>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleReorder(order)}
                            >
                              Reorder
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => toggleOrder(order.id)}
                              aria-label={
                                expandedOrderId === order.id ? "Collapse order" : "Expand order"
                              }
                              aria-expanded={expandedOrderId === order.id}
                              aria-controls={`order-details-${order.id}`}
                            >
                              <ChevronRight
                                className={`size-4 text-muted-foreground transition-transform ${
                                  expandedOrderId === order.id ? "rotate-90" : ""
                                }`}
                              />
                            </Button>
                          </div>
                        </div>
                        {expandedOrderId === order.id && (
                          <div
                            id={`order-details-${order.id}`}
                            className="mt-3 space-y-3 border-t pt-3 text-sm"
                          >
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
