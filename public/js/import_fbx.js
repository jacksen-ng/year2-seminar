import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { FBXLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/FBXLoader.js';

export function loadFBX(scene, modelname) {
    let mixer, clock, basketball, handRBone, handLBone, character;
    let actions = {};
    let activeAction, previousAction;
    let isThrowing = false;
    let throwStartTime = null;
    let throwVelocity = null;
    let gravity = null;
    let basketballStartPosition = null;
    let initialHandY = null;
    let initialBasketballPosition = null;
    let dribbleFinishCount = 0; 
    let currentAnimationName = 'dribble'; 

    let prevBasketballPosition = new THREE.Vector3();
    let prevBasketballTime = 0;
    let lastBasketballVelocity = new THREE.Vector3();
    let throwTransitionDuration = 0.1; 

    clock = new THREE.Clock();
    const loader = new FBXLoader();

    loader.load(`/model/${modelname}.fbx`, (object) => {
        character = object;
        character.scale.set(1, 1, 1);
        character.position.set(10, 120, 10);

        mixer = new THREE.AnimationMixer(character);
        actions['dribble'] = mixer.clipAction(object.animations[0]);
        actions['dribble'].setLoop(THREE.LoopRepeat, 3); 
        actions['dribble'].clampWhenFinished = true;

        character.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        scene.add(character);

        handRBone = character.getObjectByName('Hand_R');
        if (handRBone) {
            const handPosition = new THREE.Vector3();
            handRBone.getWorldPosition(handPosition);
            initialHandY = handPosition.y;
        }

        handLBone = character.getObjectByName('Hand_L');

        loader.load('/model/shot.fbx', (shot) => {
            actions['shoot'] = mixer.clipAction(shot.animations[0]);
            actions['shoot'].setLoop(THREE.LoopOnce, 1);
            actions['shoot'].clampWhenFinished = true;

            activeAction = actions['dribble'];
            activeAction.play();

            mixer.addEventListener('finished', (e) => {
                if (e.action === actions['dribble']) {
                    dribbleFinishCount++;
                    if (dribbleFinishCount >= 4) {
                        dribbleFinishCount = 0; 
                        fadeToAction('shoot', 0.2);
                        isThrowing = false;
                    } else {
                        actions['dribble'].reset().play();
                    }
                } else if (e.action === actions['shoot']) {
                    resetBasketball();
                    fadeToAction('dribble', 0.2);
                }
            });
        }, undefined, (error) => {
            console.error(error);
        });

    }, undefined, (error) => {
        console.error(error);
    });

    const loader2 = new FBXLoader();
    loader2.load('/model/ball.fbx', (object) => {
        object.scale.set(0.1, 0.1, 0.1);
        basketball = object;
        basketball.position.set(-15, 168, 60); 

        initialBasketballPosition = basketball.position.clone();
        scene.add(basketball);

        basketball.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        prevBasketballPosition.copy(initialBasketballPosition);
        prevBasketballTime = clock.getElapsedTime();
    }, undefined, (error) => {
        console.error(error);
    });

    function fadeToAction(name, duration) {
        previousAction = activeAction;
        activeAction = actions[name];
        currentAnimationName = name;

        if (previousAction !== activeAction) {
            previousAction.fadeOut(duration);
            activeAction
                .reset()
                .setEffectiveTimeScale(1)
                .setEffectiveWeight(1)
                .fadeIn(duration)
                .play();
        }
    }

    function startBasketballThrow() {
        isThrowing = true;
        throwStartTime = clock.getElapsedTime();

        basketballStartPosition = new THREE.Vector3();
        basketball.getWorldPosition(basketballStartPosition);

        throwVelocity = lastBasketballVelocity.clone();

        const forward = new THREE.Vector3();
        character.getWorldDirection(forward);
        forward.normalize();

        const extraUpwardSpeed = 50; 
        const extraForwardSpeed = 20; 

        throwVelocity.addScaledVector(forward, extraForwardSpeed);
        throwVelocity.y += extraUpwardSpeed;

        gravity = new THREE.Vector3(0, -9.81 * 10, 0);
    }

    function updateBasketballPosition() {
        const currentTime = clock.getElapsedTime();

        if (isThrowing) {
            const timeSinceThrowStart = currentTime - throwStartTime;

            const parabolicPosition = new THREE.Vector3();
            parabolicPosition.copy(basketballStartPosition);
            parabolicPosition.addScaledVector(throwVelocity, timeSinceThrowStart);
            parabolicPosition.addScaledVector(gravity, 0.5 * timeSinceThrowStart * timeSinceThrowStart);

            if (timeSinceThrowStart <= throwTransitionDuration) {
                const t = timeSinceThrowStart / throwTransitionDuration;

                function easeOutCubic(t) {
                    return 1 - Math.pow(1 - t, 3);
                }
                const easedT = easeOutCubic(t);

                let handPosition = new THREE.Vector3();
                if (handRBone && handLBone) {
                    const handRPosition = new THREE.Vector3();
                    const handLPosition = new THREE.Vector3();
                    handRBone.getWorldPosition(handRPosition);
                    handLBone.getWorldPosition(handLPosition);
                    handPosition.addVectors(handRPosition, handLPosition).multiplyScalar(0.5);
                } else if (handRBone) {
                    handRBone.getWorldPosition(handPosition);
                } else {
                    handPosition.copy(basketball.position);
                }

                basketball.position.lerpVectors(handPosition, parabolicPosition, easedT);
            } else {
                basketball.position.copy(parabolicPosition);
            }
        } else {
            const deltaTime = currentTime - prevBasketballTime;

            if (deltaTime > 0) {
                let currentPosition = new THREE.Vector3();
                if (handRBone && basketball) {
                    if (currentAnimationName === 'dribble') {
                        const handPosition = new THREE.Vector3();
                        handRBone.getWorldPosition(handPosition);

                        const deltaY = handPosition.y - initialHandY;

                        const scalingFactor = 4.0;
                        basketball.position.y = initialBasketballPosition.y + deltaY * scalingFactor;

                        basketball.position.x = initialBasketballPosition.x;
                        basketball.position.z = initialBasketballPosition.z;
                    } else if (currentAnimationName === 'shoot') {
                        if (handRBone && handLBone) {
                            const handRPosition = new THREE.Vector3();
                            const handLPosition = new THREE.Vector3();
                            handRBone.getWorldPosition(handRPosition);
                            handLBone.getWorldPosition(handLPosition);
                            const basketballPosition = new THREE.Vector3().addVectors(handRPosition, handLPosition).multiplyScalar(0.5);
                            basketball.position.copy(basketballPosition);
                        } else {
                            const handPosition = new THREE.Vector3();
                            handRBone.getWorldPosition(handPosition);
                            basketball.position.copy(handPosition);
                        }
                    }

                    basketball.getWorldPosition(currentPosition);
                    lastBasketballVelocity.copy(currentPosition).sub(prevBasketballPosition).divideScalar(deltaTime);

                    prevBasketballPosition.copy(currentPosition);
                    prevBasketballTime = currentTime;
                }
            }
        }
    }

    function resetBasketball() {
        basketball.position.copy(initialBasketballPosition);
        isThrowing = false;

        prevBasketballPosition.copy(initialBasketballPosition);
        prevBasketballTime = clock.getElapsedTime();
    }

    function animateCharacter() {
        requestAnimationFrame(animateCharacter);

        const delta = clock.getDelta();
        if (mixer) mixer.update(delta);

        if (currentAnimationName === 'shoot' && !isThrowing) {
            const shootAction = actions['shoot'];
            const actionTime = shootAction.time;
            const shootDuration = shootAction.getClip().duration;
            const THROW_START_TIME_FRACTION = 0.2; 
            const THROW_START_TIME = THROW_START_TIME_FRACTION * shootDuration;

            if (actionTime >= THROW_START_TIME) {
                startBasketballThrow();
            }
        }

        updateBasketballPosition();
    }

    animateCharacter();
}
