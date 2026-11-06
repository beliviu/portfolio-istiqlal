import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { FiArrowDown, FiDownload } from "react-icons/fi";
import DraggableIdCard from "../components/DraggableIdCard.jsx";
import TerminalAnimation from "../components/TerminalAnimation.jsx";

const codeRoles = ["Programmer", "Accountant", "Fullstack Developer"];

export default function Hero() {
  const reduceMotion = useReducedMotion();
  const [roleIndex, setRoleIndex] = useState(0);
  const [visibleRole, setVisibleRole] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const currentRole = codeRoles[roleIndex];

  useEffect(() => {
    if (reduceMotion) {
      setRoleIndex(0);
      setVisibleRole(codeRoles[0]);
      setIsDeleting(false);
      return undefined;
    }

    const isRoleComplete = visibleRole === currentRole;
    const delay = isDeleting ? 45 : isRoleComplete ? 1400 : 105;
    const timeout = window.setTimeout(() => {
      if (isRoleComplete && !isDeleting) {
        setIsDeleting(true);
      } else if (isDeleting && visibleRole.length === 0) {
        setIsDeleting(false);
        setRoleIndex((index) => (index + 1) % codeRoles.length);
      } else {
        setVisibleRole((role) =>
          isDeleting ? role.slice(0, -1) : currentRole.slice(0, role.length + 1),
        );
      }
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [currentRole, isDeleting, reduceMotion, visibleRole]);

  return (
    <section className="hero wrap" id="home">
      <motion.div
        className="hero-copy"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.7, staggerChildren: 0.1 }}
      >
        <motion.div className="status" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="pulse" aria-hidden="true" />Tersedia untuk freelance &amp; part-time
        </motion.div>
        <motion.p className="hello" initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          // halo, saya <b>Muhammad Istiqlal Fajar Sya&apos;bani</b> 👋
        </motion.p>
        <motion.h1 initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          Saya menulis <em>kode</em> yang <span className="hl-box">selalu balance.</span>
        </motion.h1>
        <p className="role-line" aria-label="Peran: Programmer dan Accountant">
          <span className="key">role</span>: <span className="val">&quot;
            <span className="role-rotator" aria-hidden="true">
              {visibleRole}
            </span>
          &quot;</span><span className="caret" aria-hidden="true" />
        </p>
        <p className="hero-desc">
          Programmer dengan latar belakang <strong>akuntansi</strong>. Saya membangun aplikasi web,
          sistem keuangan, dan otomasi laporan yang tidak cuma jalan, tapi juga <strong>benar secara angka</strong>.
        </p>
        <div className="actions flex flex-wrap items-center gap-3">
          <a className="btn btn-primary" href="/CV-Muhammad-Istiqlal.pdf" download="CV-Muhammad-Istiqlal.pdf">Download CV <FiDownload className="arrow" aria-hidden="true" /></a>
          <a className="btn btn-ghost" href="#kontak" data-magnetic>Hubungi saya <FiArrowDown className="arrow" aria-hidden="true" /></a>
        </div>
        <p className="hint">tip: tekan <kbd>Ctrl</kbd> + <kbd>K</kbd> untuk navigasi cepat</p>
      </motion.div>

      <motion.div
        className="hero-visual"
        initial={reduceMotion ? false : { opacity: 0, x: 18, rotate: 1.2 }}
        animate={{ opacity: 1, x: 0, rotate: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 0.2 }}
      >
        <div className="sticker" aria-hidden="true">DEBIT<br />=<br />KREDIT</div>
        <TerminalAnimation />
        <DraggableIdCard />
        <div className="receipt-chip" aria-hidden="true">
          <div className="row"><span>TOTAL DEBIT</span><span>5.000.000</span></div>
          <div className="row"><span>TOTAL KREDIT</span><span>5.000.000</span></div>
          <hr />
          <div className="row"><b>SELISIH</b><b>Rp0 ✓</b></div>
        </div>
      </motion.div>
    </section>
  );
}
