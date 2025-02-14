import { initScene, animate } from './import_court.js';
import { loadFBX } from './import_fbx.js';

let sceneInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
    try {
        initScene();
        animate();
        sceneInitialized = true;
        console.log('Scene initialized successfully');
    } catch (error) {
        console.error('Error initializing scene:', error);
    }

    document.getElementById('gpt-form').addEventListener('submit', async function(event) {
        event.preventDefault();
        const prompt = document.getElementById('prompt').value;

        try {
            const response = await fetch('/gpt-api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            const data = await response.json();
            const responseElement = document.getElementById('response');
            responseElement.textContent = data.message;

            // Load corresponding 3D model based on GPT response
            if (data.message && typeof data.message === 'string') {
                const modelTypes = ['Dribble', 'JumpShot', 'Defense', 'CloseScreen'];
                const matchingModel = modelTypes.find(model => 
                    data.message.toLowerCase().includes(model.toLowerCase())
                );

                if (matchingModel) {
                    loadFBX(window.scene, matchingModel);
                }
            }

        } catch (error) {
            console.error('Error:', error);
            document.getElementById('response').textContent = 'エラーが発生しました。';
        }
    });
});




