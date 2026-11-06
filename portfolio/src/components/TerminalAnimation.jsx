import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

const lines = [
  "$ node neraca.js",
  "",
  "const jurnal = [",
  '  { akun: "Kas", debit: 5_000_000 },',
  '  { akun: "Pendapatan", kredit: 5_000_000 },',
  "];",
  "",
  'const total = (k) => jurnal.reduce((s, j) => s + (j[k] ?? 0), 0);',
  "",
  'console.log(total("debit") === total("kredit"));',
  "✓ true — seimbang, siap deploy",
];
const fullText = lines.join("\n");

export default function TerminalAnimation() {
  const reduceMotion = useReducedMotion();
  const [visibleText, setVisibleText] = useState(reduceMotion ? fullText : "");

  useEffect(() => {
    if (reduceMotion) {
      setVisibleText(fullText);
      return undefined;
    }

    let index = 0;
    let timeout;
    const typeNext = () => {
      index = Math.min(index + 2, fullText.length);
      setVisibleText(fullText.slice(0, index));
      if (index < fullText.length) timeout = window.setTimeout(typeNext, 17);
    };
    timeout = window.setTimeout(typeNext, 550);

    return () => window.clearTimeout(timeout);
  }, [reduceMotion]);

  return (
    <div className="terminal" role="img" aria-label="Potongan kode JavaScript yang mengecek jurnal debit dan kredit seimbang">
      <div className="term-bar">
        <i /><i /><i /><span>~/neraca.js</span>
      </div>
      <pre className="term-body">{visibleText}<span className="terminal-caret" aria-hidden="true" /></pre>
    </div>
  );
}
