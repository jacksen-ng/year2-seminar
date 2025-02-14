import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { loadFBX } from './import_fbx.js';
import { initScene, animate, scene, renderer } from './import_court.js'; // 添加renderer导入

export let modelgroup = ['JumpShot', 'Dribble', 'Defense', 'CloseScreen', 'cube', 'sphere', 'cylinder', 'cone', 'torus'];

function createBasicObject(objectType) {
    let geometry;
    const material = new THREE.MeshStandardMaterial({
        color: 0x4a90e2,
        metalness: 0.3,
        roughness: 0.4
    });

    switch(objectType.toLowerCase()) {
        case 'cube':
            geometry = new THREE.BoxGeometry(30, 30, 30);
            break;
        case 'sphere':
            geometry = new THREE.SphereGeometry(20, 32, 32);
            break;
        case 'cylinder':
            geometry = new THREE.CylinderGeometry(15, 15, 40, 32);
            break;
        case 'cone':
            geometry = new THREE.ConeGeometry(20, 40, 32);
            break;
        case 'torus':
            geometry = new THREE.TorusGeometry(20, 5, 16, 100);
            break;
        default:
            return null;
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 150, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

function clearScene() {
    const objectsToRemove = [];
    scene.traverse((child) => {
        if (child.isMesh && !child.isGround && child.name !== 'ground') {
            objectsToRemove.push(child);
        }
    });

    objectsToRemove.forEach((object) => {
        object.geometry.dispose();
        object.material.dispose();
        scene.remove(object);
    });

    renderer.renderLists.dispose();
    console.log('Scene cleared');
}

document.getElementById('gpt-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const prompt = document.getElementById('prompt').value.toLowerCase();
    console.log('Submitted prompt:', prompt);

    try {
        const response = await fetch('/gpt-api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
        });

        const data = await response.json();
        const gptAnswer = data.message.toLowerCase();
        console.log('Raw GPT Answer:', data.message); // 添加原始回答日志
        console.log('Processed GPT Answer:', gptAnswer);

        const basicShapes = ['cube', 'sphere', 'cylinder', 'cone', 'torus'];
        const isBasicShape = basicShapes.some(shape => 
            prompt.includes(shape) || gptAnswer.includes(shape)
        );

        const basketballActions = ['jumpshot', 'dribble', 'defense', 'closescreen'];
        const isBasketballAction = basketballActions.some(action => 
            prompt.includes(action.toLowerCase()) || gptAnswer.includes(action.toLowerCase())
        );

        if (!window.sceneInitialized) {
            console.log('Initializing scene...');
            initScene();
            animate();
            window.sceneInitialized = true;
        }

        if (isBasicShape) {
            const shape = basicShapes.find(shape => 
                prompt.includes(shape) || gptAnswer.includes(shape)
            );
            console.log('Creating basic shape:', shape);
            const object = createBasicObject(shape);
            if (object) {
                clearScene();
                scene.add(object);
                console.log('Basic shape added to scene');
            }
        }

        if (isBasketballAction) {
            let modelname = basketballActions.find(action => 
                prompt.includes(action.toLowerCase()) || gptAnswer.includes(action.toLowerCase())
            );
            if (modelname === 'jumpshot') modelname = 'shot';
            modelname = modelname.charAt(0).toUpperCase() + modelname.slice(1);
            loadFBX(scene, modelname);
        }

        if (!isBasicShape && !isBasketballAction) {
            console.log('No matching model found');
            document.getElementById('response').textContent = 'No matching model found.';
        }

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('response').textContent = 'Error occurred while fetching the GPT response.';
    }
});

document.getElementById('clear-scene').addEventListener('click', function() {
    scene.traverse((child) => {
        if (child.isMesh && !child.isBasketballModel) {
            child.geometry.dispose();
            child.material.dispose();
            scene.remove(child);
        }
    });
    console.log('Basic shapes cleared');
});
