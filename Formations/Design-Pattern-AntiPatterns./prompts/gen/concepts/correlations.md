# Corrélations Biais Cognitifs ↔ Anti-Patterns ↔ Design Patterns
> Version: 1.0 | Date: 2025-01-05 | Statut: Table de Vérité Fondamentale

## Vue d'ensemble

Ce document établit les **corrélations scientifiques** entre les biais cognitifs des développeurs, l'émergence des anti-patterns et les solutions via les design patterns. Il constitue le **cœur théorique** du système AI-KIDO.

## Matrice de Corrélation Complète

### Niveau 1 : Corrélations Directes
*Relations causales établies scientifiquement*

| Biais Cognitif | Anti-Pattern Principal | Design Pattern Solution | Mécanisme de Correction | Indicateurs Mesurables |
|---|---|---|---|---|
| **Confirmation Bias** | Copy-Paste Programming | Template Method | Factorisation forcée des similitudes | Taux de duplication < 3% |
| **Anchoring Bias** | Golden Hammer | Strategy Pattern | Alternatives explicites documentées | Diversité technologique > 70% |
| **Planning Fallacy** | Big Ball of Mud | Command Pattern | Planification structurée des étapes | Respect délais > 80% |
| **Overconfidence Bias** | Premature Optimization | Observer Pattern | Mesures objectives avant optimisation | Profiling systématique |
| **Availability Heuristic** | Lava Flow | Factory Method | Création contrôlée des instances | Code coverage > 85% |
| **Sunk Cost Fallacy** | God Object | Single Responsibility | Refactoring progressif par responsabilité | Complexité cyclomatique < 10 |
| **Groupthink** | Cargo Cult Programming | Adapter Pattern | Adaptation contextuelle des solutions | Tests de régression > 95% |
| **Authority Bias** | Not Invented Here | Facade Pattern | Interface unifiée sur solutions externes | Réutilisation code > 60% |
| **Dunning-Kruger Effect** | Over-Engineering | Builder Pattern | Construction progressive de la complexité | Métriques de maintenabilité > 70 |

### Niveau 2 : Corrélations Indirectes
*Relations par effet de cascade*

#### Confirmation Bias → Cascade d'Anti-Patterns
```
Confirmation Bias
    ↓
Copy-Paste Programming (duplication)
    ↓
God Object (accumulation de responsabilités)
    ↓
Spaghetti Code (complexité ingérable)
    ↓
Big Ball of Mud (architecture chaotique)
```

**Solution en Cascade** :
```
Template Method (factorisation)
    ↓
Single Responsibility (séparation)
    ↓
Strategy Pattern (organisation)
    ↓
Command Pattern (structure)
```

#### Anchoring Bias → Rigidité Architecturale
```
Anchoring Bias
    ↓
Golden Hammer (solution unique)
    ↓
Vendor Lock-in (dépendance technologique)
    ↓
Monolithic Architecture (rigidité)
    ↓
Technical Debt (accumulation de contraintes)
```

**Solution Progressive** :
```
Strategy Pattern (alternatives)
    ↓
Abstract Factory (abstraction des dépendances)
    ↓
Adapter Pattern (découplage)
    ↓
Microservices Architecture (flexibilité)
```

## Mécanismes Psychologiques et Solutions Techniques

### 1. Biais de Confirmation → Copy-Paste Programming

#### Mécanisme Psychologique
**Base Neurologique** : Activation du circuit de récompense dopaminergique lors de la reconnaissance de patterns familiers.

**Processus Cognitif** :
1. **Reconnaissance** : "J'ai déjà vu ce problème"
2. **Récupération** : "Cette solution a marché avant"
3. **Application** : Copie de la solution existante
4. **Validation** : "Ça marche, donc c'est correct"

