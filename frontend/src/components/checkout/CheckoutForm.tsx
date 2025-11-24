import { useState, type FormEvent } from "react";

interface CheckoutFormValues {
  name: string;
  email: string;
  address: string;
  notes: string;
}

interface CheckoutFormProps {
  total: number;
  onSubmit: (values: CheckoutFormValues) => void;
}

function CheckoutForm({ total, onSubmit }: CheckoutFormProps) {
  const [values, setValues] = useState<CheckoutFormValues>({ name: "", email: "", address: "", notes: "" });

  const handleChange = (key: keyof CheckoutFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
      <div>
        <label style={{ display: "block", fontWeight: 600 }}>Name</label>
        <input
          required
          type="text"
          value={values.name}
          onChange={(event) => handleChange("name", event.target.value)}
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e2e8f0" }}
        />
      </div>

      <div>
        <label style={{ display: "block", fontWeight: 600 }}>Email</label>
        <input
          required
          type="email"
          value={values.email}
          onChange={(event) => handleChange("email", event.target.value)}
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e2e8f0" }}
        />
      </div>

      <div>
        <label style={{ display: "block", fontWeight: 600 }}>Shipping address</label>
        <textarea
          required
          value={values.address}
          onChange={(event) => handleChange("address", event.target.value)}
          rows={3}
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e2e8f0", resize: "vertical" }}
        />
      </div>

      <div>
        <label style={{ display: "block", fontWeight: 600 }}>Notes</label>
        <textarea
          value={values.notes}
          onChange={(event) => handleChange("notes", event.target.value)}
          rows={3}
          placeholder="Delivery window, doneness preference..."
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e2e8f0", resize: "vertical" }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "#475569", fontSize: 14 }}>Due today</div>
          <strong style={{ fontSize: 22 }}>${(total / 100).toFixed(2)}</strong>
        </div>
        <button
          type="submit"
          style={{
            padding: "12px 18px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          Place order
        </button>
      </div>
    </form>
  );
}

export default CheckoutForm;
