import React, { useEffect, useRef, useState } from "react";

export default function AnimatedNumber({ value = 0, duration = 700, format }) {
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);

  useEffect(() => {
    const from = displayRef.current ?? 0;
    const to = value ?? 0;
    if (from === to) return undefined;

    let raf;
    const start = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = from + (to - from) * eased;
      displayRef.current = current;
      setDisplay(current);
      if (p < 1) {
        raf = requestAnimationFrame(step);
      } else {
        displayRef.current = to;
        setDisplay(to);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const text = format
    ? format(display)
    : Number(display).toLocaleString("en-ZA", { maximumFractionDigits: 1 });

  return <span className="tabular-nums">{text}</span>;
}