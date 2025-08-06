# Design Patterns - Catalogue Exhaustif
> Version: 1.0 | Date: 2025-01-05 | Statut: Table de Vérité Fondamentale

## Vue d'ensemble

Ce catalogue présente une **documentation exhaustive des Design Patterns** utilisés dans le développement logiciel, avec un focus particulier sur les implémentations **PHP et Java** conformément aux contraintes du projet AI-KIDO.

## Classification des Patterns

### Patterns Créationnels (Creational Patterns)
*Concernent la création d'objets*

#### 1. Singleton Pattern
**Intention** : Garantir qu'une classe n'a qu'une seule instance et fournir un point d'accès global.

**Problème résolu** : 
- Contrôle strict de l'instanciation
- Accès global à une ressource partagée
- Économie de ressources système

**Structure UML** :
```
┌─────────────────┐
│    Singleton    │
├─────────────────┤
│ - instance      │
├─────────────────┤
│ + getInstance() │
│ - constructor() │
└─────────────────┘
```

**Implémentation PHP** :
```php
<?php
declare(strict_types=1);

final class DatabaseConnection
{
    private static ?self $instance = null;
    private PDO $connection;
    
    private function __construct()
    {
        $this->connection = new PDO(
            'mysql:host=localhost;dbname=app',
            'user',
            'password',
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
    }
    
    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection(): PDO
    {
        return $this->connection;
    }
    
    // Empêcher le clonage
    private function __clone() {}
    
    // Empêcher la désérialisation
    public function __wakeup()
    {
        throw new Exception("Cannot unserialize singleton");
    }
}

// Usage
$db = DatabaseConnection::getInstance();
$connection = $db->getConnection();
```

**Implémentation Java** :
```java
public final class DatabaseConnection {
    
    // Volatile pour garantir la visibilité entre threads
    private static volatile DatabaseConnection instance;
    private final Connection connection;
    
    private DatabaseConnection() {
        try {
            this.connection = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/app",
                "user",
                "password"
            );
        } catch (SQLException e) {
            throw new RuntimeException("Failed to create database connection", e);
        }
    }
    
    // Double-checked locking pour thread-safety
    public static DatabaseConnection getInstance() {
        if (instance == null) {
            synchronized (DatabaseConnection.class) {
                if (instance == null) {
                    instance = new DatabaseConnection();
                }
            }
        }
        return instance;
    }
    
    public Connection getConnection() {
        return connection;
    }
}

// Usage
DatabaseConnection db = DatabaseConnection.getInstance();
Connection conn = db.getConnection();
```

**Variantes** :
- **Eager Initialization** : Instance créée au chargement de la classe
- **Lazy Initialization** : Instance créée à la première demande
- **Thread-Safe** : Gestion de la concurrence
- **Enum Singleton** (Java) : Utilisation d'enum pour garantir l'unicité

**Avantages** :
- ✅ Contrôle strict de l'instanciation
- ✅ Accès global uniforme
- ✅ Économie de ressources
- ✅ Initialisation paresseuse possible

**Inconvénients** :
- ❌ Couplage fort (dépendance globale)
- ❌ Tests unitaires difficiles
- ❌ Violation du principe de responsabilité unique
- ❌ Problèmes de concurrence potentiels

#### 2. Factory Method Pattern
**Intention** : Créer des objets sans spécifier leur classe exacte.

**Problème résolu** :
- Délégation de la création d'objets
- Extensibilité sans modification du code client
- Découplage entre création et utilisation

**Structure UML** :
```
┌─────────────────┐    ┌─────────────────┐
│    Creator      │    │    Product      │
├─────────────────┤    ├─────────────────┤
│ + factoryMethod │    │ + operation()   │
│ + anOperation() │    └─────────────────┘
└─────────────────┘           ▲
         ▲                    │
         │                    │
┌─────────────────┐    ┌─────────────────┐
│ ConcreteCreator │    │ ConcreteProduct │
├─────────────────┤    ├─────────────────┤
│ + factoryMethod │    │ + operation()   │
└─────────────────┘    └─────────────────┘
```

**Implémentation PHP** :
```php
<?php
declare(strict_types=1);

// Interface produit
interface PaymentProcessor
{
    public function processPayment(float $amount): PaymentResult;
}

// Produits concrets
final class CreditCardProcessor implements PaymentProcessor
{
    public function processPayment(float $amount): PaymentResult
    {
        // Logique spécifique carte de crédit
        return new PaymentResult(true, "Credit card payment processed: $amount");
    }
}

final class PayPalProcessor implements PaymentProcessor
{
    public function processPayment(float $amount): PaymentResult
    {
        // Logique spécifique PayPal
        return new PaymentResult(true, "PayPal payment processed: $amount");
    }
}

final class BankTransferProcessor implements PaymentProcessor
{
    public function processPayment(float $amount): PaymentResult
    {
        // Logique spécifique virement bancaire
        return new PaymentResult(true, "Bank transfer processed: $amount");
    }
}

// Créateur abstrait
abstract class PaymentProcessorFactory
{
    abstract public function createProcessor(): PaymentProcessor;
    
    public function processPayment(float $amount): PaymentResult
    {
        $processor = $this->createProcessor();
        return $processor->processPayment($amount);
    }
}

// Créateurs concrets
final class CreditCardProcessorFactory extends PaymentProcessorFactory
{
    public function createProcessor(): PaymentProcessor
    {
        return new CreditCardProcessor();
    }
}

final class PayPalProcessorFactory extends PaymentProcessorFactory
{
    public function createProcessor(): PaymentProcessor
    {
        return new PayPalProcessor();
    }
}

// Usage
$factory = new CreditCardProcessorFactory();
$result = $factory->processPayment(100.0);
```

**Implémentation Java** :
```java
// Interface produit
public interface PaymentProcessor {
    PaymentResult processPayment(BigDecimal amount);
}

// Produits concrets
public final class CreditCardProcessor implements PaymentProcessor {
    @Override
    public PaymentResult processPayment(BigDecimal amount) {
        // Logique spécifique carte de crédit
        return new PaymentResult(true, "Credit card payment processed: " + amount);
    }
}

public final class PayPalProcessor implements PaymentProcessor {
    @Override
    public PaymentResult processPayment(BigDecimal amount) {
        // Logique spécifique PayPal
        return new PaymentResult(true, "PayPal payment processed: " + amount);
    }
}

// Créateur abstrait
public abstract class PaymentProcessorFactory {
    
    public abstract PaymentProcessor createProcessor();
    
    public PaymentResult processPayment(BigDecimal amount) {
        PaymentProcessor processor = createProcessor();
        return processor.processPayment(amount);
    }
}

// Créateurs concrets
public final class CreditCardProcessorFactory extends PaymentProcessorFactory {
    @Override
    public PaymentProcessor createProcessor() {
        return new CreditCardProcessor();
    }
}

public final class PayPalProcessorFactory extends PaymentProcessorFactory {
    @Override
    public PaymentProcessor createProcessor() {
        return new PayPalProcessor();
    }
}

// Usage
PaymentProcessorFactory factory = new CreditCardProcessorFactory();
PaymentResult result = factory.processPayment(new BigDecimal("100.00"));
```

#### 3. Abstract Factory Pattern
**Intention** : Créer des familles d'objets liés sans spécifier leurs classes concrètes.

**Problème résolu** :
- Création de familles d'objets cohérentes
- Indépendance vis-à-vis des implémentations concrètes
- Facilité de changement de famille d'objets

