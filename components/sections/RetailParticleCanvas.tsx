'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const PINKS = [
  '#FF69B4', '#FF1493', '#FF85C1',
  '#E91E8C', '#FF4DA8', '#FFB0CC',
  '#F06292', '#EC407A', '#FF80AB',
];

export default function RetailParticleCanvas() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /* ── Renderer ──────────────────────────────────────────── */
    const scene    = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0, 0);
    el.appendChild(renderer.domElement);

    let camera: THREE.PerspectiveCamera;
    let W = 0, H = 0;

    const init = (w: number, h: number) => {
      W = w; H = h;
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setSize(W, H);
      const camZ = H / (2 * Math.tan(Math.PI / 6));
      camera = new THREE.PerspectiveCamera(60, W / H, 0.1, camZ * 3);
      camera.position.z = camZ;
    };
    init(el.clientWidth || 600, el.clientHeight || 420);

    /* ── Soft-circle texture ───────────────────────────────── */
    const SZ = 128;
    const cvs = document.createElement('canvas');
    cvs.width = cvs.height = SZ;
    const ctx = cvs.getContext('2d')!;
    const gr  = ctx.createRadialGradient(SZ/2, SZ/2, 0, SZ/2, SZ/2, SZ/2);
    gr.addColorStop(0,    'rgba(220, 60, 140, 1)');
    gr.addColorStop(0.35, 'rgba(220, 60, 140, 0.75)');
    gr.addColorStop(0.7,  'rgba(220, 60, 140, 0.25)');
    gr.addColorStop(1,    'rgba(220, 60, 140, 0)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, SZ, SZ);
    const tex = new THREE.CanvasTexture(cvs);

    /* ── Build particle groups (3 size tiers) ──────────────── */
    type Group = {
      posArr: Float32Array; posAttr: THREE.BufferAttribute;
      driftX: Float32Array; driftY: Float32Array; seeds: Float32Array;
    };

    const TIERS = [
      { n: 140, size: 10 },
      { n: 90,  size: 20 },
      { n: 50,  size: 38 },
    ];

    const groups: Group[] = TIERS.map(({ n, size }) => {
      const posArr  = new Float32Array(n * 3);
      const colArr  = new Float32Array(n * 3);
      const driftX  = new Float32Array(n);
      const driftY  = new Float32Array(n);
      const seeds   = new Float32Array(n);

      for (let i = 0; i < n; i++) {
        posArr[i*3]   = (Math.random() - 0.5) * W * 1.2;
        posArr[i*3+1] = (Math.random() - 0.5) * H * 1.2;
        posArr[i*3+2] = (Math.random() - 0.5) * 20;

        const c = new THREE.Color(PINKS[Math.floor(Math.random() * PINKS.length)]);
        colArr[i*3] = c.r; colArr[i*3+1] = c.g; colArr[i*3+2] = c.b;

        driftX[i] = (Math.random() - 0.5) * 0.05;
        driftY[i] = (Math.random() - 0.5) * 0.05;
        seeds[i]  = Math.random() * Math.PI * 2;
      }

      const geo     = new THREE.BufferGeometry();
      const posAttr = new THREE.BufferAttribute(posArr, 3);
      posAttr.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute('position', posAttr);
      geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));

      const mat = new THREE.PointsMaterial({
        size, map: tex, vertexColors: true,
        transparent: true, opacity: 0.88,
        alphaTest: 0.01, depthWrite: false,
        sizeAttenuation: true,
      });

      scene.add(new THREE.Points(geo, mat));
      return { posArr, posAttr, driftX, driftY, seeds };
    });

    /* ── Animation ─────────────────────────────────────────── */
    const clock = new THREE.Clock();
    let raf: number;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t  = clock.getElapsedTime();
      const hw = W * 0.62, hh = H * 0.62;

      groups.forEach(({ posArr, posAttr, driftX, driftY, seeds }) => {
        for (let i = 0; i < seeds.length; i++) {
          posArr[i*3]   += driftX[i] + Math.sin(t * 0.18 + seeds[i]) * 0.03;
          posArr[i*3+1] += driftY[i] + Math.cos(t * 0.14 + seeds[i] + 1.5) * 0.03;

          if (posArr[i*3]   >  hw) posArr[i*3]   = -hw;
          if (posArr[i*3]   < -hw) posArr[i*3]   =  hw;
          if (posArr[i*3+1] >  hh) posArr[i*3+1] = -hh;
          if (posArr[i*3+1] < -hh) posArr[i*3+1] =  hh;
        }
        posAttr.needsUpdate = true;
      });

      renderer.render(scene, camera);
    };
    tick();

    /* ── ResizeObserver — fixes zero-size on mount ─────────── */
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        if (width < 1 || height < 1) continue;
        W = width; H = height;
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
        renderer.setSize(W, H);
      }
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      renderer.dispose();
      tex.dispose();
    };
  }, []);

  return <div ref={ref} className="absolute inset-0 pointer-events-none" />;
}
