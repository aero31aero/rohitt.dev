import * as THREE from 'three';
const helpers = {
    get_y: (u, t, a) => {
        // think class 10th physics
        // s = ut + 1/2at^2
        const cycle_time = (2 * u) / a;
        t = t % cycle_time;
        return Math.max(u * t - (a * t * t) / 2, 0); // remain positive
    },
    dumpObject: (obj, lines = [], isLast = true, prefix = '') => {
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
            helpers.dumpObject(child, lines, isLast, newPrefix);
        });
        return lines;
    },
    get_tree_locations: (count, width = 50, depth = 50) => {
        const points = [];
        for (let i = 0; i < count; i++) {
            let side = Math.floor(2 * Math.random()) === 0 ? -1 : 1;
            let random = Math.random();
            points.push({
                x: side * (0.5 + random * 0.3 + (width / 2) * random * random),
                z: depth * Math.sqrt(Math.random()) - depth / 2,
                y: 0.4,
            });
        }
        return points;
    },
    clone_gltf: (gltf) => {
        const clone = {
            animations: gltf.animations,
            scene: gltf.scene.clone(true),
        };

        const skinnedMeshes = {};

        gltf.scene.traverse((node) => {
            if (node.isSkinnedMesh) {
                skinnedMeshes[node.name] = node;
            }
        });

        const cloneBones = {};
        const cloneSkinnedMeshes = {};

        clone.scene.traverse((node) => {
            if (node.isBone) {
                cloneBones[node.name] = node;
            }

            if (node.isSkinnedMesh) {
                cloneSkinnedMeshes[node.name] = node;
            }
        });

        for (let name in skinnedMeshes) {
            const skinnedMesh = skinnedMeshes[name];
            const skeleton = skinnedMesh.skeleton;
            const cloneSkinnedMesh = cloneSkinnedMeshes[name];

            const orderedCloneBones = [];

            for (let i = 0; i < skeleton.bones.length; ++i) {
                const cloneBone = cloneBones[skeleton.bones[i].name];
                orderedCloneBones.push(cloneBone);
            }

            cloneSkinnedMesh.bind(
                new THREE.Skeleton(orderedCloneBones, skeleton.boneInverses),
                cloneSkinnedMesh.matrixWorld
            );
        }
        return clone;
    },
};

export default helpers;
