/**
 * Système d'onglets pour l'affichage du code
 * Formation Patterns Développeurs - AI-KIDO
 */

class CodeTabsManager {
    constructor() {
        this.tabContainers = [];
        this.init();
    }

    init() {
        // Attendre que le DOM soit chargé
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeTabs());
        } else {
            this.initializeTabs();
        }
    }

    initializeTabs() {
        // Trouver tous les conteneurs d'onglets
        const tabContainers = document.querySelectorAll('.code-tabs');
        
        tabContainers.forEach((container, index) => {
            this.setupTabContainer(container, index);
        });

        console.log(`✅ Système d'onglets initialisé pour ${tabContainers.length} conteneur(s)`);
    }

    setupTabContainer(container, containerIndex) {
        const tabButtons = container.querySelectorAll('.tab-btn');
        const tabContents = container.querySelectorAll('.tab-content');

        if (tabButtons.length === 0 || tabContents.length === 0) {
            console.warn('⚠️ Conteneur d\'onglets incomplet détecté:', container);
            return;
        }

        // Ajouter les événements aux boutons
        tabButtons.forEach((button, index) => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(container, button.dataset.tab);
            });

            // Ajouter un ID unique si nécessaire
            if (!button.id) {
                button.id = `tab-btn-${containerIndex}-${index}`;
            }
        });

        // Ajouter des IDs aux contenus si nécessaire
        tabContents.forEach((content, index) => {
            if (!content.id) {
                content.id = `tab-content-${containerIndex}-${index}`;
            }
        });

        // Activer le premier onglet par défaut si aucun n'est actif
        const activeButton = container.querySelector('.tab-btn.active');
        const activeContent = container.querySelector('.tab-content.active');

        if (!activeButton && !activeContent && tabButtons.length > 0) {
            this.switchTab(container, tabButtons[0].dataset.tab);
        }

        // Stocker la référence du conteneur
        this.tabContainers.push({
            container,
            buttons: tabButtons,
            contents: tabContents
        });
    }

    switchTab(container, targetTab) {
        if (!targetTab) {
            console.error('❌ Onglet cible non spécifié');
            return;
        }

        // Désactiver tous les boutons et contenus dans ce conteneur
        const allButtons = container.querySelectorAll('.tab-btn');
        const allContents = container.querySelectorAll('.tab-content');

        allButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });

        allContents.forEach(content => {
            content.classList.remove('active');
            content.setAttribute('aria-hidden', 'true');
        });

        // Activer le bouton et le contenu cibles
        const targetButton = container.querySelector(`.tab-btn[data-tab="${targetTab}"]`);
        const targetContent = container.querySelector(`.tab-content[data-tab="${targetTab}"]`);

        if (targetButton && targetContent) {
            targetButton.classList.add('active');
            targetButton.setAttribute('aria-selected', 'true');
            
            targetContent.classList.add('active');
            targetContent.setAttribute('aria-hidden', 'false');

            // Déclencher un événement personnalisé
            const event = new CustomEvent('tabSwitched', {
                detail: {
                    container,
                    activeTab: targetTab,
                    button: targetButton,
                    content: targetContent
                }
            });
            container.dispatchEvent(event);

            console.log(`🔄 Onglet activé: ${targetTab}`);
        } else {
            console.error(`❌ Onglet introuvable: ${targetTab}`, {
                button: targetButton,
                content: targetContent
            });
        }
    }

    // Méthode pour activer un onglet par index
    switchTabByIndex(containerIndex, tabIndex) {
        if (this.tabContainers[containerIndex]) {
            const container = this.tabContainers[containerIndex];
            const button = container.buttons[tabIndex];
            
            if (button && button.dataset.tab) {
                this.switchTab(container.container, button.dataset.tab);
            }
        }
    }

    // Méthode pour obtenir l'onglet actif d'un conteneur
    getActiveTab(containerIndex) {
        if (this.tabContainers[containerIndex]) {
            const container = this.tabContainers[containerIndex].container;
            const activeButton = container.querySelector('.tab-btn.active');
            return activeButton ? activeButton.dataset.tab : null;
        }
        return null;
    }

    // Méthode pour ajouter un support clavier
    addKeyboardSupport() {
        document.addEventListener('keydown', (e) => {
            // Support des flèches gauche/droite pour naviguer entre onglets
            if (e.target.classList.contains('tab-btn')) {
                const container = e.target.closest('.code-tabs');
                const buttons = Array.from(container.querySelectorAll('.tab-btn'));
                const currentIndex = buttons.indexOf(e.target);

                let newIndex = currentIndex;

                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        newIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        newIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
                        break;
                    case 'Home':
                        e.preventDefault();
                        newIndex = 0;
                        break;
                    case 'End':
                        e.preventDefault();
                        newIndex = buttons.length - 1;
                        break;
                    default:
                        return;
                }

                buttons[newIndex].focus();
                this.switchTab(container, buttons[newIndex].dataset.tab);
            }
        });
    }

    // Méthode pour améliorer l'accessibilité
    enhanceAccessibility() {
        this.tabContainers.forEach(({ container, buttons, contents }) => {
            // Ajouter les attributs ARIA
            const tablistId = `tablist-${Math.random().toString(36).substr(2, 9)}`;
            const buttonContainer = container.querySelector('.tab-buttons');
            
            if (buttonContainer) {
                buttonContainer.setAttribute('role', 'tablist');
                buttonContainer.setAttribute('id', tablistId);
            }

            buttons.forEach((button, index) => {
                button.setAttribute('role', 'tab');
                button.setAttribute('aria-controls', `tabpanel-${tablistId}-${index}`);
                button.setAttribute('tabindex', button.classList.contains('active') ? '0' : '-1');
            });

            contents.forEach((content, index) => {
                content.setAttribute('role', 'tabpanel');
                content.setAttribute('id', `tabpanel-${tablistId}-${index}`);
                content.setAttribute('aria-labelledby', buttons[index].id);
                content.setAttribute('tabindex', '0');
            });
        });
    }

    // Méthode pour sauvegarder les préférences d'onglets
    saveTabPreferences() {
        const preferences = {};
        
        this.tabContainers.forEach((container, index) => {
            const activeTab = this.getActiveTab(index);
            if (activeTab) {
                preferences[`container-${index}`] = activeTab;
            }
        });

        try {
            localStorage.setItem('codeTabsPreferences', JSON.stringify(preferences));
        } catch (e) {
            console.warn('⚠️ Impossible de sauvegarder les préférences d\'onglets:', e);
        }
    }

    // Méthode pour restaurer les préférences d'onglets
    restoreTabPreferences() {
        try {
            const preferences = JSON.parse(localStorage.getItem('codeTabsPreferences') || '{}');
            
            Object.entries(preferences).forEach(([containerKey, tabName]) => {
                const containerIndex = parseInt(containerKey.split('-')[1]);
                if (this.tabContainers[containerIndex]) {
                    const container = this.tabContainers[containerIndex].container;
                    const targetButton = container.querySelector(`.tab-btn[data-tab="${tabName}"]`);
                    
                    if (targetButton) {
                        this.switchTab(container, tabName);
                    }
                }
            });
        } catch (e) {
            console.warn('⚠️ Impossible de restaurer les préférences d\'onglets:', e);
        }
    }
}

// Initialisation globale
window.codeTabsManager = new CodeTabsManager();

// Ajouter le support clavier et l'accessibilité une fois initialisé
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.codeTabsManager.addKeyboardSupport();
        window.codeTabsManager.enhanceAccessibility();
        window.codeTabsManager.restoreTabPreferences();
    }, 100);
});

// Sauvegarder les préférences avant de quitter la page
window.addEventListener('beforeunload', () => {
    if (window.codeTabsManager) {
        window.codeTabsManager.saveTabPreferences();
    }
});

// Export pour utilisation en module si nécessaire
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CodeTabsManager;
}
