import { useEffect, useState, type FormEvent } from "react";
import { CardElement } from "@stripe/react-stripe-js";

import type { OrderType } from "../../types/orders";

export interface CheckoutFormValues {
  order_type: Extract<OrderType, "delivery">;
  full_name: string;
  email: string;
  phone: string;
  region_code: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  notes: string;
}

interface CheckoutFormProps {
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  submitting?: boolean;
  regions: { code: string; name: string }[];
  onSubmit: (values: CheckoutFormValues) => void | Promise<void>;
}

function CheckoutForm({
  subtotalCents,
  taxCents,
  totalCents,
  submitting = false,
  regions,
  onSubmit,
}: CheckoutFormProps) {
  const [values, setValues] = useState<CheckoutFormValues>({
    order_type: "delivery",
    full_name: "",
    email: "",
    phone: "",
    region_code: "",
    address_line1: "",
    address_line2: "",
    city: "",
    postal_code: "",
    notes: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!values.region_code && regions.length > 0) {
      setValues((prev) => ({ ...prev, region_code: regions[0].code }));
    }
  }, [regions, values.region_code]);

  const handleChange = (key: keyof CheckoutFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!values.region_code) {
      setFormError("Please select your region.");
      return;
    }
    if (!values.address_line1 || !values.city || !values.postal_code) {
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
        <div style={{ fontWeight: 800, marginBottom: 12 }}>Region</div>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontWeight: 600 }}>Select your region</label>
            <select
              required
              value={values.region_code}
              onChange={(event) => handleChange("region_code", event.target.value)}
              style={{ ...fieldStyle, background: "#fff" }}
            >
              <option value="">Choose a region</option>
              {regions.map((region) => (
                <option key={region.code} value={region.code}>
                  {region.name}
                </option>
              ))}
            </select>
            <p style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
              We use this to schedule the correct delivery window for your area.
            </p>
          </div>
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

      <div style={{ background: "#fff", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0" }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Payment</div>
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
          }}
        >
          <CardElement
            options={{
              hidePostalCode: true,
            }}
          />
        </div>
        <p style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
          For testing, use card <strong>4242 4242 4242 4242</strong> with any future expiry and any CVC.
        </p>
      </div>

      {formError && <p style={{ color: "#b91c1c", margin: 0 }}>{formError}</p>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ color: "#475569", fontSize: 14 }}>Due today</div>
          <div style={{ color: "#475569", fontSize: 14 }}>Subtotal: ${(subtotalCents / 100).toFixed(2)}</div>
          <div style={{ color: "#475569", fontSize: 14 }}>GST (5%): ${(taxCents / 100).toFixed(2)}</div>
          <strong style={{ fontSize: 22 }}>Total: ${(totalCents / 100).toFixed(2)}</strong>
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
