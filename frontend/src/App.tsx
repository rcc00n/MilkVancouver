import { BrowserRouter, Route, Routes } from "react-router-dom";

import Layout from "./components/layout/Layout";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import ProductPage from "./pages/ProductPage";
import SuccessPage from "./pages/SuccessPage";
import AboutPage from "./pages/AboutPage";
import PricingPage from "./pages/PricingPage";
import GalleryPage from "./pages/GalleryPage";
import BlogListPage from "./pages/BlogListPage";
import BlogPostPage from "./pages/BlogPostPage";
import ContactPage from "./pages/ContactPage";
import GoodToKnowPage from "./pages/GoodToKnowPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about-us" element={<AboutPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/shop" element={<MenuPage />} />
          <Route path="/products/:slug" element={<ProductPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/good-to-know" element={<GoodToKnowPage />} />
          <Route path="/meat-education" element={<GoodToKnowPage />} />
          <Route path="/blog" element={<BlogListPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
