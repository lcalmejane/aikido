/**
 * Système d'Exercices Gamifiés AI-KIDO
 * Jeux de rôle et quiz interactifs pour la formation
 */

class AIKidoExercises {
    constructor() {
        this.currentExercise = null;
        this.score = 0;
        this.totalQuestions = 0;
        this.correctAnswers = 0;
        this.userProgress = this.loadProgress();
        this.achievements = this.loadAchievements();
        this.init();
    }

    /**
     * Initialisation du système d'exercices
     */
    init() {
        this.bindEvents();
        this.updateScoreDisplay();
        this.checkAchievements();
    }

    /**
     * Base de données des exercices
     */
    getExerciseDatabase() {
        return {
            'scenario-startup-mvp': {
                title: 'Startup MVP - Choix d\'Architecture',
                type: 'scenario',
                difficulty: 2,
                duration: 15,
                context: {
                    title: 'Contexte : Startup en Phase MVP',
                    description: `
                        Vous êtes lead developer dans une startup qui développe une plateforme e-commerce. 
                        L'équipe est petite (3 développeurs), le budget serré, et il faut livrer un MVP 
                        fonctionnel en 6 semaines. Le CEO pousse pour des fonctionnalités rapides, 
                        mais vous savez que des choix techniques précipités peuvent créer de la dette technique.
                    `,
                    constraints: [
                        'Budget limité : 6 semaines de développement',
                        'Équipe réduite : 3 développeurs junior/mid-level',
                        'Pression business : fonctionnalités visibles prioritaires',
                        'Évolutivité future : la plateforme doit pouvoir grandir'
                    ],
                    stakeholders: [
                        'CEO : Veut des résultats rapides et visibles',
                        'CTO : Préoccupé par la qualité technique',
                        'Équipe dev : Motivée mais inexpérimentée'
                    ]
                },
                situation: `
                    Vous devez implémenter un système de notifications pour les utilisateurs. 
                    Les notifications peuvent être envoyées par email, SMS, ou push mobile. 
                    Le CEO veut que ce soit "simple et rapide", mais vous anticipez que 
                    d'autres canaux (Slack, Discord, etc.) seront ajoutés plus tard.
                `,
                choices: [
                    {
                        id: 'hardcoded-solution',
                        title: 'Solution Hard-codée Rapide',
                        description: 'Créer 3 classes séparées EmailNotifier, SMSNotifier, PushNotifier avec du code dupliqué',
                        code: `
class EmailNotifier {
    send(message, recipient) {
        // Code spécifique email
        console.log(\`Email to \${recipient}: \${message}\`);
    }
}

class SMSNotifier {
    send(message, recipient) {
        // Code spécifique SMS (très similaire)
        console.log(\`SMS to \${recipient}: \${message}\`);
    }
}
                        `,
                        consequences: {
                            immediate: ['Développement très rapide (2 jours)', 'Code simple à comprendre', 'Fonctionne pour le MVP'],
                            longTerm: ['Duplication de code importante', 'Difficile à maintenir', 'Ajout de nouveaux canaux coûteux'],
                            biases: ['Biais de disponibilité', 'Pression temporelle'],
                            antiPatterns: ['Copy-Paste Programming', 'Spaghetti Code']
                        },
                        score: 2
                    },
                    {
                        id: 'strategy-pattern',
                        title: 'Strategy Pattern Adapté',
                        description: 'Implémenter le pattern Strategy avec une interface commune et des implémentations spécifiques',
                        code: `
interface NotificationStrategy {
    send(message: string, recipient: string): void;
}

class EmailStrategy implements NotificationStrategy {
    send(message: string, recipient: string) {
        // Logique email
    }
}

class NotificationService {
    constructor(private strategy: NotificationStrategy) {}
    
    notify(message: string, recipient: string) {
        this.strategy.send(message, recipient);
    }
}
                        `,
                        consequences: {
                            immediate: ['Développement modéré (4 jours)', 'Architecture propre', 'Extensible'],
                            longTerm: ['Ajout facile de nouveaux canaux', 'Code maintenable', 'Tests unitaires simples'],
                            biases: ['Évite le biais de confirmation', 'Pensée à long terme'],
                            patterns: ['Strategy Pattern', 'Dependency Injection']
                        },
                        score: 8
                    },
                    {
                        id: 'over-engineered',
                        title: 'Architecture Complexe',
                        description: 'Créer un système complet avec Factory, Observer, Command patterns et microservices',
                        code: `
// Architecture avec multiples patterns
class NotificationFactory {
    createNotifier(type: string): INotifier { /* ... */ }
}

class NotificationOrchestrator {
    private observers: Observer[] = [];
    private commandQueue: Command[] = [];
    // ... logique complexe
}

// + Microservice dédié aux notifications
// + Event sourcing
// + CQRS pattern
                        `,
                        consequences: {
                            immediate: ['Développement très long (3+ semaines)', 'Complexité élevée', 'Risque de bugs'],
                            longTerm: ['Maintenance difficile', 'Over-engineering', 'Équipe junior dépassée'],
                            biases: ['Effet Dunning-Kruger', 'Biais d\'engagement'],
                            antiPatterns: ['Over-Engineering', 'Gold Plating']
                        },
                        score: 1
                    }
                ],
                correctChoice: 'strategy-pattern',
                explanation: `
                    Dans ce contexte de startup MVP, le **Strategy Pattern** représente le meilleur équilibre 
                    entre rapidité de développement et qualité technique. Voici pourquoi :

                    **Pourquoi pas la solution hard-codée ?**
                    - Bien que rapide, elle créerait immédiatement de la dette technique
                    - Le biais de disponibilité nous fait sous-estimer le coût futur de maintenance
                    - L'anti-pattern "Copy-Paste Programming" rendrait l'ajout de nouveaux canaux très coûteux

                    **Pourquoi pas l'architecture complexe ?**
                    - L'effet Dunning-Kruger peut pousser à sur-estimer nos capacités d'implémentation
                    - Dans un contexte MVP, c'est de l'over-engineering qui retardera la livraison
                    - L'équipe junior aura du mal à maintenir une architecture aussi complexe

                    **Pourquoi le Strategy Pattern ?**
                    - Extensibilité : Ajouter de nouveaux canaux sera simple
                    - Maintenabilité : Code propre et testable
                    - Équilibre : Ni trop simple, ni trop complexe pour le contexte
                    - Évite les biais : Prise en compte du long terme sans sur-ingénierie
                `
            },

            'quiz-pattern-recognition': {
                title: 'Quiz - Reconnaissance de Patterns',
                type: 'quiz',
                difficulty: 3,
                duration: 10,
                questions: [
                    {
                        id: 'q1',
                        question: 'Quel pattern est illustré par ce code ?',
                        code: `
class DatabaseConnection {
    private static instance: DatabaseConnection;
    
    private constructor() {}
    
    static getInstance(): DatabaseConnection {
        if (!this.instance) {
            this.instance = new DatabaseConnection();
        }
        return this.instance;
    }
}
                        `,
                        options: [
                            { id: 'a', text: 'Factory Method', correct: false },
                            { id: 'b', text: 'Singleton', correct: true },
                            { id: 'c', text: 'Builder', correct: false },
                            { id: 'd', text: 'Prototype', correct: false }
                        ],
                        explanation: 'Ce code implémente le pattern Singleton avec la méthode getInstance() et le constructeur privé.'
                    },
                    {
                        id: 'q2',
                        question: 'Quel biais cognitif peut mener à l\'anti-pattern "Golden Hammer" ?',
                        options: [
                            { id: 'a', text: 'Biais de confirmation', correct: false },
                            { id: 'b', text: 'Biais d\'ancrage', correct: true },
                            { id: 'c', text: 'Effet Dunning-Kruger', correct: false },
                            { id: 'd', text: 'Biais de disponibilité', correct: false }
                        ],
                        explanation: 'Le biais d\'ancrage nous fait nous fixer sur la première solution connue, menant au "Golden Hammer".'
                    }
                ]
            },

            'roleplay-code-review': {
                title: 'Jeu de Rôle - Code Review Difficile',
                type: 'roleplay',
                difficulty: 4,
                duration: 20,
                context: {
                    title: 'Contexte : Code Review Tendue',
                    description: `
                        Vous êtes senior developer et devez faire une code review du travail de Sarah, 
                        une développeuse junior très motivée mais qui a implémenté une solution complexe 
                        avec plusieurs anti-patterns. Sarah est fière de son travail et a passé beaucoup 
                        de temps dessus. Comment gérez-vous cette situation délicate ?
                    `,
                    codeIssues: [
                        'God Object avec 500+ lignes',
                        'Méthodes avec 10+ paramètres',
                        'Logique métier dans les contrôleurs',
                        'Pas de tests unitaires',
                        'Noms de variables non explicites'
                    ]
                },
                scenarios: [
                    {
                        id: 'direct-criticism',
                        title: 'Critique Directe',
                        description: 'Pointer directement tous les problèmes dans la review',
                        approach: 'Approche directe et technique',
                        consequences: {
                            positive: ['Problèmes identifiés clairement'],
                            negative: ['Sarah se sent attaquée', 'Perte de motivation', 'Relation dégradée'],
                            biases: ['Biais de supériorité', 'Manque d\'empathie']
                        },
                        score: 3
                    },
                    {
                        id: 'constructive-mentoring',
                        title: 'Mentorat Constructif',
                        description: 'Expliquer les problèmes avec des exemples et proposer des solutions',
                        approach: 'Approche pédagogique et bienveillante',
                        consequences: {
                            positive: ['Sarah apprend', 'Relation renforcée', 'Amélioration continue'],
                            negative: ['Prend plus de temps', 'Nécessite de la patience'],
                            patterns: ['Mentoring Pattern', 'Constructive Feedback']
                        },
                        score: 9
                    },
                    {
                        id: 'avoid-conflict',
                        title: 'Éviter le Conflit',
                        description: 'Approuver le code pour éviter de blesser Sarah',
                        approach: 'Évitement du conflit',
                        consequences: {
                            positive: ['Pas de conflit immédiat', 'Sarah reste motivée'],
                            negative: ['Problèmes techniques persistent', 'Dette technique', 'Mauvais précédent'],
                            antiPatterns: ['Conflict Avoidance', 'Technical Debt Accumulation']
                        },
                        score: 2
                    }
                ],
                correctChoice: 'constructive-mentoring'
            }
        };
    }

