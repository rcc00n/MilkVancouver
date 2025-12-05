import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react";

import { submitContactMessage } from "../../api/contact";
import { brand } from "../../config/brand";

type FooterLink = {
  label: string;
  to: string;
};

const shopLinks: FooterLink[] = [
  { label: "Shop", to: "/shop" },
  { label: "Menu", to: "/menu" },
  { label: "Pricing", to: "/pricing" },
  { label: "Gallery", to: "/gallery" },
  { label: "Blog", to: "/blog" },
];

const companyLinks: FooterLink[] = [
  { label: "About Us", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "Good to Know", to: "/good-to-know" },
  { label: "Home", to: "/" },
  { label: "Delivery FAQs", to: "/pricing" },
];

const supportLinks: FooterLink[] = [
  { label: "Account", to: "/account" },
  { label: "My Orders", to: "/account?tab=orders" },
  { label: "Reset Password", to: "/reset-password" },
  { label: "Cart", to: "/cart" },
  { label: "Checkout", to: "/checkout" },
];

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com", icon: Instagram },
  { label: "Facebook", href: "https://www.facebook.com", icon: Facebook },
  { label: "Twitter", href: "https://www.twitter.com", icon: Twitter },
  { label: "Email", href: `mailto:${brand.email}`, icon: Mail },
];

function Footer() {
  const [emailInput, setEmailInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const phoneHref = `tel:${brand.phone.replace(/[^\d+]/g, "")}`;
  const year = new Date().getFullYear();

  const handleSubscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = emailInput.trim();

    if (!email) {
      setFeedback("Enter your email to subscribe.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setFeedback(null);

    try {
      await submitContactMessage({
        name: email,
        email,
        subject: "Newsletter signup",
        message: "Please add me to the Yummee updates list.",
      });
      setStatus("success");
      setFeedback("Thanks! You're on the list.");
      setEmailInput("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setStatus("error");
      setFeedback(message);
    }
  };

  return (
    <footer className="bg-gradient-to-br from-[#1a0a2e] via-[#2d1b4e] to-[#6A0DAD] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <div className="text-3xl bg-gradient-to-r from-[#A57CFF] to-[#FFE74C] bg-clip-text text-transparent font-extrabold">
              {brand.name}
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {brand.tagline} Healthy dairy that feels fun, fresh, and real for active families.
            </p>
            <div className="space-y-2 text-sm text-gray-300">
              <a
                href={`mailto:${brand.email}`}
                className="flex items-center gap-2 hover:text-[#FFE74C] transition-colors"
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                {brand.email}
              </a>
              <a
                href={phoneHref}
                className="flex items-center gap-2 hover:text-[#FFE74C] transition-colors"
              >
                <Phone className="w-4 h-4" aria-hidden="true" />
                {brand.phone}
              </a>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" aria-hidden="true" />
                <span>{brand.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-300" aria-hidden="true" />
                <span>{brand.supportHours}</span>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith("http") ? "_blank" : undefined}
                  rel={social.href.startsWith("http") ? "noreferrer" : undefined}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#A57CFF] flex items-center justify-center transition-colors"
                >
                  <social.icon className="w-5 h-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              {shopLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-[#A57CFF] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold">Company</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              {companyLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-[#A57CFF] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold">Support</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              {supportLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-[#A57CFF] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-12 mb-12">
          <div className="max-w-md mx-auto text-center space-y-4">
            <h4 className="text-xl font-semibold">Stay Fresh with {brand.name}</h4>
            <p className="text-gray-300 text-sm">
              Get exclusive offers, new flavor drops, and healthy living tips.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="email"
                placeholder="Enter your email"
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
                className="flex-1 px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#A57CFF]"
                required
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="px-6 py-3 bg-gradient-to-r from-[#A57CFF] to-[#FFE74C] text-[#1a0a2e] rounded-full font-semibold hover:scale-105 transition-transform disabled:opacity-75"
              >
                {status === "loading" ? "Sending..." : "Subscribe"}
              </button>
            </form>
            {feedback ? (
              <p
                className={`text-sm ${
                  status === "success" ? "text-emerald-200" : "text-red-200"
                }`}
              >
                {feedback}
              </p>
            ) : null}
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-sm text-gray-300">
          <p>
            © {year} {brand.name}. All rights reserved. Made with love for active lifestyles.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
