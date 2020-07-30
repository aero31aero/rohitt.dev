import $ from 'jquery';
import * as THREE from 'three';
window.THREE = THREE; // Needed for importing orbit controls
require('three/examples/js/controls/OrbitControls.js');
import load_rabbit from './rabbit';
import load_trees from './trees';
import load_sky from './sky';
import helpers from './helpers';
import Stats from 'stats.js';

var stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);
const brick_material = new THREE.MeshPhongMaterial({ color: 0xee7744 });

const width = 0.1;
const height = 0.02;
const length = 0.2;
const gap = 0.03;
const rows = 5;
const columns = 40;

function getRandomColor() {
    var letters = '0123';
    var color = '';
    const r1 = letters[Math.floor(Math.random() * letters.length)];
    const r2 = letters[Math.floor(Math.random() * letters.length)];
    color = '#' + r1 + r2 + r1 + r2 + r1 + r2;
    for (var i = 0; i < 2; i++) {
        // color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
}

const make_brick = (scene) => {
    const geometry = new THREE.BoxGeometry(width, height, length);
    const material = new THREE.MeshPhongMaterial({
        color: getRandomColor(),
        transparent: true,
    });

    // Figure this shader out to fade objects into the distance.
    material.onBeforeCompile = function (shader) {
        shader.fragmentShader = shader.fragmentShader.replace(
            'gl_FragColor = vec4( packNormalToRGB( normal ), opacity );',
            [
                'gl_FragColor = vec4( packNormalToRGB( normal ), opacity );',
                'gl_FragColor.a *= pow( gl_FragCoord.z, 500.0 );',
            ].join('\n')
        );
    };
    const cube = new THREE.Mesh(geometry, material);
    cube.rotation.y += (Math.random() - 0.5) * 0.1;
    cube.scale.z += (Math.random() - 0.5) * 0.1;
    cube.position.x += (Math.random() - 0.5) * 0.2;
    cube.position.y += (Math.random() - 0.5) * 0.01;
    scene.add(cube);
    return cube;
};

const get_bricks = (scene, position) => {
    let bricks = [];
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            let brick = make_brick(scene);
            brick.position.x =
                -(width + gap) * (rows / 2 - 1 / 2) + (width + gap) * i;
            brick.position.z = -(length + gap) * j;
            if (i % 2 == 0) {
                brick.position.z -= length / 2;
            }

            brick.position.x += position.x;
            brick.position.y += position.y;
            brick.position.z += position.z;
            bricks.push(brick);
        }
    }
    return bricks;
};

function main() {
    const canvas = document.querySelector('#canvas');
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize($(canvas).width(), $(canvas).height());

    const fov = 75;
    const aspect = $(canvas).width() / $(canvas).height();
    const near = 0.1;
    const far = 500;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 1;
    camera.position.y = 0.5;
    const scene = new THREE.Scene();

    renderer.setClearColor(0x666666, 1);
    // const fog = new THREE.FogExp2(0x666666, 0.35);
    const fog = new THREE.FogExp2(0x666666, 0);
    fog.far = 100;
    scene.fog = fog;

    renderer.render(scene, camera);
    const color = 0xffffff;
    const intensity = 0.001;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(0, 1, 2);
    scene.add(light);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);

    // controls.domElement = renderer.domElement;
    controls.maxDistance = 1000;
    controls.target.set(0, 0, 0);
    const bricks = get_bricks(scene, controls.target);
    let rabbit = false;
    load_rabbit(scene, controls, camera, rabbit);
    load_trees(scene, controls, camera, rabbit);
    const sky = load_sky();
    // scene.add(sky);
    console.log('SKY', sky);
    function render(time) {
        stats.begin();

        if (light.intensity < 0.5) {
            let done = light.intensity / 0.5;
            light.intensity += (done * done + (1 - done) * (1 - done)) / 500;
        }
        time *= 0.001; // convert time to seconds
        const speed = 2;
        time *= speed;
        let brick_moved = false;
        bricks.forEach((brick) => {
            brick.position.z += 0.005 * speed;
            if (brick.position.z > 1) {
                brick.position.z -= columns * (length + gap);
                brick_moved = true;
            }
        });

        if (window.trees) {
            window.trees.forEach((tree) => {
                tree.position.z += 0.04;
                if (tree.position.z > 0) {
                    tree.position.z -= 3;
                }
            });
        }

        if (window.rabbit) {
            window.rabbit.position.y =
                0.05 + (1 / 2) * helpers.get_y(0.5, time, 1);
            window.rabbit.position.x =
                ((width * rows) / 2) *
                (Math.cos(time / 2) + (1 / 3) * Math.sin(time * 1.5));
            controls.target.y = 0.3;
        }

        stats.end();

        renderer.render(scene, camera);
        controls.update(time);
        sky.rotation.y -= 0.001;
        requestAnimationFrame(render);

        window.addEventListener('resize', onWindowResize, false);

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    const start = () => {
        renderer.setClearColor;
        requestAnimationFrame(render);
    };
    return start;
}

const start = main();
export default start;
