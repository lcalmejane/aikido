# Premier Prompt AI-KIDO - Validation Système
> Version: 1.0 | Date: 2025-01-05 | Statut: Prompt de Validation

## Vue d'ensemble

Ce document contient le **premier prompt AI-KIDO** conçu pour valider l'ensemble du système de formation sur les Design Patterns, Anti-Patterns et Biais Cognitifs. Il sert de **test d'intégration** pour vérifier la cohérence entre les 5 personas, les tables de vérité et les règles de gouvernance.

## Prompt Principal de Validation

### Contexte de Test
```
CONTEXTE : Équipe de développement PHP/Java de 8 personnes
NIVEAU : Mixte (2 juniors, 4 intermédiaires, 2 seniors)
PROBLÈME : Code legacy avec nombreux anti-patterns
OBJECTIF : Refactoring guidé avec formation aux patterns
CONTRAINTES : Budget limité, pas d'arrêt de production
DURÉE : 3 mois maximum
```

### Prompt de Validation Intégré

```markdown
# PROMPT AI-KIDO - VALIDATION SYSTÈME COMPLET

## MISSION
Vous êtes le système AI-KIDO complet avec accès aux 5 personas spécialisés.
Une équipe de développement vous consulte pour résoudre un problème complexe
de refactoring de code legacy avec formation simultanée de l'équipe.

## CONTEXTE DÉTAILLÉ
**Entreprise** : E-commerce B2B, 50M€ CA annuel
**Équipe** : 8 développeurs (2 juniors 0-2 ans, 4 intermédiaires 2-5 ans, 2 seniors 5+ ans)
**Stack technique** : PHP 7.4 → 8.1, Java 11 → 17
**Problème principal** : Application monolithique 200k lignes, maintenance difficile
**Symptômes observés** :
- Bugs fréquents (15-20 par sprint)
- Développement nouvelles features très lent (3x plus long qu'attendu)
- Tests unitaires quasi-inexistants (5% couverture)
- Équipe démotivée, turnover élevé
- Résistance au changement

**Code problématique identifié** :
```php
class OrderManager {
    private $db;
    private $config;
    private $logger;
    private $emailService;
    private $paymentGateway;
    private $inventoryService;
    
    public function processOrder($orderData) {
        // 500 lignes de logique mélangée
        $this->logger->log("Processing order");
        
        // Validation inline
        if (empty($orderData['customer_id'])) {
            throw new Exception("Customer ID required");
        }
        if (empty($orderData['items'])) {
            throw new Exception("Items required");
        }
        
        // Calcul prix avec logique métier complexe
        $total = 0;
        foreach ($orderData['items'] as $item) {
            $price = $item['price'];
            if ($orderData['customer_type'] === 'premium') {
                $price *= 0.9; // 10% discount
            } elseif ($orderData['customer_type'] === 'gold') {
                $price *= 0.85; // 15% discount
            }
            
            // Taxes selon le pays
            if ($orderData['country'] === 'FR') {
                $price *= 1.20; // TVA 20%
            } elseif ($orderData['country'] === 'DE') {
                $price *= 1.19; // TVA 19%
            }
            
            $total += $price * $item['quantity'];
        }
        
        // Vérification stock
        foreach ($orderData['items'] as $item) {
            $stock = $this->inventoryService->getStock($item['product_id']);
            if ($stock < $item['quantity']) {
                throw new Exception("Insufficient stock");
            }
        }
        
        // Traitement paiement
        $paymentResult = $this->paymentGateway->charge(
            $orderData['payment_method'],
            $total
        );
        
        if (!$paymentResult['success']) {
            throw new Exception("Payment failed");
        }
        
        // Mise à jour base de données
        $orderId = $this->db->insert('orders', [
            'customer_id' => $orderData['customer_id'],
            'total' => $total,
            'status' => 'paid',
            'created_at' => date('Y-m-d H:i:s')
        ]);
        
        // Mise à jour stock
        foreach ($orderData['items'] as $item) {
            $this->inventoryService->decreaseStock(
                $item['product_id'],
                $item['quantity']
            );
        }
        
        // Envoi email confirmation
        $this->emailService->send(
            $orderData['customer_email'],
            'Order Confirmation',
            $this->generateEmailContent($orderId, $orderData)
        );
        
        $this->logger->log("Order processed: " . $orderId);
        
        return ['order_id' => $orderId, 'total' => $total];
    }
    
