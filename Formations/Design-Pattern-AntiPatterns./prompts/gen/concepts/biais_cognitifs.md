# Biais Cognitifs - Catalogue Scientifique
> Version: 1.0 | Date: 2025-01-05 | Statut: Table de Vérité Fondamentale

## Vue d'ensemble

Ce catalogue présente une **analyse scientifique des biais cognitifs** qui influencent les développeurs dans leurs décisions techniques, avec leurs **corrélations directes avec les Anti-Patterns** et les **solutions via les Design Patterns**.

## Classification des Biais Cognitifs

### Biais de Confirmation et de Recherche d'Information
*Tendances dans la collecte et l'interprétation des informations*

#### 1. Confirmation Bias (Biais de Confirmation)
**Définition Scientifique** : Tendance à rechercher, interpréter et mémoriser les informations qui confirment nos croyances préexistantes.

**Mécanisme Neurologique** : Activation préférentielle du cortex préfrontal ventromédian lors de la validation d'informations cohérentes avec nos croyances.

**Manifestations en Développement** :
- Recherche uniquement de solutions familières
- Ignorance des alternatives techniques
- Résistance aux nouvelles méthodologies
- Validation sélective des tests

**Corrélation avec Anti-Patterns** :
- **Copy-Paste Programming** : "Cette solution a marché avant, elle marchera encore"
- **Golden Hammer** : "Mon framework préféré peut tout faire"
- **Not Invented Here** : "Les solutions externes ne sont pas fiables"

**Exemple Concret PHP** :
```php
<?php
// ❌ Biais de confirmation : utilisation systématique d'arrays
class UserManager
{
    // Toujours utiliser des arrays car "c'est plus simple"
    public function createUser(array $userData): array
    {
        // Validation manuelle répétitive
        if (empty($userData['email'])) {
            return ['error' => 'Email required'];
        }
        if (!filter_var($userData['email'], FILTER_VALIDATE_EMAIL)) {
            return ['error' => 'Invalid email'];
        }
        if (strlen($userData['password']) < 8) {
            return ['error' => 'Password too short'];
        }
        
        // Logique métier mélangée avec la présentation
        $userId = $this->saveToDatabase($userData);
        
        return [
            'success' => true,
            'user_id' => $userId,
            'message' => 'User created successfully'
        ];
    }
    
    public function updateUser(int $userId, array $userData): array
    {
        // Même validation répétée (Copy-Paste)
        if (empty($userData['email'])) {
            return ['error' => 'Email required'];
        }
        if (!filter_var($userData['email'], FILTER_VALIDATE_EMAIL)) {
            return ['error' => 'Invalid email'];
        }
        // ... répétition du code
    }
}
```

**Solution : Value Objects + Strategy Pattern** :
```php
<?php
// ✅ Solution : Structures typées et validation centralisée

final class Email
{
    private string $value;
    
    public function __construct(string $email)
    {
        if (empty($email)) {
            throw new InvalidArgumentException('Email cannot be empty');
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Invalid email format');
        }
        
        $this->value = $email;
    }
    
    public function getValue(): string
    {
        return $this->value;
    }
}

final class Password
{
    private string $value;
    
    public function __construct(string $password)
    {
        if (strlen($password) < 8) {
            throw new InvalidArgumentException('Password must be at least 8 characters');
        }
        
        $this->value = password_hash($password, PASSWORD_ARGON2ID);
    }
    
    public function getValue(): string
    {
        return $this->value;
    }
}

final class User
{
    public function __construct(
        private Email $email,
        private Password $password,
        private string $name
    ) {}
    
    public function getEmail(): Email { return $this->email; }
    public function getPassword(): Password { return $this->password; }
    public function getName(): string { return $this->name; }
}

// Service avec responsabilité unique
final class UserService
{
    public function __construct(
        private UserRepository $repository,
        private UserValidator $validator
    ) {}
    
    public function createUser(string $email, string $password, string $name): User
    {
        // Validation automatique via les Value Objects
        $user = new User(
            new Email($email),
            new Password($password),
            $name
        );
        
        // Validation métier supplémentaire
        $this->validator->validateForCreation($user);
        
        return $this->repository->save($user);
    }
}
```

#### 2. Anchoring Bias (Biais d'Ancrage)
**Définition Scientifique** : Tendance à s'appuyer trop lourdement sur la première information reçue (l'ancre) lors de la prise de décision.

**Mécanisme Neurologique** : Activation du système de récompense dopaminergique lors de la première solution trouvée, créant une résistance au changement.

