import GLTFLoader from 'three-gltf-loader';
import * as THREE from 'three';
const rabbit = require('./rabbit/scene.gltf');
import gltfPath from './rabbit/scene.gltf';
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

// COPIED FROM A BLOGPOST; KEEP IT IN CASE IT IS USEFUL LATER
function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
    const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
    const halfFovY = THREE.MathUtils.degToRad(camera.fov * 0.5);
    const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);
    // compute a unit vector that points in the direction the camera is now
    // in the xz plane from the center of the box
    const direction = new THREE.Vector3()
        .subVectors(camera.position, boxCenter)
        .multiply(new THREE.Vector3(1, 0, 1))
        .normalize();

    // move the camera to a position distance units way from the center
    // in whatever direction the camera was from the center already
    camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));

    // pick some near and far values for the frustum that
    // will contain the box.
    camera.near = boxSize / 100;
    camera.far = boxSize * 100;

    camera.updateProjectionMatrix();

    // point the camera to look at the center of the box
    camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
}

const scale_scene = (mroot, scene) => {
    var bbox = new THREE.Box3().setFromObject(mroot);
    var cent = bbox.getCenter(new THREE.Vector3());
    var size = bbox.getSize(new THREE.Vector3());

    //Rescale the object to normalized space
    var maxAxis = Math.max(size.x, size.y, size.z);
    mroot.scale.multiplyScalar(0.2 / maxAxis);
    bbox.setFromObject(mroot);
    bbox.getCenter(cent);
    bbox.getSize(size);
    //Reposition somewhere, hackily.
    mroot.position.copy(cent).multiplyScalar(-1);
    mroot.position.y += size.y * 0.5;
    mroot.position.z += 0.5;

    const rabbitskin = new THREE.MeshLambertMaterial({ color: 0xffffff });
    rabbitskin.emmisive = 0xffffff;
    rabbitskin.reflectivity = 0.5;
    mroot.traverse((o) => {
        if (o.isMesh) o.material = rabbitskin;
    });
    scene.add(mroot);
    return mroot;
};

const set_controls_to_scene = (root, controls, camera) => {
    const box = new THREE.Box3().setFromObject(root);

    const boxSize = box.getSize(new THREE.Vector3()).length();
    const boxCenter = box.getCenter(new THREE.Vector3());

    // set the camera to frame the box
    // frameArea(boxSize * 0.5, boxSize, boxCenter, camera);

    console.log(boxSize, boxCenter);

    // update the Trackball controls to handle the new size
    controls.maxDistance = boxSize * 100;
    console.log('Target', controls.target);
    // controls.target.copy(boxCenter);
    // console.log("Target", controls.target);
    controls.update();
};

const load_rabbit = (scene, controls, camera, object) => {
    console.log('HERE', '/' + gltfPath);
    loader.load(
        // resource URL
        '/' + gltfPath,
        // called when the resource is loaded
        function (gltf) {
            console.log('ADDING THIS');
            const root = gltf.scene;
            // scene.add(root);
            window.rabbit = scale_scene(root, scene);
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

export default load_rabbit;