    // 20+ autres méthodes similaires...
}
```

**Équivalent Java problématique** :
```java
public class PaymentProcessor {
    private DatabaseConnection db;
    private ConfigurationManager config;
    private Logger logger;
    private EmailService emailService;
    
    public PaymentResult processPayment(PaymentRequest request) {
        // 400 lignes de logique similaire
        logger.info("Processing payment");
        
        // Validation hardcodée
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Invalid amount");
        }
        
        // Logique métier dans le processeur
        BigDecimal finalAmount = request.getAmount();
        if ("PREMIUM".equals(request.getCustomerType())) {
            finalAmount = finalAmount.multiply(new BigDecimal("0.95"));
        } else if ("GOLD".equals(request.getCustomerType())) {
            finalAmount = finalAmount.multiply(new BigDecimal("0.90"));
        }
        
        // Traitement selon le type de paiement
        if ("CREDIT_CARD".equals(request.getPaymentType())) {
            // 50 lignes de logique carte de crédit
        } else if ("PAYPAL".equals(request.getPaymentType())) {
            // 50 lignes de logique PayPal
        } else if ("BANK_TRANSFER".equals(request.getPaymentType())) {
            // 50 lignes de logique virement
        }
        
        // Sauvegarde et notification
        // ...
        
        return new PaymentResult(true, finalAmount);
    }
}
```

## QUESTIONS DE VALIDATION

### 1. ANALYSE MULTI-PERSONAS
Analysez ce code en mobilisant les 5 personas AI-KIDO :

**a) Expert Design Patterns** : Quels patterns recommandez-vous pour structurer ce code ?
**b) Expert Anti-Patterns** : Quels anti-patterns identifiez-vous et comment les corriger ?
**c) Expert Psychologie Cognitive** : Quels biais cognitifs ont probablement conduit à ce code ?
**d) Formateur Technique** : Comment structurer la formation pour cette équipe mixte ?
**e) Développeur Senior** : Quelle stratégie de refactoring pragmatique recommandez-vous ?

### 2. PLAN D'ACTION INTÉGRÉ
Proposez un plan d'action sur 3 mois qui :
- Respecte les contraintes (budget, production)
- Forme l'équipe progressivement
- Refactorise le code par étapes
- Mesure les progrès objectivement
- Prévient la récidive des anti-patterns

### 3. VALIDATION COHÉRENCE
Démontrez la cohérence entre :
- Les patterns recommandés et les anti-patterns identifiés
- Les biais cognitifs et les erreurs de code observées
- L'approche pédagogique et le niveau de l'équipe
- La stratégie technique et les contraintes business

### 4. MÉTRIQUES DE SUCCÈS
Définissez des métriques concrètes pour mesurer :
- L'amélioration de la qualité du code
- L'efficacité de la formation
- L'impact sur la productivité de l'équipe
- La réduction des anti-patterns
```

## Réponse Attendue du Système

### Structure de Réponse Validée

#### 1. Analyse Multi-Personas (Expert Design Patterns)
```markdown
## ANALYSE EXPERT DESIGN PATTERNS

### Anti-Patterns Identifiés
- **God Object** : OrderManager fait tout (validation, calcul, paiement, email, BDD)
- **Long Method** : processOrder() avec 500 lignes
- **Feature Envy** : Utilisation excessive des services externes
- **Magic Numbers** : 0.9, 0.85, 1.20, 1.19 hardcodés

### Patterns Recommandés
1. **Strategy Pattern** : Pour les calculs de prix selon le type client
2. **Template Method** : Pour le processus de commande standardisé
3. **Factory Method** : Pour la création des stratégies de paiement
4. **Observer Pattern** : Pour les notifications (email, logs, audit)
5. **Command Pattern** : Pour l'encapsulation des actions métier

### Implémentation Prioritaire - Strategy Pattern
```php
interface PricingStrategy {
    public function calculatePrice(Money $basePrice, array $context): Money;
}

class PremiumPricingStrategy implements PricingStrategy {
    public function calculatePrice(Money $basePrice, array $context): Money {
        return $basePrice->multiply(0.90); // 10% discount
    }
}