**Manifestations en Développement** :
- Première architecture conçue devient définitive
- Première estimation de temps rarement révisée
- Premier choix technologique difficile à remettre en question
- Première implémentation considérée comme référence

**Corrélation avec Anti-Patterns** :
- **Golden Hammer** : Premier outil maîtrisé utilisé partout
- **Premature Optimization** : Première zone identifiée sur-optimisée
- **Big Ball of Mud** : Première structure maintenue coûte que coûte

**Exemple Concret Java** :
```java
// ❌ Biais d'ancrage : première solution = solution définitive
public class DataProcessor {
    
    // Première idée : utiliser HashMap pour tout
    private Map<String, Object> cache = new HashMap<>();
    private Map<String, Object> config = new HashMap<>();
    private Map<String, Object> results = new HashMap<>();
    
    public Object processData(String input) {
        // Ancrage sur la première structure de données
        Map<String, Object> data = new HashMap<>();
        data.put("input", input);
        data.put("timestamp", System.currentTimeMillis());
        data.put("processed", false);
        
        // Logique complexe avec des Maps partout
        if (cache.containsKey(input)) {
            Map<String, Object> cached = (Map<String, Object>) cache.get(input);
            if ((Long) cached.get("timestamp") > System.currentTimeMillis() - 300000) {
                return cached.get("result");
            }
        }
        
        // Traitement avec manipulation de Maps
        Object result = performComplexProcessing(data);
        
        Map<String, Object> cacheEntry = new HashMap<>();
        cacheEntry.put("result", result);
        cacheEntry.put("timestamp", System.currentTimeMillis());
        cache.put(input, cacheEntry);
        
        return result;
    }
    
    private Object performComplexProcessing(Map<String, Object> data) {
        // Plus de manipulation de Maps non typées
        String input = (String) data.get("input");
        // ... logique complexe avec casting partout
        return input.toUpperCase();
    }
}
```

**Solution : Types Explicites + Builder Pattern** :
```java
// ✅ Solution : Structures typées et évolutives

public final class ProcessingRequest {
    private final String input;
    private final Instant timestamp;
    private final ProcessingOptions options;
    
    private ProcessingRequest(Builder builder) {
        this.input = builder.input;
        this.timestamp = builder.timestamp;
        this.options = builder.options;
    }
    
    public String getInput() { return input; }
    public Instant getTimestamp() { return timestamp; }
    public ProcessingOptions getOptions() { return options; }
    
    public static class Builder {
        private String input;
        private Instant timestamp = Instant.now();
        private ProcessingOptions options = ProcessingOptions.defaultOptions();
        
        public Builder withInput(String input) {
            this.input = input;
            return this;
        }
        
        public Builder withTimestamp(Instant timestamp) {
            this.timestamp = timestamp;
            return this;
        }
        
        public Builder withOptions(ProcessingOptions options) {
            this.options = options;
            return this;
        }
        
        public ProcessingRequest build() {
            if (input == null || input.trim().isEmpty()) {
                throw new IllegalArgumentException("Input cannot be null or empty");
            }
            return new ProcessingRequest(this);
        }
    }
}

public final class ProcessingResult {
    private final String result;
    private final Instant processedAt;
    private final Duration processingTime;
    
    public ProcessingResult(String result, Instant processedAt, Duration processingTime) {
        this.result = result;
        this.processedAt = processedAt;
        this.processingTime = processingTime;
    }
    
    // Getters...
}

// Cache typé avec Strategy Pattern
public interface CacheStrategy<K, V> {
    Optional<V> get(K key);
    void put(K key, V value);
    void evict(K key);
    void clear();
}

public final class TimeBasedCache<K, V> implements CacheStrategy<K, V> {
    private final Map<K, CacheEntry<V>> cache = new ConcurrentHashMap<>();
    private final Duration ttl;
    
    public TimeBasedCache(Duration ttl) {
        this.ttl = ttl;
    }
    
    @Override
    public Optional<V> get(K key) {
        CacheEntry<V> entry = cache.get(key);
        if (entry != null && !entry.isExpired(ttl)) {
            return Optional.of(entry.getValue());
        }
        cache.remove(key); // Nettoyage automatique
        return Optional.empty();
    }
    
    @Override
    public void put(K key, V value) {
        cache.put(key, new CacheEntry<>(value, Instant.now()));
    }
    
    // Autres méthodes...
}

// Processeur avec architecture claire
public final class DataProcessor {
    
    private final CacheStrategy<String, ProcessingResult> cache;
    private final ProcessingEngine engine;
    
    public DataProcessor(CacheStrategy<String, ProcessingResult> cache, ProcessingEngine engine) {
        this.cache = cache;
        this.engine = engine;
    }
    
    public ProcessingResult processData(ProcessingRequest request) {
        // Vérification du cache
        Optional<ProcessingResult> cached = cache.get(request.getInput());
        if (cached.isPresent()) {
            return cached.get();
        }
        
        // Traitement
        Instant start = Instant.now();
        String result = engine.process(request);
        Duration processingTime = Duration.between(start, Instant.now());
        
        ProcessingResult processingResult = new ProcessingResult(result, Instant.now(), processingTime);
        
        // Mise en cache
        cache.put(request.getInput(), processingResult);
        
        return processingResult;
    }
}
```

