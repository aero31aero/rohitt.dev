import * as THREE from 'three';

import Stats from 'three/examples/jsm/libs/stats.module.js';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import teeth from './teeth.txt';
import voronoi from './voronoi.txt';
import random_points from './random-points.txt';

const vpoints = voronoi.split('\n').map((v) => {
    v = v.split(' ');
    const a = new THREE.Vector3(v[0], v[1], v[2]);

    const b = new THREE.Vector3(v[3], v[4], v[5]);

    return [a, b];
});

const radius = 6;

const MARGIN = 0;
let SCREEN_HEIGHT = window.innerHeight - MARGIN * 2;
let SCREEN_WIDTH = window.innerWidth;

let camera, controls, scene, renderer, stats;
let dirLight;

let composer;

const textureLoader = new THREE.TextureLoader();

const clock = new THREE.Clock();
init();
animate();

function init() {
    camera = new THREE.PerspectiveCamera(
        25,
        SCREEN_WIDTH / SCREEN_HEIGHT,
        50,
        1e7
    );
    camera.position.z = 10000;
    camera.position.y = 10000;
    camera.position.x = 10000;
    camera.lookAt(new THREE.Vector3(3000, 1000, 1000));

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0000025);

    dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(-1, 0, 1).normalize();
    scene.add(dirLight);

    // stars

    const r = radius,
        starsGeometry = [
            new THREE.BufferGeometry(),
            new THREE.BufferGeometry(),
        ];

    const vertices1 = [];
    const vertices2 = [];

    teeth.split('\n').forEach((t) => {
        t = t.split(' ');
        vertices1.push(t[0], t[1], t[2]);
    });
    random_points.split('\n').forEach((t) => {
        t = t.split(' ');
        vertices2.push(t[0], t[1], t[2]);
    });

    starsGeometry[0].setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices1, 3)
    );
    starsGeometry[1].setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices2, 3)
    );

    const starsMaterials = [
        new THREE.PointsMaterial({
            color: 0x555555,
            size: 1,
            sizeAttenuation: false,
        }),
        new THREE.PointsMaterial({
            color: 0xee,
            size: 5,
            sizeAttenuation: false,
        }),
    ];

    const stars = new THREE.Points(starsGeometry[0], starsMaterials[0]);
    stars.matrixAutoUpdate = false;
    stars.updateMatrix();
    scene.add(stars);

    // stars
    const stars2 = new THREE.Points(starsGeometry[1], starsMaterials[1]);
    stars2.matrixAutoUpdate = false;
    stars2.updateMatrix();
    scene.add(stars2);
    //lines

    const lines = [];
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xdddddd });
    vpoints.forEach((item) => {
        let lineGeometry = new THREE.BufferGeometry().setFromPoints(item);
        let line = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(line);
        lines.push(line);
    });

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI;
    controls.minDistance = 1000;
    controls.maxDistance = 25000;
    controls.autoRotate = true;
    controls.target = new THREE.Vector3(1300, 1000, 2000); // hand tweaked to target the mesh.
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
    };

    stats = new Stats();
    document.body.appendChild(stats.dom);

    window.addEventListener('resize', onWindowResize);

    // postprocessing
    const renderModel = new RenderPass(scene, camera);
    composer = new EffectComposer(renderer);
    composer.addPass(renderModel);
}

function onWindowResize() {
    SCREEN_HEIGHT = window.innerHeight;
    SCREEN_WIDTH = window.innerWidth;

    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();

    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    composer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
}

function animate() {
    requestAnimationFrame(animate);

    render();
    stats.update();
}

function render() {
    // rotate the planet and clouds

    const delta = clock.getDelta();

    controls.update(delta);
    composer.render(delta);
}

/// temporary
