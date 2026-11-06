import { motion, useReducedMotion } from "motion/react";

const cafeProducts = [
  { name: "Iced caramel latte", category: "Coffee", price: "28k", art: "latte", icon: "☕", badge: "Best seller" },
  { name: "Matcha cloud", category: "Non-coffee", price: "32k", art: "matcha", icon: "🍵", badge: "New" },
  { name: "Butter croissant", category: "Bakery", price: "22k", art: "croissant", icon: "🥐", badge: "" },
  { name: "Berry cheesecake", category: "Dessert", price: "35k", art: "cake", icon: "🍰", badge: "" },
];

export function Preview({ type }) {
  if (type === "dashboard") {
    return (
      <div className="pv-owner">
        <aside className="pv-owner-sidebar">
          <div className="pv-brand-mark">K<span>.</span></div>
          <span className="pv-owner-brand">Kopi Kita<small>OWNER SPACE</small></span>
          <span className="pv-side-link selected">▦ <span>Dashboard</span></span>
          <span className="pv-side-link">▤ <span>Transaksi</span></span>
          <span className="pv-side-link">◷ <span>Laporan</span></span>
          <span className="pv-side-link">▧ <span>Menu cafe</span></span>
          <span className="pv-side-link">⚙ <span>Pengaturan</span></span>
          <div className="pv-sidebar-bottom"><i /> Cafe beroperasi</div>
        </aside>
        <div className="pv-owner-main">
          <div className="pv-owner-top">
            <div><span className="pv-overline">SELASA, 24 JUNI 2025</span><b>Ringkasan cafe <span>☀</span></b></div>
            <span className="pv-owner-avatar">MF</span>
          </div>
          <div className="pv-welcome">Selamat pagi, Fajar <span>👋</span><small>Ini yang terjadi di cafe hari ini.</small></div>
          <div className="pv-owner-kpis">
            <div className="pv-owner-kpi"><span>Penjualan hari ini <i>↗ 12,8%</i></span><b>Rp 4.285.000</b><small>Dibanding hari sebelumnya</small><em className="kpi-icon sales">↗</em></div>
            <div className="pv-owner-kpi"><span>Total pesanan <i>↗ 8,2%</i></span><b>86 <small>pesanan</small></b><small>Hari ini hingga sekarang</small><em className="kpi-icon orders">▤</em></div>
            <div className="pv-owner-kpi"><span>Estimasi laba <i>↗ 6,4%</i></span><b>Rp 1.720.000</b><small>Margin bersih 40,1%</small><em className="kpi-icon profit">⌁</em></div>
          </div>
          <div className="pv-owner-panels">
            <div className="pv-revenue">
              <div className="pv-panel-title"><span><b>Ringkasan penjualan</b><small>Pemasukan dan pengeluaran cafe</small></span><i>7 hari⌄</i></div>
              <div className="pv-chart-legend"><span><i /> Pemasukan</span><span><i /> Pengeluaran</span><b>Rp 28,6jt</b></div>
              <div className="pv-owner-chart">
                <div className="pv-chart-y"><span>8jt</span><span>6jt</span><span>4jt</span><span>2jt</span></div>
                <div className="pv-chart-bars">
                  {[["42%", "22%"], ["68%", "35%"], ["52%", "26%"], ["87%", "46%"], ["62%", "31%"], ["100%", "49%"], ["76%", "39%"]].map(([income, expense], index) => (
                    <div className="pv-chart-pair" key={index}><i style={{ "--h": income }} /><i style={{ "--h": expense }} /></div>
                  ))}
                </div>
              </div>
              <div className="pv-chart-x"><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span></div>
            </div>
            <div className="pv-popular">
              <div className="pv-panel-title"><span><b>Menu terlaris</b><small>Paling banyak dipesan</small></span><i>⋯</i></div>
              {cafeProducts.slice(0, 3).map((product, index) => (
                <div className="pv-popular-item" key={product.name}>
                  <span className={`pv-popular-thumb ${product.art}`}>{product.icon}</span>
                  <span><b>{product.name}</b><small>{[32, 24, 18][index]} terjual</small></span>
                  <strong>{[1, 2, 3][index]}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "reconciliation") {
    return (
      <table className="pv-table">
        <thead><tr><th>Tanggal</th><th>Keterangan</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>02/10</td><td>Transfer masuk</td><td className="ok">✓ cocok</td></tr>
          <tr><td>03/10</td><td>Biaya admin</td><td className="ok">✓ cocok</td></tr>
          <tr><td>05/10</td><td>Pembayaran vendor</td><td className="warn">! cek</td></tr>
          <tr><td>07/10</td><td>Setoran tunai</td><td className="ok">✓ cocok</td></tr>
          <tr><td>09/10</td><td>Bunga bank</td><td className="ok">✓ cocok</td></tr>
        </tbody>
      </table>
    );
  }

  if (type === "pos") {
    return (
      <div className="pv-pos-app">
        <div className="pv-pos-topbar">
          <span className="pv-brand-mark">K<span>.</span></span>
          <span className="pv-pos-cafe">Kopi Kita<small>KASIR · SHIFT PAGI</small></span>
          <span className="pv-pos-open"><i /> ONLINE</span>
          <span className="pv-pos-staff">MF</span>
        </div>
        <div className="pv-pos-content">
          <div className="pv-pos-menu">
            <div className="pv-pos-heading"><span><b>Menu cafe</b><small>Tambah produk ke pesanan</small></span><span className="pv-pos-search">⌕ Cari menu...</span></div>
            <div className="pv-categories"><span className="active">Semua menu</span><span>☕ Coffee</span><span>🍵 Non-coffee</span><span>🥐 Bakery</span><span>🍰 Dessert</span></div>
            <div className="pv-product-grid">
              {cafeProducts.map((product, index) => (
                <div className="pv-product" key={product.name}>
                  <div className={`pv-product-art ${product.art}`}><span>{product.icon}</span>{product.badge && <i>{product.badge}</i>}</div>
                  <div className="pv-product-info"><span><b>{product.name}</b><small>{product.category}</small></span><strong>Rp {product.price}</strong></div>
                  <span className="pv-add-product">＋ Tambah</span>
                  {index === 0 && <span className="pv-product-stock">Stok 18</span>}
                </div>
              ))}
            </div>
          </div>
          <aside className="pv-order-panel">
            <div className="pv-order-title"><span><b>Pesanan baru</b><small>#ORD-0086 · Meja 04</small></span><i>⋯</i></div>
            <span className="pv-order-source">⌁ Dari aplikasi pelanggan</span>
            <div className="pv-order-list">
              <div><span className="pv-order-emoji latte">☕</span><span><b>Iced caramel latte</b><small>Less sugar · Iced</small><em>Rp 28.000</em></span><strong>× 2</strong></div>
              <div><span className="pv-order-emoji croissant">🥐</span><span><b>Butter croissant</b><small>Panaskan</small><em>Rp 22.000</em></span><strong>× 1</strong></div>
              <div><span className="pv-order-emoji cake">🍰</span><span><b>Berry cheesecake</b><small>—</small><em>Rp 35.000</em></span><strong>× 1</strong></div>
            </div>
            <div className="pv-order-summary"><div><span>Subtotal</span><b>Rp 113.000</b></div><div><span>Pajak 10%</span><b>Rp 11.300</b></div><div className="total"><span>Total tagihan</span><b>Rp 124.300</b></div></div>
            <span className="pv-send-order">✓ Terima &amp; proses pesanan</span>
            <span className="pv-order-hint">Pesanan masuk otomatis dari aplikasi pelanggan</span>
          </aside>
        </div>
      </div>
    );
  }

  if (type === "barcode") {
    return (
      <div className="pv-mobile">
        <div className="pv-phone">
          <div className="pv-phone-screen">
            <div className="pv-phone-top"><span>9:41</span><span>● ● ●</span></div>
            <div className="pv-mobile-brand"><span className="pv-mobile-brand-mark">K</span><span>Kopi Kita<small>GOOD COFFEE, GOOD MOOD</small></span><i>⌕</i></div>
            <div className="pv-mobile-greeting"><span>Selamat siang, Fajar 👋</span><b>Meja 08</b><small>Pesan favoritmu, langsung dari meja.</small></div>
            <div className="pv-mobile-promo"><span>COFFEE BREAK, ON US</span><b>Temani harimu<br />dengan yang spesial.</b><i>☕</i><small>Diskon 15% untuk minuman pilihan</small></div>
            <div className="pv-mobile-section"><b>Menu favorit</b><span>Lihat semua →</span></div>
            <div className="pv-mobile-products">
              {cafeProducts.slice(0, 3).map((product) => (
                <div className="pv-mobile-product" key={product.name}>
                  <div className={`pv-mobile-product-art ${product.art}`}>{product.icon}</div>
                  <b>{product.name}</b><small>{product.category}</small><span>Rp {product.price}</span>
                </div>
              ))}
            </div>
            <div className="pv-mobile-section scan-title"><b>Meja kamu</b></div>
            <div className="pv-mobile-table-card">
              <div className="pv-qr" aria-label="Ilustrasi barcode untuk memesan">
                {Array.from({ length: 49 }, (_, index) => (
                  <i className={[0, 1, 2, 6, 8, 12, 13, 14, 34, 36, 40, 41, 42, 46, 48].includes(index) ? "finder" : ""} key={index} />
                ))}
              </div>
              <span><b>Scan &amp; pesan</b><small>Barcode meja 08</small></span>
              <i>⌁</i>
            </div>
            <div className="pv-phone-nav"><span>⌂<small>Beranda</small></span><span>▦<small>Menu</small></span><span>▤<small>Pesanan</small></span><span>◉<small>Akun</small></span></div>
          </div>
        </div>
        <div className="pv-mobile-float"><span>✓</span><b>Pesanan #086<small>Siap dalam 10–15 menit</small></b></div>
      </div>
    );
  }

  if (type === "accounting") {
    return (
      <div className="pv-accounting">
        <div className="pv-accounting-sidebar">
          <div className="pv-ledger-brand"><span>R</span><b>rakit<small>FINANCE, MADE SIMPLE</small></b></div>
          <span className="pv-ledger-nav active">⌂ <small>Ringkasan</small></span>
          <span className="pv-ledger-nav">↔ <small>Transaksi</small></span>
          <span className="pv-ledger-nav">▤ <small>Laporan</small></span>
          <span className="pv-ledger-nav">▧ <small>Kategori</small></span>
          <div className="pv-ledger-profile"><span>MF</span><b>Fajar<small>Usaha Kopi Kita</small></b><i>⌄</i></div>
        </div>
        <div className="pv-accounting-main">
          <div className="pv-accounting-head"><span><small>RINGKASAN KEUANGAN</small><b>Halo, Fajar 👋</b></span><i>24 Jun 2025⌄</i></div>
          <div className="pv-accounting-intro">Yuk cek kondisi keuangan usahamu hari ini.</div>
          <div className="pv-balance">
            <span>Uang yang kamu punya</span><strong>Rp 8.450.000</strong>
            <small><i>↗ 12,5%</i> dibanding bulan lalu</small>
            <div className="pv-balance-decoration">Rp</div>
          </div>
          <div className="pv-accounting-actions">
            <span className="income"><i>↓</i><b>Uang masuk<small>Total pendapatan</small><strong>Rp 12,8 jt</strong></b></span>
            <span className="expense"><i>↑</i><b>Uang keluar<small>Total pengeluaran</small><strong>Rp 4,35 jt</strong></b></span>
          </div>
          <div className="pv-accounting-lower">
            <div className="pv-accounting-chart">
              <div className="pv-ledger-panel-title"><span><b>Arus uang</b><small>Ringkasan pemasukan &amp; pengeluaran</small></span><i>Bulan ini⌄</i></div>
              <div className="pv-accounting-legend"><span><i /> Uang masuk</span><span><i /> Uang keluar</span></div>
              <div className="pv-ledger-chart">
                <div className="pv-ledger-y"><span>4 jt</span><span>3 jt</span><span>2 jt</span><span>1 jt</span></div>
                <div className="pv-ledger-bars">{[["67%", "28%"], ["82%", "42%"], ["54%", "35%"], ["100%", "53%"], ["73%", "39%"]].map(([income, expense], index) => <div key={index}><i style={{ "--h": income }} /><i style={{ "--h": expense }} /></div>)}</div>
              </div>
              <div className="pv-ledger-x"><span>1 Jun</span><span>8 Jun</span><span>15 Jun</span><span>22 Jun</span><span>30 Jun</span></div>
            </div>
            <div className="pv-transactions">
              <div className="pv-ledger-panel-title"><span><b>Transaksi terakhir</b><small>Catatan keuanganmu</small></span><i>Semua →</i></div>
              <div><i className="income">↓</i><span><b>Penjualan kopi</b><small>Hari ini · Pemasukan</small></span><strong className="income">+ Rp 850.000</strong></div>
              <div><i className="expense">↑</i><span><b>Beli bahan baku</b><small>Hari ini · Belanja</small></span><strong className="expense">− Rp 320.000</strong></div>
              <div><i className="income">↓</i><span><b>Penjualan roti</b><small>Kemarin · Pemasukan</small></span><strong className="income">+ Rp 275.000</strong></div>
            </div>
          </div>
          <div className="pv-tip"><span>✦</span><b>Tips keuangan<small>Pisahkan uang usaha dari uang pribadi supaya catatanmu makin rapi.</small></b><i>→</i></div>
        </div>
      </div>
    );
  }

  return (
    <div className="pv-api">
      <span className="method">POST</span> /api/pajak/pph21{"\n\n"}
      {"{\n  "}
      <span className="c-str">"gaji_bruto"</span>: <span className="c-num">12000000</span>,{"\n  "}
      <span className="c-str">"status"</span>: <span className="c-str">"K/1"</span>{"\n}\n\n"}
      <span className="c-mut">→ 200 OK</span>{"\n"}
      {"{ "}
      <span className="c-str">"pph21"</span>: <span className="c-num">270000</span>,{" "}
      <span className="c-str">"tarif"</span>: <span className="c-str">"TER B"</span>
      {" }"}
    </div>
  );
}

export default function ProjectCard({ project, index }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      className={`project ${index === 0 ? "feature" : ""}`}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: reduceMotion ? 0 : 0.55, delay: index * 0.08 }}
      whileHover={reduceMotion ? undefined : { y: -5 }}
    >
      <div className="p-preview" aria-hidden="true"><Preview type={project.preview} /></div>
      <div className="p-body">
        <div className="p-ref">
          <span><b>{project.reference}</b> · {project.category}</span>
          <span className="project-status">{project.status}</span>
        </div>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        {project.impact && (
          <div className="p-impact">
            {project.impact.map((item) => (
              <div key={item.label}><strong>{item.value}</strong>{item.label}</div>
            ))}
          </div>
        )}
        <div className="tags">{project.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
        {project.links?.length > 0 && (
          <div className="p-links" aria-label={`Tautan untuk ${project.title}`}>
            {project.links.map((link) => link.href ? (
            <a key={link.label} className="project-link" href={link.href} target="_blank" rel="noreferrer">
              {link.label} ↗
            </a>
          ) : (
            <span key={link.label} className="project-link unavailable" aria-disabled="true" title="Tautan belum tersedia">
              {link.label} ↗
            </span>
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
}