#### 3. Availability Heuristic (Heuristique de Disponibilité)
**Définition Scientifique** : Tendance à surestimer la probabilité d'événements dont on se souvient facilement.

**Mécanisme Neurologique** : Activation de l'hippocampe pour la récupération de souvenirs, avec biais vers les événements récents ou marquants.

**Manifestations en Développement** :
- Surestimation des risques récemment rencontrés
- Solutions basées sur les derniers projets
- Peur excessive de bugs récents
- Négligence des problèmes non récents

**Corrélation avec Anti-Patterns** :
- **Premature Optimization** : Optimisation basée sur le dernier problème de performance
- **Over-Engineering** : Architecture complexe pour éviter le dernier problème rencontré
- **Analysis Paralysis** : Peur excessive basée sur les échecs récents

### Biais de Planification et d'Estimation
*Erreurs dans l'évaluation du temps et des ressources*

#### 4. Planning Fallacy (Erreur de Planification)
**Définition Scientifique** : Tendance à sous-estimer le temps, les coûts et les risques des actions futures, tout en surestimant leurs bénéfices.

**Mécanisme Neurologique** : Optimisme cognitif lié à l'activation du cortex préfrontal ventromédian, qui minimise les signaux négatifs.

**Manifestations en Développement** :
- Estimations systématiquement trop optimistes
- Négligence des cas d'erreur et edge cases
- Sous-estimation de la complexité technique
- Oubli du temps de test et de debug

**Corrélation avec Anti-Patterns** :
- **Big Ball of Mud** : Architecture non planifiée par manque de temps prévu
- **Technical Debt** : Raccourcis pris pour respecter les délais
- **Quick Fix** : Solutions temporaires qui deviennent permanentes

**Exemple Concret** :
```php
<?php
// ❌ Planning Fallacy : "Ça va prendre 2 heures"
class QuickUserImport
{
    public function importUsers(string $csvFile): array
    {
        // "Simple import CSV, 30 minutes max"
        $handle = fopen($csvFile, 'r');
        $users = [];
        
        while (($data = fgetcsv($handle)) !== false) {
            // "Juste créer l'utilisateur, c'est simple"
            $user = [
                'email' => $data[0],
                'name' => $data[1],
                'age' => (int)$data[2]
            ];
            
            // Oops, il faut valider l'email (+30 min)
            if (!filter_var($user['email'], FILTER_VALIDATE_EMAIL)) {
                continue; // Ignorer silencieusement (mauvaise idée)
            }
            
            // Oops, il faut vérifier les doublons (+1 heure)
            if ($this->userExists($user['email'])) {
                continue;
            }
            
            // Oops, il faut hasher le mot de passe (+30 min)
            $user['password'] = password_hash('default123', PASSWORD_DEFAULT);
            
            // Oops, il faut gérer les erreurs DB (+1 heure)
            try {
                $this->saveUser($user);
                $users[] = $user;
            } catch (Exception $e) {
                // Log? Rollback? (+2 heures de réflexion)
                error_log("Failed to save user: " . $e->getMessage());
            }
        }
        
        fclose($handle);
        
        // Oops, il faut un rapport d'import (+1 heure)
        // Oops, il faut notifier les utilisateurs (+2 heures)
        // Oops, il faut gérer les gros fichiers (+3 heures)
        // Total : 2 heures estimées → 11 heures réelles
        
        return $users;
    }
}
```

