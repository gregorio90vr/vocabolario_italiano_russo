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
        // Verifica che i dati del vocabolario siano caricati
        if (typeof vocab === 'undefined' || typeof categoryInfo === 'undefined') {
            console.error('Dati del vocabolario non caricati!');
            setTimeout(() => this.init(), 500); // Riprova dopo 500ms
            return;
        }
        
        // Setup event listeners immediately
        this.setupEventListeners();
        
        // Show loading screen briefly for better UX
        setTimeout(() => {
            this.hideLoadingScreen();
            this.showWelcomePage();
            this.updateQuickStats();
            
            // Re-setup event listeners after DOM is fully loaded
            this.setupModalEventListeners();
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

        // Handle Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('info-modal');
                if (modal && !modal.classList.contains('hidden')) {
                    this.closeInfoModal();
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

        // Modal close button functionality
        const modalCloseBtn = document.querySelector('.modal-close');
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => this.closeInfoModal());
        }
    }
    
    setupModalEventListeners() {
        // Gestisci il click sul pulsante di chiusura del modal
        const modalCloseBtn = document.querySelector('.modal-close');
        if (modalCloseBtn) {
            modalCloseBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeInfoModal();
            };
        }
        
        // Gestisci il click sull'overlay del modal (sfondo)
        const modal = document.getElementById('info-modal');
        if (modal) {
            modal.onclick = (e) => {
                if (e.target === modal) {
                    this.closeInfoModal();
                }
            };
            
            // Evita che i click sul contenuto del modal lo chiudano
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.onclick = (e) => {
                    e.stopPropagation();
                };
            }
        }
        
        // Gestisci il click sul pulsante info
        const infoButton = document.getElementById('info-button');
        if (infoButton) {
            infoButton.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showInfoModal();
            };
        }
        
        // Gestisci il click sul footer link "Info"
        const footerInfoLinks = document.querySelectorAll('.footer-link');
        footerInfoLinks.forEach(link => {
            if (link.textContent.includes('Info')) {
                link.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showInfoModal();
                };
            }
        });
    }
    
    showWelcomePage() {
        this.currentPage = 'welcome';
        this.stopAutoAdvance();
        // Rimuoviamo la barra di progresso
        // this.hideProgressBar();
        this.hideStatsSidebar();
        
        const pageContent = document.getElementById('page_content');
        if (!pageContent) {
            console.error('Elemento page_content non trovato!');
            return;
        }
        
        // Verifica che categoryInfo sia disponibile
        if (typeof categoryInfo === 'undefined') {
            console.error('categoryInfo non definito!');
            pageContent.innerHTML = '<div style="text-align:center;padding:50px;">Errore: Dati del vocabolario non caricati</div>';
            return;
        }
        
        pageContent.innerHTML = `
            <div class="welcome-page">
                <h2 class="welcome-title">Benvenuto al Russo Quiz!</h2>
                <p class="welcome-subtitle">
                    Impara il vocabolario russo-italiano attraverso quiz interattivi. 
                    Seleziona una o più categorie per iniziare il tuo percorso di apprendimento.
                </p>
                
                <!-- Statistiche compatte solo se ci sono dati -->
                ${this.getCompactStatsDisplay()}
                
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
            </div>
        `;
    }

    getCompactStatsDisplay() {
        const totalAnswered = this.sessionStats.correct + this.sessionStats.incorrect + this.sessionStats.skipped + this.sessionStats.cheated;
        
        if (totalAnswered === 0) return '';
        
        return `
            <div class="session-summary">
                <div class="summary-header">
                    <span class="summary-icon">📈</span>
                    <span class="summary-title">Sessione Corrente</span>
                </div>
                <div class="summary-content">
                    <span class="summary-text">${totalAnswered} parole studiate</span>
                    ${this.sessionStats.correct > 0 ? `<span class="summary-badge correct">${this.sessionStats.correct} ✅</span>` : ''}
                    ${this.sessionStats.incorrect > 0 ? `<span class="summary-badge incorrect">${this.sessionStats.incorrect} ❌</span>` : ''}
                    ${this.sessionStats.skipped > 0 ? `<span class="summary-badge skipped">${this.sessionStats.skipped} ⏭️</span>` : ''}
                    ${this.sessionStats.cheated > 0 ? `<span class="summary-badge cheated">${this.sessionStats.cheated} 👁️</span>` : ''}
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
        if (typeof vocab === 'undefined') return 0;
        
        let total = 0;
        this.selectedCategories.forEach(category => {
            if (vocab[category] && typeof vocab[category] === 'object') {
                total += Object.keys(vocab[category]).length;
            }
        });
        return total;
    }
    
    startQuiz() {
        this.currentPage = 'quiz';
        this.totalQuestions = Math.min(this.getTotalWordsCount(), 10); // Limita il quiz a un massimo di 10 parole
        // Rimuoviamo la barra di progresso
        // this.showProgressBar();
        this.showStatsSidebar();
        this.nextWord();
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

    // Rimossa funzione updateProgress
    
    updateQuickStats() {
        // Aggiorna le statistiche nella sidebar (desktop)
        const quickCorrect = document.getElementById('quick-correct');
        const quickIncorrect = document.getElementById('quick-incorrect');
        const quickSkipped = document.getElementById('quick-skipped');
        
        if (quickCorrect) quickCorrect.textContent = this.sessionStats.correct;
        if (quickIncorrect) quickIncorrect.textContent = this.sessionStats.incorrect;
        if (quickSkipped) quickSkipped.textContent = this.sessionStats.skipped;
        
        // Aggiorna il progress indicator
        this.updateProgressIndicator();
    }
    
    updateProgressIndicator() {
        const progressIndicator = document.getElementById('progress-indicator');
        const progressCircleFill = document.getElementById('progress-circle-fill');
        const progressPercentage = document.getElementById('progress-percentage');
        
        if (!progressIndicator || !progressCircleFill || !progressPercentage) return;
        
        const totalQuestions = 10;
        const completedQuestions = this.usedWords.size;
        const percentage = Math.round((completedQuestions / totalQuestions) * 100);
        
        // Calcola il stroke-dashoffset per il cerchio (100.53 è la circonferenza per raggio 16)
        const circumference = 100.53; // 2 * π * 16
        const offset = circumference - (percentage / 100) * circumference;
        
        // Aggiorna il cerchio
        progressCircleFill.style.strokeDashoffset = offset;
        
        // Aggiorna il testo della percentuale
        progressPercentage.textContent = `${percentage}%`;
        
        // Aggiorna l'attributo data per i colori dinamici
        progressIndicator.setAttribute('data-progress', percentage.toString());
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
            // Mostra i risultati finali con fuochi d'artificio
            this.showFinalResults();
            return;
        }

        const randomIndex = Math.floor(Math.random() * availableWords.length);
        const selectedWord = availableWords[randomIndex];

        this.currentWord = selectedWord.word;
        this.currentCategory = selectedWord.category;
        this.correctAnswer = selectedWord.translation;
        this.userAnswer = '';

        this.usedWords.add(`${this.currentCategory}:${this.currentWord}`);

        // Usa il nuovo sistema di aggiornamento senza scroll jump
        if (document.querySelector('.quiz-container')) {
            this.updateQuizContent();
        } else {
            this.renderQuizPage();
        }
        
        // Forza l'aggiornamento dello stato dell'input per la nuova domanda
        this.updateInputState();
        
        // Rimuoviamo l'aggiornamento della barra di progresso
        // this.updateProgress();
        this.updateQuickStats();
    }
    
    renderQuizPage() {
        const pageContent = document.getElementById('page_content');
        
        // Nuovo layout quiz ottimizzato e accattivante
        pageContent.innerHTML = `
            <div class="quiz-container">
                <!-- Header moderno e minimalista -->
                <div class="quiz-header-modern">
                    <div class="header-left">
                        <button class="back-button-modern" onclick="quiz.showWelcomePage()">
                            <svg class="back-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                        </button>
                        <div class="quiz-title-modern">
                            <span class="language-indicator">🇷🇺 → 🇮🇹</span>
                        </div>
                    </div>
                    
                    <div class="header-right">
                        <!-- Progress Indicator -->
                        <div class="progress-indicator" id="progress-indicator">
                            <svg class="progress-circle" viewBox="0 0 40 40">
                                <circle class="progress-circle-bg" cx="20" cy="20" r="16"></circle>
                                <circle class="progress-circle-fill" cx="20" cy="20" r="16" id="progress-circle-fill"></circle>
                            </svg>
                            <div class="progress-percentage" id="progress-percentage">0%</div>
                        </div>
                    </div>
                </div>

                <!-- Area principale del quiz -->
                <div class="quiz-main-content">
                    <!-- Card della domanda -->
                    <div class="quiz-question-card">
                        <div class="category-pill">
                            <span class="category-emoji">${categoryInfo[this.currentCategory].emoji}</span>
                            <span class="category-name">${categoryInfo[this.currentCategory].name}</span>
                        </div>
                        
                        <div class="russian-word-display">
                            ${this.currentWord}
                        </div>
                        
                        <div class="translation-prompt">
                            Traduci in italiano:
                        </div>
                    </div>

                    <!-- Area input e messaggio -->
                    <div class="quiz-interaction-area">
                        <div class="input-section">
                            <input type="text" 
                                   id="answer_input" 
                                   class="quiz-input" 
                                   placeholder="Scrivi la traduzione qui..." 
                                   value="${this.userAnswer}"
                                   oninput="quiz.updateUserAnswer(this.value)"
                                   autocomplete="off"
                                   spellcheck="false">
                        </div>
                        
                        <div class="message-section" id="quiz_message">
                            ${this.showResult ? this.renderResultMessage() : this.renderInputHint()}
                        </div>
                    </div>
                </div>

                <!-- Bottoni fissi in basso -->
                <div class="quiz-actions-bottom">
                    <div class="action-buttons-grid">
                        <button id="primary_action" 
                                class="action-btn primary" 
                                onclick="quiz.handlePrimaryAction()"
                                title="${this.showResult ? 'Vai alla prossima parola' : 'Conferma la tua risposta'}">
                            <span class="btn-icon">${this.showResult ? '▶️' : '✓'}</span>
                            <span class="btn-text">${this.showResult ? 'Avanti' : 'Conferma'}</span>
                        </button>
                        
                        <button id="secondary_action" 
                                class="action-btn secondary" 
                                onclick="quiz.handleSecondaryAction()"
                                title="${this.showResult ? 'Torna al menu' : 'Salta questa parola'}">
                            <span class="btn-icon">${this.showResult ? '🏠' : '⏭️'}</span>
                            <span class="btn-text">${this.showResult ? 'Menu' : 'Salta'}</span>
                        </button>
                        
                        <button id="tertiary_action" 
                                class="action-btn tertiary" 
                                onclick="quiz.handleTertiaryAction()"
                                title="Mostra la soluzione" 
                                ${this.showResult ? 'style="display:none"' : ''}>
                            <span class="btn-icon">👁️</span>
                            <span class="btn-text">Aiuto</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Gestisci lo stato dell'input
        this.updateInputState();
    }
    
    updateQuizContent() {
        // Aggiorna la categoria e emoji
        const categoryEmoji = document.querySelector('.category-emoji');
        const categoryName = document.querySelector('.category-name');
        if (categoryEmoji) categoryEmoji.textContent = categoryInfo[this.currentCategory].emoji;
        if (categoryName) categoryName.textContent = categoryInfo[this.currentCategory].name;
        
        // Aggiorna la parola russa
        const russianWord = document.querySelector('.russian-word-display');
        if (russianWord) russianWord.textContent = this.currentWord;
        
        // Rimossa logica di aggiornamento barra progresso
        
        // Aggiorna l'input
        const answerInput = document.getElementById('answer_input');
        if (answerInput) {
            answerInput.value = this.userAnswer;
            // Assicurati che l'input sia abilitato per una nuova domanda
            if (!this.showResult) {
                answerInput.disabled = false;
                answerInput.style.opacity = '1';
            }
        }
        
        // Aggiorna area messaggi
        const messageArea = document.getElementById('quiz_message');
        if (messageArea) {
            messageArea.innerHTML = this.showResult ? this.renderResultMessage() : this.renderInputHint();
        }
        
        // Aggiorna bottoni
        const primaryBtn = document.getElementById('primary_action');
        const secondaryBtn = document.getElementById('secondary_action');
        const tertiaryBtn = document.getElementById('tertiary_action');
        
        if (primaryBtn) {
            const icon = primaryBtn.querySelector('.btn-icon');
            const text = primaryBtn.querySelector('.btn-text');
            if (icon) icon.textContent = this.showResult ? '▶️' : '✓';
            if (text) text.textContent = this.showResult ? 'Avanti' : 'Conferma';
            primaryBtn.title = this.showResult ? 'Vai alla prossima parola' : 'Conferma la tua risposta';
        }
        
        if (secondaryBtn) {
            const icon = secondaryBtn.querySelector('.btn-icon');
            const text = secondaryBtn.querySelector('.btn-text');
            if (icon) icon.textContent = this.showResult ? '🏠' : '⏭️';
            if (text) text.textContent = this.showResult ? 'Menu' : 'Salta';
            secondaryBtn.title = this.showResult ? 'Torna al menu' : 'Salta questa parola';
        }
        
        if (tertiaryBtn) {
            tertiaryBtn.style.display = this.showResult ? 'none' : 'flex';
        }
    }
    
    updateInputState() {
        const answerInput = document.getElementById('answer_input');
        if (!answerInput) return;

        if (this.showResult) {
            // Quando mostra il risultato, disabilita l'input ma mantienilo visibile
            answerInput.disabled = true;
            answerInput.style.opacity = '0.6';
        } else {
            // Quando è in modalità input, riabilita
            answerInput.disabled = false;
            answerInput.style.opacity = '1';

            // Focus solo su desktop per evitare problemi mobile
            if (window.innerWidth > 768) {
                setTimeout(() => {
                    answerInput.focus();
                    answerInput.select();
                }, 100);
            }
        }

        // Ensure input is editable during quiz
        if (this.currentPage === 'quiz' && !this.showResult) {
            answerInput.disabled = false;
        }
    }
    
    renderResultMessage() {
        const resultType = this.getResultType();
        let message = '';
        let cssClass = '';
        let icon = '';
        
        switch (resultType) {
            case 'correct':
                message = 'Perfetto! Risposta esatta!';
                cssClass = 'correct';
                icon = '🎉';
                break;
            case 'incorrect':
                message = `La risposta corretta è: "${this.correctAnswer}"`;
                cssClass = 'incorrect';
                icon = '❌';
                break;
            case 'skipped':
                message = `La traduzione corretta era: "${this.correctAnswer}"`;
                cssClass = 'skipped';
                icon = '⏭️';
                break;
            case 'cheated':
                message = `La soluzione è: "${this.correctAnswer}"`;
                cssClass = 'solution';
                icon = '👁️';
                break;
        }
        
        return `
            <div class="result-card-compact ${cssClass}">
                <div class="result-content">
                    <span class="result-icon-inline">${icon}</span>
                    <span class="result-message-inline">${message}</span>
                </div>
                <div class="result-timer-bar" id="timer-bar"></div>
            </div>
        `;
    }
    
    renderInputHint() {
        return `
            <div class="input-hint-new">
                <div class="hint-icon">💡</div>
                <div class="hint-text">Inserisci la traduzione italiana</div>
                <div class="hint-shortcut">Premi "Conferma" o Invio ⏎</div>
            </div>
        `;
    }
    
    // Gestori unificati per le azioni dei bottoni
    handlePrimaryAction() {
        if (this.showResult) {
            this.nextWord();
        } else {
            this.submitAnswer();
        }
    }
    
    handleSecondaryAction() {
        if (this.showResult) {
            this.showWelcomePage();
        } else {
            this.skipWord();
        }
    }
    
    handleTertiaryAction() {
        if (!this.showResult) {
            this.showSolution();
        }
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
            // Rimosso il pop-up di notifica per risposte corrette - il messaggio di risultato è sufficiente
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
        this.updateQuizContent();
        this.updateInputState();
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
        this.updateQuizContent();
        this.updateInputState();
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
        this.updateQuizContent();
        this.updateInputState();
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
    
    getAdditionalInfo() {
        const total = this.sessionStats.correct + this.sessionStats.incorrect;
        if (total > 0) {
            const accuracy = Math.round((this.sessionStats.correct / total) * 100);
            return `Precisione attuale: ${accuracy}% (${this.sessionStats.correct}/${total})`;
        }
        return '';
    }
    
    updateUserAnswer(value) {
        this.userAnswer = value;
    }

    startAutoAdvance(seconds) {
        this.stopAutoAdvance();
        
        // Trova la barra del timer nel messaggio di risultato
        const timerBar = document.getElementById('timer-bar');
        if (!timerBar) return;
        
        let timeLeft = seconds;
        const totalTime = seconds;
        
        // Inizializza la barra del timer
        timerBar.style.width = '100%';
        timerBar.style.transition = 'none';
        
        const updateTimer = () => {
            if (timeLeft > 0) {
                const percentage = (timeLeft / totalTime) * 100;
                timerBar.style.transition = 'width 1s linear';
                timerBar.style.width = `${percentage}%`;
                timeLeft--;
            } else {
                this.stopAutoAdvance();
                this.nextWord();
            }
        };
        
        // Avvia il timer dopo un breve delay per permettere la transizione CSS
        setTimeout(() => {
            updateTimer();
            this.autoAdvanceTimer = setInterval(updateTimer, 1000);
        }, 100);
    }
    
    stopAutoAdvance() {
        if (this.autoAdvanceTimer) {
            clearInterval(this.autoAdvanceTimer);
            this.autoAdvanceTimer = null;
        }
        // Rimuovi la gestione del countdownElement dato che ora usiamo la barra del timer integrata
    }

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

    calculateBadge(correctPercentage) {
        if (correctPercentage >= 90) {
            return { name: 'Oro', emoji: '🥇', color: '#FFD700' };
        } else if (correctPercentage >= 70) {
            return { name: 'Argento', emoji: '🥈', color: '#C0C0C0' };
        } else if (correctPercentage >= 50) {
            return { name: 'Bronzo', emoji: '🥉', color: '#CD7F32' };
        } else {
            return { name: 'Partecipazione', emoji: '🎖️', color: '#4169E1' };
        }
    }

    showFinalResults() {
        const totalWords = 10;
        const correctPercentage = (this.sessionStats.correct / totalWords) * 100;
        const incorrectPercentage = (this.sessionStats.incorrect / totalWords) * 100;
        const skippedPercentage = (this.sessionStats.skipped / totalWords) * 100;
        
        const badge = this.calculateBadge(correctPercentage);
        
        // Crea container per fuochi d'artificio
        const fireworksContainer = document.createElement('div');
        fireworksContainer.className = 'fireworks-container';
        document.body.appendChild(fireworksContainer);

        // Crea fuochi d'artificio multipli
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const firework = document.createElement('div');
                firework.className = 'firework';
                firework.style.left = Math.random() * 90 + 5 + '%';
                firework.style.animationDelay = Math.random() * 0.5 + 's';
                fireworksContainer.appendChild(firework);
            }, i * 200);
        }

        // Modal dei risultati
        const scoreModal = document.createElement('div');
        scoreModal.className = 'score-modal';
        scoreModal.innerHTML = `
            <div class="score-header">
                <h2>🎉 Quiz Completato! 🎉</h2>
            </div>
            <div class="badge-display">
                <div class="badge-icon" style="color: ${badge.color}; font-size: 4em;">${badge.emoji}</div>
                <div class="badge-name" style="color: ${badge.color}; font-size: 1.5em; font-weight: bold;">${badge.name}</div>
            </div>
            <div class="score-stats">
                <div class="stat-row correct">
                    <span class="stat-icon">✅</span>
                    <span class="stat-text">Corrette: ${this.sessionStats.correct}/10 (${correctPercentage.toFixed(1)}%)</span>
                </div>
                <div class="stat-row incorrect">
                    <span class="stat-icon">❌</span>
                    <span class="stat-text">Sbagliate: ${this.sessionStats.incorrect}/10 (${incorrectPercentage.toFixed(1)}%)</span>
                </div>
                <div class="stat-row skipped">
                    <span class="stat-icon">⏭️</span>
                    <span class="stat-text">Saltate: ${this.sessionStats.skipped}/10 (${skippedPercentage.toFixed(1)}%)</span>
                </div>
            </div>
            <div class="score-actions">
                <button class="score-btn primary" onclick="quiz.restartQuiz()">
                    🔄 Nuovo Quiz
                </button>
                <button class="score-btn secondary" onclick="quiz.closeScoreModal()">
                    🏠 Menu Principale
                </button>
            </div>
        `;
        document.body.appendChild(scoreModal);

        // Rimuovi fuochi d'artificio dopo 6 secondi
        setTimeout(() => {
            fireworksContainer.remove();
        }, 6000);
    }

    restartQuiz() {
        this.closeScoreModal();
        this.usedWords.clear();
        this.startQuiz();
    }

    closeScoreModal() {
        const modal = document.querySelector('.score-modal');
        const fireworks = document.querySelector('.fireworks-container');
        if (modal) modal.remove();
        if (fireworks) fireworks.remove();
        
        // Reset dello stato per permettere un nuovo quiz
        this.usedWords.clear();
        this.showWelcomePage();
    }

    showInfoModal() {
        const modal = document.getElementById('info-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            
            // Assicurati che gli event listeners siano configurati
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.onclick = () => this.closeInfoModal();
            }
            
            // Focus sul modal per accessibilità
            modal.focus();
        }
    }

    closeInfoModal() {
        const modal = document.getElementById('info-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
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

    /* Fireworks styles */
    .fireworks-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10000;
        overflow: hidden;
    }
    
    .firework {
        position: absolute;
        bottom: 10%;
        width: 8px;
        height: 8px;
        background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24);
        border-radius: 50%;
        animation: firework-explosion 2s ease-out forwards;
        box-shadow: 0 0 20px currentColor;
    }
    
    @keyframes firework-explosion {
        0% {
            transform: translateY(0) scale(1);
            opacity: 1;
        }
        25% {
            transform: translateY(-200px) scale(1.2);
            opacity: 0.8;
        }
        50% {
            transform: translateY(-400px) scale(2);
            opacity: 0.6;
        }
        75% {
            transform: translateY(-500px) scale(3);
            opacity: 0.3;
        }
        100% {
            transform: translateY(-600px) scale(0);
            opacity: 0;
        }
    }
    
    .score-modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        z-index: 10001;
        max-width: 400px;
        width: 90%;
        text-align: center;
        animation: scoreModalSlideIn 0.6s ease-out;
    }
    
    .score-header h2 {
        margin: 0 0 20px 0;
        font-size: 1.8em;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    }
    
    .badge-display {
        margin: 20px 0;
        padding: 20px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        backdrop-filter: blur(10px);
    }
    
    .badge-icon {
        animation: badgeBounce 1s ease-in-out infinite alternate;
    }
    
    .badge-name {
        margin-top: 10px;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
    }
    
    .score-stats {
        margin: 20px 0;
    }
    
    .stat-row {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 10px 0;
        padding: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        font-size: 1.1em;
    }
    
    .stat-row .stat-icon {
        margin-right: 10px;
        font-size: 1.2em;
    }
    
    .score-actions {
        display: flex;
        gap: 15px;
        margin-top: 25px;
        justify-content: center;
    }
    
    .score-btn {
        padding: 12px 20px;
        border: none;
        border-radius: 25px;
        font-size: 1em;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 120px;
    }
    
    .score-btn.primary {
        background: linear-gradient(45deg, #11998e, #38ef7d);
        color: white;
    }
    
    .score-btn.secondary {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 2px solid rgba(255, 255, 255, 0.3);
    }
    
    .score-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }
    
    @keyframes scoreModalSlideIn {
        from { 
            opacity: 0; 
            transform: translate(-50%, -60%) scale(0.8);
        }
        to { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1);
        }
    }
    
    @keyframes badgeBounce {
        from { transform: scale(1); }
        to { transform: scale(1.1); }
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

// Call this function at the end of the quiz
function endQuiz() {
    const correct = parseInt(document.getElementById("quick-correct").textContent, 10);
    const incorrect = parseInt(document.getElementById("quick-incorrect").textContent, 10);
    const skipped = parseInt(document.getElementById("quick-skipped").textContent, 10);

    showFinalScore(correct, incorrect, skipped);
}
