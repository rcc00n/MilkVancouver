import { BrowserRouter, Route, Routes } from "react-router-dom";

import Layout from "./layout/Layout";
import AboutPage from "./pages/AboutPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ContactPage from "./pages/ContactPage";
import GalleryPage from "./pages/GalleryPage";
import BlogPostPage from "./pages/BlogPostPage";
import BlogListPage from "./pages/BlogListPage";
import GoodToKnowPage from "./pages/GoodToKnowPage";
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import PricingPage from "./pages/PricingPage";
import ProductPage from "./pages/ProductPage";
import SuccessPage from "./pages/SuccessPage";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import Pricing from "./pages/Pricing";
import Shop from "./pages/Shop";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/about-us" element={<About />} />
          <Route path="/blog" element={<BlogListPage />} />
          <Route path="/blog/list" element={<BlogListPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/contact/form" element={<ContactPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/products/:slug" element={<ProductPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/good-to-know" element={<GoodToKnowPage />} />
          <Route path="/milk-education" element={<GoodToKnowPage />} />
          <Route path="/dairy-education" element={<GoodToKnowPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/pricing/legacy" element={<PricingPage />} />
          <Route path="/about/legacy" element={<AboutPage />} />
          <Route path="/home/legacy" element={<HomePage />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