**Solution : Command Pattern + Proper Planning** :
```php
<?php
// ✅ Solution : Architecture planifiée et extensible

interface ImportCommand
{
    public function execute(): ImportResult;
}

final class ImportResult
{
    public function __construct(
        private int $totalProcessed,
        private int $successCount,
        private int $errorCount,
        private array $errors,
        private Duration $processingTime
    ) {}
    
    // Getters...
}

final class UserImportCommand implements ImportCommand
{
    public function __construct(
        private CsvReader $csvReader,
        private UserValidator $validator,
        private UserRepository $repository,
        private ImportLogger $logger,
        private NotificationService $notificationService
    ) {}
    
    public function execute(): ImportResult
    {
        $startTime = microtime(true);
        $totalProcessed = 0;
        $successCount = 0;
        $errors = [];
        
        try {
            $users = $this->csvReader->readUsers();
            $totalProcessed = count($users);
            
            foreach ($users as $userData) {
                try {
                    $this->processUser($userData);
                    $successCount++;
                } catch (ValidationException $e) {
                    $errors[] = "Row {$userData['row']}: {$e->getMessage()}";
                    $this->logger->logValidationError($userData, $e);
                } catch (DuplicateUserException $e) {
                    $errors[] = "Row {$userData['row']}: Duplicate email {$userData['email']}";
                    $this->logger->logDuplicateError($userData, $e);
                }
            }
            
            // Notification des résultats
            $this->notificationService->notifyImportCompleted($successCount, count($errors));
            
        } catch (Exception $e) {
            $this->logger->logCriticalError($e);
            throw new ImportException("Import failed critically", $e);
        }
        
        $processingTime = Duration::fromSeconds(microtime(true) - $startTime);
        
        return new ImportResult(
            $totalProcessed,
            $successCount,
            count($errors),
            $errors,
            $processingTime
        );
    }
    
    private function processUser(array $userData): void
    {
        // Validation
        $validationResult = $this->validator->validate($userData);
        if (!$validationResult->isValid()) {
            throw new ValidationException($validationResult->getFirstError());
        }
        
        // Création de l'utilisateur
        $user = User::fromArray($userData);
        
        // Sauvegarde
        $this->repository->save($user);
    }
}

// Usage avec planification réaliste
final class ImportService
{
    public function importUsersFromCsv(string $filePath): ImportResult
    {
        // Estimation réaliste basée sur l'expérience :
        // - Lecture CSV : 10% du temps
        // - Validation : 30% du temps  
        // - Sauvegarde : 40% du temps
        // - Gestion d'erreurs : 20% du temps
        
        $command = new UserImportCommand(
            new CsvReader($filePath),
            new UserValidator(),
            new DatabaseUserRepository(),
            new FileImportLogger(),
            new EmailNotificationService()
        );
        
        return $command->execute();
    }
}
```

#### 5. Overconfidence Bias (Biais de Surconfiance)
**Définition Scientifique** : Tendance à surestimer ses propres capacités, connaissances ou chances de succès.

**Mécanisme Neurologique** : Activation excessive du cortex préfrontal dorsolatéral, associée à une sous-activation de l'insula (région de l'autocritique).

**Manifestations en Développement** :
- Estimation trop optimiste de ses compétences
- Négligence des tests et de la documentation
- Refus de demander de l'aide ou des reviews
- Sous-estimation de la complexité des tâches

**Corrélation avec Anti-Patterns** :
- **Premature Optimization** : "Je sais où sont les goulots d'étranglement"
- **Not Invented Here** : "Je peux faire mieux que les librairies existantes"
- **God Object** : "Cette classe peut tout gérer"

### Biais Sociaux et de Groupe
*Influences des dynamiques d'équipe*

#### 6. Groupthink (Pensée de Groupe)
**Définition Scientifique** : Phénomène psychologique où le désir d'harmonie dans un groupe résulte en des décisions irrationnelles ou dysfonctionnelles.

**Mécanisme Neurologique** : Activation des circuits de récompense sociale (ocytocine) qui privilégient la cohésion de groupe sur l'analyse critique.

**Manifestations en Développement** :
- Adoption non critique des décisions techniques
- Évitement des débats constructifs
- Conformité aux standards d'équipe sans questionnement
- Suppression des opinions dissidentes

**Corrélation avec Anti-Patterns** :
- **Cargo Cult Programming** : Adoption de pratiques sans compréhension
- **Golden Hammer** : Utilisation d'outils par conformité d'équipe
- **Analysis Paralysis** : Évitement des décisions controversées

