declare module 'vanta/dist/vanta.waves.min' {
  import type * as THREE from 'three';

  interface VantaOptions {
    el: HTMLElement;
    THREE: typeof THREE;
    color?: number;
    shininess?: number;
    waveHeight?: number;
    waveSpeed?: number;
    zoom?: number;
    [key: string]: unknown;
  }

  interface VantaEffect {
    destroy: () => void;
  }

  function WAVES(options: VantaOptions): VantaEffect;
  export default WAVES;
}
