import { Link, Outlet } from "react-router-dom";

import { useCart } from "../../context/CartContext";
import CartSidebar from "./CartSidebar";
import Footer from "./Footer";
import Header from "./Header";

function Layout() {
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="layout-shell">
      <Header />
      <div className="layout-content">
        <div className="cart-link-mobile">
          <Link to="/cart">View cart ({itemCount})</Link>
        </div>
        <div className="layout-main">
          <main className="page-main">
            <Outlet />
          </main>
          <CartSidebar />
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Layout;