#### Manifestation Technique
```php
<?php
// ❌ Manifestation du biais : répétition de patterns familiers
class UserController
{
    public function createUser(Request $request): Response
    {
        // Validation manuelle (pattern familier)
        if (empty($request->get('email'))) {
            return new JsonResponse(['error' => 'Email required'], 400);
        }
        if (!filter_var($request->get('email'), FILTER_VALIDATE_EMAIL)) {
            return new JsonResponse(['error' => 'Invalid email'], 400);
        }
        if (strlen($request->get('password')) < 8) {
            return new JsonResponse(['error' => 'Password too short'], 400);
        }
        
        // Sauvegarde (pattern copié)
        $user = new User();
        $user->setEmail($request->get('email'));
        $user->setPassword(password_hash($request->get('password'), PASSWORD_DEFAULT));
        
        $entityManager = $this->getDoctrine()->getManager();
        $entityManager->persist($user);
        $entityManager->flush();
        
        return new JsonResponse(['success' => true, 'id' => $user->getId()]);
    }
    
    public function updateUser(Request $request, int $id): Response
    {
        // COPIE EXACTE de la validation (biais de confirmation)
        if (empty($request->get('email'))) {
            return new JsonResponse(['error' => 'Email required'], 400);
        }
        if (!filter_var($request->get('email'), FILTER_VALIDATE_EMAIL)) {
            return new JsonResponse(['error' => 'Invalid email'], 400);
        }
        if (strlen($request->get('password')) < 8) {
            return new JsonResponse(['error' => 'Password too short'], 400);
        }
        
        // Logique différente mais structure identique
        $user = $this->getDoctrine()->getRepository(User::class)->find($id);
        if (!$user) {
            return new JsonResponse(['error' => 'User not found'], 404);
        }
        
        $user->setEmail($request->get('email'));
        if ($request->get('password')) {
            $user->setPassword(password_hash($request->get('password'), PASSWORD_DEFAULT));
        }
        
        $entityManager = $this->getDoctrine()->getManager();
        $entityManager->flush();
        
        return new JsonResponse(['success' => true]);
    }
}
```

#### Solution : Template Method Pattern
```php
<?php
// ✅ Solution : Template Method force la factorisation

abstract class UserActionController
{
    // Template Method définit le processus
    protected final function processUserAction(Request $request, ?int $userId = null): Response
    {
        try {
            // Étapes communes forcées
            $validationResult = $this->validateRequest($request);
            if (!$validationResult->isValid()) {
                return $this->createErrorResponse($validationResult->getErrors());
            }
            
            $userData = $this->extractUserData($request);
            $user = $this->executeUserAction($userData, $userId);
            
            return $this->createSuccessResponse($user);
            
        } catch (UserActionException $e) {
            return $this->createErrorResponse([$e->getMessage()]);
        }
    }
    
    // Méthodes communes (éliminent la duplication)
    private function validateRequest(Request $request): ValidationResult
    {
        $validator = new UserDataValidator();
        return $validator->validate($request->all());
    }
    
    private function extractUserData(Request $request): UserData
    {
        return UserData::fromRequest($request);
    }
    
    private function createErrorResponse(array $errors): Response
    {
        return new JsonResponse(['errors' => $errors], 400);
    }
    
    private function createSuccessResponse(User $user): Response
    {
        return new JsonResponse([
            'success' => true,
            'user' => $user->toArray()
        ]);
    }
    
    // Méthodes abstraites (spécialisation forcée)
    abstract protected function executeUserAction(UserData $userData, ?int $userId): User;
}

// Implémentations spécialisées
final class CreateUserController extends UserActionController
{
    protected function executeUserAction(UserData $userData, ?int $userId): User
    {
        $user = User::fromUserData($userData);
        return $this->userRepository->save($user);
    }
}

final class UpdateUserController extends UserActionController
{
    protected function executeUserAction(UserData $userData, ?int $userId): User
    {
        $user = $this->userRepository->findById($userId);
        if (!$user) {
            throw new UserNotFoundException("User with ID $userId not found");
        }
        
        $user->updateFromUserData($userData);
        return $this->userRepository->save($user);
    }
}
```

**Mécanisme de Correction** :
1. **Factorisation Forcée** : Template Method oblige à identifier les parties communes
2. **Spécialisation Contrôlée** : Seules les différences réelles sont implémentées
3. **Validation Centralisée** : Une seule source de vérité pour les règles
4. **Tests Unifiés** : Comportement commun testé une seule fois

### 2. Anchoring Bias → Golden Hammer

#### Mécanisme Psychologique
**Base Neurologique** : Activation du striatum (apprentissage par renforcement) qui privilégie les solutions ayant déjà fonctionné.

**Processus Cognitif** :
1. **Ancrage** : Première solution technique maîtrisée
2. **Renforcement** : Succès répétés avec cette solution
3. **Généralisation** : Application à tous les contextes
4. **Résistance** : Rejet des alternatives par confort cognitif