class GoldPricingStrategy implements PricingStrategy {
    public function calculatePrice(Money $basePrice, array $context): Money {
        return $basePrice->multiply(0.85); // 15% discount
    }
}

class StandardPricingStrategy implements PricingStrategy {
    public function calculatePrice(Money $basePrice, array $context): Money {
        return $basePrice; // No discount
    }
}
```
```

#### 2. Analyse Multi-Personas (Expert Anti-Patterns)
```markdown
## ANALYSE EXPERT ANTI-PATTERNS

### Diagnostic Détaillé
**God Object (Criticité: HAUTE)**
- Classe OrderManager : 500+ lignes, 15+ responsabilités
- Impact : Tests impossibles, maintenance cauchemardesque
- Cause : Accumulation progressive de fonctionnalités

**Copy-Paste Programming (Criticité: MOYENNE)**
- Logique de calcul dupliquée entre PHP et Java
- Validation répétée dans plusieurs méthodes
- Impact : Bugs en cascade, maintenance x3

**Magic Numbers (Criticité: MOYENNE)**
- Taux de remise hardcodés (0.9, 0.85)
- Taux de TVA hardcodés (1.20, 1.19)
- Impact : Configuration impossible, erreurs fréquentes

### Plan de Refactoring
**Phase 1 (Semaine 1-2) : Extract Method**
```php
class OrderManager {
    public function processOrder($orderData) {
        $this->validateOrder($orderData);
        $total = $this->calculateTotal($orderData);
        $this->verifyStock($orderData);
        $paymentResult = $this->processPayment($orderData, $total);
        $orderId = $this->saveOrder($orderData, $total);
        $this->updateInventory($orderData);
        $this->sendConfirmation($orderData, $orderId);
        
        return ['order_id' => $orderId, 'total' => $total];
    }
    
    private function validateOrder($orderData) { /* ... */ }
    private function calculateTotal($orderData) { /* ... */ }
    // Autres méthodes extraites
}
```

**Phase 2 (Semaine 3-4) : Extract Class**
```php
class OrderValidator {
    public function validate(array $orderData): void { /* ... */ }
}

class PriceCalculator {
    public function calculate(array $orderData): Money { /* ... */ }
}

class OrderPersistence {
    public function save(array $orderData, Money $total): int { /* ... */ }
}
```

**Phase 3 (Semaine 5-8) : Design Patterns**
- Strategy pour le calcul des prix
- Observer pour les notifications
- Factory pour les services
```

#### 3. Analyse Multi-Personas (Expert Psychologie Cognitive)
```markdown
## ANALYSE EXPERT PSYCHOLOGIE COGNITIVE

### Biais Cognitifs Identifiés

**1. Surconfiance (Overconfidence Bias)**
- Manifestation : "Je peux tout gérer dans une classe"
- Résultat : God Object de 500 lignes
- Mécanisme : Sous-estimation de la complexité cognitive

**2. Biais de Confirmation**
- Manifestation : "Cette approche a marché une fois, elle marche toujours"
- Résultat : Copy-paste entre PHP et Java
- Mécanisme : Évitement de la remise en question

**3. Biais de Disponibilité**
- Manifestation : Utilisation des valeurs "sous la main"
- Résultat : Magic numbers hardcodés
- Mécanisme : Facilité d'accès vs configuration propre

**4. Effet Dunning-Kruger**
- Manifestation : "Pas besoin de tests, je maîtrise"
- Résultat : 5% de couverture de tests
- Mécanisme : Incompétence inconsciente

### Stratégies de Prévention

**1. Pair Programming Obligatoire**
- Objectif : Contrer la surconfiance
- Méthode : Validation continue par un pair
- Fréquence : 50% du temps de développement

**2. Code Reviews Systématiques**
- Objectif : Challenger les choix techniques
- Méthode : Questions socratiques, alternatives proposées
- Critères : Complexité, réutilisabilité, testabilité

**3. TDD (Test-Driven Development)**
- Objectif : Forcer l'humilité et la simplicité
- Méthode : Test d'abord, implémentation ensuite
- Bénéfice : Design émergent, code testable

**4. Métriques Automatisées**
- Objectif : Feedback objectif continu
- Outils : SonarQube, PHPStan, SpotBugs
- Seuils : Complexité < 10, Duplication < 5%
```

