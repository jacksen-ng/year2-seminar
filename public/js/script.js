document.addEventListener('DOMContentLoaded', () => {
    const responseArea = document.getElementById('response');
    const promptInput = document.getElementById('prompt');
    
    promptInput.addEventListener('focus', () => {
        promptInput.placeholder = '';
    });

    promptInput.addEventListener('blur', () => {
        if (!promptInput.value) {
            promptInput.placeholder = 'バスケについて質問してください...';
        }
    });

    let isTyping = false;
    function typeWriter(text, element) {
        if (isTyping) return;
        isTyping = true;
        let i = 0;
        element.textContent = '';
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, 50);
            } else {
                isTyping = false;
            }
        }
        type();
    }

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        const clone = response.clone();
        clone.json().then(data => {
            if (data.message) {
                typeWriter(data.message, responseArea);
            }
        });
        return response;
    };
});
