import { useLocation, Link } from "react-router-dom";

interface SuccessLocationState {
  orderId?: number;
}

function SuccessPage() {
  const location = useLocation();
  const state = (location.state || {}) as SuccessLocationState;

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", textAlign: "center" }}>
      <h1 style={{ fontSize: 32, marginBottom: 16 }}>Payment success 🎉</h1>

      {state.orderId && (
        <p style={{ fontSize: 16, marginBottom: 8 }}>
          Your order ID: <strong>#{state.orderId}</strong>
        </p>
      )}

      <p style={{ marginBottom: 8, color: "#475569" }}>
        Thank you for your order. We&apos;ll start preparing it right away.
      </p>
      <p style={{ marginBottom: 16, color: "#475569" }}>
        You&apos;ll receive an email with pickup or delivery details shortly.
      </p>

      <p style={{ marginBottom: 24, color: "#0f172a" }}>
        For pickup orders, please bring your confirmation email and a photo ID to the store.
      </p>

      <Link
        to="/"
        style={{
          display: "inline-block",
          padding: "10px 18px",
          borderRadius: 999,
          border: "1px solid #16a34a",
          color: "#16a34a",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Back to store
      </Link>
    </div>
  );
}

export default SuccessPage;
