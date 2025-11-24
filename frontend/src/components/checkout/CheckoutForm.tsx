import { useState, type FormEvent } from "react";

import type { OrderType } from "../../api/orders";

export interface CheckoutFormValues {
  order_type: OrderType;
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  notes: string;
  pickup_location: string;
  pickup_instructions: string;
}

interface CheckoutFormProps {
  total: number;
  submitting?: boolean;
  onSubmit: (values: CheckoutFormValues) => void;
}

function CheckoutForm({ total, submitting = false, onSubmit }: CheckoutFormProps) {
  const [values, setValues] = useState<CheckoutFormValues>({
    order_type: "pickup",
    full_name: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    postal_code: "",
    notes: "",
    pickup_location: "",
    pickup_instructions: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (key: keyof CheckoutFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (values.order_type === "delivery" && (!values.address_line1 || !values.city || !values.postal_code)) {
      setFormError("Delivery requires address, city, and postal code.");
      return;
    }
    setFormError(null);
    onSubmit(values);
  };

  const fieldStyle = {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    background: "#fff",
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
      <div style={{ background: "#fff", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0" }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Fulfillment</div>
        <div style={{ display: "flex", gap: 10 }}>
          {(["pickup", "delivery"] as OrderType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleChange("order_type", type)}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: values.order_type === type ? "2px solid #16a34a" : "1px solid #e2e8f0",
                background: values.order_type === type ? "#ecfdf3" : "#f8fafc",
                fontWeight: 700,
                color: "#0f172a",
                flex: 1,
              }}
            >
              {type === "pickup" ? "Pickup" : "Delivery"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0" }}>
        <div style={{ fontWeight: 800, marginBottom: 12 }}>Contact</div>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontWeight: 600 }}>Full name</label>
            <input
              required
              type="text"
              value={values.full_name}
              onChange={(event) => handleChange("full_name", event.target.value)}
              style={fieldStyle}
            />
          </div>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            <div>
              <label style={{ display: "block", fontWeight: 600 }}>Email</label>
              <input
                required
                type="email"
                value={values.email}
                onChange={(event) => handleChange("email", event.target.value)}
                style={fieldStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600 }}>Phone</label>
              <input
                required
                type="tel"
                value={values.phone}
                onChange={(event) => handleChange("phone", event.target.value)}
                style={fieldStyle}
              />
            </div>
          </div>
        </div>
      </div>

      {values.order_type === "delivery" ? (
        <div style={{ background: "#fff", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0" }}>
          <div style={{ fontWeight: 800, marginBottom: 12 }}>Delivery address</div>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontWeight: 600 }}>Address line 1</label>
              <input
                required
                type="text"
                value={values.address_line1}
                onChange={(event) => handleChange("address_line1", event.target.value)}
                style={fieldStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600 }}>Address line 2</label>
              <input
                type="text"
                value={values.address_line2}
                onChange={(event) => handleChange("address_line2", event.target.value)}
                style={fieldStyle}
                placeholder="Apartment, suite, etc."
              />
            </div>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <div>
                <label style={{ display: "block", fontWeight: 600 }}>City</label>
                <input
                  required
                  type="text"
                  value={values.city}
                  onChange={(event) => handleChange("city", event.target.value)}
                  style={fieldStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 600 }}>Postal code</label>
                <input
                  required
                  type="text"
                  value={values.postal_code}
                  onChange={(event) => handleChange("postal_code", event.target.value)}
                  style={fieldStyle}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: "#fff", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0" }}>
          <div style={{ fontWeight: 800, marginBottom: 12 }}>Pickup details</div>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontWeight: 600 }}>Pickup location</label>
              <input
                type="text"
                value={values.pickup_location}
                onChange={(event) => handleChange("pickup_location", event.target.value)}
                style={fieldStyle}
                placeholder="Storefront or curbside"
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600 }}>Pickup instructions</label>
              <textarea
                value={values.pickup_instructions}
                onChange={(event) => handleChange("pickup_instructions", event.target.value)}
                rows={3}
                style={{ ...fieldStyle, resize: "vertical" }}
                placeholder="Vehicle description, arrival window..."
              />
            </div>
          </div>
        </div>
      )}

      <div style={{ background: "#fff", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0" }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Notes</div>
        <textarea
          value={values.notes}
          onChange={(event) => handleChange("notes", event.target.value)}
          rows={3}
          placeholder="Delivery window, doneness preference..."
          style={{ ...fieldStyle, resize: "vertical" }}
        />
      </div>

      {formError && <p style={{ color: "#b91c1c", margin: 0 }}>{formError}</p>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ color: "#475569", fontSize: 14 }}>Due today</div>
          <strong style={{ fontSize: 22 }}>${(total / 100).toFixed(2)}</strong>
        </div>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "12px 18px",
            borderRadius: 12,
            border: "none",
            background: submitting ? "#94a3b8" : "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "#fff",
            fontWeight: 700,
            minWidth: 160,
            boxShadow: "0 10px 20px -12px rgba(16, 185, 129, 0.6)",
            opacity: submitting ? 0.9 : 1,
          }}
        >
          {submitting ? "Placing order..." : "Place order"}
        </button>
      </div>
    </form>
  );
}

export default CheckoutForm;