**Implémentation PHP** :
```php
<?php
declare(strict_types=1);

// Interfaces des produits
interface Button
{
    public function render(): string;
}

interface Checkbox
{
    public function render(): string;
}

// Famille Windows
final class WindowsButton implements Button
{
    public function render(): string
    {
        return '<button class="windows-btn">Windows Button</button>';
    }
}

final class WindowsCheckbox implements Checkbox
{
    public function render(): string
    {
        return '<input type="checkbox" class="windows-checkbox">';
    }
}

// Famille Mac
final class MacButton implements Button
{
    public function render(): string
    {
        return '<button class="mac-btn">Mac Button</button>';
    }
}

final class MacCheckbox implements Checkbox
{
    public function render(): string
    {
        return '<input type="checkbox" class="mac-checkbox">';
    }
}

// Factory abstraite
interface GUIFactory
{
    public function createButton(): Button;
    public function createCheckbox(): Checkbox;
}

// Factories concrètes
final class WindowsFactory implements GUIFactory
{
    public function createButton(): Button
    {
        return new WindowsButton();
    }
    
    public function createCheckbox(): Checkbox
    {
        return new WindowsCheckbox();
    }
}

final class MacFactory implements GUIFactory
{
    public function createButton(): Button
    {
        return new MacButton();
    }
    
    public function createCheckbox(): Checkbox
    {
        return new MacCheckbox();
    }
}

// Usage
function createUI(GUIFactory $factory): string
{
    $button = $factory->createButton();
    $checkbox = $factory->createCheckbox();
    
    return $button->render() . $checkbox->render();
}

$windowsFactory = new WindowsFactory();
$windowsUI = createUI($windowsFactory);
```

#### 4. Builder Pattern
**Intention** : Construire des objets complexes étape par étape.

**Problème résolu** :
- Construction d'objets avec de nombreux paramètres
- Validation progressive des paramètres
- Réutilisation du processus de construction

**Implémentation PHP** :
```php
<?php
declare(strict_types=1);

final class DatabaseConfig
{
    private string $host;
    private int $port;
    private string $database;
    private string $username;
    private string $password;
    private array $options;
    
    public function __construct(
        string $host,
        int $port,
        string $database,
        string $username,
        string $password,
        array $options = []
    ) {
        $this->host = $host;
        $this->port = $port;
        $this->database = $database;
        $this->username = $username;
        $this->password = $password;
        $this->options = $options;
    }
    
    // Getters...
    public function getHost(): string { return $this->host; }
    public function getPort(): int { return $this->port; }
    public function getDatabase(): string { return $this->database; }
    public function getUsername(): string { return $this->username; }
    public function getPassword(): string { return $this->password; }
    public function getOptions(): array { return $this->options; }
}

final class DatabaseConfigBuilder
{
    private string $host = 'localhost';
    private int $port = 3306;
    private string $database = '';
    private string $username = '';
    private string $password = '';
    private array $options = [];
    
    public function host(string $host): self
    {
        $this->host = $host;
        return $this;
    }
    
    public function port(int $port): self
    {
        if ($port < 1 || $port > 65535) {
            throw new InvalidArgumentException('Port must be between 1 and 65535');
        }
        $this->port = $port;
        return $this;
    }
    
    public function database(string $database): self
    {
        if (empty($database)) {
            throw new InvalidArgumentException('Database name cannot be empty');
        }
        $this->database = $database;
        return $this;
    }
    
    public function credentials(string $username, string $password): self
    {
        $this->username = $username;
        $this->password = $password;
        return $this;
    }
    
    public function option(string $key, mixed $value): self
    {
        $this->options[$key] = $value;
        return $this;
    }
    
    public function build(): DatabaseConfig
    {
        if (empty($this->database)) {
            throw new RuntimeException('Database name is required');
        }
        
        return new DatabaseConfig(
            $this->host,
            $this->port,
            $this->database,
            $this->username,
            $this->password,
            $this->options
        );
    }
}

// Usage
$config = (new DatabaseConfigBuilder())
    ->host('production-db.example.com')
    ->port(5432)
    ->database('ecommerce')
    ->credentials('app_user', 'secure_password')
    ->option('charset', 'utf8mb4')
    ->option('timeout', 30)
    ->build();
```

#### 5. Prototype Pattern
**Intention** : Créer des objets en clonant un prototype existant.

**Problème résolu** :
- Création d'objets coûteuse en ressources
- Éviter la re-initialisation complète
- Création d'objets avec état complexe

### Patterns Structurels (Structural Patterns)
*Concernent la composition d'objets et de classes*

#### 6. Adapter Pattern
**Intention** : Permettre à des interfaces incompatibles de travailler ensemble.

**Problème résolu** :
- Intégration de bibliothèques tierces
- Réutilisation de code existant
- Migration progressive d'API

**Implémentation PHP** :
```php
<?php
declare(strict_types=1);

// Interface cible attendue par le client
interface PaymentGateway
{
    public function processPayment(float $amount, string $currency): PaymentResult;
}

// Service externe avec interface incompatible
final class StripeAPI
{
    public function charge(int $amountInCents, string $currencyCode, array $metadata = []): array
    {
        // Simulation appel API Stripe
        return [
            'id' => 'ch_' . uniqid(),
            'status' => 'succeeded',
            'amount' => $amountInCents,
            'currency' => $currencyCode
        ];
    }
}

// Adaptateur
final class StripeAdapter implements PaymentGateway
{
    private StripeAPI $stripeAPI;
    
    public function __construct(StripeAPI $stripeAPI)
    {
        $this->stripeAPI = $stripeAPI;
    }
    
    public function processPayment(float $amount, string $currency): PaymentResult
    {
        // Conversion du format (euros vers centimes)
        $amountInCents = (int) ($amount * 100);
        
        // Appel à l'API Stripe avec adaptation des paramètres
        $response = $this->stripeAPI->charge($amountInCents, strtolower($currency));
        
        // Conversion du résultat vers le format attendu
        return new PaymentResult(
            $response['status'] === 'succeeded',
            $response['id'],
            $response['amount'] / 100
        );
    }
}

// Usage
$stripeAPI = new StripeAPI();
$paymentGateway = new StripeAdapter($stripeAPI);
$result = $paymentGateway->processPayment(99.99, 'EUR');
```

#### 7. Decorator Pattern
**Intention** : Ajouter dynamiquement des responsabilités à un objet.

**Problème résolu** :
- Extension de fonctionnalités sans modification
- Alternative flexible à l'héritage
- Composition de comportements

