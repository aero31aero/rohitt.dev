import GLTFLoader from 'three-gltf-loader';
import * as THREE from 'three';
const rabbit = require('./rabbit/scene.gltf');
import gltfPath from './tree.glb';
const loader = new GLTFLoader();
import helpers from './helpers';
console.log('HELPER', helpers);

const scale_scene = (mroot, scene, gltf) => {
    var bbox = new THREE.Box3().setFromObject(mroot);
    var cent = bbox.getCenter(new THREE.Vector3());
    var size = bbox.getSize(new THREE.Vector3());

    //Rescale the object to normalized space
    var maxAxis = Math.max(size.x, size.y, size.z);
    mroot.scale.multiplyScalar(2 / maxAxis);
    bbox.setFromObject(mroot);
    bbox.getCenter(cent);
    bbox.getSize(size);
    console.log('Cox Size', new THREE.Box3().setFromObject(mroot), mroot.scale);
    mroot.scale.y *= 1;
    //Reposition somewhere, hackily.
    const pinktree = new THREE.MeshLambertMaterial({ color: 0xff7766 });
    const yellowtree = new THREE.MeshLambertMaterial({ color: 0xdddd00 });
    const bluetree = new THREE.MeshLambertMaterial({ color: 0x1188ff });
    mroot.position.copy(cent).multiplyScalar(-1);
    mroot.position.y = 1.27;
    mroot.position.x = 0;
    mroot.position.z = 0;
    const positions = helpers.get_tree_locations(30, 3, 5);
    const trees = positions.map((p) => {
        const tree = helpers.clone_gltf(gltf).scene;
        const { x, y, z } = p;
        // console.log(helpers.dumpObject(tree).join('\n'));
        tree.position.set(x, 1.27, z);
        // console.log(tree.position);
        scene.add(tree);
        return tree;
    });
    // scene.add(mroot);
    window.trees = trees;
    return trees;
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
            window.trees = scale_scene(root, scene, gltf);
            console.log('Set object', object);
            console.log(helpers.dumpObject(root).join('\n'));

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
