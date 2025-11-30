let guesses = [];
let possibleNumbers = [];
let editingIndex = -1;

// Check if a number has unique digits
function hasUniqueDigits(numStr) {
    const digits = numStr.split('');
    return digits.length === new Set(digits).size;
}

// Initialize possible numbers (only numbers with unique digits and no zero)
function initializePossibleNumbers() {
    possibleNumbers = [];
    for (let i = 0; i <= 999; i++) {
        const numStr = i.toString().padStart(3, '0');
        if (hasUniqueDigits(numStr) && !numStr.includes('0')) {
            possibleNumbers.push(numStr);
        }
    }
}

// Check if a guess matches the criteria
function checkMatch(actual, guess, correctNums, correctPos) {
    let actualDigits = actual.split('');
    let guessDigits = guess.split('');
    
    // Count correct positions
    let positions = 0;
    let actualRemaining = [];
    let guessRemaining = [];
    
    for (let i = 0; i < 3; i++) {
        if (actualDigits[i] === guessDigits[i]) {
            positions++;
        } else {
            actualRemaining.push(actualDigits[i]);
            guessRemaining.push(guessDigits[i]);
        }
    }
    
    // Count correct numbers (including correct positions)
    let numbers = positions;
    for (let digit of guessRemaining) {
        let idx = actualRemaining.indexOf(digit);
        if (idx !== -1) {
            numbers++;
            actualRemaining.splice(idx, 1);
        }
    }
    
    return numbers === correctNums && positions === correctPos;
}

// Filter possible numbers based on guesses
function filterPossibleNumbers() {
    possibleNumbers = possibleNumbers.filter(num => {
        return guesses.every(guess => {
            return checkMatch(num, guess.numbers, guess.correctNumbers, guess.correctPositions);
        });
    });
    
    updateStats();
}

// Generate suggestions
function generateSuggestions() {
    if (possibleNumbers.length === 0) {
        return [];
    }

    if (possibleNumbers.length <= 5) {
        return possibleNumbers.slice(0, 5);
    }

    // Smart suggestion: pick diverse numbers
    let suggestions = [];
    let step = Math.floor(possibleNumbers.length / 5);
    
    for (let i = 0; i < 5 && i * step < possibleNumbers.length; i++) {
        suggestions.push(possibleNumbers[i * step]);
    }

    return suggestions;
}

// Update statistics
function updateStats() {
    document.getElementById('totalGuesses').textContent = guesses.length;
    document.getElementById('possibleAnswers').textContent = possibleNumbers.length;
}

// Add a guess
function addGuess() {
    const numbers = document.getElementById('numbers').value;
    const correctNumbers = parseInt(document.getElementById('correctNumbers').value);
    const correctPositions = parseInt(document.getElementById('correctPositions').value);

    // Validation
    if (numbers.length !== 3 || !/^\d{3}$/.test(numbers)) {
        alert('กรุณาใส่ตัวเลข 3 หลัก');
        return;
    }

    // Check for unique digits
    if (!hasUniqueDigits(numbers)) {
        alert('ตัวเลขแต่ละหลักต้องไม่ซ้ำกัน (เช่น 112, 133 ไม่ถูกต้อง)');
        return;
    }

    if (isNaN(correctNumbers) || correctNumbers < 0 || correctNumbers > 3) {
        alert('กรุณาใส่จำนวนตัวเลขที่ถูก (0-3)');
        return;
    }

    if (isNaN(correctPositions) || correctPositions < 0 || correctPositions > 3) {
        alert('กรุณาใส่จำนวนตำแหน่งที่ถูก (0-3)');
        return;
    }

    if (correctPositions > correctNumbers) {
        alert('จำนวนตำแหน่งที่ถูกต้องไม่สามารถมากกว่าจำนวนตัวเลขที่ถูกต้องได้');
        return;
    }

    // Check if this is the winning guess
    if (correctNumbers === 3 && correctPositions === 3) {
        alert('🎉 ยินดีด้วย! คุณทายถูกแล้ว! คำตอบคือ ' + numbers);
    }

    // Add or update guess
    if (editingIndex !== -1) {
        guesses[editingIndex] = {
            numbers: numbers,
            correctNumbers: correctNumbers,
            correctPositions: correctPositions
        };
        editingIndex = -1;
        document.querySelector('.btn-add').textContent = '➕ เพิ่มข้อมูล';
        // Re-initialize and filter all guesses
        initializePossibleNumbers();
        guesses.forEach(guess => {
            possibleNumbers = possibleNumbers.filter(num => {
                return checkMatch(num, guess.numbers, guess.correctNumbers, guess.correctPositions);
            });
        });
        updateStats();
    } else {
        guesses.push({
            numbers: numbers,
            correctNumbers: correctNumbers,
            correctPositions: correctPositions
        });
        // Filter incrementally
        filterPossibleNumbers();
    }

    // Update display
    displayHistory();
    displaySuggestions();

    // Clear inputs
    document.getElementById('numbers').value = '';
    document.getElementById('correctNumbers').value = '';
    document.getElementById('correctPositions').value = '';
}