#### 4. Analyse Multi-Personas (Formateur Technique)
```markdown
## PLAN DE FORMATION ADAPTÉ

### Analyse de l'Équipe
**2 Juniors (0-2 ans)** : Besoin de structure et guidance
**4 Intermédiaires (2-5 ans)** : Besoin de montée en compétences
**2 Seniors (5+ ans)** : Besoin de leadership et mentorat

### Parcours de Formation (12 semaines)

**Semaines 1-2 : Fondamentaux (Tous niveaux)**
- Qu'est-ce qu'un Design Pattern ?
- Identification des anti-patterns dans le code existant
- Introduction aux biais cognitifs en développement
- Exercice : Analyse du code OrderManager

**Semaines 3-4 : Patterns Essentiels (Focus Juniors/Intermédiaires)**
- Strategy Pattern : Calculs de prix
- Template Method : Processus de commande
- Observer Pattern : Notifications
- Exercice : Refactoring guidé d'une méthode

**Semaines 5-6 : Refactoring Pratique (Tous niveaux)**
- Extract Method, Extract Class
- Dependency Injection
- Tests unitaires et refactoring
- Exercice : Refactoring en binômes

**Semaines 7-8 : Patterns Avancés (Focus Intermédiaires/Seniors)**
- Factory Method, Abstract Factory
- Command Pattern
- Repository Pattern
- Exercice : Architecture d'un nouveau module

**Semaines 9-10 : Leadership Technique (Focus Seniors)**
- Code Reviews efficaces
- Mentorat des juniors
- Architecture Decision Records
- Exercice : Présentation d'architecture

**Semaines 11-12 : Consolidation (Tous niveaux)**
- Projet intégrateur
- Présentation des réalisations
- Plan d'amélioration continue
- Certification des acquis

### Méthodes Pédagogiques Adaptées

**Pour les Juniors** :
- Guidance directive avec explications détaillées
- Exemples concrets et exercices guidés
- Pair programming avec intermédiaires/seniors
- Feedback fréquent et encourageant

**Pour les Intermédiaires** :
- Approche socratique avec questions ouvertes
- Analyse comparative de solutions
- Responsabilité de mentorat des juniors
- Projets avec autonomie croissante

**Pour les Seniors** :
- Collaboration d'égal à égal
- Débats techniques et architecture
- Rôle de mentor et leader technique
- Responsabilité de la vision d'ensemble
```

#### 5. Analyse Multi-Personas (Développeur Senior)
```markdown
## STRATÉGIE PRAGMATIQUE DE REFACTORING

### Contraintes Réelles Prises en Compte
- **Budget limité** : Pas de réécriture complète
- **Production continue** : Refactoring incrémental obligatoire
- **Équipe mixte** : Formation progressive nécessaire
- **Legacy critique** : Approche prudente et mesurée

### Plan de Refactoring Pragmatique (3 mois)

**Mois 1 : Stabilisation et Tests**
```php
// Étape 1 : Wrapper de sécurité
class OrderManagerWrapper {
    private OrderManager $legacy;
    
    public function processOrder($orderData) {
        // Logs détaillés pour monitoring
        $this->logger->info('Order processing started', $orderData);
        
        try {
            $result = $this->legacy->processOrder($orderData);
            $this->logger->info('Order processing succeeded', $result);
            return $result;
        } catch (Exception $e) {
            $this->logger->error('Order processing failed', [
                'error' => $e->getMessage(),
                'data' => $orderData
            ]);
            throw $e;
        }
    }
}

// Étape 2 : Tests de caractérisation
class OrderManagerTest extends TestCase {
    public function testProcessOrderWithPremiumCustomer() {
        // Tests pour capturer le comportement actuel
        // Avant de modifier quoi que ce soit
    }
}
```

**Mois 2 : Refactoring Incrémental**
```php
// Étape 3 : Extract Method progressif
class OrderManager {
    public function processOrder($orderData) {
        $this->validateOrder($orderData);
        $total = $this->calculateTotal($orderData);
        // ... reste inchangé temporairement
    }
    
    private function validateOrder($orderData) {
        // Logique extraite et testée séparément
    }
    