**Implémentation Java** :
```java
// Interface composant
public interface Coffee {
    String getDescription();
    BigDecimal getCost();
}

// Composant concret
public final class SimpleCoffee implements Coffee {
    @Override
    public String getDescription() {
        return "Simple coffee";
    }
    
    @Override
    public BigDecimal getCost() {
        return new BigDecimal("2.00");
    }
}

// Décorateur abstrait
public abstract class CoffeeDecorator implements Coffee {
    protected final Coffee coffee;
    
    public CoffeeDecorator(Coffee coffee) {
        this.coffee = Objects.requireNonNull(coffee, "Coffee cannot be null");
    }
    
    @Override
    public String getDescription() {
        return coffee.getDescription();
    }
    
    @Override
    public BigDecimal getCost() {
        return coffee.getCost();
    }
}

// Décorateurs concrets
public final class MilkDecorator extends CoffeeDecorator {
    public MilkDecorator(Coffee coffee) {
        super(coffee);
    }
    
    @Override
    public String getDescription() {
        return coffee.getDescription() + ", milk";
    }
    
    @Override
    public BigDecimal getCost() {
        return coffee.getCost().add(new BigDecimal("0.50"));
    }
}

public final class SugarDecorator extends CoffeeDecorator {
    public SugarDecorator(Coffee coffee) {
        super(coffee);
    }
    
    @Override
    public String getDescription() {
        return coffee.getDescription() + ", sugar";
    }
    
    @Override
    public BigDecimal getCost() {
        return coffee.getCost().add(new BigDecimal("0.25"));
    }
}

// Usage
Coffee coffee = new SimpleCoffee();
coffee = new MilkDecorator(coffee);
coffee = new SugarDecorator(coffee);

System.out.println(coffee.getDescription()); // "Simple coffee, milk, sugar"
System.out.println(coffee.getCost()); // 2.75
```

#### 8. Facade Pattern
**Intention** : Fournir une interface unifiée pour un ensemble de sous-systèmes.

**Problème résolu** :
- Simplification d'API complexes
- Découplage client/sous-systèmes
- Point d'entrée unique

**Structure UML** :
```
┌─────────────────┐    ┌─────────────────┐
│     Facade      │    │   Subsystem1    │
├─────────────────┤    ├─────────────────┤
│ + operation()   │───▶│ + operation1()  │
└─────────────────┘    └─────────────────┘
         │              ┌─────────────────┐
         └─────────────▶│   Subsystem2    │
                        ├─────────────────┤
                        │ + operation2()  │
                        └─────────────────┘
```

**Implémentation PHP** :
```php
<?php
declare(strict_types=1);

// Sous-systèmes complexes
final class DatabaseService
{
    public function connect(): void
    {
        echo "Connecting to database...\n";
    }
    
    public function executeQuery(string $query): array
    {
        echo "Executing query: $query\n";
        return ['result' => 'data'];
    }
    
    public function disconnect(): void
    {
        echo "Disconnecting from database...\n";
    }
}

final class CacheService
{
    public function get(string $key): ?string
    {
        echo "Getting cache for key: $key\n";
        return null; // Cache miss
    }
    
    public function set(string $key, string $value): void
    {
        echo "Setting cache for key: $key\n";
    }
}

final class LoggingService
{
    public function log(string $message): void
    {
        echo "LOG: $message\n";
    }
}

final class ValidationService
{
    public function validateUser(array $userData): bool
    {
        echo "Validating user data...\n";
        return !empty($userData['email']);
    }
}

// Facade simplifiant l'accès
final class UserServiceFacade
{
    private DatabaseService $database;
    private CacheService $cache;
    private LoggingService $logger;
    private ValidationService $validator;
    
    public function __construct()
    {
        $this->database = new DatabaseService();
        $this->cache = new CacheService();
        $this->logger = new LoggingService();
        $this->validator = new ValidationService();
    }
    
    public function getUserById(int $userId): ?array
    {
        $this->logger->log("Fetching user $userId");
        
        // Vérifier le cache d'abord
        $cacheKey = "user_$userId";
        $cachedUser = $this->cache->get($cacheKey);
        
        if ($cachedUser !== null) {
            $this->logger->log("User $userId found in cache");
            return json_decode($cachedUser, true);
        }
        
        // Récupérer depuis la base de données
        $this->database->connect();
        $userData = $this->database->executeQuery("SELECT * FROM users WHERE id = $userId");
        $this->database->disconnect();
        
        if (!empty($userData)) {
            // Mettre en cache pour les prochaines requêtes
            $this->cache->set($cacheKey, json_encode($userData));
            $this->logger->log("User $userId cached successfully");
        }
        
        return $userData;
    }
    
    public function createUser(array $userData): bool
    {
        $this->logger->log("Creating new user");
        
        // Validation des données
        if (!$this->validator->validateUser($userData)) {
            $this->logger->log("User validation failed");
            return false;
        }
        
        // Insertion en base
        $this->database->connect();
        $result = $this->database->executeQuery(
            "INSERT INTO users (email, name) VALUES ('{$userData['email']}', '{$userData['name']}')"
        );
        $this->database->disconnect();
        
        $this->logger->log("User created successfully");
        return true;
    }
}

// Usage simplifié
$userService = new UserServiceFacade();

// Récupération d'utilisateur (gère cache, DB, logging automatiquement)
$user = $userService->getUserById(123);

// Création d'utilisateur (gère validation, DB, logging automatiquement)
$success = $userService->createUser([
    'email' => 'john@example.com',
    'name' => 'John Doe'
]);
```

**Avantages** :
- ✅ Interface simplifiée pour systèmes complexes
- ✅ Découplage entre clients et sous-systèmes
- ✅ Centralisation de la logique d'orchestration
- ✅ Facilite les tests et la maintenance

**Inconvénients** :
- ❌ Peut devenir un "God Object" si mal conçu
- ❌ Risque de cacher la complexité nécessaire
- ❌ Point de défaillance unique potentiel

#### 9. Composite Pattern
**Intention** : Composer des objets en structures arborescentes pour représenter des hiérarchies partie-tout.

**Problème résolu** :
- Traitement uniforme d'objets individuels et composés
- Structures hiérarchiques récursives
- Opérations sur arbres d'objets

**Structure UML** :
```
┌─────────────────┐
│   Component     │
├─────────────────┤
│ + operation()   │
└─────────────────┘
         ▲
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌───▼───────┐
│ Leaf  │ │ Composite │
├───────┤ ├───────────┤
│ +op() │ │ +add()    │
└───────┘ │ +remove() │
          │ +op()     │
          └───────────┘
```

**Implémentation Java** :
```java
import java.util.*;

// Interface composant
public interface FileSystemComponent {
    String getName();
    long getSize();
    void display(String indent);
}

// Feuille - Fichier
public final class File implements FileSystemComponent {
    private final String name;
    private final long size;
    
    public File(String name, long size) {
        this.name = Objects.requireNonNull(name, "Name cannot be null");
        this.size = size;
    }
    
    @Override
    public String getName() {
        return name;
    }
    
    @Override
    public long getSize() {
        return size;
    }
    
    @Override
    public void display(String indent) {
        System.out.println(indent + "📄 " + name + " (" + size + " bytes)");
    }
}

// Composite - Dossier
public final class Directory implements FileSystemComponent {
    private final String name;
    private final List<FileSystemComponent> children;
    
    public Directory(String name) {
        this.name = Objects.requireNonNull(name, "Name cannot be null");
        this.children = new ArrayList<>();
    }
    
    public void add(FileSystemComponent component) {
        Objects.requireNonNull(component, "Component cannot be null");
        children.add(component);
    }
    
    public void remove(FileSystemComponent component) {
        children.remove(component);
    }
    
    @Override
    public String getName() {
        return name;
    }
    
    @Override
    public long getSize() {
        return children.stream()
                      .mapToLong(FileSystemComponent::getSize)
                      .sum();
    }
    
    @Override
    public void display(String indent) {
        System.out.println(indent + "📁 " + name + "/ (" + getSize() + " bytes total)");
        for (FileSystemComponent child : children) {
            child.display(indent + "  ");
        }
    }
    
    public List<FileSystemComponent> getChildren() {
        return Collections.unmodifiableList(children);
    }
}

// Usage
Directory root = new Directory("project");
Directory src = new Directory("src");
Directory tests = new Directory("tests");

// Ajout de fichiers
src.add(new File("Main.java", 1500));
src.add(new File("Utils.java", 800));
tests.add(new File("MainTest.java", 1200));
tests.add(new File("UtilsTest.java", 600));

// Construction de l'arbre
root.add(src);
root.add(tests);
root.add(new File("README.md", 300));
root.add(new File("pom.xml", 2000));

// Affichage de toute la structure
root.display("");
// Sortie:
// 📁 project/ (6400 bytes total)
//   📁 src/ (2300 bytes total)
//     📄 Main.java (1500 bytes)
//     📄 Utils.java (800 bytes)
//   📁 tests/ (1800 bytes total)
//     📄 MainTest.java (1200 bytes)
//     📄 UtilsTest.java (600 bytes)
//   📄 README.md (300 bytes)
//   📄 pom.xml (2000 bytes)

System.out.println("Total project size: " + root.getSize() + " bytes");
```

