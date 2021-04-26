import * as THREE from 'three';

import Stats from 'three/examples/jsm/libs/stats.module.js';

import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import teeth from './teeth.txt';
import voronoi from './voronoi.txt';

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
    camera.position.y = 2000;
    camera.position.x = 5000;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

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

    teeth.split('\n').forEach((t) => {
        t = t.split(' ');
        vertices1.push(t[0], t[1], t[2]);
    });

    starsGeometry[0].setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices1, 3)
    );

    const starsMaterial = new THREE.PointsMaterial({
        color: 0x555555,
        size: 1,
        sizeAttenuation: false,
    });

    const stars = new THREE.Points(starsGeometry[0], starsMaterial);
    // stars.rotation.x = (3 * Math.PI) / 2;
    // stars.scale.setScalar(128);
    stars.matrixAutoUpdate = false;
    stars.updateMatrix();
    scene.add(stars);
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

    controls = new FlyControls(camera, renderer.domElement);

    controls.movementSpeed = 1000;
    controls.domElement = renderer.domElement;
    controls.rollSpeed = Math.PI / 24;
    controls.autoForward = false;
    controls.dragToLook = false;

    //

    stats = new Stats();
    document.body.appendChild(stats.dom);

    window.addEventListener('resize', onWindowResize);

    // postprocessing

    const renderModel = new RenderPass(scene, camera);
    const effectFilm = new FilmPass(0.35, 0.75, 2048, false);

    composer = new EffectComposer(renderer);

    composer.addPass(renderModel);
    composer.addPass(effectFilm);
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