    private function calculateTotal($orderData) {
        // Introduction progressive du Strategy Pattern
        $calculator = $this->getPriceCalculator($orderData['customer_type']);
        return $calculator->calculate($orderData);
    }
}
```

**Mois 3 : Patterns et Architecture**
```php
// Étape 4 : Architecture cible
class OrderService {
    public function __construct(
        private OrderValidator $validator,
        private PriceCalculator $priceCalculator,
        private PaymentProcessor $paymentProcessor,
        private OrderRepository $repository,
        private NotificationService $notificationService
    ) {}
    
    public function processOrder(OrderData $orderData): OrderResult {
        $this->validator->validate($orderData);
        $total = $this->priceCalculator->calculate($orderData);
        $payment = $this->paymentProcessor->process($orderData, $total);
        $order = $this->repository->save($orderData, $total);
        $this->notificationService->notify($order);
        
        return new OrderResult($order->getId(), $total);
    }
}
```

### Métriques de Validation Terrain
**Avant Refactoring** :
- Complexité cyclomatique : 25 (OrderManager)
- Couverture tests : 5%
- Temps ajout feature : 3-5 jours
- Bugs par sprint : 15-20

**Objectifs 3 mois** :
- Complexité cyclomatique : <10 par classe
- Couverture tests : >80%
- Temps ajout feature : 1-2 jours
- Bugs par sprint : <5

**Métriques de suivi hebdomadaire** :
- Nombre de classes extraites
- Pourcentage de code refactorisé
- Nombre de tests ajoutés
- Satisfaction équipe (enquête)
```

## Validation de Cohérence Système

### Cohérence Patterns ↔ Anti-Patterns
- **God Object** → **Single Responsibility** (Strategy, Template Method)
- **Long Method** → **Extract Method** puis **Template Method**
- **Magic Numbers** → **Configuration** + **Strategy Pattern**
- **Copy-Paste** → **Template Method** + **Strategy Pattern**

### Cohérence Biais ↔ Code
- **Surconfiance** → **God Object** → **Pair Programming** + **Code Reviews**
- **Confirmation** → **Copy-Paste** → **TDD** + **Refactoring**
- **Disponibilité** → **Magic Numbers** → **Configuration** + **Standards**
- **Dunning-Kruger** → **Pas de tests** → **TDD** + **Métriques**

### Cohérence Pédagogie ↔ Équipe
- **Juniors** → **Guidance directive** → **Patterns simples** (Strategy)
- **Intermédiaires** → **Questions socratiques** → **Patterns moyens** (Observer)
- **Seniors** → **Collaboration** → **Patterns complexes** (Command)

### Cohérence Technique ↔ Business
- **Refactoring incrémental** → **Pas d'arrêt production**
- **Formation progressive** → **Budget limité**
- **Métriques objectives** → **ROI mesurable**
- **Patterns pragmatiques** → **Contraintes réelles**

## Métriques de Succès Intégrées

### Métriques Techniques (Mesurables)
```yaml
Code Quality:
  - Complexité cyclomatique: <10 par méthode
  - Duplication: <5% du code total
  - Couverture tests: >80%
  - Violations SonarQube: <50 par 1000 lignes

Performance:
  - Temps de build: <5 minutes
  - Temps de tests: <2 minutes
  - Temps déploiement: <10 minutes
  - Temps ajout feature: -50%
```

### Métriques Pédagogiques (Mesurables)
```yaml
Formation:
  - Satisfaction globale: >4.5/5
  - Rétention concepts: >85% à 3 mois
  - Application terrain: >80% des projets
  - Progression compétences: +70% en moyenne

Équipe:
  - Autonomie juniors: +60%
  - Leadership seniors: +40%
  - Collaboration: +50%
  - Satisfaction travail: +30%
```

### Métriques Business (Mesurables)
```yaml
Impact:
  - Réduction bugs production: -60%
  - Amélioration time-to-market: -40%
  - Réduction coût maintenance: -35%
  - ROI formation: >150% sur 12 mois

Équipe:
  - Réduction turnover: -50%
  - Amélioration recrutement: +30%
  - Satisfaction client interne: +40%
  - Innovation rate: +25%
```

---

**VALIDATION** : Ce prompt AI-KIDO valide l'intégration complète du système en démontrant la cohérence entre les 5 personas, leur capacité à analyser un problème complexe de manière complémentaire, et à proposer une solution pragmatique respectant les contraintes réelles tout en maximisant l'impact pédagogique et technique.
