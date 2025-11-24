import { useState } from "react";
import { useNavigate } from "react-router-dom";

import CheckoutForm, { type CheckoutFormValues } from "../components/checkout/CheckoutForm";
import { createOrder, type OrderPayload } from "../api/orders";
import { useCart } from "../context/CartContext";

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotalCents, clear } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: CheckoutFormValues) => {
    if (!items.length) return;
    setSubmitting(true);
    setError(null);

    const order: OrderPayload = {
      items: items.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
      full_name: values.full_name,
      email: values.email,
      phone: values.phone,
      order_type: values.order_type,
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
      const result = await createOrder(order);
      clear();
      navigate("/success", { state: { orderId: result.id } });
    } catch (apiError) {
      console.error("Failed to submit order", apiError);
      setError("Unable to submit order right now. Please try again or switch fulfillment type.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <h2 style={{ margin: 0 }}>Checkout</h2>
        <p style={{ color: "#475569" }}>Finalize your delivery info and payment.</p>
      </div>
      {items.length === 0 ? (
        <p style={{ color: "#475569" }}>Cart is empty. Add items to proceed.</p>
      ) : (
        <CheckoutForm total={subtotalCents} onSubmit={handleSubmit} submitting={submitting} />
      )}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {submitting && <p style={{ color: "#475569" }}>Submitting order...</p>}
    </div>
  );
}

export default CheckoutPage;