#### Manifestation Technique
```java
// ❌ Manifestation : utilisation systématique de HashMap
public class DataManager {
    
    // Ancrage sur HashMap pour TOUT
    private Map<String, Object> userCache = new HashMap<>();
    private Map<String, Object> configCache = new HashMap<>();
    private Map<String, Object> sessionData = new HashMap<>();
    private Map<String, Object> temporaryStorage = new HashMap<>();
    
    public void storeUserData(String userId, String name, int age, String email) {
        // HashMap même pour des données structurées
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", userId);
        userData.put("name", name);
        userData.put("age", age);
        userData.put("email", email);
        userData.put("created_at", System.currentTimeMillis());
        
        userCache.put(userId, userData);
    }
    
    public void updateConfiguration(String key, String value) {
        // HashMap même pour la configuration
        Map<String, Object> config = new HashMap<>();
        config.put("key", key);
        config.put("value", value);
        config.put("updated_at", System.currentTimeMillis());
        config.put("version", getNextVersion());
        
        configCache.put(key, config);
    }
    
    public void processOrder(String orderId, List<String> items, double total) {
        // HashMap même pour des processus complexes
        Map<String, Object> orderData = new HashMap<>();
        orderData.put("id", orderId);
        orderData.put("items", items);
        orderData.put("total", total);
        orderData.put("status", "processing");
        
        // Logique complexe avec des Maps non typées
        processPayment(orderData);
        updateInventory(orderData);
        sendNotification(orderData);
        
        temporaryStorage.put(orderId, orderData);
    }
    
    private void processPayment(Map<String, Object> orderData) {
        // Plus de manipulation de Maps...
        double total = (Double) orderData.get("total");
        String orderId = (String) orderData.get("id");
        
        Map<String, Object> paymentData = new HashMap<>();
        paymentData.put("order_id", orderId);
        paymentData.put("amount", total);
        paymentData.put("status", "pending");
        
        // Casting partout, aucune sécurité de type
        sessionData.put("payment_" + orderId, paymentData);
    }
}
```