// Display history
function displayHistory() {
    const historyList = document.getElementById('historyList');
    
    if (guesses.length === 0) {
        historyList.innerHTML = '<div class="empty-state">ยังไม่มีข้อมูล กรุณาใส่ข้อมูลการทายของคุณ</div>';
        return;
    }

    historyList.innerHTML = guesses.map((guess, index) => `
        <div class="history-item">
            <div class="history-numbers">${guess.numbers}</div>
            <div class="history-result">
                <span class="result-badge correct-number">ถูก ${guess.correctNumbers} ตัว</span>
                <span class="result-badge correct-position">ถูก ${guess.correctPositions} ตำแหน่ง</span>
            </div>
            <div class="history-actions">
                <button class="btn-edit" onclick="editGuess(${index})" title="แก้ไข">✏️</button>
                <button class="btn-delete" onclick="deleteGuess(${index})" title="ลบ">🗑️</button>
            </div>
        </div>
    `).reverse().join('');
}

// Display suggestions
function displaySuggestions() {
    const suggestionSection = document.getElementById('suggestionSection');
    const suggestionNumbers = document.getElementById('suggestionNumbers');
    const suggestionText = document.getElementById('suggestionText');

    if (guesses.length === 0) {
        suggestionSection.style.display = 'none';
        return;
    }

    const suggestions = generateSuggestions();
    
    if (suggestions.length === 0) {
        suggestionText.textContent = '❌ ไม่พบคำตอบที่เป็นไปได้ กรุณาตรวจสอบข้อมูลที่ใส่';
        suggestionNumbers.innerHTML = '';
        suggestionSection.style.display = 'block';
        return;
    }

    if (suggestions.length === 1) {
        suggestionText.textContent = '🎯 คำตอบที่เป็นไปได้เหลือ 1 คำตอบ!';
    } else {
        suggestionText.textContent = `💡 แนะนำตัวเลขถัดไป (เหลือ ${possibleNumbers.length} คำตอบที่เป็นไปได้)`;
    }

    suggestionNumbers.innerHTML = suggestions.map(num => 
        `<div class="suggestion-number" onclick="useSuggestion('${num}')">${num}</div>`
    ).join('');

    suggestionSection.style.display = 'block';
}

// Use suggestion
function useSuggestion(number) {
    document.getElementById('numbers').value = number;
    document.getElementById('numbers').focus();
}

// Edit guess
function editGuess(index) {
    const guess = guesses[index];
    document.getElementById('numbers').value = guess.numbers;
    document.getElementById('correctNumbers').value = guess.correctNumbers;
    document.getElementById('correctPositions').value = guess.correctPositions;
    editingIndex = index;
    document.querySelector('.btn-add').textContent = '💾 อัปเดตข้อมูล';
    document.getElementById('numbers').focus();
}

// Delete guess
function deleteGuess(index) {
    if (confirm('คุณต้องการลบข้อมูลนี้หรือไม่?')) {
        guesses.splice(index, 1);
        // Re-filter all guesses
        initializePossibleNumbers();
        guesses.forEach(guess => {
            possibleNumbers = possibleNumbers.filter(num => {
                return checkMatch(num, guess.numbers, guess.correctNumbers, guess.correctPositions);
            });
        });
        updateStats();
        displayHistory();
        displaySuggestions();
    }
}

// Reset game
function resetGame() {
    if (guesses.length > 0 && !confirm('คุณต้องการเริ่มเกมใหม่หรือไม่?')) {
        return;
    }

    guesses = [];
    editingIndex = -1;
    initializePossibleNumbers();
    displayHistory();
    displaySuggestions();
    updateStats();
    
    document.getElementById('numbers').value = '';
    document.getElementById('correctNumbers').value = '';
    document.getElementById('correctPositions').value = '';
    document.querySelector('.btn-add').textContent = '➕ เพิ่มข้อมูล';
}

// Add Enter key support
document.getElementById('correctPositions').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addGuess();
    }
});

// Initialize
initializePossibleNumbers();
updateStats();