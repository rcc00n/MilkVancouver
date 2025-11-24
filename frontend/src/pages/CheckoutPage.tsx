import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import CheckoutForm, { type CheckoutFormValues } from "../components/checkout/CheckoutForm";
import { type OrderPayload } from "../api/orders";
import { createCheckout } from "../api/payments";
import { useCart } from "../context/CartContext";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

function CheckoutPageInner() {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const { items, subtotalCents, clear } = useCart();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const taxCents = Math.round(subtotalCents * 0.05);
  const totalCents = subtotalCents + taxCents;

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
        values.order_type === "delivery"
          ? {
              line1: values.address_line1,
              line2: values.address_line2,
              city: values.city,
              postal_code: values.postal_code,
              notes: values.notes,
            }
          : undefined,
      notes: values.notes,
      pickup_location: values.order_type === "pickup" ? values.pickup_location : undefined,
      pickup_instructions: values.order_type === "pickup" ? values.pickup_instructions : undefined,
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
        />
      )}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {submitting && <p style={{ color: "#475569" }}>Processing payment...</p>}
    </div>
  );
}

function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutPageInner />
    </Elements>
  );
}

export default CheckoutPage;