#### Solution : Strategy Pattern
```java
// ✅ Solution : Strategy Pattern avec types appropriés

// Interface commune pour différentes stratégies de stockage
public interface StorageStrategy<T> {
    void store(String key, T data);
    Optional<T> retrieve(String key);
    void remove(String key);
    void clear();
}

// Stratégie pour les données utilisateur
public final class UserStorageStrategy implements StorageStrategy<User> {
    private final Map<String, User> storage = new ConcurrentHashMap<>();
    
    @Override
    public void store(String key, User user) {
        if (key == null || user == null) {
            throw new IllegalArgumentException("Key and user cannot be null");
        }
        storage.put(key, user);
    }
    
    @Override
    public Optional<User> retrieve(String key) {
        return Optional.ofNullable(storage.get(key));
    }
    
    @Override
    public void remove(String key) {
        storage.remove(key);
    }
    
    @Override
    public void clear() {
        storage.clear();
    }
}

// Stratégie pour la configuration
public final class ConfigurationStorageStrategy implements StorageStrategy<ConfigurationEntry> {
    private final Map<String, ConfigurationEntry> storage = new ConcurrentHashMap<>();
    private final ConfigurationValidator validator;
    
    public ConfigurationStorageStrategy(ConfigurationValidator validator) {
        this.validator = validator;
    }
    
    @Override
    public void store(String key, ConfigurationEntry config) {
        ValidationResult result = validator.validate(config);
        if (!result.isValid()) {
            throw new InvalidConfigurationException(result.getErrors());
        }
        
        storage.put(key, config.withUpdatedTimestamp());
    }
    
    // Autres méthodes...
}

// Stratégie pour les commandes (avec persistance)
public final class OrderStorageStrategy implements StorageStrategy<Order> {
    private final OrderRepository repository;
    private final Map<String, Order> cache = new ConcurrentHashMap<>();
    
    public OrderStorageStrategy(OrderRepository repository) {
        this.repository = repository;
    }
    
    @Override
    public void store(String key, Order order) {
        // Persistance en base
        Order savedOrder = repository.save(order);
        
        // Cache pour les accès rapides
        cache.put(key, savedOrder);
    }
    
    @Override
    public Optional<Order> retrieve(String key) {
        // Vérification cache d'abord
        Order cached = cache.get(key);
        if (cached != null) {
            return Optional.of(cached);
        }
        
        // Fallback sur la base de données
        Optional<Order> fromDb = repository.findById(key);
        fromDb.ifPresent(order -> cache.put(key, order));
        
        return fromDb;
    }
    
    // Autres méthodes...
}

// Gestionnaire utilisant les stratégies appropriées
public final class DataManager {
    
    private final StorageStrategy<User> userStorage;
    private final StorageStrategy<ConfigurationEntry> configStorage;
    private final StorageStrategy<Order> orderStorage;
    
    public DataManager(
            StorageStrategy<User> userStorage,
            StorageStrategy<ConfigurationEntry> configStorage,
            StorageStrategy<Order> orderStorage) {
        this.userStorage = userStorage;
        this.configStorage = configStorage;
        this.orderStorage = orderStorage;
    }
    
    public void storeUser(User user) {
        userStorage.store(user.getId(), user);
    }
    
    public void updateConfiguration(String key, String value) {
        ConfigurationEntry config = new ConfigurationEntry(key, value);
        configStorage.store(key, config);
    }
    
    public void processOrder(Order order) {
        // Logique métier claire avec types forts
        PaymentResult payment = processPayment(order);
        
        if (payment.isSuccessful()) {
            updateInventory(order.getItems());
            sendNotification(order.getCustomer(), order);
            
            Order processedOrder = order.withStatus(OrderStatus.COMPLETED);
            orderStorage.store(order.getId(), processedOrder);
        } else {
            Order failedOrder = order.withStatus(OrderStatus.PAYMENT_FAILED);
            orderStorage.store(order.getId(), failedOrder);
        }
    }
    
    private PaymentResult processPayment(Order order) {
        // Logique de paiement avec types appropriés
        return paymentProcessor.process(order.getPaymentInfo());
    }
}

// Factory pour créer les stratégies appropriées
public final class StorageStrategyFactory {
    
    public static <T> StorageStrategy<T> createStrategy(Class<T> dataType, StorageConfig config) {
        if (dataType == User.class) {
            return (StorageStrategy<T>) new UserStorageStrategy();
        } else if (dataType == ConfigurationEntry.class) {
            return (StorageStrategy<T>) new ConfigurationStorageStrategy(new ConfigurationValidator());
        } else if (dataType == Order.class) {
            return (StorageStrategy<T>) new OrderStorageStrategy(config.getOrderRepository());
        } else {
            throw new UnsupportedOperationException("No storage strategy for type: " + dataType.getName());
        }
    }
}
```

**Mécanisme de Correction** :
1. **Alternatives Explicites** : Strategy Pattern force à considérer différentes approches
2. **Types Appropriés** : Chaque stratégie utilise les structures de données optimales
3. **Spécialisation Contextuelle** : Chaque stratégie est optimisée pour son usage
4. **Extensibilité** : Nouvelles stratégies ajoutables sans modification du code existant

### 3. Planning Fallacy → Big Ball of Mud

#### Mécanisme Psychologique
**Base Neurologique** : Optimisme cognitif lié à l'activation du cortex préfrontal ventromédian qui minimise les signaux de risque.

**Processus Cognitif** :
1. **Optimisme Initial** : "Ce sera simple et rapide"
2. **Sous-estimation** : Négligence des cas complexes
3. **Pression Temporelle** : Raccourcis pour respecter les délais
4. **Accumulation** : Dégradation progressive de l'architecture

