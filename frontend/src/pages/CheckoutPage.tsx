import { useState } from "react";
import { useNavigate } from "react-router-dom";

import CheckoutForm from "../components/checkout/CheckoutForm";
import { createOrder, type OrderPayload } from "../api/orders";
import { useCart } from "../context/CartContext";

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotalCents, clear } = useCart();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: { name: string; email: string; address: string; notes: string }) => {
    if (!items.length) return;
    setSubmitting(true);

    const order: OrderPayload = {
      items,
      email: values.email,
      name: values.name,
      address: values.address,
      notes: values.notes,
    };

    try {
      const result = await createOrder(order);
      clear();
      navigate("/success", { state: { orderId: result.id } });
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
        <CheckoutForm total={subtotalCents} onSubmit={handleSubmit} />
      )}
      {submitting && <p style={{ color: "#475569" }}>Submitting order...</p>}
    </div>
  );
}

export default CheckoutPage;
