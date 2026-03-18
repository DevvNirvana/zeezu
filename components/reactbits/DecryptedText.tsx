"use client";

import { useEffect, useRef, useState } from "react";

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  animateOn?: "view" | "mount";
  className?: string;
  revealDirection?: "start" | "end" | "center";
}

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&/\\|";

export default function DecryptedText({
  text,
  speed = 40,
  maxIterations = 8,
  sequential = false,
  animateOn = "mount",
  className = "",
}: DecryptedTextProps) {
  const [display, setDisplay] = useState<string[]>(text.split(""));
  const [started, setStarted] = useState(animateOn === "mount");
  const ref = useRef<HTMLSpanElement>(null);
  const iterRef = useRef<number[]>(text.split("").map(() => 0));
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (animateOn !== "view") return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [animateOn]);

  useEffect(() => {
    if (!started) return;
    const chars = text.split("");
    let revealedCount = 0;

    frameRef.current = setInterval(() => {
      setDisplay(prev =>
        chars.map((char, i) => {
          if (char === " " || char === "/" || char === "." || char === ":" || char === "#") return char;
          if (sequential) {
            if (i < revealedCount) return char;
            if (i === revealedCount) {
              iterRef.current[i]++;
              if (iterRef.current[i] >= maxIterations) { revealedCount++; return char; }
              return CHARS[Math.floor(Math.random() * CHARS.length)];
            }
            return prev[i] === char ? char : CHARS[Math.floor(Math.random() * CHARS.length)];
          } else {
            iterRef.current[i]++;
            if (iterRef.current[i] >= maxIterations) return char;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          }
        })
      );

      const done = sequential
        ? revealedCount >= chars.filter(c => c !== " " && c !== "/" && c !== "." && c !== ":" && c !== "#").length
        : iterRef.current.every((n, i) => n >= maxIterations || chars[i] === " " || chars[i] === "/" || chars[i] === "." || chars[i] === ":" || chars[i] === "#");

      if (done && frameRef.current) {
        clearInterval(frameRef.current);
        setDisplay(chars);
      }
    }, speed);

    return () => { if (frameRef.current) clearInterval(frameRef.current); };
  }, [started, text, speed, maxIterations, sequential]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      {display.join("")}
    </span>
  );
}
