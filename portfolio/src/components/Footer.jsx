import { FiArrowUp, FiGithub, FiInstagram, FiLinkedin } from "react-icons/fi";

const socialLinks = [
  { label: "GitHub", href: "https://github.com/beliviu", icon: FiGithub },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/muhammad-istiqlal-fajar-sya-bani-5a3887335", icon: FiLinkedin },
  { label: "Instagram", href: "https://www.instagram.com/islfajaar_/", icon: FiInstagram },
];

export default function Footer() {
  return (
    <footer className="footer wrap">
      <span>© {new Date().getFullYear()} Muhammad Istiqlal Fajar Sya&apos;bani · dibangun dengan React</span>
      <div className="socials">
        {socialLinks.map(({ label, href, icon: Icon }) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </a>
        ))}
        <a href="#top" className="footer-top-link" aria-label="Kembali ke atas">
          <FiArrowUp aria-hidden="true" />
          <span>Kembali ke atas</span>
        </a>
      </div>
    </footer>
  );
}
