document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('avatar-canvas');
    const ctx = canvas.getContext('2d');
    const styleSelect = document.getElementById('style');
    const promptTextarea = document.getElementById('prompt');
    const negativePromptTextarea = document.getElementById('negative_prompt');
    const customizationForm = document.getElementById('customization-form');
    const seedRange = document.getElementById('seed-range');
    const seedValue = document.getElementById('seed-value');
    const refreshSeedButton = document.getElementById('refresh-seed-button');
    const likeButton = document.getElementById('like-button');
    const dislikeButton = document.getElementById('dislike-button');
    const resetButton = document.getElementById('reset-preferences-button');
    const likeCountDisplay = document.getElementById('like-count');
    const dislikeCountDisplay = document.getElementById('dislike-count');
    const loadingText = document.getElementById('loadingText');
    const chatMessages = document.getElementById('chat-messages'); // 用于显示错误信息

    let likeCount = 0;
    let dislikeCount = 0;

    // 当选择风格时，自动填充描述框
    styleSelect.addEventListener('change', function() {
        let textToSet = '';
        switch (this.value) {
            case 'realistic':
                textToSet = 'High resolution, Realism, Natural light, Soft shadows, Light and shadow contrast, Real materials, Natural colors';
                break;
            case 'cartoon':
                textToSet = 'Cartoon style, Anime style, Simple lines, Thick lines, Bright colors, High saturation colors, Exaggerated proportions, Cute elements';
                break;
            case 'cute':
                textToSet = 'Big eyes, Small nose, Round face, Soft colors, Warm tones';
                break;
            case 'funny':
                textToSet = 'Exaggerated expressions, Weird hairstyles, Asymmetric facial features, Twisted postures, Funny movements, Mismatched items, Oversized or undersized items, Upside-down scenes, Chaotic scenes';
                break;
            case 'ancient':
                textToSet = 'Ancient-style costumes, Classical hairstyles, Ancient-style makeup, Ancient architecture styles, Garden landscapes, Ancient streets and alleys, Calligraphy and paintings, Classical musical instruments, Traditional props';
                break;
            case 'fresh':
                textToSet = 'Light colors, Low-saturation colors, Natural elements, Pastoral scenery, Seaside scenery, Simple clothing, Light-weight items';
                break;
            case 'sci-fi':
                textToSet = 'Future city, Alien landscape, Interstellar space station, Flying car, Spaceship, Cyberpunk human, Energy shield, Quantum computer';
                break;
            case 'fantasy':
                textToSet = 'Magical creatures, Elves, Dwarves, Mysterious forest, Floating islands, Magic castle, Magic runes, Magic array, Space-time rift';
                break;
            case 'none':
                textToSet = '';
                break;
        }
        promptTextarea.value = textToSet; // 更新元素 ID 引用
    });

    function generateSeed() {
        return Math.floor(Math.random() * (1000000000 - 1 + 1)) + 1;
    }

    function updateSeedDisplay() {
        seedValue.textContent = seedRange.value;
    }

    seedRange.addEventListener('input', function() {
        updateSeedDisplay();
    });

    refreshSeedButton.addEventListener('click', function() {
        const newSeed = generateSeed();
        seedRange.value = newSeed;
        updateSeedDisplay();
        customizationForm.dispatchEvent(new Event('submit')); // 触发表单提交
    });

    function updateCounts(likeIncrement, dislikeIncrement) {
        likeCount += likeIncrement;
        dislikeCount += dislikeIncrement;
        likeCountDisplay.textContent = likeCount;
        dislikeCountDisplay.textContent = dislikeCount;
    }

    function generateAvatar(style, prompt, negative_prompt, seed) {
        const payload = {
            style: style,
            prompt: prompt,
            negative_prompt: negative_prompt,
            seed: parseInt(seed, 10),
        };

        showLoading(); // 显示加载指示器

        fetch('/generate_image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })
        .then(response => response.json())
        .then(data => {
            hideLoading(); // 隐藏加载指示器
            console.log('Response data:', data);
            if (data.image_url) {
                const image = new Image();
                image.onload = function() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                };
                image.onerror = function() {
                    console.error('Error loading the image');
                    showErrorMessage("Failed to load the image.");
                };
                image.src = data.image_url;
            } else {
                console.error('No image URL found in response');
                showErrorMessage("No image data received.");
            }
        })
        .catch(error => {
            hideLoading(); // 隐藏加载指示器
            console.error('Error generating image:', error);
            showErrorMessage("Failed to generate image.");
        });
    }

    function showLoading() {
        loadingText.style.display = 'block'; // 显示加载指示器
    }

    function hideLoading() {
        loadingText.style.display = 'none'; // 隐藏加载指示器
    }

    function showErrorMessage(message) {
        const messageItem = document.createElement('li');
        messageItem.textContent = message;
        messageItem.style.color = 'red'; // 错误信息红色显示
        chatMessages.appendChild(messageItem);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    customizationForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const style = styleSelect.value;
        const prompt = promptTextarea.value;
        const negative_prompt = negativePromptTextarea.value;
        const seed = parseInt(seedRange.value, 10);
        generateAvatar(style, prompt, negative_prompt, seed);
    });

    let userPreferences = {
        likeCount: 0,
        dislikeCount: 0
    };

    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
        userPreferences = JSON.parse(savedPreferences);
    }

    function updateCounts() {
        likeCountDisplay.textContent = userPreferences.likeCount;
        dislikeCountDisplay.textContent = userPreferences.dislikeCount;
    }
    updateCounts();

    likeButton.addEventListener('click', function() {
        userPreferences.likeCount++;
        localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
        updateCounts();
    });

    dislikeButton.addEventListener('click', function() {
        userPreferences.dislikeCount++;
        localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
        updateCounts();
    });

    resetButton.addEventListener('click', function() {
        userPreferences.likeCount = 0;
        userPreferences.dislikeCount = 0;
        localStorage.removeItem('userPreferences');
        updateCounts();
    });
});