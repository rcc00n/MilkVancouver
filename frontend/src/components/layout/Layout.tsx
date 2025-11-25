import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { useCart } from "../../context/CartContext";
import CartSidebar from "./CartSidebar";
import Footer from "./Footer";
import Header from "./Header";

function Layout() {
  const { items, subtotalCents } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const location = useLocation();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const isHome = location.pathname === "/";

  useEffect(() => {
    setIsCartOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  const handleOpenCart = () => setIsCartOpen(true);
  const handleCloseCart = () => setIsCartOpen(false);

  return (
    <div className="layout-shell">
      <Header onCartClick={handleOpenCart} />
      <div className={`layout-content ${isHome ? "layout-content--home" : ""}`}>
        <div className="cart-link-mobile">
          <button type="button" onClick={handleOpenCart}>
            Open cart ({itemCount})
          </button>
        </div>
        <div className="layout-main">
          <main className="page-main">
            <Outlet />
          </main>
        </div>
      </div>
      <button
        type="button"
        className="cart-fab"
        onClick={handleOpenCart}
        aria-expanded={isCartOpen}
      >
        <div className="cart-fab__label">Cart</div>
        <div className="cart-fab__meta">
          {itemCount} item{itemCount === 1 ? "" : "s"} · ${(subtotalCents / 100).toFixed(2)}
        </div>
      </button>
      <CartSidebar open={isCartOpen} onClose={handleCloseCart} />
      <Footer />
    </div>
  );
}

export default Layout;