#### Solution : Command Pattern + Planning Structuré
```php
<?php
// ✅ Solution : Command Pattern avec planification explicite

interface ProjectCommand
{
    public function execute(): CommandResult;
    public function getEstimatedDuration(): Duration;
    public function getDependencies(): array;
    public function rollback(): void;
}

final class ImplementFeatureCommand implements ProjectCommand
{
    public function __construct(
        private FeatureSpecification $specification,
        private array $subCommands = []
    ) {
        // Planification forcée lors de la construction
        $this->subCommands = [
            new AnalyzeRequirementsCommand($specification),
            new DesignArchitectureCommand($specification),
            new ImplementCoreLogicCommand($specification),
            new WriteTestsCommand($specification),
            new IntegrateWithExistingSystemCommand($specification),
            new DocumentFeatureCommand($specification)
        ];
    }
    
    public function getEstimatedDuration(): Duration
    {
        // Estimation basée sur les sous-tâches (plus réaliste)
        $totalMinutes = 0;
        foreach ($this->subCommands as $command) {
            $totalMinutes += $command->getEstimatedDuration()->inMinutes();
        }
        
        // Buffer de 25% pour les imprévus (leçon de l'expérience)
        $bufferMinutes = $totalMinutes * 0.25;
        
        return Duration::fromMinutes($totalMinutes + $bufferMinutes);
    }
    
    public function getDependencies(): array
    {
        $dependencies = [];
        foreach ($this->subCommands as $command) {
            $dependencies = array_merge($dependencies, $command->getDependencies());
        }
        return array_unique($dependencies);
    }
    
    public function execute(): CommandResult
    {
        $startTime = microtime(true);
        $results = [];
        
        try {
            // Exécution séquentielle avec validation à chaque étape
            foreach ($this->subCommands as $index => $command) {
                $stepResult = $command->execute();
                $results[] = $stepResult;
                
                if (!$stepResult->isSuccess()) {
                    // Rollback automatique en cas d'échec
                    $this->rollbackPreviousSteps($index);
                    return CommandResult::failure(
                        "Step " . ($index + 1) . " failed: " . $stepResult->getError(),
                        $results
                    );
                }
            }
            
            $duration = Duration::fromSeconds(microtime(true) - $startTime);
            
            return CommandResult::success(
                "Feature implemented successfully",
                $results,
                $duration
            );
            
        } catch (Exception $e) {
            $this->rollbackAllSteps();
            return CommandResult::failure("Unexpected error: " . $e->getMessage(), $results);
        }
    }
    
    public function rollback(): void
    {
        $this->rollbackAllSteps();
    }
    
    private function rollbackPreviousSteps(int $failedStepIndex): void
    {
        // Rollback dans l'ordre inverse
        for ($i = $failedStepIndex - 1; $i >= 0; $i--) {
            try {
                $this->subCommands[$i]->rollback();
            } catch (Exception $e) {
                // Log mais continue le rollback
                error_log("Rollback failed for step $i: " . $e->getMessage());
            }
        }
    }
    
    private function rollbackAllSteps(): void
    {
        $this->rollbackPreviousSteps(count($this->subCommands));
    }
}

// Exemple de sous-commande avec estimation réaliste
final class ImplementCoreLogicCommand implements ProjectCommand
{
    public function __construct(
        private FeatureSpecification $specification
    ) {}
    
    public function getEstimatedDuration(): Duration
    {
        // Estimation basée sur la complexité mesurée
        $complexity = $this->specification->getComplexityScore();
        
        // Formule basée sur l'expérience historique
        $baseMinutes = match($complexity) {
            ComplexityLevel::LOW => 120,      // 2 heures
            ComplexityLevel::MEDIUM => 300,   // 5 heures
            ComplexityLevel::HIGH => 600,     // 10 heures
            ComplexityLevel::VERY_HIGH => 1200 // 20 heures
        };
        
        // Ajustements selon les facteurs externes
        $adjustmentFactor = 1.0;
        
        if ($this->specification->requiresNewTechnology()) {
            $adjustmentFactor += 0.5; // +50% pour nouvelle techno
        }
        
        if ($this->specification->hasComplexIntegrations()) {
            $adjustmentFactor += 0.3; // +30% pour intégrations
        }
        
        if ($this->specification->requiresDataMigration()) {
            $adjustmentFactor += 0.4; // +40% pour migration
        }
        
        return Duration::fromMinutes($baseMinutes * $adjustmentFactor);
    }
    
    public function getDependencies(): array
    {
        return [
            'database_schema_updated',
            'api_contracts_defined',
            'test_environment_ready'
        ];
    }
    
    public function execute(): CommandResult
    {
        // Implémentation avec checkpoints
        $checkpoints = [
            'core_classes_created',
            'business_logic_implemented',
            'validation_added',
            'error_handling_implemented',
            'logging_integrated'
        ];
        
        $completedCheckpoints = [];
        
        try {
            foreach ($checkpoints as $checkpoint) {
                $this->executeCheckpoint($checkpoint);
                $completedCheckpoints[] = $checkpoint;
            }
            
            return CommandResult::success("Core logic implemented", $completedCheckpoints);
            
        } catch (Exception $e) {
            return CommandResult::failure(
                "Failed at checkpoint: " . end($completedCheckpoints),
                $completedCheckpoints
            );
        }
    }
    
    private function executeCheckpoint(string $checkpoint): void
    {
        match($checkpoint) {
            'core_classes_created' => $this->createCoreClasses(),
            'business_logic_implemented' => $this->implementBusinessLogic(),
            'validation_added' => $this->addValidation(),
            'error_handling_implemented' => $this->implementErrorHandling(),
            'logging_integrated' => $this->integrateLogging(),
            default => throw new InvalidArgumentException("Unknown checkpoint: $checkpoint")
        };
    }
    
    public function rollback(): void
    {
        // Rollback spécifique à cette commande
        $this->removeGeneratedFiles();
        $this->revertDatabaseChanges();
        $this->cleanupTemporaryResources();
    }
}

// Orchestrateur de projet avec planification réaliste
final class ProjectManager
{
    public function planProject(ProjectSpecification $spec): ProjectPlan
    {
        $commands = $this->breakDownIntoCommands($spec);
        
        // Calcul des estimations réalistes
        $totalDuration = Duration::zero();
        $dependencies = [];
        
        foreach ($commands as $command) {
            $totalDuration = $totalDuration->add($command->getEstimatedDuration());
            $dependencies = array_merge($dependencies, $command->getDependencies());
        }
        
        // Planification avec buffer global
        $bufferDuration = $totalDuration->multiply(0.2); // 20% de buffer global
        $totalWithBuffer = $totalDuration->add($bufferDuration);
        
        return new ProjectPlan(
            $commands,
            $totalWithBuffer,
            array_unique($dependencies),
            $this->identifyRisks($spec),
            $this->createMilestones($commands)
        );
    }
    
    public function executeProject(ProjectPlan $plan): ProjectResult
    {
        $executor = new CommandExecutor();
        
        return $executor->executeSequentially($plan->getCommands());
    }
}
```

