import GLTFLoader from 'three-gltf-loader';
import * as THREE from 'three';
const rabbit = require('./rabbit/scene.gltf');
import gltfPath from './tree.glb';
const loader = new GLTFLoader();
import helpers from './helpers';
console.log('HELPER', helpers);
const treeskin = new THREE.MeshLambertMaterial({ color: 0x09240f });
const treebark = new THREE.MeshLambertMaterial({ color: 0x241709 });
const apply_material = (root) => {
    root.scene.traverse((o) => {
        if (o.isMesh) {
            o.material = treeskin;
            if (o.name == 'TrunkOfATree') {
                o.material = treebark;
            }
        }
    });
};

const scale_scene = (mroot, scene, gltf) => {
    var bbox = new THREE.Box3().setFromObject(mroot);
    var cent = bbox.getCenter(new THREE.Vector3());
    var size = bbox.getSize(new THREE.Vector3());

    //Rescale the object to normalized space
    bbox.setFromObject(mroot);
    bbox.getCenter(cent);
    bbox.getSize(size);
    console.log('Cox Size', new THREE.Box3().setFromObject(mroot), mroot.scale);
    // mroot.scale.y *= 1;
    // mroot.position.copy(cent).multiplyScalar(-1);
    // mroot.position.y = 1.27;
    // mroot.position.x = 0;
    // mroot.position.z = 0;
    const positions = helpers.get_tree_locations(100, 3, 10);
    const trees = positions.map((p) => {
        const mscene = helpers.clone_gltf(gltf);
        apply_material(mscene);
        const tree = mscene.scene;
        const { x, y, z } = p;
        tree.scale.multiplyScalar(0.1);
        // console.log(helpers.dumpObject(tree).join('\n'));
        tree.position.set(x, y, z);
        // console.log(tree.position);
        scene.add(tree);
        return tree;
    });
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