**Avantages** :
- ✅ Traitement uniforme des objets simples et composés
- ✅ Facilite l'ajout de nouveaux types de composants
- ✅ Structure récursive naturelle
- ✅ Simplification du code client

**Inconvénients** :
- ❌ Peut rendre le design trop général
- ❌ Difficile de restreindre les types de composants
- ❌ Complexité accrue pour des cas simples

#### 15. Bridge Pattern
**Intention** : Séparer une abstraction de son implémentation afin que les deux puissent varier indépendamment.

**Problème résolu** :
- Éviter le couplage permanent entre abstraction et implémentation
- Partager une implémentation entre plusieurs objets
- Extensibilité des hiérarchies d'abstraction et d'implémentation

**Structure UML** :
```
┌─────────────────┐    ┌─────────────────┐
│   Abstraction   │    │ Implementation  │
├─────────────────┤    ├─────────────────┤
│ - implementor   │───▶│ + operation()   │
│ + operation()   │    └─────────────────┘
└─────────────────┘             ▲
         ▲                      │
         │              ┌───────┴───────┐
┌─────────────────┐     │               │
│RefinedAbstraction│ ┌───▼─────────┐ ┌──▼─────────┐
├─────────────────┤ │ConcreteImplA│ │ConcreteImplB│
│ + operation()   │ ├─────────────┤ ├────────────┤
└─────────────────┘ │ + operation()│ │+ operation()│
                    └─────────────┘ └────────────┘
```

**Implémentation Java** :
```java
// Interface d'implémentation
public interface NotificationSender {
    void sendMessage(String title, String message);
}

// Implémentations concrètes
public final class EmailSender implements NotificationSender {
    private final String emailAddress;
    
    public EmailSender(String emailAddress) {
        this.emailAddress = emailAddress;
    }
    
    @Override
    public void sendMessage(String title, String message) {
        System.out.println("Email sent to " + emailAddress);
        System.out.println("Subject: " + title);
        System.out.println("Body: " + message);
    }
}

public final class SMSSender implements NotificationSender {
    private final String phoneNumber;
    
    public SMSSender(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }
    
    @Override
    public void sendMessage(String title, String message) {
        System.out.println("SMS sent to " + phoneNumber);
        System.out.println("Message: " + title + " - " + message);
    }
}

public final class SlackSender implements NotificationSender {
    private final String channel;
    
    public SlackSender(String channel) {
        this.channel = channel;
    }
    
    @Override
    public void sendMessage(String title, String message) {
        System.out.println("Slack message sent to #" + channel);
        System.out.println("**" + title + "**");
        System.out.println(message);
    }
}

// Abstraction
public abstract class Notification {
    protected final NotificationSender sender;
    
    public Notification(NotificationSender sender) {
        this.sender = Objects.requireNonNull(sender, "Sender cannot be null");
    }
    
    public abstract void send(String title, String message);
}

// Abstractions raffinées
public final class SimpleNotification extends Notification {
    public SimpleNotification(NotificationSender sender) {
        super(sender);
    }
    
    @Override
    public void send(String title, String message) {
        sender.sendMessage(title, message);
    }
}

public final class UrgentNotification extends Notification {
    public UrgentNotification(NotificationSender sender) {
        super(sender);
    }
    
    @Override
    public void send(String title, String message) {
        String urgentTitle = "🚨 URGENT: " + title;
        String urgentMessage = "PRIORITY MESSAGE:\n" + message + "\n\nPlease respond immediately.";
        sender.sendMessage(urgentTitle, urgentMessage);
    }
}

public final class ScheduledNotification extends Notification {
    private final LocalDateTime scheduledTime;
    
    public ScheduledNotification(NotificationSender sender, LocalDateTime scheduledTime) {
        super(sender);
        this.scheduledTime = scheduledTime;
    }
    
    @Override
    public void send(String title, String message) {
        String scheduledTitle = "📅 " + title;
        String scheduledMessage = "Scheduled for: " + scheduledTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) + 
                                 "\n\n" + message;
        sender.sendMessage(scheduledTitle, scheduledMessage);
    }
}

// Usage
NotificationSender emailSender = new EmailSender("user@example.com");
NotificationSender smsSender = new SMSSender("+1234567890");
NotificationSender slackSender = new SlackSender("general");

// Notifications simples
Notification simpleEmail = new SimpleNotification(emailSender);
simpleEmail.send("Welcome", "Thank you for joining our service!");

Notification simpleSMS = new SimpleNotification(smsSender);
simpleSMS.send("Code", "Your verification code is: 123456");

// Notifications urgentes
Notification urgentSlack = new UrgentNotification(slackSender);
urgentSlack.send("Server Down", "Production server is not responding!");

// Notifications programmées
Notification scheduledEmail = new ScheduledNotification(
    emailSender, 
    LocalDateTime.now().plusHours(2)
);
scheduledEmail.send("Meeting Reminder", "Don't forget about the team meeting at 3 PM");
```

**Avantages** :
- ✅ Découplage complet abstraction/implémentation
- ✅ Extensibilité indépendante des deux hiérarchies
- ✅ Changement d'implémentation à l'exécution
- ✅ Partage d'implémentation entre objets

**Inconvénients** :
- ❌ Complexité accrue du design
- ❌ Plus difficile à comprendre initialement
- ❌ Peut être excessif pour des cas simples

#### 16. Proxy Pattern
**Intention** : Fournir un substitut ou un espace réservé pour un autre objet afin de contrôler l'accès à celui-ci.

**Problème résolu** :
- Contrôle d'accès à un objet coûteux
- Chargement paresseux (lazy loading)
- Mise en cache et optimisation
- Contrôle de sécurité et logging

**Structure UML** :
```
┌─────────────────┐    ┌─────────────────┐
│    Subject      │    │   RealSubject   │
├─────────────────┤    ├─────────────────┤
│ + request()     │    │ + request()     │
└─────────────────┘    └─────────────────┘
         ▲                       ▲
         │                       │
         │              ┌────────┘
         │              │
┌─────────────────┐     │
│     Proxy       │     │
├─────────────────┤     │
│ - realSubject   │─────┘
│ + request()     │
└─────────────────┘
```

