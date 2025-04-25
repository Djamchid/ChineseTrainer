document.addEventListener('DOMContentLoaded', function() {
    // Canvas setup
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const characterDisplay = document.getElementById('character');
    const pinyinDisplay = document.getElementById('pinyin');
    const meaningDisplay = document.getElementById('meaning');
    const compositionDisplay = document.getElementById('composition');
    const clearBtn = document.getElementById('clearBtn');
    const nextBtn = document.getElementById('nextBtn');
    const levelSelect = document.getElementById('level');
    const progressBar = document.getElementById('progressBar');
    const streakElement = document.getElementById('streak');
    const showHintBtn = document.getElementById('showHintBtn');
    const hideHintBtn = document.getElementById('hideHintBtn');
    const hintContainer = document.getElementById('hintContainer');
    const examplesContainer = document.getElementById('examplesContainer');
    const pronounceBtn = document.getElementById('pronounceBtn');
    
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let streak = 0;
    let currentCharIndex = 0;
    let characters = [];
    // Speech synthesis
    const synth = window.speechSynthesis || null;
    
    // Initialize canvas
    function initCanvas() {
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#000';
        clearCanvas();
        
        // Initialize speech synthesis safely
        if (window.speechSynthesis && typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
            window.speechSynthesis.onvoiceschanged = () => {
                // Get voices when they're loaded
                const voices = window.speechSynthesis.getVoices();
                // Log available voices for debugging
                console.log("Available voices:", voices.map(v => `${v.name} (${v.lang})`).join(', '));
            };
        }
    }
    
    // Clear the canvas
    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw on canvas
    function draw(e) {
        if (!isDrawing) return;
        
        // Get correct coordinates for both mouse and touch
        let x, y;
        if (e.type === 'mousemove') {
            x = e.offsetX;
            y = e.offsetY;
        } else if (e.type === 'touchmove') {
            const rect = canvas.getBoundingClientRect();
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
            e.preventDefault();
        }
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        [lastX, lastY] = [x, y];
    }
    
    // Start drawing
    function startDrawing(e) {
        isDrawing = true;
        
        // Get correct coordinates for both mouse and touch
        if (e.type === 'mousedown') {
            lastX = e.offsetX;
            lastY = e.offsetY;
        } else if (e.type === 'touchstart') {
            const rect = canvas.getBoundingClientRect();
            lastX = e.touches[0].clientX - rect.left;
            lastY = e.touches[0].clientY - rect.top;
            e.preventDefault();
        }
    }
    
    // Stop drawing
    function stopDrawing() {
        isDrawing = false;
    }
    
    // Load characters based on level
    function loadCharacters() {
        const level = levelSelect.value;
        characters = [...characterData[level]];
        shuffleArray(characters);
        currentCharIndex = 0;
        streak = 0;
        streakElement.textContent = streak;
        updateProgressBar();
        displayCharacter();
        updateExamplesDisplay();
    }
    
    // Display current character
    function displayCharacter() {
        const current = characters[currentCharIndex];
        characterDisplay.textContent = current.char;
        pinyinDisplay.textContent = current.pinyin;
        meaningDisplay.textContent = current.meaning;
        
        // Show composition info for combined ideograms
        if (current.components) {
            compositionDisplay.textContent = `Components: ${current.components}`;
            compositionDisplay.style.display = 'block';
        } else if (current.notes) {
            compositionDisplay.textContent = `Note: ${current.notes}`;
            compositionDisplay.style.display = 'block';
        } else {
            compositionDisplay.style.display = 'none';
        }
        
        // Update hint container character
        hintContainer.querySelector('.character-display').textContent = current.char;
        
        // Auto-pronounce when displaying a new character
        // Only if speech synthesis is available
        if (window.speechSynthesis) {
            setTimeout(() => {
                pronounceCurrentCharacter();
            }, 500);
        }
    }
    
    // Shuffle array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    // Progress to next character
    function nextCharacter() {
        clearCanvas();
        currentCharIndex = (currentCharIndex + 1) % characters.length;
        updateProgressBar();
        displayCharacter();
        
        // Hide hint if it was showing
        hideHint();
    }
    
    // Update progress bar
    function updateProgressBar() {
        const percentage = ((currentCharIndex + 1) / characters.length) * 100;
        progressBar.style.width = `${percentage}%`;
    }
    
    // Update examples display
    function updateExamplesDisplay() {
        examplesContainer.innerHTML = '';
        
        // Add 5 random examples from the current level
        const shuffled = [...characters].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 5);
        
        selected.forEach(char => {
            const exampleDiv = document.createElement('div');
            exampleDiv.className = 'example-character';
            exampleDiv.innerHTML = `
                <span>${char.char}</span>
                <span>${char.pinyin}</span>
            `;
            
            exampleDiv.addEventListener('click', () => {
                // Find the index of this character in the main array
                const index = characters.findIndex(c => c.char === char.char);
                if (index !== -1) {
                    currentCharIndex = index;
                    displayCharacter();
                    updateProgressBar();
                    clearCanvas();
                }
            });
            
            // Add pronunciation on example characters too
            // Only if speech synthesis is available
            if (window.speechSynthesis) {
                const pronunciationIcon = document.createElement('i');
                pronunciationIcon.className = 'fas fa-volume-up';
                pronunciationIcon.style.marginLeft = '5px';
                pronunciationIcon.style.cursor = 'pointer';
                pronunciationIcon.style.color = '#4CAF50';
                pronunciationIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    pronounceCharacter(char.char, char.pinyin);
                });
                exampleDiv.appendChild(pronunciationIcon);
            }
            
            examplesContainer.appendChild(exampleDiv);
        });
    }
    
    // Show hint
    function showHint() {
        hintContainer.style.display = 'block';
        showHintBtn.style.display = 'none';
        hideHintBtn.style.display = 'inline-block';
    }
    
    // Hide hint
    function hideHint() {
        hintContainer.style.display = 'none';
        hideHintBtn.style.display = 'none';
        showHintBtn.style.display = 'inline-block';
    }
    
    // Increment streak
    function incrementStreak() {
        streak++;
        streakElement.textContent = streak;
        
        // Visual feedback for streak
        streakElement.style.color = '#4caf50';
        streakElement.style.fontSize = '20px';
        setTimeout(() => {
            streakElement.style.color = '';
            streakElement.style.fontSize = '';
        }, 500);
    }
    
    // Pronunciation functions
    function pronounceCurrentCharacter() {
        // Check if speech synthesis is available
        if (!window.speechSynthesis) {
            console.warn("Speech synthesis not supported in this browser");
            alert("Speech synthesis is not supported in your browser");
            return;
        }
        
        const current = characters[currentCharIndex];
        pronounceCharacter(current.char, current.pinyin);
    }
    
    function pronounceCharacter(character, pinyin) {
        // Check if speech synthesis is available
        if (!window.speechSynthesis) {
            console.warn("Speech synthesis not supported in this browser");
            return;
        }
        
        try {
            // Cancel any ongoing speech first (important for Windows)
            window.speechSynthesis.cancel();
            
            // First try to use voices that can handle Chinese
            let utterance = new SpeechSynthesisUtterance(character);
            
            // Try to find the Google 普通话（中国大陆）voice specifically
            const voices = window.speechSynthesis.getVoices();
            let targetVoice = null;
            
            if (voices && voices.length > 0) {
                // Look specifically for Google 普通话（中国大陆）
                targetVoice = voices.find(voice => 
                    voice.name === "Google 普通话（中国大陆）" && voice.lang === "zh-CN"
                );
                
                // If not found, try any Google Chinese voice
                if (!targetVoice) {
                    targetVoice = voices.find(voice => 
                        voice.name && voice.name.includes("Google") && 
                        voice.lang === "zh-CN"
                    );
                }
                
                // If still not found, try any Chinese voice
                if (!targetVoice) {
                    targetVoice = voices.find(voice => 
                        voice.lang && (
                            voice.lang.includes('zh') || 
                            voice.lang.includes('cmn') || 
                            (voice.name && (
                                voice.name.includes('Chinese') || 
                                voice.name.includes('Mandarin') ||
                                voice.name.includes('普通话')
                            ))
                        )
                    );
                }
            }
            
            // Log available voices to help with debugging
            console.log("Available voices:", voices.map(v => `${v.name} (${v.lang})`));
            
            if (targetVoice) {
                console.log("Using voice:", targetVoice.name, targetVoice.lang);
                utterance.voice = targetVoice;
                utterance.lang = targetVoice.lang;
            } else {
                // If no Chinese voice is available, we'll use any available voice
                // but set a Chinese language tag to improve pronunciation
                console.log("No Chinese voice found, using default with zh-CN language");
                utterance.lang = 'zh-CN';
            }
            
            // Make it speak a bit slower for learning purposes
            utterance.rate = 0.8;
            
            // Add a visual feedback while speaking
            const originalColor = characterDisplay.style.color || '#333';
            characterDisplay.style.color = '#d62828';
            
            utterance.onend = () => {
                characterDisplay.style.color = originalColor;
                // Reset the speech synthesis system (helps with Windows issues)
                setTimeout(() => {
                    window.speechSynthesis.cancel();
                }, 100);
            };
            
            window.speechSynthesis.speak(utterance);
            
            // Windows fix: if speech doesn't start within a reasonable time, reset it
            setTimeout(() => {
                if (window.speechSynthesis.speaking) {
                    window.speechSynthesis.pause();
                    window.speechSynthesis.resume();
                }
            }, 1000);
            
        } catch (error) {
            console.error("Error with speech synthesis:", error);
            // Try to reset the speech system on error
            try {
                window.speechSynthesis.cancel();
            } catch (e) {
                console.error("Failed to reset speech synthesis:", e);
            }
        }
    }
    
    // Event listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch event support
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
    
    clearBtn.addEventListener('click', clearCanvas);
    nextBtn.addEventListener('click', () => {
        incrementStreak();
        nextCharacter();
    });
    
    levelSelect.addEventListener('change', loadCharacters);
    
    showHintBtn.addEventListener('click', showHint);
    hideHintBtn.addEventListener('click', hideHint);
    pronounceBtn.addEventListener('click', pronounceCurrentCharacter);
    
    // Initialize the app
    initCanvas();
    loadCharacters();
});
