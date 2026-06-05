import {
  AdditiveBlending,
  BufferGeometry,
  Camera,
  Color,
  type DataTexture,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Raycaster,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Activity } from "./types";
import { feelToColor, feelToRadius, R_CORONA_OUTER, R_DISK_OUTER, SHADOW_RADIUS } from "./mapping";
import { buildDiskLUT, lensFragmentShader, lensVertexShader } from "./lensing";

type RenderMode = "shader" | "rings";

export interface HoverEvent {
  activity: Activity;
  clientX: number;
  clientY: number;
}

type HoverHandler = (hover: HoverEvent | null) => void;

const BAND_HALF_WIDTH = 0.07; // visible glow band
const PICK_HALF_WIDTH = 0.18; // wider invisible band for easier hover/tap

/**
 * Owns the WebGL render of the black hole. Layer 2 draws each activity as a flat
 * glowing ring at its mapped radius around a dark event-horizon sphere; Layer 3
 * will replace the disk render with a lensing shader without changing this API.
 */
export class BlackHoleScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera: PerspectiveCamera;
  private readonly controls: OrbitControls;
  private readonly bands = new Group(); // visible glow rings
  private readonly picks = new Group(); // invisible wider rings for raycasting
  private readonly bandById = new Map<string, Mesh>();
  private readonly radiusById = new Map<string, number>();
  private highlightedId: string | null = null;
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private readonly resizeObserver: ResizeObserver;

  // Layer 3 — the lensing shader, rendered as a fullscreen pass.
  private readonly fsScene = new Scene();
  private readonly fsCamera = new Camera();
  private readonly lensMaterial: ShaderMaterial;
  private diskLUT: DataTexture | null = null;
  private mode: RenderMode = "shader";
  private readonly startTime = performance.now();
  private readonly camRight = new Vector3();
  private readonly camUp = new Vector3();
  private readonly camForward = new Vector3();

  private hoverHandler: HoverHandler = () => {};
  private lastPointer: { clientX: number; clientY: number } | null = null;
  private rafId = 0;
  private disposed = false;

  constructor(private readonly container: HTMLElement) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000005, 1);
    container.appendChild(this.renderer.domElement);

    this.camera = new PerspectiveCamera(45, 1, 0.1, 200);
    this.camera.position.set(0, 3.4, 16);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 45;
    this.controls.target.set(0, 0, 0);

    // Layer 2 objects double as the graceful fallback if the shader won't compile.
    this.scene.add(this.bands, this.picks);
    this.addShadow();
    this.addStarfield();

    // Layer 3: fullscreen lensing pass.
    this.lensMaterial = new ShaderMaterial({
      vertexShader: lensVertexShader,
      fragmentShader: lensFragmentShader,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uResolution: { value: new Vector2(1, 1) },
        uCamPos: { value: new Vector3() },
        uCamRight: { value: this.camRight },
        uCamUp: { value: this.camUp },
        uCamForward: { value: this.camForward },
        uTanHalfFov: { value: Math.tan(((this.camera.fov * Math.PI) / 180) / 2) },
        uAspect: { value: 1 },
        uTime: { value: 0 },
        uDiskLUT: { value: null },
        uDiskInner: { value: SHADOW_RADIUS },
        uDiskOuter: { value: R_CORONA_OUTER },
        uShadowRadius: { value: SHADOW_RADIUS },
        uInfluence: { value: R_CORONA_OUTER * 1.45 },
        uHighlightRadius: { value: -1 },
        uHighlightOn: { value: 0 },
        uSeam: { value: R_DISK_OUTER },
      },
    });
    this.fsScene.add(new Mesh(new PlaneGeometry(2, 2), this.lensMaterial));
    // If the lensing shader fails to compile on this GPU, fall back to Layer 2.
    this.renderer.debug.onShaderError = () => {
      this.mode = "rings";
    };

    this.resize();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);

    this.renderer.domElement.addEventListener("pointermove", this.onPointerMove);
    this.renderer.domElement.addEventListener("pointerdown", this.onPointerMove);
    this.renderer.domElement.addEventListener("pointerleave", this.onPointerLeave);

    this.loop();
  }

  onHover(handler: HoverHandler): void {
    this.hoverHandler = handler;
  }

  /** Rebuild the rings from the current activity list. */
  setActivities(list: Activity[]): void {
    this.clearGroup(this.bands);
    this.clearGroup(this.picks);
    this.bandById.clear();
    this.radiusById.clear();

    for (const activity of list) {
      const radius = feelToRadius(activity.feel);
      this.radiusById.set(activity.id, radius);
      const color = feelToColor(activity.feel);

      const band = new Mesh(
        new RingGeometry(radius - BAND_HALF_WIDTH, radius + BAND_HALF_WIDTH, 128),
        new MeshBasicMaterial({
          color,
          side: DoubleSide,
          transparent: true,
          opacity: 0.85,
          blending: AdditiveBlending,
          depthWrite: false,
        }),
      );
      band.rotation.x = -Math.PI / 2;
      band.userData.feel = activity.feel;
      this.bands.add(band);
      this.bandById.set(activity.id, band);

      const pick = new Mesh(
        new RingGeometry(radius - PICK_HALF_WIDTH, radius + PICK_HALF_WIDTH, 96),
        new MeshBasicMaterial({ transparent: true, opacity: 0, side: DoubleSide, depthWrite: false }),
      );
      pick.rotation.x = -Math.PI / 2;
      pick.userData.activity = activity;
      this.picks.add(pick);
    }

    // Rebuild the disk lookup table for the lensing shader.
    this.diskLUT?.dispose();
    this.diskLUT = buildDiskLUT(list, SHADOW_RADIUS, R_CORONA_OUTER);
    this.lensMaterial.uniforms.uDiskLUT.value = this.diskLUT;
  }

  /** Emphasize a single activity's band (driven by legend or scene hover). */
  setHighlight(id: string | null): void {
    if (id === this.highlightedId) return;
    this.highlightedId = id;

    // Shader mode: highlight the lensed band by its radius.
    const radius = id ? this.radiusById.get(id) : undefined;
    this.lensMaterial.uniforms.uHighlightOn.value = radius !== undefined ? 1 : 0;
    if (radius !== undefined) this.lensMaterial.uniforms.uHighlightRadius.value = radius;

    // Ring fallback: emphasize via opacity/scale.
    for (const [bandId, band] of this.bandById) {
      const active = bandId === id;
      const material = band.material as MeshBasicMaterial;
      material.opacity = id === null ? 0.85 : active ? 1 : 0.25;
      const scale = active ? 1.04 : 1;
      band.scale.set(scale, scale, scale);
    }
  }

  private addShadow(): void {
    const shadow = new Mesh(
      new SphereGeometry(SHADOW_RADIUS, 64, 64),
      new MeshBasicMaterial({ color: 0x000000 }),
    );
    this.scene.add(shadow);
  }

  private addStarfield(): void {
    const count = 1400;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Random direction on a large sphere shell.
      const r = 60 + Math.random() * 60;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    const stars = new Points(
      geo,
      new PointsMaterial({ color: new Color(0xbfc4ff), size: 0.12, sizeAttenuation: true }),
    );
    this.scene.add(stars);
  }

  private readonly onPointerMove = (e: PointerEvent): void => {
    this.lastPointer = { clientX: e.clientX, clientY: e.clientY };
    this.updateHover();
  };

  private readonly onPointerLeave = (): void => {
    this.lastPointer = null;
    this.hoverHandler(null);
  };

  private updateHover(): void {
    if (!this.lastPointer) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((this.lastPointer.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((this.lastPointer.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.picks.children, false)[0];
    if (hit) {
      const activity = hit.object.userData.activity as Activity;
      this.hoverHandler({ activity, clientX: this.lastPointer.clientX, clientY: this.lastPointer.clientY });
    } else {
      this.hoverHandler(null);
    }
  }

  private resize(): void {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    const pr = this.renderer.getPixelRatio();
    this.lensMaterial.uniforms.uResolution.value.set(w * pr, h * pr);
    this.lensMaterial.uniforms.uAspect.value = w / h;
  }

  private updateLensUniforms(): void {
    const u = this.lensMaterial.uniforms;
    this.camera.updateMatrixWorld();
    const e = this.camera.matrixWorld.elements;
    this.camRight.set(e[0], e[1], e[2]);
    this.camUp.set(e[4], e[5], e[6]);
    this.camForward.set(-e[8], -e[9], -e[10]); // camera looks down -Z
    u.uCamPos.value.copy(this.camera.position);
    u.uTanHalfFov.value = Math.tan(((this.camera.fov * Math.PI) / 180) / 2);
    u.uTime.value = (performance.now() - this.startTime) / 1000;
  }

  private readonly loop = (): void => {
    if (this.disposed) return;
    this.rafId = requestAnimationFrame(this.loop);
    this.controls.update();
    // Keep the tooltip anchored to the right ring as the camera orbits.
    if (this.lastPointer) this.updateHover();

    if (this.mode === "shader") {
      this.updateLensUniforms();
      this.renderer.render(this.fsScene, this.fsCamera);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  };

  private clearGroup(group: Group): void {
    for (const child of [...group.children]) {
      group.remove(child);
      if (child instanceof Mesh) {
        child.geometry.dispose();
        (child.material as MeshBasicMaterial).dispose();
      }
    }
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    this.resizeObserver.disconnect();
    this.renderer.domElement.removeEventListener("pointermove", this.onPointerMove);
    this.renderer.domElement.removeEventListener("pointerdown", this.onPointerMove);
    this.renderer.domElement.removeEventListener("pointerleave", this.onPointerLeave);
    this.clearGroup(this.bands);
    this.clearGroup(this.picks);
    this.diskLUT?.dispose();
    this.lensMaterial.dispose();
    for (const child of this.fsScene.children) {
      if (child instanceof Mesh) child.geometry.dispose();
    }
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