**Implémentation PHP** :
```php
<?php
declare(strict_types=1);

// Interface commune
interface ImageInterface
{
    public function display(): void;
    public function getSize(): int;
}

// Sujet réel - Image coûteuse à charger
final class HighResolutionImage implements ImageInterface
{
    private string $filename;
    private ?string $imageData = null;
    private int $size;
    
    public function __construct(string $filename)
    {
        $this->filename = $filename;
        $this->loadImageFromDisk(); // Opération coûteuse
    }
    
    private function loadImageFromDisk(): void
    {
        echo "Loading high-resolution image: {$this->filename}\n";
        // Simulation du chargement coûteux
        sleep(2); // Simule 2 secondes de chargement
        $this->imageData = "Binary image data for {$this->filename}";
        $this->size = strlen($this->imageData) * 1024; // Simule une grande taille
        echo "Image loaded: {$this->size} bytes\n";
    }
    
    public function display(): void
    {
        echo "Displaying high-resolution image: {$this->filename}\n";
        echo "Image data: " . substr($this->imageData, 0, 50) . "...\n";
    }
    
    public function getSize(): int
    {
        return $this->size;
    }
}

// Proxy avec chargement paresseux et mise en cache
final class ImageProxy implements ImageInterface
{
    private string $filename;
    private ?HighResolutionImage $realImage = null;
    private static array $cache = [];
    
    public function __construct(string $filename)
    {
        $this->filename = $filename;
    }
    
    public function display(): void
    {
        // Chargement paresseux
        if ($this->realImage === null) {
            $this->realImage = $this->getRealImage();
        }
        
        $this->realImage->display();
    }
    
    public function getSize(): int
    {
        // Retourne une estimation sans charger l'image
        if ($this->realImage === null) {
            echo "Returning estimated size for {$this->filename}\n";
            return 1024 * 1024; // 1MB estimé
        }
        
        return $this->realImage->getSize();
    }
    
    private function getRealImage(): HighResolutionImage
    {
        // Vérification du cache
        if (isset(self::$cache[$this->filename])) {
            echo "Image retrieved from cache: {$this->filename}\n";
            return self::$cache[$this->filename];
        }
        
        // Création et mise en cache
        $image = new HighResolutionImage($this->filename);
        self::$cache[$this->filename] = $image;
        
        return $image;
    }
}

// Proxy de sécurité
final class SecureImageProxy implements ImageInterface
{
    private ImageInterface $image;
    private string $userRole;
    
    public function __construct(ImageInterface $image, string $userRole)
    {
        $this->image = $image;
        $this->userRole = $userRole;
    }
    
    public function display(): void
    {
        if ($this->hasAccess()) {
            $this->image->display();
        } else {
            echo "Access denied: Insufficient permissions to view image\n";
        }
    }
    
    public function getSize(): int
    {
        if ($this->hasAccess()) {
            return $this->image->getSize();
        }
        
        echo "Access denied: Cannot get image size\n";
        return 0;
    }
    
    private function hasAccess(): bool
    {
        return in_array($this->userRole, ['admin', 'editor', 'viewer']);
    }
}

// Usage
echo "=== Test du Proxy de chargement paresseux ===\n";

// Création des proxies (pas de chargement encore)
$image1 = new ImageProxy("photo1.jpg");
$image2 = new ImageProxy("photo2.jpg");
$image3 = new ImageProxy("photo1.jpg"); // Même fichier

echo "Proxies créés, aucune image chargée encore\n\n";

// Première utilisation - déclenche le chargement
echo "Première utilisation de image1:\n";
$image1->display();

echo "\nDeuxième utilisation de image1 (depuis le cache):\n";
$image1->display();

echo "\nUtilisation de image3 (même fichier, depuis le cache):\n";
$image3->display();

echo "\n=== Test du Proxy de sécurité ===\n";

$secureImage = new SecureImageProxy($image1, 'admin');
$secureImage->display();

$unauthorizedImage = new SecureImageProxy($image1, 'guest');
$unauthorizedImage->display();
```

**Types de Proxy** :
- **Virtual Proxy** : Chargement paresseux d'objets coûteux
- **Protection Proxy** : Contrôle d'accès basé sur les permissions
- **Remote Proxy** : Représentation locale d'objets distants
- **Cache Proxy** : Mise en cache des résultats d'opérations coûteuses

**Avantages** :
- ✅ Contrôle transparent de l'accès aux objets
- ✅ Optimisation des performances (lazy loading, cache)
- ✅ Sécurité et contrôle d'accès
- ✅ Séparation des préoccupations

**Inconvénients** :
- ❌ Complexité supplémentaire
- ❌ Latence potentielle lors du premier accès
- ❌ Peut masquer des problèmes de performance

### Patterns Comportementaux (Behavioral Patterns)
*Concernent les algorithmes et l'assignation des responsabilités*

#### 10. Strategy Pattern
**Intention** : Définir une famille d'algorithmes et les rendre interchangeables.

**Problème résolu** :
- Éviter les structures conditionnelles complexes
- Faciliter l'ajout de nouveaux algorithmes
- Respecter le principe ouvert/fermé

**Implémentation PHP** :
```php
<?php
declare(strict_types=1);

// Interface stratégie
interface DiscountStrategy
{
    public function calculateDiscount(float $amount): float;
}

// Stratégies concrètes
final class NoDiscountStrategy implements DiscountStrategy
{
    public function calculateDiscount(float $amount): float
    {
        return 0.0;
    }
}

final class PercentageDiscountStrategy implements DiscountStrategy
{
    private float $percentage;
    
    public function __construct(float $percentage)
    {
        if ($percentage < 0 || $percentage > 100) {
            throw new InvalidArgumentException('Percentage must be between 0 and 100');
        }
        $this->percentage = $percentage;
    }
    
    public function calculateDiscount(float $amount): float
    {
        return $amount * ($this->percentage / 100);
    }
}

final class FixedAmountDiscountStrategy implements DiscountStrategy
{
    private float $discountAmount;
    
    public function __construct(float $discountAmount)
    {
        if ($discountAmount < 0) {
            throw new InvalidArgumentException('Discount amount cannot be negative');
        }
        $this->discountAmount = $discountAmount;
    }
    
    public function calculateDiscount(float $amount): float
    {
        return min($this->discountAmount, $amount);
    }
}

// Contexte
final class ShoppingCart
{
    private array $items = [];
    private DiscountStrategy $discountStrategy;
    
    public function __construct(DiscountStrategy $discountStrategy = null)
    {
        $this->discountStrategy = $discountStrategy ?? new NoDiscountStrategy();
    }
    
    public function addItem(string $name, float $price): void
    {
        $this->items[] = ['name' => $name, 'price' => $price];
    }
    
    public function setDiscountStrategy(DiscountStrategy $strategy): void
    {
        $this->discountStrategy = $strategy;
    }
    
    public function calculateTotal(): float
    {
        $subtotal = array_sum(array_column($this->items, 'price'));
        $discount = $this->discountStrategy->calculateDiscount($subtotal);
        return max(0, $subtotal - $discount);
    }
}

// Usage
$cart = new ShoppingCart();
$cart->addItem('Laptop', 1000.0);
$cart->addItem('Mouse', 25.0);

// Pas de remise
echo $cart->calculateTotal(); // 1025.0

// Remise de 10%
$cart->setDiscountStrategy(new PercentageDiscountStrategy(10));
echo $cart->calculateTotal(); // 922.5

// Remise fixe de 50€
$cart->setDiscountStrategy(new FixedAmountDiscountStrategy(50));
echo $cart->calculateTotal(); // 975.0
```

#### 11. Observer Pattern
**Intention** : Définir une dépendance un-vers-plusieurs entre objets.

