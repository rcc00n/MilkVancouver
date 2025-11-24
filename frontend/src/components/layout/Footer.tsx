function Footer() {
  return (
    <footer style={{ borderTop: "1px solid #e2e8f0", padding: "20px 0", background: "rgba(255,255,255,0.85)" }}>
      <div style={{ width: "min(1100px, 95vw)", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#475569" }}>
        <span style={{ fontWeight: 600 }}>MeatDirect</span>
        <span style={{ fontSize: 14 }}>From butcher to doorstep. Crafted weekly.</span>
      </div>
    </footer>
  );
}

export default Footer;
