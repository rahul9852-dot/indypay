'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'scale';
}

export default function AnimatedDiv({ children, className, delay = 0, direction = 'up' }: Props) {
  const variants = {
    up:    { hidden: { opacity: 0, y: 36 },   visible: { opacity: 1, y: 0 } },
    left:  { hidden: { opacity: 0, x: -36 },  visible: { opacity: 1, x: 0 } },
    right: { hidden: { opacity: 0, x: 36 },   visible: { opacity: 1, x: 0 } },
    scale: { hidden: { opacity: 0, scale: 0.88 }, visible: { opacity: 1, scale: 1 } },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1], delay }}
      variants={variants[direction]}
    >
      {children}
    </motion.div>
  );
}