**Problème résolu** :
- Notification automatique de changements
- Découplage entre observé et observateurs
- Communication événementielle

**Implémentation Java** :
```java
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

// Interface observateur
public interface OrderObserver {
    void onOrderStatusChanged(Order order, OrderStatus oldStatus, OrderStatus newStatus);
}

// Énumération des statuts
public enum OrderStatus {
    PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
}

// Sujet observé
public final class Order {
    private final String id;
    private OrderStatus status;
    private final List<OrderObserver> observers;
    
    public Order(String id) {
        this.id = Objects.requireNonNull(id, "Order ID cannot be null");
        this.status = OrderStatus.PENDING;
        this.observers = new CopyOnWriteArrayList<>(); // Thread-safe
    }
    
    public void addObserver(OrderObserver observer) {
        Objects.requireNonNull(observer, "Observer cannot be null");
        observers.add(observer);
    }
    
    public void removeObserver(OrderObserver observer) {
        observers.remove(observer);
    }
    
    public void setStatus(OrderStatus newStatus) {
        Objects.requireNonNull(newStatus, "Status cannot be null");
        
        if (this.status != newStatus) {
            OrderStatus oldStatus = this.status;
            this.status = newStatus;
            notifyObservers(oldStatus, newStatus);
        }
    }
    
    private void notifyObservers(OrderStatus oldStatus, OrderStatus newStatus) {
        for (OrderObserver observer : observers) {
            try {
                observer.onOrderStatusChanged(this, oldStatus, newStatus);
            } catch (Exception e) {
                // Log l'erreur mais continue avec les autres observateurs
                System.err.println("Error notifying observer: " + e.getMessage());
            }
        }
    }
    
    // Getters
    public String getId() { return id; }
    public OrderStatus getStatus() { return status; }
}

// Observateurs concrets
public final class EmailNotificationService implements OrderObserver {
    @Override
    public void onOrderStatusChanged(Order order, OrderStatus oldStatus, OrderStatus newStatus) {
        System.out.println("Sending email for order " + order.getId() + 
                          ": status changed from " + oldStatus + " to " + newStatus);
        // Logique d'envoi d'email
    }
}

public final class InventoryService implements OrderObserver {
    @Override
    public void onOrderStatusChanged(Order order, OrderStatus oldStatus, OrderStatus newStatus) {
        if (newStatus == OrderStatus.CONFIRMED) {
            System.out.println("Reserving inventory for order " + order.getId());
            // Logique de réservation stock
        } else if (newStatus == OrderStatus.CANCELLED) {
            System.out.println("Releasing inventory for order " + order.getId());
            // Logique de libération stock
        }
    }
}

// Usage
Order order = new Order("ORD-001");
order.addObserver(new EmailNotificationService());
order.addObserver(new InventoryService());

order.setStatus(OrderStatus.CONFIRMED); // Déclenche les notifications
order.setStatus(OrderStatus.SHIPPED);   // Déclenche les notifications
```

#### 12. Command Pattern
**Intention** : Encapsuler une requête comme un objet.

**Problème résolu** :
- Découplage entre invocateur et récepteur
- Support pour undo/redo
- Journalisation et mise en file d'attente
**Structure UML** :
```
┌─────────────────┐    ┌─────────────────┐
│    Command      │    │    Receiver     │
├─────────────────┤    ├─────────────────┤
│ + execute()     │    │ + action()      │
└─────────────────┘    └─────────────────┘
         ▲                       ▲
         │                       │
┌─────────────────┐              │
│ ConcreteCommand │──────────────┘
├─────────────────┤
│ - receiver      │
│ + execute()     │
└─────────────────┘
         ▲
         │
┌─────────────────┐
│    Invoker      │
├─────────────────┤
│ - command       │
│ + setCommand()  │
│ + executeCmd()  │
└─────────────────┘
```

**Implémentation PHP** :
```php
<?php
declare(strict_types=1);

// Interface Command
interface Command
{
    public function execute(): void;
    public function undo(): void;
}

// Récepteur - Éditeur de texte
final class TextEditor
{
    private string $content = '';
    
    public function write(string $text): void
    {
        $this->content .= $text;
    }
    
    public function delete(int $length): void
    {
        $this->content = substr($this->content, 0, -$length);
    }
    
    public function getContent(): string
    {
        return $this->content;
    }
    
    public function setContent(string $content): void
    {
        $this->content = $content;
    }
}

// Commandes concrètes
final class WriteCommand implements Command
{
    private TextEditor $editor;
    private string $text;
    private string $previousContent;
    
    public function __construct(TextEditor $editor, string $text)
    {
        $this->editor = $editor;
        $this->text = $text;
    }
    
    public function execute(): void
    {
        $this->previousContent = $this->editor->getContent();
        $this->editor->write($this->text);
    }
    
    public function undo(): void
    {
        $this->editor->setContent($this->previousContent);
    }
}

final class DeleteCommand implements Command
{
    private TextEditor $editor;
    private int $length;
    private string $previousContent;
    
    public function __construct(TextEditor $editor, int $length)
    {
        $this->editor = $editor;
        $this->length = $length;
    }
    
    public function execute(): void
    {
        $this->previousContent = $this->editor->getContent();
        $this->editor->delete($this->length);
    }
    
    public function undo(): void
    {
        $this->editor->setContent($this->previousContent);
    }
}

// Invocateur avec support undo/redo
final class EditorInvoker
{
    private array $history = [];
    private int $currentPosition = -1;
    
    public function executeCommand(Command $command): void
    {
        // Supprimer l'historique après la position actuelle
        $this->history = array_slice($this->history, 0, $this->currentPosition + 1);
        
        // Exécuter et ajouter à l'historique
        $command->execute();
        $this->history[] = $command;
        $this->currentPosition++;
    }
    
    public function undo(): bool
    {
        if ($this->currentPosition >= 0) {
            $this->history[$this->currentPosition]->undo();
            $this->currentPosition--;
            return true;
        }
        return false;
    }
    
    public function redo(): bool
    {
        if ($this->currentPosition < count($this->history) - 1) {
            $this->currentPosition++;
            $this->history[$this->currentPosition]->execute();
            return true;
        }
        return false;
    }
}

// Usage
$editor = new TextEditor();
$invoker = new EditorInvoker();

// Exécution de commandes
$invoker->executeCommand(new WriteCommand($editor, "Hello "));
echo $editor->getContent(); // "Hello "

$invoker->executeCommand(new WriteCommand($editor, "World!"));
echo $editor->getContent(); // "Hello World!"

$invoker->executeCommand(new DeleteCommand($editor, 6));
echo $editor->getContent(); // "Hello "

// Undo/Redo
$invoker->undo(); // Annule la suppression
echo $editor->getContent(); // "Hello World!"

$invoker->undo(); // Annule "World!"
echo $editor->getContent(); // "Hello "

$invoker->redo(); // Refait "World!"
echo $editor->getContent(); // "Hello World!"
```

**Avantages** :
- ✅ Découplage complet invocateur/récepteur
- ✅ Support natif pour undo/redo
- ✅ Journalisation et mise en file d'attente faciles
- ✅ Composition de macro-commandes possible

**Inconvénients** :
- ❌ Augmentation du nombre de classes
- ❌ Complexité accrue pour des actions simples
- ❌ Gestion mémoire pour l'historique

#### 13. State Pattern
**Intention** : Permettre à un objet de modifier son comportement lorsque son état interne change.