    /**
     * Chargement d'un exercice
     */
    loadExercise(exerciseId) {
        const exercises = this.getExerciseDatabase();
        this.currentExercise = exercises[exerciseId];
        
        if (!this.currentExercise) {
            console.error(`Exercice ${exerciseId} non trouvé`);
            return;
        }

        this.renderExercise();
    }

    /**
     * Rendu de l'exercice
     */
    renderExercise() {
        const container = document.getElementById('exercise-container');
        if (!container) return;

        let html = '';

        // Header de l'exercice
        html += `
            <div class="exercise-header">
                <h2 class="exercise-title">${this.currentExercise.title}</h2>
                <div class="exercise-meta">
                    <span class="exercise-type">${this.formatType(this.currentExercise.type)}</span>
                    <span class="exercise-difficulty">${'⭐'.repeat(this.currentExercise.difficulty)}</span>
                    <span class="exercise-duration">${this.currentExercise.duration} min</span>
                </div>
                <div class="exercise-score">
                    <span>Score: ${this.score}</span>
                    <span>🏆</span>
                </div>
            </div>
        `;

        // Contenu selon le type
        switch (this.currentExercise.type) {
            case 'scenario':
                html += this.renderScenario();
                break;
            case 'quiz':
                html += this.renderQuiz();
                break;
            case 'roleplay':
                html += this.renderRoleplay();
                break;
        }

        container.innerHTML = html;
        this.bindExerciseEvents();
    }

