import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Image } from "@/components/ui/image";

// Branding cloned from the client's public site (bigbayevents.co.za)
const LOGO = "https://bigbayevents.co.za/wp-content/uploads/2026/02/Big-Bay-Event-Swims-2026-27-002-640x640.webp";

const SWIMMERS = [
  "https://bigbayevents.co.za/wp-content/uploads/2021/09/Slide5.webp",
  "https://bigbayevents.co.za/wp-content/uploads/2021/09/Slide6.webp",
  "https://bigbayevents.co.za/wp-content/uploads/2021/09/Slide8.webp",
  "https://bigbayevents.co.za/wp-content/uploads/2021/09/Slide7.webp",
  "https://bigbayevents.co.za/wp-content/uploads/2026/07/RIM-SWIM-poster-002-400x400.jpg",
];

const RUN_MS = 10000;
const LAP_S = 11;

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const tick = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / RUN_MS) * 100);
      setProgress(p);
      if (p >= 100) clearInterval(tick);
    }, 80);
    const fade = setTimeout(() => setLeaving(true), RUN_MS - 700);
    const done = setTimeout(() => onComplete?.(), RUN_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden ocean-gradient"
      style={{ "--orbit-d": "min(58vw, 264px)" }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[70vw] max-h-[560px] w-[70vw] max-w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ocean-glow/20 blur-3xl" />

      {/* Orbit stage */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: "min(84vw, 380px)", height: "min(84vw, 380px)" }}
      >
        {/* Rotating dashed ring */}
        <motion.div
          className="absolute rounded-full border border-white/20"
          style={{ width: "var(--orbit-d)", height: "var(--orbit-d)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/10" />
        </motion.div>

        {/* Swimmers circling the logo */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: LAP_S, repeat: Infinity, ease: "linear" }}
        >
          {SWIMMERS.map((src, i) => {
            const angle = (360 / SWIMMERS.length) * i;
            return (
              <div
                key={src}
                className="absolute"
                style={{ transform: `rotate(${angle}deg) translateY(calc(-1 * var(--orbit-d) / 2))` }}
              >
                <motion.div
                  animate={{ rotate: [-angle, -angle - 360] }}
                  transition={{ duration: LAP_S, repeat: Infinity, ease: "linear" }}
                >
                  <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-white/70 bg-white/10 shadow-lg shadow-black/40 ring-1 ring-white/10 sm:h-14 sm:w-14">
                    <Image src={src} className="h-full w-full object-cover" alt="Big Bay swimmer" />
                  </div>
                </motion.div>
              </div>
            );
          })}
        </motion.div>

        {/* Centre logo */}
        <motion.div
          className="relative z-10"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 rounded-full bg-ocean-glow/40 blur-xl" />
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white/85 bg-white shadow-2xl sm:h-32 sm:w-32">
            <Image src={LOGO} className="h-full w-full object-cover" alt="Big Bay Events" />
          </div>
        </motion.div>
      </div>

      {/* Wording */}
      <div className="relative mt-10 px-6 text-center">
        <h1 className="text-2xl font-heading font-bold tracking-tight text-white sm:text-3xl">
          Spinning up <span className="text-ocean-glow">Your app</span>
          <span className="ml-0.5 inline-flex">
            <span className="splash-dot">.</span>
            <span className="splash-dot">.</span>
            <span className="splash-dot">.</span>
          </span>
        </h1>
        <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-white/55 sm:text-sm">
          Big Bay Events · Water Safety OS
        </p>
      </div>

      {/* Progress */}
      <div className="relative mt-8 h-1.5 w-56 overflow-hidden rounded-full bg-white/15 sm:w-64">
        <div
          className="h-full rounded-full bg-ocean-glow transition-[width] duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}