**Problème résolu** :
- Éviter les structures conditionnelles complexes
- Encapsuler les comportements liés aux états
- Faciliter l'ajout de nouveaux états

**Structure UML** :
```
┌─────────────────┐    ┌─────────────────┐
│    Context      │    │     State       │
├─────────────────┤    ├─────────────────┤
│ - state         │───▶│ + handle()      │
│ + request()     │    └─────────────────┘
│ + setState()    │             ▲
└─────────────────┘             │
                        ┌───────┴───────┐
                        │               │
                ┌───────▼───────┐ ┌─────▼─────┐
                │ ConcreteStateA│ │ConcreteStateB│
                ├───────────────┤ ├───────────┤
                │ + handle()    │ │ + handle()│
                └───────────────┘ └───────────┘
```

**Implémentation Java** :
```java
// Interface État
public interface OrderState {
    void processOrder(OrderContext context);
    void cancelOrder(OrderContext context);
    void shipOrder(OrderContext context);
    String getStateName();
}

// Contexte
public final class OrderContext {
    private OrderState currentState;
    private final String orderId;
    
    public OrderContext(String orderId) {
        this.orderId = orderId;
        this.currentState = new PendingState(); // État initial
    }
    
    public void setState(OrderState state) {
        System.out.println("Order " + orderId + " changing state to: " + state.getStateName());
        this.currentState = state;
    }
    
    public void processOrder() {
        currentState.processOrder(this);
    }
    
    public void cancelOrder() {
        currentState.cancelOrder(this);
    }
    
    public void shipOrder() {
        currentState.shipOrder(this);
    }
    
    public String getOrderId() {
        return orderId;
    }
    
    public String getCurrentStateName() {
        return currentState.getStateName();
    }
}

// États concrets
public final class PendingState implements OrderState {
    @Override
    public void processOrder(OrderContext context) {
        System.out.println("Processing order " + context.getOrderId());
        context.setState(new ProcessedState());
    }
    
    @Override
    public void cancelOrder(OrderContext context) {
        System.out.println("Cancelling order " + context.getOrderId());
        context.setState(new CancelledState());
    }
    
    @Override
    public void shipOrder(OrderContext context) {
        System.out.println("Cannot ship order " + context.getOrderId() + " - not processed yet");
    }
    
    @Override
    public String getStateName() {
        return "PENDING";
    }
}

public final class ProcessedState implements OrderState {
    @Override
    public void processOrder(OrderContext context) {
        System.out.println("Order " + context.getOrderId() + " is already processed");
    }
    
    @Override
    public void cancelOrder(OrderContext context) {
        System.out.println("Cancelling processed order " + context.getOrderId());
        context.setState(new CancelledState());
    }
    
    @Override
    public void shipOrder(OrderContext context) {
        System.out.println("Shipping order " + context.getOrderId());
        context.setState(new ShippedState());
    }
    
    @Override
    public String getStateName() {
        return "PROCESSED";
    }
}

public final class ShippedState implements OrderState {
    @Override
    public void processOrder(OrderContext context) {
        System.out.println("Order " + context.getOrderId() + " is already shipped");
    }
    
    @Override
    public void cancelOrder(OrderContext context) {
        System.out.println("Cannot cancel shipped order " + context.getOrderId());
    }
    
    @Override
    public void shipOrder(OrderContext context) {
        System.out.println("Order " + context.getOrderId() + " is already shipped");
    }
    
    @Override
    public String getStateName() {
        return "SHIPPED";
    }
}

public final class CancelledState implements OrderState {
    @Override
    public void processOrder(OrderContext context) {
        System.out.println("Cannot process cancelled order " + context.getOrderId());
    }
    
    @Override
    public void cancelOrder(OrderContext context) {
        System.out.println("Order " + context.getOrderId() + " is already cancelled");
    }
    
    @Override
    public void shipOrder(OrderContext context) {
        System.out.println("Cannot ship cancelled order " + context.getOrderId());
    }
    
    @Override
    public String getStateName() {
        return "CANCELLED";
    }
}

// Usage
OrderContext order = new OrderContext("ORD-001");

System.out.println("Current state: " + order.getCurrentStateName()); // PENDING

order.processOrder(); // Traite la commande -> PROCESSED
order.shipOrder();    // Expédie la commande -> SHIPPED
order.cancelOrder();  // Tentative d'annulation (impossible)

// Nouvel ordre
OrderContext order2 = new OrderContext("ORD-002");
order2.cancelOrder(); // Annule directement -> CANCELLED
order2.processOrder(); // Tentative de traitement (impossible)
```

**Avantages** :
- ✅ Élimination des structures conditionnelles complexes
- ✅ Encapsulation claire des comportements par état
- ✅ Facilité d'ajout de nouveaux états
- ✅ Respect du principe ouvert/fermé

**Inconvénients** :
- ❌ Augmentation du nombre de classes
- ❌ Peut être excessif pour des machines à états simples
- ❌ Complexité de gestion des transitions

#### 14. Template Method Pattern
**Intention** : Définir le squelette d'un algorithme dans une classe de base, en laissant les sous-classes redéfinir certaines étapes.

**Problème résolu** :
- Réutilisation de code avec variation d'étapes
- Contrôle de l'ordre d'exécution
- Inversion de contrôle (Hollywood Principle)

**Implémentation PHP** :
```php
<?php
declare(strict_types=1);

// Classe abstraite définissant le template
abstract class DataProcessor
{
    // Template method - définit l'algorithme général
    final public function processData(string $filePath): array
    {
        $rawData = $this->readData($filePath);
        $validData = $this->validateData($rawData);
        $processedData = $this->transformData($validData);
        $this->saveResults($processedData);
        
        return $processedData;
    }
    
    // Étapes communes (implémentation par défaut)
    protected function readData(string $filePath): array
    {
        if (!file_exists($filePath)) {
            throw new InvalidArgumentException("File not found: $filePath");
        }
        
        $content = file_get_contents($filePath);
        return json_decode($content, true) ?? [];
    }
    
    protected function saveResults(array $data): void
    {
        $timestamp = date('Y-m-d_H-i-s');
        $outputFile = "processed_data_$timestamp.json";
        file_put_contents($outputFile, json_encode($data, JSON_PRETTY_PRINT));
        echo "Results saved to: $outputFile\n";
    }
    
    // Étapes abstraites (à implémenter par les sous-classes)
    abstract protected function validateData(array $data): array;
    abstract protected function transformData(array $data): array;
    
    // Hook method (optionnel à redéfinir)
    protected function logProgress(string $step): void
    {
        echo "Processing step: $step\n";
    }
}

// Implémentation concrète pour les données utilisateur
final class UserDataProcessor extends DataProcessor
{
    protected function validateData(array $data): array
    {
        $this->logProgress('Validating user data');
        
        return array_filter($data, function($user) {
            return isset($user['email']) && 
                   filter_var($user['email'], FILTER_VALIDATE_EMAIL) &&
                   isset($user['name']) && 
                   !empty(trim($user['name']));
        });
    }
    
    protected function transformData(array $data): array
    {
        $this->logProgress('Transforming user data');
        
        return array_map(function($user) {
            return [
                'id' => $user['id'] ?? uniqid(),
                'email' => strtolower(trim($user['email'])),
                'name' => ucwords(strtolower(trim($user['name']))),
                'created_at' => date('Y-m-d H:i:s'),
                'status' => 'active'
            ];
        }, $data);
    }
    
    protected function logProgress(string $step): void
    {
        echo "[USER PROCESSOR] $step\n";
    }
}

// Usage
$userProcessor = new UserDataProcessor();
$userData = $userProcessor->processData('users.json');
```