#### 7. Authority Bias (Biais d'Autorité)
**Définition Scientifique** : Tendance à attribuer une plus grande précision à l'opinion d'une figure d'autorité et à être plus influencé par cette opinion.

**Manifestations en Développement** :
- Acceptation aveugle des décisions du lead developer
- Adoption non critique des frameworks "recommandés"
- Résistance à remettre en question l'architecture existante
- Déférence excessive aux "experts" reconnus

### Biais de Traitement de l'Information
*Erreurs dans l'analyse et la prise de décision*

#### 8. Sunk Cost Fallacy (Sophisme des Coûts Irrécupérables)
**Définition Scientifique** : Tendance à continuer un investissement basé sur les ressources déjà investies plutôt que sur les bénéfices futurs.

**Mécanisme Neurologique** : Activation du striatum ventral (système de récompense) qui cherche à justifier les investissements passés.

**Manifestations en Développement** :
- Maintien de code legacy par "respect" du travail passé
- Continuation de projets non viables
- Refus de refactoring par peur de "perdre" le code existant
- Attachement excessif aux premières implémentations

**Corrélation avec Anti-Patterns** :
- **Lava Flow** : Conservation de code obsolète
- **Big Ball of Mud** : Refus de réécrire l'architecture
- **Technical Debt** : Accumulation par évitement du refactoring

**Exemple Concret Java** :
```java
// ❌ Sunk Cost Fallacy : "On a déjà investi 6 mois là-dessus"
public class LegacyOrderProcessor {
    
    // Code écrit il y a 2 ans, devenu ingérable
    private Map<String, Object> orderCache = new HashMap<>();
    private List<String> processingQueue = new ArrayList<>();
    private Properties config = new Properties();
    
    // Méthode de 200 lignes qu'on n'ose plus toucher
    public String processOrder(Map<String, Object> orderData) {
        // "On ne peut pas refactorer, ça marche et on a passé 6 mois dessus"
        
        String orderId = UUID.randomUUID().toString();
        orderData.put("id", orderId);
        orderData.put("status", "processing");
        orderData.put("created_at", System.currentTimeMillis());
        
        // Logique complexe avec des conditions imbriquées
        if (orderData.containsKey("customer_id")) {
            String customerId = (String) orderData.get("customer_id");
            if (customerId != null && !customerId.isEmpty()) {
                Map<String, Object> customer = getCustomerFromCache(customerId);
                if (customer != null) {
                    String customerType = (String) customer.get("type");
                    if ("premium".equals(customerType)) {
                        // Logique premium (50 lignes)
                        applyPremiumDiscount(orderData);
                        setPremiumShipping(orderData);
                        // ... 48 autres lignes
                    } else if ("gold".equals(customerType)) {
                        // Logique gold (40 lignes) - copie de premium avec variations
                        applyGoldDiscount(orderData);
                        setGoldShipping(orderData);
                        // ... 38 autres lignes
                    } else {
                        // Logique standard (30 lignes)
                        applyStandardProcessing(orderData);
                        // ... 28 autres lignes
                    }
                }
            }
        }
        
        // Plus de logique complexe...
        validateInventory(orderData);
        calculateTaxes(orderData);
        processPayment(orderData);
        updateInventory(orderData);
        sendNotifications(orderData);
        
        orderCache.put(orderId, orderData);
        processingQueue.add(orderId);
        
        return orderId;
    }
    
    // 15 méthodes privées de 20-50 lignes chacune
    private void applyPremiumDiscount(Map<String, Object> orderData) { /* 50 lignes */ }
    private void applyGoldDiscount(Map<String, Object> orderData) { /* 40 lignes */ }
    // ... 13 autres méthodes similaires
}
```

