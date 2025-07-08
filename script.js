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
                
                <!-- Statistiche inline per mobile/tablet -->
                <div class="stats-inline">
                    <div class="stats-inline-grid">
                        <div class="stat-mini">
                            <span class="stat-icon">✅</span>
                            <div class="stat-value">${this.sessionStats.correct}</div>
                            <div class="stat-label">Corrette</div>
                        </div>
                        <div class="stat-mini">
                            <span class="stat-icon">❌</span>
                            <div class="stat-value">${this.sessionStats.incorrect}</div>
                            <div class="stat-label">Sbagliate</div>
                        </div>
                        <div class="stat-mini">
                            <span class="stat-icon">⏭️</span>
                            <div class="stat-value">${this.sessionStats.skipped}</div>
                            <div class="stat-label">Saltate</div>
                        </div>
                        <div class="stat-mini">
                            <span class="stat-icon">👁️</span>
                            <div class="stat-value">${this.sessionStats.cheated}</div>
                            <div class="stat-label">Aiuti</div>
                        </div>
                    </div>
                </div>
                
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
        
        // Aggiorna anche le statistiche inline (mobile/tablet)
        this.updateInlineStats();
    }
    
    updateInlineStats() {
        // Cerca tutti gli elementi delle statistiche inline e li aggiorna
        const inlineStats = document.querySelectorAll('.stat-mini .stat-value');
        if (inlineStats.length >= 4) {
            inlineStats[0].textContent = this.sessionStats.correct;
            inlineStats[1].textContent = this.sessionStats.incorrect;
            inlineStats[2].textContent = this.sessionStats.skipped;
            inlineStats[3].textContent = this.sessionStats.cheated;
        }
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
            // Reset dello stato per permettere un nuovo quiz
            this.usedWords.clear();
            this.showWelcomePage();
            this.showNotification('Quiz completato! 🎉 Puoi iniziarne un altro!', 'success');
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
                        <!-- Barra di progresso rimossa -->
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
            <div class="result-card ${cssClass}">
                <div class="result-icon">${icon}</div>
                <div class="result-message">${message}</div>
                <div class="result-stats">${this.getAdditionalInfo()}</div>
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
