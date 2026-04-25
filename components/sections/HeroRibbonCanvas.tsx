'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const U_SEG = 180;
const V_SEG = 20;

type RibbonDef = {
  colors: number[];
  yPos: number; zPos: number; xOff: number;
  rotZ: number; width: number;
  amps: [number, number, number];
  freqs: [number, number, number];
  speed: number; phase: number; opacity: number;
};

const RIBBONS: RibbonDef[] = [
  {
    colors: [0x3B28CC, 0x7B4DB5, 0xC4A8E8],
    yPos: 2.5, zPos: -2, xOff: 5.5,
    rotZ: -0.58, width: 5,
    amps: [1.1, 0.52, 0.28], freqs: [0.6, 1.4, 2.8],
    speed: 0.24, phase: 0, opacity: 0.84,
  },
  {
    colors: [0x7B4DB5, 0xCC4BA0, 0xFF7272],
    yPos: 0.5, zPos: -0.8, xOff: 7.5,
    rotZ: -0.48, width: 4.5,
    amps: [1.3, 0.50, 0.24], freqs: [0.75, 1.6, 3.2],
    speed: 0.31, phase: 1.2, opacity: 0.76,
  },
  {
    colors: [0xFF8C42, 0xEF4799, 0x8B31D4],
    yPos: -1, zPos: 0, xOff: 9,
    rotZ: -0.70, width: 4,
    amps: [1.0, 0.65, 0.32], freqs: [0.85, 1.8, 2.6],
    speed: 0.38, phase: 2.4, opacity: 0.70,
  },
  {
    colors: [0xA855F7, 0x4361EE, 0x7B4DB5],
    yPos: 4, zPos: 0.5, xOff: 4.5,
    rotZ: -0.40, width: 3.5,
    amps: [0.85, 0.42, 0.20], freqs: [0.95, 2.0, 3.6],
    speed: 0.28, phase: 3.5, opacity: 0.60,
  },
];

export default function HeroRibbonCanvas() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const W = el.clientWidth;
    const H = el.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(22, W / H, 0.1, 100);
    camera.position.z = 22;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0, 0);
    el.appendChild(renderer.domElement);

    /* ─── Build a ribbon mesh ──────────────────────────────────── */
    type Ribbon = { pa: THREE.BufferAttribute; d: RibbonDef };

    const buildRibbon = (d: RibbonDef): Ribbon => {
      const cols = d.colors.map(h => new THREE.Color(h));
      const n = (U_SEG + 1) * (V_SEG + 1);
      const posArr = new Float32Array(n * 3);
      const colArr = new Float32Array(n * 3);
      const idx: number[] = [];

      for (let i = 0; i <= U_SEG; i++) {
        const u = i / U_SEG;
        const x = (u - 0.5) * 32;

        // 3-stop gradient colour
        const stops = cols.length - 1;
        const gp = u * stops;
        const ga = Math.min(Math.floor(gp), stops - 1);
        const c = cols[ga].clone().lerp(cols[ga + 1], gp - ga);

        for (let j = 0; j <= V_SEG; j++) {
          const k = (i * (V_SEG + 1) + j) * 3;
          posArr[k]     = x;
          posArr[k + 1] = d.yPos + (j / V_SEG - 0.5) * d.width;
          posArr[k + 2] = d.zPos;
          colArr[k] = c.r; colArr[k + 1] = c.g; colArr[k + 2] = c.b;
        }
      }

      for (let i = 0; i < U_SEG; i++) {
        for (let j = 0; j < V_SEG; j++) {
          const a = i * (V_SEG + 1) + j;
          idx.push(a, a + V_SEG + 1, a + 1, a + 1, a + V_SEG + 1, a + V_SEG + 2);
        }
      }

      const geo = new THREE.BufferGeometry();
      const pa = new THREE.BufferAttribute(posArr, 3);
      pa.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute('position', pa);
      geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
      geo.setIndex(idx);

      const mat = new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: d.opacity,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.z = d.rotZ;
      mesh.position.x = d.xOff;
      scene.add(mesh);

      return { pa, d };
    };

    const ribbons = RIBBONS.map(buildRibbon);

    /* ─── Mouse parallax ───────────────────────────────────────── */
    let mx = 0;
    const onMove = (e: MouseEvent) => { mx = (e.clientX / innerWidth - 0.5) * 2; };
    window.addEventListener('mousemove', onMove);

    /* ─── Animation loop ───────────────────────────────────────── */
    const clock = new THREE.Clock();
    let raf: number;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();

      ribbons.forEach(({ pa, d }) => {
        const arr = pa.array as Float32Array;

        for (let i = 0; i <= U_SEG; i++) {
          const u = i / U_SEG;
          const x = (u - 0.5) * 32;

          // Multi-frequency wave along ribbon length
          const wave =
            d.amps[0] * Math.sin(u * Math.PI * 2 * d.freqs[0] + t * d.speed         + d.phase      ) +
            d.amps[1] * Math.sin(u * Math.PI * 2 * d.freqs[1] + t * d.speed * 0.72  + d.phase + 1.3) +
            d.amps[2] * Math.sin(u * Math.PI * 2 * d.freqs[2] + t * d.speed * 1.45  + d.phase + 2.7);

          // Slow twist that makes the ribbon curl
          const twist = 0.22 * Math.sin(t * d.speed * 0.45 + d.phase + u * Math.PI * 0.5);

          // Subtle Z depth undulation (ribbon curl in depth)
          const zWave = 0.3 * Math.sin(u * Math.PI * 3.5 + t * d.speed * 0.38 + d.phase);

          for (let j = 0; j <= V_SEG; j++) {
            const v = j / V_SEG - 0.5;
            const k = (i * (V_SEG + 1) + j) * 3;
            arr[k]     = x;
            arr[k + 1] = d.yPos + v * d.width + wave + twist * v * 2;
            arr[k + 2] = d.zPos + zWave + v * 0.15 * Math.sin(t * d.speed * 0.6 + d.phase);
          }
        }

        pa.needsUpdate = true;
      });

      // Subtle camera drift on mouse
      camera.position.x += (mx * 0.35 - camera.position.x) * 0.03;
      renderer.render(scene, camera);
    };
    tick();

    /* ─── Resize ───────────────────────────────────────────────── */
    const onResize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      el.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={ref} className="absolute inset-0 pointer-events-none" />;
}