**Solution : Refactoring Progressif** :
```java
// ✅ Solution : Refactoring par étapes, préservation de la valeur

// Étape 1 : Extraire les Value Objects
public final class OrderId {
    private final String value;
    
    public OrderId() {
        this.value = UUID.randomUUID().toString();
    }
    
    public OrderId(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Order ID cannot be null or empty");
        }
        this.value = value;
    }
    
    public String getValue() { return value; }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof OrderId)) return false;
        OrderId orderId = (OrderId) o;
        return Objects.equals(value, orderId.value);
    }
    
    @Override
    public int hashCode() { return Objects.hash(value); }
}

// Étape 2 : Strategy Pattern pour les types de clients
public interface CustomerProcessingStrategy {
    void processOrder(Order order, Customer customer);
}

public final class PremiumCustomerStrategy implements CustomerProcessingStrategy {
    private final DiscountService discountService;
    private final ShippingService shippingService;
    
    public PremiumCustomerStrategy(DiscountService discountService, ShippingService shippingService) {
        this.discountService = discountService;
        this.shippingService = shippingService;
    }
    
    @Override
    public void processOrder(Order order, Customer customer) {
        // Logique claire et testable
        Discount discount = discountService.calculatePremiumDiscount(order);
        order.applyDiscount(discount);
        
        ShippingOption shipping = shippingService.getPremiumShipping(order);
        order.setShippingOption(shipping);
    }
}

// Étape 3 : Command Pattern pour le processus
public final class ProcessOrderCommand {
    private final OrderValidator validator;
    private final CustomerService customerService;
    private final Map<CustomerType, CustomerProcessingStrategy> strategies;
    private final PaymentProcessor paymentProcessor;
    private final InventoryService inventoryService;
    private final NotificationService notificationService;
    
    public ProcessOrderCommand(/* dependencies */) {
        this.validator = validator;
        this.customerService = customerService;
        this.strategies = Map.of(
            CustomerType.PREMIUM, new PremiumCustomerStrategy(discountService, shippingService),
            CustomerType.GOLD, new GoldCustomerStrategy(discountService, shippingService),
            CustomerType.STANDARD, new StandardCustomerStrategy(discountService, shippingService)
        );
        // ... autres dépendances
    }
    
    public OrderResult execute(OrderRequest request) {
        // Processus clair et linéaire
        Order order = Order.fromRequest(request);
        
        // Validation
        ValidationResult validation = validator.validate(order);
        if (!validation.isValid()) {
            return OrderResult.validationFailure(validation.getErrors());
        }
        
        // Traitement selon le type de client
        Customer customer = customerService.findById(request.getCustomerId());
        CustomerProcessingStrategy strategy = strategies.get(customer.getType());
        strategy.processOrder(order, customer);
        
        // Étapes communes
        inventoryService.reserve(order.getItems());
        PaymentResult payment = paymentProcessor.process(order.getPaymentInfo());
        
        if (payment.isSuccessful()) {
            inventoryService.confirm(order.getItems());
            notificationService.notifyOrderConfirmed(order);
            return OrderResult.success(order.getId());
        } else {
            inventoryService.release(order.getItems());
            return OrderResult.paymentFailure(payment.getError());
        }
    }
}

// Migration progressive : Adapter Pattern pour compatibilité
public final class LegacyOrderProcessorAdapter {
    private final ProcessOrderCommand newProcessor;
    
    public LegacyOrderProcessorAdapter(ProcessOrderCommand newProcessor) {
        this.newProcessor = newProcessor;
    }
    
    // Maintient l'interface legacy pendant la transition
    public String processOrder(Map<String, Object> orderData) {
        try {
            OrderRequest request = OrderRequest.fromLegacyMap(orderData);
            OrderResult result = newProcessor.execute(request);
            
            if (result.isSuccess()) {
                return result.getOrderId().getValue();
            } else {
                throw new OrderProcessingException(result.getError());
            }
        } catch (Exception e) {
            // Fallback vers l'ancienne implémentation si nécessaire
            return fallbackToLegacyProcessor(orderData);
        }
    }
    
    private String fallbackToLegacyProcessor(Map<String, Object> orderData) {
        // Utilisation temporaire de l'ancien code en cas d'échec
        // Permet une migration sans risque
        return legacyProcessor.processOrder(orderData);
    }
}
```

#### 9. Dunning-Kruger Effect
**Définition Scientifique** : Biais cognitif par lequel les personnes ayant de faibles compétences surestiment grandement leurs propres compétences.

**Manifestations en Développement** :
- Développeurs juniors confiants dans des solutions complexes
- Sous-estimation du temps nécessaire pour apprendre
- Résistance aux conseils des développeurs seniors
- Architecture over-engineered par manque d'expérience

## Corrélations Biais ↔ Anti-Patterns ↔ Design Patterns

### Matrice de Corrélation

| Biais Cognitif | Anti-Pattern Principal | Design Pattern Solution | Mécanisme de Correction |
|---|---|---|---|
| **Confirmation Bias** | Copy-Paste Programming | Template Method | Factorisation forcée |
| **Anchoring Bias** | Golden Hammer | Strategy Pattern | Alternatives explicites |
| **Planning Fallacy** | Big Ball of Mud | Command Pattern | Planification structurée |
| **Overconfidence** |
