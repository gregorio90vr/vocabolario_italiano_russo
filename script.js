// Quiz Application Logic - Enhanced Version
class RussoQuiz {
    constructor() {
        this.selectedCategories = ['sostantivo'];
        this.currentPage = 'welcome';
        this.currentWord = null;
        this.currentCategory = null;
        this.correctAnswer = null;
        this.showResult = false;
        this.userAnswer = '';
        this.sessionStats = {
            correct: 0,
            incorrect: 0,
            skipped: 0,
            cheated: 0
        };
        this.wordHistory = [];
        this.usedWords = new Set();
        this.autoAdvanceTimer = null;
        this.countdownElement = null;
        this.totalQuestions = 0;
        
        this.init();
    }
    
    init() {
        // Show loading screen briefly for better UX
        setTimeout(() => {
            this.hideLoadingScreen();
            this.showWelcomePage();
            this.setupEventListeners();
            this.updateQuickStats();
        }, 1000);
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const appContainer = document.getElementById('app-container');
        
        if (loadingScreen && appContainer) {
            loadingScreen.style.opacity = '0';
            loadingScreen.style.visibility = 'hidden';
            appContainer.classList.remove('hidden');
        }
    }
    
    setupEventListeners() {
        // Handle Enter key for text input
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.currentPage === 'quiz') {
                const input = document.getElementById('answer_input');
                if (input && !this.showResult) {
                    this.submitAnswer();
                } else if (this.showResult) {
                    this.nextWord();
                }
            }
        });

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('info-modal');
            if (e.target === modal) {
                this.closeInfoModal();
            }
        });

        // Theme toggle functionality
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Info button functionality
        const infoButton = document.getElementById('info-button');
        if (infoButton) {
            infoButton.addEventListener('click', () => this.showInfoModal());
        }
    }
    
    showWelcomePage() {
        this.currentPage = 'welcome';
        this.stopAutoAdvance();
        this.hideProgressBar();
        this.hideStatsSidebar();
        
        const pageContent = document.getElementById('page_content');
        pageContent.innerHTML = `
            <div class="welcome-page">
                <h2 class="welcome-title">Benvenuto al Russo Quiz!</h2>
                <p class="welcome-subtitle">
                    Impara il vocabolario russo-italiano attraverso quiz interattivi. 
                    Seleziona una o più categorie per iniziare il tuo percorso di apprendimento.
                </p>
                
                <div class="simple-card">
                    <h3 class="simple-title">🎯 Scegli le Categorie</h3>
                    <div class="category-grid">
                        ${Object.keys(categoryInfo).map(category => `
                            <div class="category-card ${this.selectedCategories.includes(category) ? 'selected' : ''}" 
                                 id="card-${category}" 
                                 onclick="quiz.selectCategory('${category}')"
                                 title="Clicca per selezionare/deselezionare">
                                <div class="selection-indicator">✓</div>
                                <span class="category-emoji">${categoryInfo[category].emoji}</span>
                                <p class="category-name">${categoryInfo[category].name}</p>
                            </div>
                        `).join('')}
                    </div>
                    <button class="start-button" onclick="quiz.startQuiz()">
                        ${this.getStartButtonText()}
                    </button>
                </div>
                
                <div class="simple-card">
                    <h3 class="simple-title">📊 Statistiche della Sessione</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <span class="stat-icon">✅</span>
                            <div class="stat-value">${this.sessionStats.correct}</div>
                            <div class="stat-label">Corrette</div>
                        </div>
                        <div class="stat-card">
                            <span class="stat-icon">❌</span>
                            <div class="stat-value">${this.sessionStats.incorrect}</div>
                            <div class="stat-label">Sbagliate</div>
                        </div>
                        <div class="stat-card">
                            <span class="stat-icon">⏭️</span>
                            <div class="stat-value">${this.sessionStats.skipped}</div>
                            <div class="stat-label">Saltate</div>
                        </div>
                        <div class="stat-card">
                            <span class="stat-icon">👁️</span>
                            <div class="stat-value">${this.sessionStats.cheated}</div>
                            <div class="stat-label">Aiuti</div>
                        </div>
                    </div>
                    ${this.getAccuracyDisplay()}
                </div>
            </div>
        `;
    }

    getAccuracyDisplay() {
        const total = this.sessionStats.correct + this.sessionStats.incorrect;
        if (total === 0) return '';
        
        const accuracy = Math.round((this.sessionStats.correct / total) * 100);
        return `
            <div style="margin-top: 20px; text-align: center;">
                <div style="font-size: 1.2em; font-weight: 600; color: #667eea;">
                    Precisione: ${accuracy}%
                </div>
                <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                    ${this.sessionStats.correct} corrette su ${total} risposte
                </div>
            </div>
        `;
    }

    selectCategory(category) {
        if (this.selectedCategories.includes(category)) {
            if (this.selectedCategories.length > 1) {
                this.selectedCategories = this.selectedCategories.filter(cat => cat !== category);
                document.getElementById(`card-${category}`).classList.remove('selected');
            }
        } else {
            this.selectedCategories.push(category);
            document.getElementById(`card-${category}`).classList.add('selected');
        }
        
        this.updateStartButton();
    }
    
    updateStartButton() {
        const button = document.querySelector('.start-button');
        if (button) {
            button.textContent = this.getStartButtonText();
        }
    }
    
    getStartButtonText() {
        const count = this.selectedCategories.length;
        const totalWords = this.getTotalWordsCount();
        
        if (count === 1) {
            return `🚀 Inizia Quiz! (${totalWords} parole)`;
        } else {
            return `🚀 Inizia Quiz! (${count} categorie, ${totalWords} parole)`;
        }
    }

    getTotalWordsCount() {
        let total = 0;
        this.selectedCategories.forEach(category => {
            total += Object.keys(vocab[category]).length;
        });
        return total;
    }
    
    startQuiz() {
        this.currentPage = 'quiz';
        this.totalQuestions = Math.min(this.getTotalWordsCount(), 10); // Limita il quiz a un massimo di 10 parole
        this.showProgressBar();
        this.showStatsSidebar();
        this.nextWord();
    }

    showProgressBar() {
        const progressContainer = document.getElementById('progress-container');
        if (progressContainer) {
            progressContainer.classList.remove('hidden');
        }
    }

    hideProgressBar() {
        const progressContainer = document.getElementById('progress-container');
        if (progressContainer) {
            progressContainer.classList.add('hidden');
        }
    }

    showStatsSidebar() {
        const sidebar = document.getElementById('stats-sidebar');
        if (sidebar && window.innerWidth > 1024) {
            sidebar.classList.remove('hidden');
        }
    }

    hideStatsSidebar() {
        const sidebar = document.getElementById('stats-sidebar');
        if (sidebar) {
            sidebar.classList.add('hidden');
        }
    }

    updateProgress() {
        const answered = this.sessionStats.correct + this.sessionStats.incorrect + this.sessionStats.skipped + this.sessionStats.cheated;
        const percentage = Math.min((answered / this.totalQuestions) * 100, 100);
        
        const progressFill = document.getElementById('progress-fill');
        const progressStats = document.getElementById('progress-stats');
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        
        if (progressStats) {
            progressStats.textContent = `${answered}/${this.totalQuestions}`;
        }
    }

    updateQuickStats() {
        document.getElementById('quick-correct').textContent = this.sessionStats.correct;
        document.getElementById('quick-incorrect').textContent = this.sessionStats.incorrect;
        document.getElementById('quick-skipped').textContent = this.sessionStats.skipped;
    }
    
    nextWord() {
        this.stopAutoAdvance();
        this.showResult = false;

        // Ottieni parole disponibili dalle categorie selezionate
        const availableWords = [];
        this.selectedCategories.forEach(category => {
            Object.keys(vocab[category]).forEach(word => {
                if (!this.usedWords.has(`${category}:${word}`)) {
                    availableWords.push({ word, category, translation: vocab[category][word] });
                }
            });
        });

        if (availableWords.length === 0 || this.usedWords.size >= 10) { // Limita il quiz a un massimo di 10 parole
            this.showWelcomePage();
            this.showNotification('Quiz completato! 🎉', 'success');
            return;
        }

        const randomIndex = Math.floor(Math.random() * availableWords.length);
        const selectedWord = availableWords[randomIndex];

        this.currentWord = selectedWord.word;
        this.currentCategory = selectedWord.category;
        this.correctAnswer = selectedWord.translation;
        this.userAnswer = '';

        this.usedWords.add(`${this.currentCategory}:${this.currentWord}`);

        this.renderQuizPage();
        this.updateProgress();
        this.updateQuickStats();
    }
    
    renderQuizPage() {
        const pageContent = document.getElementById('page_content');
        pageContent.innerHTML = `
            <div class="quiz-page">
                <button class="back-button" onclick="quiz.showWelcomePage()">
                    ← Torna al Menu Principale
                </button>
                
                <div class="quiz-card">
                    <div class="category-badge">
                        ${categoryInfo[this.currentCategory].emoji} ${categoryInfo[this.currentCategory].name}
                    </div>
                    <div class="russian-word">${this.currentWord}</div>
                    
                    ${this.showResult ? this.renderResult() : this.renderQuizInput()}
                </div>
            </div>
        `;
        
        if (!this.showResult) {
            // Focus on input with slight delay for better UX
            setTimeout(() => {
                const input = document.getElementById('answer_input');
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 100);
        }
    }
    
    renderQuizInput() {
        return `
            <div>
                <input type="text" 
                       id="answer_input" 
                       class="form-control" 
                       placeholder="Scrivi la traduzione italiana qui..." 
                       value="${this.userAnswer}"
                       oninput="quiz.updateUserAnswer(this.value)"
                       autocomplete="off"
                       spellcheck="false">
                
                <div class="btn-group">
                    <button class="btn btn-primary" onclick="quiz.submitAnswer()" title="Conferma la tua risposta">
                        ✓ Conferma Risposta
                    </button>
                    <button class="btn btn-warning" onclick="quiz.skipWord()" title="Salta questa parola">
                        ⏭️ Salta Parola
                    </button>
                    <button class="btn btn-secondary" onclick="quiz.showSolution()" title="Mostra la soluzione">
                        👁️ Mostra Soluzione
                    </button>
                </div>
                
                <div style="margin-top: 20px; color: #666; font-size: 0.9em; text-align: center;">
                    💡 Suggerimento: Premi Invio per confermare la risposta
                </div>
            </div>
        `;
    }
    
    renderResult() {
        const resultType = this.getResultType();
        let message = '';
        let cssClass = '';
        let emoji = '';
        
        switch (resultType) {
            case 'correct':
                message = 'Perfetto! Risposta esatta!';
                cssClass = 'correct';
                emoji = '🎉';
                break;
            case 'incorrect':
                message = `Non è corretto. La risposta giusta è: "${this.correctAnswer}"`;
                cssClass = 'incorrect';
                emoji = '❌';
                break;
            case 'skipped':
                message = `Parola saltata. La traduzione corretta era: "${this.correctAnswer}"`;
                cssClass = 'solution';
                emoji = '⏭️';
                break;
            case 'cheated':
                message = `Ecco la soluzione: "${this.correctAnswer}"`;
                cssClass = 'solution';
                emoji = '👁️';
                break;
        }
        
        return `
            <div class="result-message ${cssClass}">
                ${emoji} ${message}
                ${this.getAdditionalInfo()}
            </div>
            <div class="btn-group">
                <button class="btn btn-success" onclick="quiz.nextWord()" title="Vai alla prossima parola">
                    ▶️ Prossima Parola
                </button>
                <button class="btn btn-secondary" onclick="quiz.showWelcomePage()" title="Torna al menu principale">
                    🏠 Menu Principale
                </button>
            </div>
        `;
    }

    getAdditionalInfo() {
        const total = this.sessionStats.correct + this.sessionStats.incorrect;
        if (total > 0) {
            const accuracy = Math.round((this.sessionStats.correct / total) * 100);
            return `<div style="margin-top: 10px; font-size: 0.9em; opacity: 0.8;">
                Precisione attuale: ${accuracy}% (${this.sessionStats.correct}/${total})
            </div>`;
        }
        return '';
    }
    
    updateUserAnswer(value) {
        this.userAnswer = value;
    }
    
    submitAnswer() {
        if (!this.userAnswer.trim()) {
            this.showNotification('⚠️ Inserisci una risposta prima di confermare!', 'warning');
            return;
        }
        
        const isCorrect = this.checkAnswer(this.userAnswer.trim(), this.correctAnswer);
        
        if (isCorrect) {
            this.sessionStats.correct++;
            this.wordHistory.push({
                word: this.currentWord,
                category: this.currentCategory,
                correctAnswer: this.correctAnswer,
                userAnswer: this.userAnswer.trim(),
                result: 'correct'
            });
            this.showNotification('🎉 Risposta corretta!', 'success');
        } else {
            this.sessionStats.incorrect++;
            this.wordHistory.push({
                word: this.currentWord,
                category: this.currentCategory,
                correctAnswer: this.correctAnswer,
                userAnswer: this.userAnswer.trim(),
                result: 'incorrect'
            });
        }
        
        this.showResult = true;
        this.renderQuizPage();
        this.startAutoAdvance(4); // Auto-advance after 4 seconds
    }
    
    skipWord() {
        this.sessionStats.skipped++;
        this.wordHistory.push({
            word: this.currentWord,
            category: this.currentCategory,
            correctAnswer: this.correctAnswer,
            userAnswer: '',
            result: 'skipped'
        });
        
        this.showResult = true;
        this.renderQuizPage();
        this.startAutoAdvance(3); // Auto-advance after 3 seconds
    }
    
    showSolution() {
        this.sessionStats.cheated++;
        this.wordHistory.push({
            word: this.currentWord,
            category: this.currentCategory,
            correctAnswer: this.correctAnswer,
            userAnswer: '',
            result: 'cheated'
        });
        
        this.showResult = true;
        this.renderQuizPage();
        this.startAutoAdvance(3); // Auto-advance after 3 seconds
    }
    
    checkAnswer(userAnswer, correctAnswer) {
        // Normalize answers for comparison
        const normalize = (str) => str.toLowerCase()
            .replace(/[àáâãäå]/g, 'a')
            .replace(/[èéêë]/g, 'e')
            .replace(/[ìíîï]/g, 'i')
            .replace(/[òóôõö]/g, 'o')
            .replace(/[ùúûü]/g, 'u')
            .replace(/[ñ]/g, 'n')
            .replace(/[ç]/g, 'c')
            .replace(/[^a-z0-9]/g, '');
        
        const normalizedUser = normalize(userAnswer);
        const normalizedCorrect = normalize(correctAnswer);
        
        // Check exact match
        if (normalizedUser === normalizedCorrect) return true;
        
        // Check if correct answer contains multiple options separated by comma or slash
        const options = correctAnswer.split(/[,\/]/).map(opt => normalize(opt.trim()));
        return options.some(option => normalizedUser === option);
    }
    
    getResultType() {
        const lastEntry = this.wordHistory[this.wordHistory.length - 1];
        return lastEntry ? lastEntry.result : 'correct';
    }
    
    startAutoAdvance(seconds) {
        this.stopAutoAdvance();
        
        // Create countdown display
        this.countdownElement = document.createElement('div');
        this.countdownElement.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, #4facfe, #00f2fe);
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            font-weight: 600;
            font-size: 1em;
            box-shadow: 0 6px 20px rgba(79, 172, 254, 0.4);
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
            cursor: pointer;
        `;
        
        // Add click to advance immediately
        this.countdownElement.onclick = () => {
            this.stopAutoAdvance();
            this.nextWord();
        };
        
        document.body.appendChild(this.countdownElement);
        
        let timeLeft = seconds;
        
        const updateCountdown = () => {
            if (timeLeft > 0) {
                this.countdownElement.innerHTML = `
                    <div>🕒 Prossima parola in ${timeLeft}s</div>
                    <div style="font-size: 0.8em; opacity: 0.8; margin-top: 2px;">Clicca per andare subito</div>
                `;
                timeLeft--;
            } else {
                this.stopAutoAdvance();
                this.nextWord();
            }
        };
        
        updateCountdown();
        this.autoAdvanceTimer = setInterval(updateCountdown, 1000);
    }
    
    stopAutoAdvance() {
        if (this.autoAdvanceTimer) {
            clearInterval(this.autoAdvanceTimer);
            this.autoAdvanceTimer = null;
        }
        if (this.countdownElement) {
            this.countdownElement.remove();
            this.countdownElement = null;
        }
    }

    // New utility methods
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#11998e' : type === 'warning' ? '#f093fb' : '#667eea'};
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            font-weight: 600;
            z-index: 10001;
            animation: slideDown 0.3s ease-out;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    showInfoModal() {
        const modal = document.getElementById('info-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    closeInfoModal() {
        const modal = document.getElementById('info-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    toggleTheme() {
        const themeIcon = document.querySelector('.theme-icon');
        const body = document.body;
        
        if (body.classList.contains('dark-theme')) {
            body.classList.remove('dark-theme');
            if (themeIcon) themeIcon.textContent = '🌙';
        } else {
            body.classList.add('dark-theme');
            if (themeIcon) themeIcon.textContent = '☀️';
        }
    }

    // Add keyboard shortcuts
    handleKeyboardShortcuts(e) {
        if (this.currentPage === 'quiz' && !this.showResult) {
            switch(e.key) {
                case 'Escape':
                    this.showWelcomePage();
                    break;
                case 'Tab':
                    e.preventDefault();
                    this.skipWord();
                    break;
            }
        }
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    
    @keyframes slideUp {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .dark-theme {
        filter: invert(1) hue-rotate(180deg);
    }
    
    .dark-theme img,
    .dark-theme video,
    .dark-theme .flag {
        filter: invert(1) hue-rotate(180deg);
    }
`;
document.head.appendChild(style);

// Initialize the quiz when page loads
let quiz;
document.addEventListener('DOMContentLoaded', () => {
    quiz = new RussoQuiz();
    
    // Add keyboard event listener
    document.addEventListener('keydown', (e) => {
        if (quiz) {
            quiz.handleKeyboardShortcuts(e);
        }
    });
});
