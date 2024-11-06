import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise";
import GUI from "lil-gui";

const texturesURL = [
  "https://ksenia-k.com/img/threejs/matcaps/1.png",
  "https://ksenia-k.com/img/threejs/matcaps/2.png",
  "https://ksenia-k.com/img/threejs/matcaps/3.png",
  "https://ksenia-k.com/img/threejs/matcaps/4.png",
  "https://ksenia-k.com/img/threejs/matcaps/5.png",
  "https://ksenia-k.com/img/threejs/matcaps/6.png",
  "https://ksenia-k.com/img/threejs/matcaps/7.png",
];

export function ThreeScene() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const previewsRef = useRef(null);
  const [activeTexture, setActiveTexture] = useState(null);

  const params = {
    resolution: 12,
    previewPadding: 3,
    amplitude: 1,
  };

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current || !previewsRef.current)
      return;

    let renderer, scene, camera, orbit, geometry, material;
    const perlin = new ImprovedNoise();
    const textureLoader = new THREE.TextureLoader();
    const textures = [];

    const initScene = () => {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        canvas: canvasRef.current,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        45,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        1,
        50
      );
      camera.position.set(0, 1, 10);

      material = new THREE.MeshMatcapMaterial({
        side: THREE.DoubleSide,
      });

      orbit = new OrbitControls(camera, canvasRef.current);
      orbit.enableZoom = false;
      orbit.enablePan = false;
      orbit.enableDamping = true;
      orbit.minPolarAngle = 0.4 * Math.PI;
      orbit.maxPolarAngle = 0.6 * Math.PI;

      geometry = new THREE.PlaneGeometry(
        5,
        4,
        5 * params.resolution,
        4 * params.resolution
      );
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      mesh.rotation.set(-0.5 * Math.PI, 0, 0.15 * Math.PI);

      updateSceneSize();
    };

    const render = (time) => {
      orbit.update();
      renderer.render(scene, camera);

      const positions = geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 2] = perlin.noise(
          0.5 * positions[i] + 0.0005 * time,
          0.5 * positions[i + 1] + 0.0005 * time,
          0
        );
        positions[i + 2] -=
          1.5 *
          perlin.noise(
            0.2 * positions[i] - 0.0002 * time,
            0.2 * positions[i + 1] + 0.0002 * time,
            0
          );
        positions[i + 2] *= params.amplitude;
      }
      geometry.attributes.position.copyArray(positions);
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
      material.needsUpdate = true;

      requestAnimationFrame(render);
    };

    const updateSceneSize = () => {
      if (!containerRef.current || !previewsRef.current) return;
      camera.aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );

      if (textures.length) {
        const w = 0.8 * Math.min(window.innerWidth, window.innerHeight);
        Array.from(previewsRef.current.children).forEach((canvas) => {
          canvas.style.width = w - 4 * params.previewPadding + "px";
        });
      }
    };

    const createControls = () => {
      const gui = new GUI();
      gui.add(params, "amplitude", 0, 1.5).name("noise amplitude");
    };

    initScene();
    createControls();

    texturesURL.forEach((url, idx) => {
      const texture = textureLoader.load(url, (t) => {
        if (idx === 5) {
          setActiveTexture(t);
          material.matcap = t;
        }
      });
      textures.push(texture);
    });

    window.addEventListener("resize", updateSceneSize);
    requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", updateSceneSize);
      renderer.dispose();
    };
  }, []);

  return (
    <>
      <div ref={containerRef} className="fixed top-0 left-0 w-full h-[93%]">
        <canvas ref={canvasRef} />
      </div>
      <div
        ref={previewsRef}
        className="fixed left-0 bottom-[10vh] w-full flex justify-center pointer-events-none"
      ></div>
    </>
  );
}
