'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function NoCodeHeroCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth;
    const H = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    /* ── Lighting ─────────────────────────────────────────── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.PointLight(0x7b4db5, 4, 25);
    key.position.set(3, 4, 6);
    scene.add(key);
    const fill = new THREE.PointLight(0xc4a8e8, 2, 20);
    fill.position.set(-4, -2, 4);
    scene.add(fill);
    const rim = new THREE.PointLight(0xffffff, 1, 15);
    rim.position.set(0, -4, 2);
    scene.add(rim);

    /* ── Payment cards ────────────────────────────────────── */
    const CARD_W = 2.4, CARD_H = 1.5, CARD_D = 0.08;

    type CardDef = {
      pos: [number, number, number];
      rot: [number, number, number];
      color: number;
      speed: number;
    };

    const CARDS: CardDef[] = [
      { pos: [0.4,  0.5,  0],   rot: [ 0.12,  0.25,  0.05], color: 0x7b4db5, speed: 1 },
      { pos: [-2.2, -0.8, -1.2], rot: [-0.1,  -0.3,  -0.08], color: 0x9b6dd5, speed: 0.7 },
      { pos: [2.1,  -1.2,  0.5], rot: [ 0.15,  0.45,  0.1],  color: 0x5c3088, speed: 1.3 },
    ];

    const cardMeshes: THREE.Group[] = [];

    CARDS.forEach((def) => {
      const group = new THREE.Group();
      group.position.set(...def.pos);
      group.rotation.set(...def.rot);

      // Card body
      const bodyGeo = new THREE.BoxGeometry(CARD_W, CARD_H, CARD_D, 2, 2, 1);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: def.color,
        metalness: 0.25,
        roughness: 0.55,
        transparent: true,
        opacity: 0.88,
      });
      group.add(new THREE.Mesh(bodyGeo, bodyMat));

      // Chip
      const chip = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.3, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xe8d5a8, metalness: 0.9, roughness: 0.15 })
      );
      chip.position.set(-0.65, 0.25, CARD_D / 2 + 0.01);
      group.add(chip);

      // Contactless wave rings (thin torus)
      [0.18, 0.26, 0.34].forEach((r, i) => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(r, 0.012, 8, 32, Math.PI),
          new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 - i * 0.08 })
        );
        ring.position.set(0.3, 0.3, CARD_D / 2 + 0.01);
        ring.rotation.z = Math.PI / 2;
        group.add(ring);
      });

      // Brand stripe
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(CARD_W, 0.22, 0.005),
        new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 })
      );
      stripe.position.set(0, -0.28, CARD_D / 2 + 0.002);
      group.add(stripe);

      scene.add(group);
      cardMeshes.push(group);
    });

    /* ── Floating nodes (payment network) ─────────────────── */
    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);

    type NodeData = { mesh: THREE.Mesh; seed: number; radius: number; theta: number; phi: number };
    const nodes: NodeData[] = [];

    for (let i = 0; i < 22; i++) {
      const r = 3.5 + Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const size = 0.04 + Math.random() * 0.06;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(size, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0x7b4db5,
          emissive: 0x7b4db5,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.55 + Math.random() * 0.3,
        })
      );
      mesh.position.setFromSphericalCoords(r, phi, theta);
      nodeGroup.add(mesh);
      nodes.push({ mesh, seed: Math.random() * Math.PI * 2, radius: r, theta, phi });
    }

    /* ── Connection lines ──────────────────────────────────── */
    const lineMat = new THREE.LineBasicMaterial({ color: 0x7b4db5, transparent: true, opacity: 0.18 });
    const linePositions: Float32Array = new Float32Array(nodes.length * nodes.length * 6);
    let lineIdx = 0;
    const lineGeo = new THREE.BufferGeometry();
    const linePosAttr = new THREE.BufferAttribute(linePositions, 3);
    linePosAttr.setUsage(THREE.DynamicDrawUsage);
    lineGeo.setAttribute('position', linePosAttr);
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    nodeGroup.add(lines);

    /* ── Particle field ────────────────────────────────────── */
    const PCount = 200;
    const pPos = new Float32Array(PCount * 3);
    for (let i = 0; i < PCount; i++) {
      pPos[i * 3]     = (Math.random() - 0.5) * 18;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 4;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x7b4db5, size: 0.04, transparent: true, opacity: 0.45 });
    scene.add(new THREE.Points(pGeo, pMat));

    /* ── Mouse ─────────────────────────────────────────────── */
    let mx = 0, my = 0;
    const onMove = (e: MouseEvent) => {
      const r = mount.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      my = -((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove);

    /* ── Animate ───────────────────────────────────────────── */
    const clock = new THREE.Clock();
    let raf: number;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Float cards
      cardMeshes.forEach((g, i) => {
        const def = CARDS[i];
        g.position.y = def.pos[1] + Math.sin(t * 0.5 * def.speed + i * 1.8) * 0.12;
        g.rotation.y  = def.rot[1] + Math.sin(t * 0.25 * def.speed + i) * 0.06 + mx * 0.04;
        g.rotation.x  = def.rot[0] + Math.cos(t * 0.2  * def.speed + i) * 0.04 + my * 0.025;
      });

      // Orbit nodes
      nodes.forEach((n, i) => {
        const angle = n.theta + t * (0.04 + i * 0.003);
        n.mesh.position.setFromSphericalCoords(n.radius, n.phi, angle);
        const s = 1 + 0.2 * Math.sin(t * 1.5 + n.seed);
        n.mesh.scale.setScalar(s);
      });

      // Update connection lines (nearest 3 pairs)
      lineIdx = 0;
      for (let a = 0; a < nodes.length; a++) {
        for (let b = a + 1; b < nodes.length; b++) {
          const d = nodes[a].mesh.position.distanceTo(nodes[b].mesh.position);
          if (d < 2.8) {
            linePositions[lineIdx++] = nodes[a].mesh.position.x;
            linePositions[lineIdx++] = nodes[a].mesh.position.y;
            linePositions[lineIdx++] = nodes[a].mesh.position.z;
            linePositions[lineIdx++] = nodes[b].mesh.position.x;
            linePositions[lineIdx++] = nodes[b].mesh.position.y;
            linePositions[lineIdx++] = nodes[b].mesh.position.z;
          }
        }
      }
      linePosAttr.needsUpdate = true;
      lineGeo.setDrawRange(0, lineIdx / 3);

      // Slow node group rotation
      nodeGroup.rotation.y = t * 0.06 + mx * 0.06;
      nodeGroup.rotation.x = my * 0.04;

      // Camera drift
      camera.position.x += (mx * 0.4 - camera.position.x) * 0.04;
      camera.position.y += (my * 0.3 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    /* ── Resize ────────────────────────────────────────────── */
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
}