**Avantages** :
- ✅ Réutilisation maximale du code commun
- ✅ Contrôle strict de l'algorithme général
- ✅ Flexibilité pour les étapes spécifiques
- ✅ Facilite la maintenance et l'extension

**Inconvénients** :
- ❌ Couplage fort par héritage
- ❌ Peut devenir complexe avec beaucoup d'étapes
- ❌ Difficile de modifier l'ordre des étapes

## Patterns Modernes et Architecturaux

### 11. Repository Pattern
**Intention** : Encapsuler la logique d'accès aux données.

**Implémentation PHP** :
```php
<?php
declare(strict_types=1);

// Entité
final class User
{
    private ?int $id;
    private string $email;
    private string $name;
    
    public function __construct(?int $id, string $email, string $name)
    {
        $this->id = $id;
        $this->email = $email;
        $this->name = $name;
    }
    
    // Getters et setters...
    public function getId(): ?int { return $this->id; }
    public function getEmail(): string { return $this->email; }
    public function getName(): string { return $this->name; }
    public function setId(int $id): void { $this->id = $id; }
}

// Interface repository
interface UserRepositoryInterface
{
    public function findById(int $id): ?User;
    public function findByEmail(string $email): ?User;
    public function findAll(): array;
    public function save(User $user): User;
    public function delete(User $user): void;
}

// Implémentation concrète
final class DatabaseUserRepository implements UserRepositoryInterface
{
    private PDO $pdo;
    
    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }
    
    public function findById(int $id): ?User
    {
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE id = ?');
        $stmt->execute([$id]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $data ? $this->hydrate($data) : null;
    }
    
    public function findByEmail(string $email): ?User
    {
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $data ? $this->hydrate($data) : null;
    }
    
    public function findAll(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM users ORDER BY name');
        $users = [];
        
        while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $users[] = $this->hydrate($data);
        }
        
        return $users;
    }
    
    public function save(User $user): User
    {
        if ($user->getId() === null) {
            return $this->insert($user);
        } else {
            return $this->update($user);
        }
    }
    
    public function delete(User $user): void
    {
        if ($user->getId() === null) {
            throw new InvalidArgumentException('Cannot delete user without ID');
        }
        
        $stmt = $this->pdo->prepare('DELETE FROM users WHERE id = ?');
        $stmt->execute([$user->getId()]);
    }
    
    private function insert(User $user): User
    {
        $stmt = $this->pdo->prepare('INSERT INTO users (email, name) VALUES (?, ?)');
        $stmt->execute([$user->getEmail(), $user->getName()]);
        
        $user->setId((int) $this->pdo->lastInsertId());
        return $user;
    }
    
    private function update(User $user): User
    {
        $stmt = $this->pdo->prepare('UPDATE users SET email = ?, name = ? WHERE id = ?');
        $stmt->execute([$user->getEmail(), $user->getName(), $user->getId()]);
        
        return $user;
    }
    
    private function hydrate(array $data): User
    {
        return new User(
            (int) $data['id'],
            $data['email'],
            $data['name']
        );
    }
}

// Usage
$pdo = new PDO('sqlite::memory:');
$userRepository = new DatabaseUserRepository($pdo);

$user = new User(null, 'john@example.com', 'John Doe');
$savedUser = $userRepository->save($user);

$foundUser = $userRepository->findById($savedUser->getId());
```

### 12. MVC (Model-View-Controller)
**Intention** : Séparer la logique métier, la présentation et le contrôle.

### 13. Dependency Injection
**Intention** : Fournir les dépendances d'un objet plutôt que de les créer.

## Relations entre Patterns

### Patterns Complémentaires
- **Factory Method + Strategy** : Création de stratégies
- **Observer + Command** : Notifications avec historique
- **Decorator + Composite** : Structures hiérarchiques extensibles

### Patterns Alternatifs
- **Strategy vs State** : Algorithmes vs États
- **Factory Method vs Abstract Factory** : Produit vs Famille
- **Adapter


## Bilan de Complétude - Référence refactoring.guru

### Patterns Actuellement Documentés (16/23)

**✅ Patterns Créationnels (4/5)** :
1. ✅ [`Singleton`](prompts/gen/concepts/design_patterns.md:13) - Implémentation complète PHP/Java
2. ✅ [`Factory Method`](prompts/gen/concepts/design_patterns.md:141) - Implémentation complète PHP/Java  
3. ✅ [`Abstract Factory`](prompts/gen/concepts/design_patterns.md:294) - Implémentation complète PHP
4. ✅ [`Builder`](prompts/gen/concepts/design_patterns.md:399) - Implémentation complète PHP
5. ⚠️ [`Prototype`](prompts/gen/concepts/design_patterns.md:520) - Mentionné mais implémentation manquante

**✅ Patterns Structurels (6/7)** :
6. ✅ [`Adapter`](prompts/gen/concepts/design_patterns.md:531) - Implémentation complète PHP
7. ✅ [`Decorator`](prompts/gen/concepts/design_patterns.md:598) - Implémentation complète Java
8. ✅ [`Facade`](prompts/gen/concepts/design_patterns.md:688) - Implémentation complète PHP
9. ✅ [`Composite`](prompts/gen/concepts/design_patterns.md:855) - Implémentation complète Java
10. ✅ [`Bridge`](prompts/gen/concepts/design_patterns.md:1008) - Implémentation complète Java
11. ✅ [`Proxy`](prompts/gen/concepts/design_patterns.md:1159) - Implémentation complète PHP
12. ❌ **Flyweight** - Pattern manquant

**✅ Patterns Comportementaux (6/11)** :
13. ✅ [`Strategy`](prompts/gen/concepts/design_patterns.md:1011) - Implémentation complète PHP
14. ✅ [`Observer`](prompts/gen/concepts/design_patterns.md:1121) - Implémentation complète Java
15. ✅ [`Command`](prompts/gen/concepts/design_patterns.md:1223) - Implémentation complète PHP
16. ✅ [`State`](prompts/gen/concepts/design_patterns.md:1789) - Implémentation complète Java
17. ✅ [`Template Method`](prompts/gen/concepts/design_patterns.md:1981) - Implémentation complète PHP
18. ❌ **Chain of Responsibility** - Pattern manquant
19. ❌ **Iterator** - Pattern manquant
20. ❌ **Mediator** - Pattern manquant
21. ❌ **Memento** - Pattern manquant
22. ❌ **Visitor** - Pattern manquant

### Patterns Modernes Ajoutés (3)
- ✅ [`Repository`](prompts/gen/concepts/design_patterns.md:2233) - Pattern architectural moderne
- ⚠️ [`MVC`](prompts/gen/concepts/design_patterns.md:2368) - Mentionné mais implémentation manquante
- ⚠️ [`Dependency Injection`](prompts/gen/concepts/design_patterns.md:2371) - Mentionné mais implémentation manquante

### Statut Global : **70% de complétude** (16/23 patterns GoF + 3 modernes)

**Priorités d'enrichissement restantes** :
1. **Haute priorité** : Flyweight, Chain of Responsibility, Iterator
2. **Moyenne priorité** : Mediator, Memento, Visitor
3. **Compléments** : Finaliser Prototype, MVC, Dependency Injection

---
