import { Link, useLocation } from "react-router-dom";

function SuccessPage() {
  const location = useLocation();
  const orderId = (location.state as { orderId?: string | number } | undefined)?.orderId;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ padding: 18, border: "1px solid #bbf7d0", background: "#ecfdf3", borderRadius: 14 }}>
        <h2 style={{ margin: 0 }}>Order confirmed</h2>
        <p style={{ margin: 0, color: "#166534" }}>
          Thanks for ordering with MeatDirect. We will send tracking details shortly.
        </p>
        {orderId !== undefined && <div style={{ marginTop: 8, color: "#166534" }}>Order ID: {orderId}</div>}
      </div>
      <Link to="/" style={{ color: "#2563eb", fontWeight: 600 }}>
        Back to catalog
      </Link>
    </div>
  );
}

export default SuccessPage;
