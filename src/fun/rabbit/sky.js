import * as THREE from 'three';
var loader = new THREE.TextureLoader();
const path = require('./textures/europe.jpg');
const texture = loader.load(`/${path.default}`);

const load_sky = (scene) => {
    const temp_mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    var sphere = new THREE.Mesh(
        new THREE.SphereGeometry(200, 32, 32),
        new THREE.MeshBasicMaterial({
            map: texture,
            fog: false,
        })
        // temp_mat,
    );
    sphere.material.side = THREE.BackSide;
    // sphere.scale.x = -1;
    return sphere;
};

export default load_sky;
