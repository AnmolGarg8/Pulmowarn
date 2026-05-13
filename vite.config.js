import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['three', 'three/addons/postprocessing/EffectComposer.js', 'three/addons/postprocessing/RenderPass.js', 'three/addons/postprocessing/UnrealBloomPass.js', 'gsap', 'gsap/ScrollTrigger'],
    },
  },
});