    /**
     * Rendu d'un scénario
     */
    renderScenario() {
        const exercise = this.currentExercise;
        
        let html = `
            <div class="scenario-context">
                <h3>📋 ${exercise.context.title}</h3>
                <p>${exercise.context.description}</p>
                
                <div class="context-details">
                    <div class="constraints">
                        <h4>Contraintes :</h4>
                        <ul>
                            ${exercise.context.constraints.map(c => `<li>${c}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="stakeholders">
                        <h4>Parties prenantes :</h4>
                        <ul>
                            ${exercise.context.stakeholders.map(s => `<li>${s}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>

            <div class="scenario-situation">
                <h3>🎯 Situation</h3>
                <p>${exercise.situation}</p>
            </div>

            <div class="choice-section">
                <h3>🤔 Que faites-vous ?</h3>
                <div class="choice-options">
        `;

        exercise.choices.forEach(choice => {
            html += `
                <div class="choice-option" data-choice-id="${choice.id}">
                    <div class="choice-header">
                        <h4>${choice.title}</h4>
                        <p>${choice.description}</p>
                    </div>
                    
                    ${choice.code ? `
                        <div class="code-block" data-language="typescript">
                            <pre><code>${choice.code.trim()}</code></pre>
                        </div>
                    ` : ''}
                    
                    <button class="aikido-btn primary select-choice" data-choice-id="${choice.id}">
                        Choisir cette solution
                    </button>
                </div>
            `;
        });

        html += `
                </div>
            </div>

            <div id="choice-feedback" class="choice-feedback hidden">
                <!-- Le feedback sera affiché ici -->
            </div>
        `;

        return html;
    }

    /**
     * Rendu d'un quiz
     */
    renderQuiz() {
        const exercise = this.currentExercise;
        let html = `<div class="quiz-container">`;

        exercise.questions.forEach((question, index) => {
            html += `
                <div class="quiz-question" data-question-id="${question.id}">
                    <h3>Question ${index + 1}</h3>
                    <p>${question.question}</p>
                    
                    ${question.code ? `
                        <div class="code-block" data-language="typescript">
                            <pre><code>${question.code.trim()}</code></pre>
                        </div>
                    ` : ''}
                    
                    <div class="quiz-options">
                        ${question.options.map(option => `
                            <label class="quiz-option">
                                <input type="radio" name="q${index}" value="${option.id}" data-correct="${option.correct}">
                                <span>${option.text}</span>
                            </label>
                        `).join('')}
                    </div>
                    
                    <div class="question-feedback hidden">
                        <p>${question.explanation}</p>
                    </div>
                </div>
            `;
        });

        html += `
            <button class="aikido-btn success submit-quiz">Valider le Quiz</button>
        </div>`;

        return html;
    }

    /**
     * Gestion des événements d'exercice
     */
    bindExerciseEvents() {
        // Sélection de choix dans les scénarios
        document.querySelectorAll('.select-choice').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const choiceId = e.target.dataset.choiceId;
                this.handleChoiceSelection(choiceId);
            });
        });

        // Soumission de quiz
        const submitBtn = document.querySelector('.submit-quiz');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.handleQuizSubmission();
            });
        }
    }

    /**
     * Gestion de la sélection de choix
     */
    handleChoiceSelection(choiceId) {
        const exercise = this.currentExercise;
        const selectedChoice = exercise.choices.find(c => c.id === choiceId);
        const isCorrect = choiceId === exercise.correctChoice;

        // Mise à jour du score
        this.score += selectedChoice.score || 0;
        this.totalQuestions++;
        if (isCorrect) this.correctAnswers++;

        // Affichage du feedback
        this.showChoiceFeedback(selectedChoice, isCorrect);
        
        // Sauvegarde du progrès
        this.saveProgress();
        this.updateScoreDisplay();
        this.checkAchievements();
    }

    /**
     * Affichage du feedback pour un choix
     */
    showChoiceFeedback(choice, isCorrect) {
        const feedbackContainer = document.getElementById('choice-feedback');
        
        let html = `
            <div class="feedback-header ${isCorrect ? 'correct' : 'incorrect'}">
                <h3>${isCorrect ? '✅ Excellent choix !' : '❌ Choix sous-optimal'}</h3>
                <div class="score-gained">+${choice.score} points</div>
            </div>

            <div class="consequences-analysis">
                <h4>📊 Analyse des Conséquences</h4>
                
                <div class="consequences-grid">
                    <div class="immediate-consequences">
                        <h5>Conséquences Immédiates</h5>
                        <ul>
                            ${choice.consequences.immediate.map(c => `<li>${c}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="longterm-consequences">
                        <h5>Conséquences Long Terme</h5>
                        <ul>
                            ${choice.consequences.longTerm.map(c => `<li>${c}</li>`).join('')}
                        </ul>
                    </div>
                </div>

                ${choice.consequences.biases ? `
                    <div class="bias-analysis">
                        <h5>🧩 Biais Cognitifs Impliqués</h5>
                        <div class="bias-tags">
                            ${choice.consequences.biases.map(b => `<span class="bias-tag">${b}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}

                ${choice.consequences.antiPatterns ? `
                    <div class="antipattern-analysis">
                        <h5>⚠️ Anti-Patterns Identifiés</h5>
                        <div class="antipattern-tags">
                            ${choice.consequences.antiPatterns.map(ap => `<span class="antipattern-tag">${ap}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}

                ${choice.consequences.patterns ? `
                    <div class="pattern-analysis">
                        <h5>🏗️ Patterns Utilisés</h5>
                        <div class="pattern-tags">
                            ${choice.consequences.patterns.map(p => `<span class="pattern-tag">${p}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>

            <div class="detailed-explanation">
                <h4>💡 Explication Détaillée</h4>
                <div class="explanation-content">
                    ${this.currentExercise.explanation}
                </div>
            </div>

            <div class="next-actions">
                <button class="aikido-btn primary next-exercise">Exercice Suivant</button>
                <button class="aikido-btn retry-exercise">Réessayer</button>
            </div>
        `;

        feedbackContainer.innerHTML = html;
        feedbackContainer.classList.remove('hidden');
        
        // Scroll vers le feedback
        feedbackContainer.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Utilitaires
     */
    formatType(type) {
        const types = {
            'scenario': '🎭 Scénario',
            'quiz': '❓ Quiz',
            'roleplay': '🎪 Jeu de Rôle'
        };
        return types[type] || type;
    }

    loadProgress() {
        const saved = localStorage.getItem('aikido-exercise-progress');
        return saved ? JSON.parse(saved) : {
            completedExercises: [],
            totalScore: 0,
            achievements: []
        };
    }

    saveProgress() {
        this.userProgress.totalScore = this.score;
        localStorage.setItem('aikido-exercise-progress', JSON.stringify(this.userProgress));
    }

    updateScoreDisplay() {
        const scoreElements = document.querySelectorAll('.exercise-score span:first-child');
        scoreElements.forEach(el => {
            el.textContent = `Score: ${this.score}`;
        });
    }

    checkAchievements() {
        // Logique des achievements
        const achievements = [];
        
        if (this.score >= 100) achievements.push('Centurion');
        if (this.correctAnswers >= 10) achievements.push('Expert');
        if (this.totalQuestions >= 20) achievements.push('Persévérant');
        
        // Afficher les nouveaux achievements
        achievements.forEach(achievement => {
            if (!this.userProgress.achievements.includes(achievement)) {
                this.showAchievement(achievement);
                this.userProgress.achievements.push(achievement);
            }
        });
    }

    showAchievement(achievement) {
        // Animation d'achievement
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <span class="achievement-icon">🏆</span>
                <span class="achievement-text">Achievement débloqué: ${achievement}!</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    bindEvents() {
        // Événements globaux pour les exercices
        document.addEventListener('click', (e) => {
            if (e.target.matches('.next-exercise')) {
                this.loadNextExercise();
            }
            
            if (e.target.matches('.retry-exercise')) {
                this.retryCurrentExercise();
            }
        });
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.aikidoExercises = new AIKidoExercises();
});
