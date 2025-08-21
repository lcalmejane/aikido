/**
 * Code Enhancements - Améliorations pour les blocs de code
 * Ajoute des fonctionnalités comme la copie, la coloration syntaxique améliorée, etc.
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // ===== AJOUT DE BOUTONS DE COPIE =====
    function addCopyButtons() {
        const codeBlocks = document.querySelectorAll('pre[class*="language-"], pre:has(code[class*="language-"])');
        
        codeBlocks.forEach(pre => {
            // Éviter de dupliquer les boutons
            if (pre.querySelector('.code-copy-btn')) return;
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'code-copy-btn';
            copyBtn.innerHTML = '📋 Copier';
            copyBtn.setAttribute('aria-label', 'Copier le code');
            
            // Position relative pour le bouton
            pre.style.position = 'relative';
            pre.appendChild(copyBtn);
            
            copyBtn.addEventListener('click', async function() {
                const code = pre.querySelector('code');
                const text = code ? code.textContent : pre.textContent;
                
                try {
                    await navigator.clipboard.writeText(text);
                    
                    // Feedback visuel
                    copyBtn.innerHTML = '✅ Copié !';
                    copyBtn.classList.add('copied');
                    
                    setTimeout(() => {
                        copyBtn.innerHTML = '📋 Copier';
                        copyBtn.classList.remove('copied');
                    }, 2000);
                    
                } catch (err) {
                    console.error('Erreur lors de la copie:', err);
                    
                    // Fallback pour les navigateurs plus anciens
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    
                    copyBtn.innerHTML = '✅ Copié !';
                    copyBtn.classList.add('copied');
                    
                    setTimeout(() => {
                        copyBtn.innerHTML = '📋 Copier';
                        copyBtn.classList.remove('copied');
                    }, 2000);
                }
            });
        });
    }
    
    // ===== AMÉLIORATION DE LA COLORATION SYNTAXIQUE =====
    function enhanceSyntaxHighlighting() {
        const codeBlocks = document.querySelectorAll('code[class*="language-"]');
        
        codeBlocks.forEach(code => {
            // Amélioration pour TypeScript/JavaScript
            if (code.classList.contains('language-typescript') || code.classList.contains('language-javascript')) {
                enhanceJSTS(code);
            }
            
            // Amélioration pour PHP
            if (code.classList.contains('language-php')) {
                enhancePHP(code);
            }
            
            // Amélioration pour Java
            if (code.classList.contains('language-java')) {
                enhanceJava(code);
            }
        });
    }
    
    function enhanceJSTS(code) {
        let html = code.innerHTML;
        
        // Mots-clés TypeScript/JavaScript
        const keywords = [
            'interface', 'class', 'extends', 'implements', 'abstract', 'private', 'protected', 'public',
            'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'switch',
            'case', 'default', 'try', 'catch', 'finally', 'throw', 'async', 'await', 'import', 'export'
        ];
        
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
            html = html.replace(regex, `<span class="keyword">$1</span>`);
        });
        
        // Types primitifs
        const types = ['string', 'number', 'boolean', 'void', 'any', 'unknown', 'never'];
        types.forEach(type => {
            const regex = new RegExp(`\\b(${type})\\b`, 'g');
            html = html.replace(regex, `<span class="type">$1</span>`);
        });
        
        code.innerHTML = html;
    }
    
    function enhancePHP(code) {
        let html = code.innerHTML;
        
        // Mots-clés PHP
        const keywords = [
            'class', 'interface', 'trait', 'extends', 'implements', 'abstract', 'final',
            'public', 'private', 'protected', 'static', 'const',
            'function', 'return', 'if', 'else', 'elseif', 'switch', 'case', 'default',
            'for', 'foreach', 'while', 'do', 'try', 'catch', 'finally', 'throw',
            'namespace', 'use', 'as', 'new', 'clone', 'instanceof'
        ];
        
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
            html = html.replace(regex, `<span class="keyword">$1</span>`);
        });
        
        // Variables PHP
        html = html.replace(/(\$[a-zA-Z_]\w*)/g, '<span class="variable">$1</span>');
        
        code.innerHTML = html;
    }
    
    function enhanceJava(code) {
        let html = code.innerHTML;
        
        // Mots-clés Java
        const keywords = [
            'class', 'interface', 'enum', 'extends', 'implements', 'abstract', 'final',
            'public', 'private', 'protected', 'static', 'final', 'synchronized',
            'void', 'int', 'long', 'double', 'float', 'boolean', 'char', 'byte', 'short',
            'String', 'Object', 'List', 'Map', 'Set',
            'if', 'else', 'switch', 'case', 'default', 'for', 'while', 'do',
            'try', 'catch', 'finally', 'throw', 'throws',
            'new', 'this', 'super', 'return', 'break', 'continue',
            'package', 'import'
        ];
        
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
            html = html.replace(regex, `<span class="keyword">$1</span>`);
        });
        
        code.innerHTML = html;
    }
    
    // ===== NUMÉROTATION DES LIGNES OPTIONNELLE =====
    function addLineNumbers() {
        const codeBlocks = document.querySelectorAll('pre.line-numbers');
        
        codeBlocks.forEach(pre => {
            const code = pre.querySelector('code');
            if (!code) return;
            
            const lines = code.textContent.split('\n');
            const lineCount = lines.length;
            
            // Créer les numéros de ligne
            const lineNumbers = document.createElement('div');
            lineNumbers.className = 'line-numbers-wrapper';
            lineNumbers.style.cssText = `
                position: absolute;
                left: 0;
                top: 0;
                padding: var(--spacing-lg) var(--spacing-sm);
                background: rgba(0, 0, 0, 0.2);
                border-right: 1px solid rgba(255, 255, 255, 0.1);
                width: 3em;
                text-align: right;
                font-size: var(--font-size-xs);
                line-height: 1.7;
                color: rgba(255, 255, 255, 0.4);
                user-select: none;
            `;
            
            for (let i = 1; i <= lineCount; i++) {
                const lineNumber = document.createElement('div');
                lineNumber.textContent = i;
                lineNumbers.appendChild(lineNumber);
            }
            
            pre.style.position = 'relative';
            pre.style.paddingLeft = 'calc(3em + var(--spacing-lg))';
            pre.insertBefore(lineNumbers, pre.firstChild);
        });
    }
    
    // ===== MISE EN ÉVIDENCE AU CLIC =====
    function addClickHighlight() {
        const codeBlocks = document.querySelectorAll('pre code');
        
        codeBlocks.forEach(code => {
            code.addEventListener('click', function() {
                this.classList.add('highlight-flash');
                setTimeout(() => {
                    this.classList.remove('highlight-flash');
                }, 1000);
            });
        });
    }
    
    // ===== AMÉLIORATION DE L'ACCESSIBILITÉ =====
    function improveAccessibility() {
        const codeBlocks = document.querySelectorAll('pre[class*="language-"]');
        
        codeBlocks.forEach(pre => {
            // Ajouter des attributs d'accessibilité
            pre.setAttribute('role', 'region');
            pre.setAttribute('aria-label', 'Code example');
            
            const code = pre.querySelector('code');
            if (code) {
                code.setAttribute('tabindex', '0');
            }
        });
    }
    
    // ===== INITIALISATION =====
    function init() {
        // Attendre que le DOM soit complètement chargé
        setTimeout(() => {
            addCopyButtons();
            enhanceSyntaxHighlighting();
            addLineNumbers();
            addClickHighlight();
            improveAccessibility();
        }, 100);
    }
    
    // Lancer l'initialisation
    init();
    
    // Re-initialiser si le contenu change dynamiquement (pour les onglets)
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setTimeout(init, 50); // Petite attente pour le changement d'onglet
        });
    });
    
});
