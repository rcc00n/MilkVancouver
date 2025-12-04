import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";

import CheckoutForm, { type CheckoutFormValues } from "../components/checkout/CheckoutForm";
import { type OrderPayload, fetchRegions } from "../api/orders";
import { createCheckout, fetchStripeConfig } from "../api/payments";
import { useCart } from "../context/CartContext";

function CheckoutPageInner() {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const { items, subtotalCents, clear } = useCart();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regions, setRegions] = useState<{ code: string; name: string }[]>([]);
  const [regionsError, setRegionsError] = useState<string | null>(null);
  const taxCents = Math.round(subtotalCents * 0.05);
  const totalCents = subtotalCents + taxCents;

  useEffect(() => {
    let cancelled = false;
    async function loadRegions() {
      try {
        const data = await fetchRegions();
        if (!cancelled) {
          setRegions(data.map((region) => ({ code: region.code, name: region.name })));
          setRegionsError(null);
        }
      } catch (err) {
        console.error("Failed to load regions", err);
        if (!cancelled) {
          setRegionsError("We couldn't load regions. Please refresh and try again.");
        }
      }
    }
    loadRegions();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (values: CheckoutFormValues) => {
    if (!items.length) return;

    if (!stripe || !elements) {
      setError("Payment is not ready yet. Please wait a moment and try again.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const order: OrderPayload = {
      items: items.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
      full_name: values.full_name,
      email: values.email,
      phone: values.phone,
      order_type: values.order_type,
      subtotal_cents: subtotalCents,
      tax_cents: taxCents,
      total_cents: totalCents,
      address:
        {
          line1: values.address_line1,
          line2: values.address_line2,
          city: values.city,
          postal_code: values.postal_code,
          notes: values.notes,
        },
      notes: values.notes,
      region_code: values.region_code,
    };

    try {
      // 1) Create order + PaymentIntent on backend
      const { client_secret, order_id } = await createCheckout(order);

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError("Please enter your card details.");
        setSubmitting(false);
        return;
      }

      // 2) Confirm card payment with Stripe
      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: values.full_name,
            email: values.email,
          },
        },
      });

      if (result.error) {
        setError(result.error.message || "Payment failed. Please try again.");
      } else if (result.paymentIntent?.status === "succeeded") {
        clear();
        navigate("/success", { state: { orderId: order_id } });
      } else {
        setError("Payment did not complete. Please try again.");
      }
    } catch (apiError) {
      console.error("Failed to submit order / payment", apiError);
      setError(
        apiError instanceof Error
          ? apiError.message
          : "Unable to submit order right now. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <h2 style={{ margin: 0 }}>Checkout</h2>
        <p style={{ color: "#475569" }}>Finalize your details and pay securely.</p>
      </div>
      {items.length === 0 ? (
        <p style={{ color: "#475569" }}>Cart is empty. Add items to proceed.</p>
      ) : (
        <CheckoutForm
          subtotalCents={subtotalCents}
          taxCents={taxCents}
          totalCents={totalCents}
          onSubmit={handleSubmit}
          submitting={submitting}
          regions={regions}
        />
      )}
      {regionsError && <p style={{ color: "#b91c1c" }}>{regionsError}</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {submitting && <p style={{ color: "#475569" }}>Processing payment...</p>}
    </div>
  );
}

function CheckoutPage() {
  const insecureHostFallback =
    import.meta.env.VITE_SECURE_CHECKOUT_ORIGIN?.trim() ||
    (typeof window !== "undefined" ? window.location.origin.replace(/^http:/, "https:") : "");
  const envStripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim();
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [loadingStripe, setLoadingStripe] = useState(true);
  const [stripeError, setStripeError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hostname = window.location.hostname;
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1";

    if (window.isSecureContext || isLocal) {
      return;
    }

    try {
      const cartSnapshot = localStorage.getItem("md_cart");
      const target = new URL(
        `${insecureHostFallback}${window.location.pathname}${window.location.search}${window.location.hash}`
      );
      if (cartSnapshot) {
        target.searchParams.set("cart", btoa(cartSnapshot));
      }
      setStripeError("Redirecting you to our secure checkout…");
      window.location.replace(target.toString());
    } catch (error) {
      console.error("Secure checkout redirect failed", error);
      setStripeError("Payments require a secure connection. Please switch to HTTPS and try again.");
    }
  }, [insecureHostFallback]);

  useEffect(() => {
    let cancelled = false;

    async function prepareStripe() {
      setLoadingStripe(true);
      try {
        const publishableKey =
          envStripeKey ||
          (await fetchStripeConfig()).publishable_key?.trim();

        if (!publishableKey) {
          throw new Error("Stripe publishable key is missing on the server.");
        }

        const promise = loadStripe(publishableKey);
        const stripeInstance = await promise;

        if (!stripeInstance) {
          throw new Error("Stripe failed to initialize with the provided key.");
        }

        if (!cancelled) {
          setStripePromise(promise);
          setStripeError(null);
        }
      } catch (error) {
        console.error("Failed to initialize Stripe", error);
        if (!cancelled) {
          setStripeError(
            "Payments are unavailable right now. Please try again soon or contact support."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingStripe(false);
        }
      }
    }

    prepareStripe();

    return () => {
      cancelled = true;
    };
  }, [envStripeKey]);

  if (stripeError) {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>Checkout</h2>
          <p style={{ color: "#475569" }}>Finalize your details and pay securely.</p>
        </div>
        <p style={{ color: "#b91c1c" }}>{stripeError}</p>
      </div>
    );
  }

  if (loadingStripe || !stripePromise) {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>Checkout</h2>
          <p style={{ color: "#475569" }}>Preparing a secure payment form...</p>
        </div>
        <p style={{ color: "#475569" }}>Loading payments...</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutPageInner />
    </Elements>
  );
}

export default CheckoutPage;
