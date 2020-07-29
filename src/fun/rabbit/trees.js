import GLTFLoader from 'three-gltf-loader';
import * as THREE from 'three';
const rabbit = require('./rabbit/scene.gltf');
import gltfPath from './tree.glb';
const loader = new GLTFLoader();

function dumpObject(obj, lines = [], isLast = true, prefix = '') {
    const localPrefix = isLast ? '└─' : '├─';
    lines.push(
        `${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${
            obj.type
        }]`
    );
    const newPrefix = prefix + (isLast ? '  ' : '│ ');
    const lastNdx = obj.children.length - 1;
    obj.children.forEach((child, ndx) => {
        const isLast = ndx === lastNdx;
        dumpObject(child, lines, isLast, newPrefix);
    });
    return lines;
}

const scale_scene = (mroot, scene) => {
    var bbox = new THREE.Box3().setFromObject(mroot);
    var cent = bbox.getCenter(new THREE.Vector3());
    var size = bbox.getSize(new THREE.Vector3());

    //Rescale the object to normalized space
    var maxAxis = Math.max(size.x, size.y, size.z);
    mroot.scale.multiplyScalar(10 / maxAxis);
    bbox.setFromObject(mroot);
    bbox.getCenter(cent);
    bbox.getSize(size);
    console.log('Cox Size', new THREE.Box3().setFromObject(mroot), mroot.scale);
    mroot.scale.y *= 1;
    //Reposition somewhere, hackily.
    mroot.position.copy(cent).multiplyScalar(-1);
    mroot.position.y = 0;
    mroot.position.x += 0.3;
    mroot.position.z = -2.5;
    mroot.children.forEach((child, n) => {
        // If the tree is too far off center, place it in a thin band around the path.
        if (child.type !== 'Group') {
            return;
        }
        const side = Math.random() > 0.5 ? 1 : -1; // Place on left or right
        const new_x = side * (10 + 1.5 * Math.random()) - 3;
        if (child.position.x > 15) {
            // Place trees on the right side in the -10 to -20 bracket
            child.position.x = new_x;
            child.position.z -= 10;
            console.log('From right to', new_x);
        } else if (child.position.x < -15) {
            // Place tress on the left side in the -20 to -30 bracker
            child.position.x = new_x;
            child.position.z -= 20;
            console.log('From left to', new_x);
        } else {
            console.log('Unmodified', child.position);
        }
    });

    // const rabbitskin = new THREE.MeshLambertMaterial({ color: 0xffffff });
    // rabbitskin.emmisive = 0xffffff;
    // rabbitskin.reflectivity = 0.5;
    // mroot.traverse((o) => {
    //     if (o.isMesh) o.material = rabbitskin;
    // });
    // cars = mroot.getObjectByName('Cars');
    // console.log("HEREEEEE", cars);
    scene.add(mroot);
    return mroot;
};

const load_tree = (scene, controls, camera, object) => {
    console.log('HERE TREE', '/' + gltfPath);
    loader.load(
        // resource URL
        '/' + gltfPath,
        // called when the resource is loaded
        function (gltf) {
            console.log('ADDING THIS');
            const root = gltf.scene;
            // scene.add(root);
            window.trees = scale_scene(root, scene);
            console.log('Set object', object);
            console.log(dumpObject(root).join('\n'));

            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Group
            gltf.scenes; // Array<THREE.Group>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object
        },
        // called while loading is progressing
        function (xhr) {
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
        },
        // called when loading has errors
        function (error) {
            console.log('An error happened');
            console.log(error);
        }
    );
};

export default load_tree;
