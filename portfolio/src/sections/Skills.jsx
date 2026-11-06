import Reveal from "../components/Reveal.jsx";
import BalanceScale from "../components/BalanceScale.jsx";

export default function Skills() {
  return (
    <section className="section wrap" id="keahlian">
      <div className="sec-head">
        <Reveal>
          <p className="sec-label">01 / keahlian</p>
          <h2 className="sec-title">Dua sisi,<br /><span className="dim">satu neraca.</span></h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="sec-intro">Kode di sisi debit, akuntansi di sisi kredit. Keduanya saling melengkapi, dan selalu seimbang.</p>
        </Reveal>
      </div>
      <Reveal>
        <BalanceScale />
      </Reveal>
    </section>
  );
}
