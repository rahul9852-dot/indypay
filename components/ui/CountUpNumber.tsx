'use client';

import { useEffect, useRef } from 'react';
import { CountUp } from 'countup.js';

type Props = {
  end: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
};

export default function CountUpNumber({ end, suffix = '', prefix = '', decimals = 0, duration = 2.5, className }: Props) {
  const elRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!elRef.current) return;
    const counter = new CountUp(elRef.current, end, { suffix, prefix, decimalPlaces: decimals, duration });
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          counter.start();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(elRef.current);
    return () => observer.disconnect();
  }, [end, suffix, prefix, decimals, duration]);

  return <span ref={elRef} className={className}>0</span>;
}
