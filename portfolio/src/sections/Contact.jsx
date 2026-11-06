import { useEffect, useMemo, useState } from "react";
import { FiArrowRight, FiCheck, FiCopy, FiMail } from "react-icons/fi";
import { CONTACT_EMAIL } from "../config/site.js";
import Reveal from "../components/Reveal.jsx";

const invoiceOptions = [
  { label: "Aplikasi web", value: "Aplikasi web", subject: "Aplikasi web", price: "Mulai dari Rp2,5 juta" },
  { label: "Sistem keuangan", value: "Sistem keuangan", subject: "Sistem keuangan", price: "Mulai dari Rp4 juta" },
  { label: "Otomasi laporan", value: "Otomasi laporan", subject: "Otomasi laporan", price: "Mulai dari Rp3 juta" },
  { label: "Lainnya", value: "Lainnya", subject: "Kebutuhan khusus", price: "Disesuaikan" },
];

const invoiceTemplate = (itemLabel) => `Halo Fajar,\n\nSaya butuh bantuan untuk proyek ${itemLabel.toLowerCase()} untuk kebutuhan bisnis saya.\n\nBisa kita diskusikan detailnya?\n\nTerima kasih.`;

export default function Contact({ onCopyEmail }) {
  const [selectedItem, setSelectedItem] = useState(invoiceOptions[1].value);
  const [copied, setCopied] = useState(false);
  const [stampState, setStampState] = useState("OPEN");

  const selectedDetail = useMemo(
    () => invoiceOptions.find((option) => option.value === selectedItem) ?? invoiceOptions[0],
    [selectedItem],
  );

  useEffect(() => {
    const nextStamp = selectedItem === "Lainnya" ? "DRAFT" : "OPEN";
    setStampState(nextStamp === "OPEN" ? "OPEN" : "DRAFT");
  }, [selectedItem]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleMailTo = () => {
    const subject = `Proyek: ${selectedDetail.subject} – dari portfolio`;
    const body = `Halo Fajar,\n\nSaya tertarik dengan jasa ${selectedDetail.subject.toLowerCase()} untuk kebutuhan saya.\n\nSaya ingin membahas detail proyek, timeline, dan estimasi biaya.\n\nTerima kasih.`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <section className="section contact wrap" id="kontak">
      <div className="contact-grid">
        <Reveal>
          <p className="sec-label">04 / kontak</p>
          <h2>Punya proyek?<br />Mari kita <em>posting.</em></h2>
          <p className="contact-copy">Butuh aplikasi, sistem keuangan, atau otomasi laporan? Ceritakan sedikit tentang kebutuhanmu, biasanya saya balas dalam 1×24 jam.</p>
          <div className="actions flex flex-wrap items-center gap-3">
            <button className="btn btn-primary" type="button" onClick={handleMailTo} data-magnetic>
              Kirim email <FiArrowRight className="arrow" aria-hidden="true" />
            </button>
            <button
              className="btn btn-ghost copy-email"
              type="button"
              onClick={() => {
                if (onCopyEmail) onCopyEmail();
                setCopied(true);
              }}
              aria-live="polite"
            >
              {copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />} {copied ? "Tersalin ✓" : "Salin email"}
            </button>
          </div>
          <p className="contact-extra-line">Biasanya balas dalam 1×24 jam · WIB (UTC+7)</p>
        </Reveal>
        <Reveal className="invoice" delay={0.12}>
          <div className="inv-head">
            <div><span className="invoice-label">INVOICE</span><strong>#{new Date().getFullYear()}-001</strong></div>
            <span className={`inv-stamp ${stampState === "DRAFT" ? "is-draft" : ""}`}>{stampState}</span>
          </div>
          <div className="inv-row"><span>Dari</span><span>Muhammad Istiqlal Fajar Sya&apos;bani</span></div>
          <div className="inv-row"><span>Kepada</span><span>Kamu 👋</span></div>
          <div className="inv-row inv-select-row">
            <span>Item</span>
            <label className="inv-select-wrapper">
              <select
                value={selectedItem}
                aria-label="Pilih item invoice"
                onChange={(event) => setSelectedItem(event.target.value)}
              >
                {invoiceOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="inv-row"><span>Qty</span><span>1</span></div>
          <div className="inv-row"><span>Harga</span><span className="inv-price" data-price={selectedDetail.price}>{selectedDetail.price}</span></div>
          <div className="inv-total"><span>TOTAL</span><span>{selectedDetail.price}</span></div>
          <div className="barcode" aria-hidden="true" />
        </Reveal>
      </div>
    </section>
  );
}