## Métriques de Validation

### Indicateurs de Succès
*Mesures objectives de l'efficacité des corrections*

#### Métriques Techniques
- **Taux de Duplication** : < 3% (correction du Confirmation Bias)
- **Diversité Technologique** : > 70% (correction de l'Anchoring Bias)
- **Respect des Délais** : > 80% (correction du Planning Fallacy)
- **Complexité Cyclomatique** : < 10 par méthode
- **Couverture de Tests** : > 85%
- **Dette Technique** : < 5% du temps de développement

#### Métriques Comportementales
- **Fréquence de Refactoring** : > 1 fois par sprint
- **Adoption de Nouveaux Patterns** : > 2 par trimestre
- **Temps de Review** : < 24h en moyenne
- **Taux de Régression** : < 2%

### Outils de Mesure

#### Analyse Statique
```bash
# PHP
phpstan analyse --level=8 src/
psalm --show-info=false
phpcs --standard=PSR12 src/
phpmd src/ text cleancode,codesize,controversial,design,naming,unusedcode

# Java
mvn sonar:sonar
spotbugs:check
checkstyle:check
pmd:check
```

#### Métriques Comportementales
```yaml
# Exemple de configuration de métriques
metrics:
  code_quality:
    duplication_threshold: 3
    complexity_threshold: 10
    coverage_threshold: 85
  
  behavioral:
    refactoring_frequency: weekly
    pattern_adoption_rate: 2_per_quarter
    review_time_limit: 24h
  
  alerts:
    technical_debt_ratio: 5
    regression_rate: 2
    deadline_miss_rate: 20
```

## Conclusion

Les corrélations entre biais cognitifs, anti-patterns et design patterns constituent le **fondement scientifique** de l'approche AI-KIDO. Cette compréhension permet :

1. **Prédiction** : Anticiper l'émergence d'anti-patterns selon les biais observés
2. **Prévention** : Mettre en place des garde-fous techniques et processus
3. **Correction** : Appliquer les design patterns appropriés de manière ciblée
4. **Mesure** : Évaluer l'efficacité des interventions via des métriques objectives

### Applications Pratiques
- **Code Reviews** : Checklist basée sur les corrélations identifiées
- **Formation** : Sensibilisation aux biais et leurs manifestations techniques
- **Architecture** : Choix de patterns préventifs selon les risques cognitifs
- **Processus** : Intégration de vérifications automatisées

---
*Ce document constitue la base théorique du système AI-KIDO pour la formation aux Design Patterns, Anti-Patterns et Biais Cognitifs.*
