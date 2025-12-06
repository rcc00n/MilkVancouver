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
  const isFlushLayout =
    location.pathname.startsWith("/shop") ||
    location.pathname.startsWith("/about") ||
    location.pathname.startsWith("/products");
  const showCartFab = isHome || location.pathname.startsWith("/shop");

  useEffect(() => {
    setIsCartOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  const handleOpenCart = () => setIsCartOpen(true);
  const handleCloseCart = () => setIsCartOpen(false);

  return (
    <div className="layout-shell">
      <Header onCartClick={handleOpenCart} />
      <main
        className={`site-main ${isHome ? "site-main--wide site-main--banded" : ""}`}
        style={{ paddingTop: 0, paddingBottom: 0 }}
      >
        <div
          className={`site-main__inner ${isHome ? "site-main__inner--banded" : ""} ${
            isFlushLayout ? "site-main__inner--flush" : ""
          }`}
          style={{ paddingRight: 0, paddingLeft: 0 }}
        >
          <div className="cart-link-mobile">
            <button type="button" onClick={handleOpenCart} aria-label="Open cart">
              Cart ({itemCount}) · ${(subtotalCents / 100).toFixed(2)}
            </button>
          </div>
          <Outlet />
        </div>
      </main>
      {showCartFab && (
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
      )}
      <CartSidebar open={isCartOpen} onClose={handleCloseCart} />
      <Footer />
    </div>
  );
}

export default Layout;
