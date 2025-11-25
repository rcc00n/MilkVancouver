import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div>
            <div className="brand__name">MeatDirect</div>
            <p className="muted">Quality local meat delivered to your door.</p>
          </div>
        </div>
        <div>
          <h4 className="footer__heading">Contact</h4>
          <div className="footer__text">
            <a href="tel:555-123-4567">(555) 123-4567</a>
            <br />
            <a href="mailto:hello@meatdirect.com">hello@meatdirect.com</a>
            <br />
            <Link to="/contact">Contact page</Link>
          </div>
        </div>
        <div>
          <h4 className="footer__heading">Hours</h4>
          <div className="footer__text">Open 24/7 online</div>
          <div className="footer__text">Shop anytime</div>
        </div>
        <div>
          <h4 className="footer__heading">Follow</h4>
          <div className="footer__text">Stay connected with us</div>
        </div>
      </div>
      <div className="footer__bottom">
        <div className="container footer__bottom-row">
          <span>Farm-direct sourcing · Hormone-free · Transparent partners</span>
          <span>© {new Date().getFullYear()} MeatDirect</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
