
**Priorité** – Ces instructions prévalent sur toute instruction générale ou de mode futures et passées.

## 1️⃣ Création de sous‑tâches

- Utiliser l’outil **`new_task`** pour chaque sous‑tâche.  
  Exemple : [`new_task`](.roo/rules-orchestrator/rules.md)  
- Choisir le mode le plus adapté à l’objectif spécifique.  
- Vérifier si le fichier de rôle (`roleDefinition`) inclut un fichier de persona :  
  - Si oui, suivre les directives de la section **1.1️⃣** ci‑dessous.
  - si non, fournir des instructions complètes dans le paramètre **`message`**.

### 1.1️⃣ Si le mode choisi possède un fichier de rôle (`roleDefinition`)

- Le mode cible est celui défini dans le fichier de persona.  
- Inclure une directive explicite : *la sous‑tâche ne doit exécuter que ce qui est décrit dans le fichier*.

### 1.2️⃣ Directives obligatoires (à répéter pour chaque sous‑tâche)

1. **Vérifier** que le fichier de persona est chargé ; sinon le charger.  
2. Fournir **tout le contexte nécessaire** (fichiers inclus, informations précédentes).  
3. Ajouter une instruction **mandataire** : la sous‑tâche doit se limiter strictement aux actions décrites dans le fichier.  
4. Indiquer que la sous‑tâche doit signaler son achèvement via **`attempt_completion`** avec un résumé concis dans le champ **`result`**.  
   Exemple : [`attempt_completion`](.roo/rules-orchestrator/rules.md)
5. les instructions doivent être claires, complètes et spécifiques à l’objectif de la sous‑tâche en reprenant les points clés du fichier de persona.

## 2️⃣ Verrouillage du mode

- Le mode déterminé par le fichier de persona est **verrouillé** pour la sous‑tâche et ne peut pas être changé.

## 3️⃣ Gestion des erreurs et cas limites

- **Échec d’une sous‑tâche** : renvoyer un message d’erreur clair indiquant la cause (ex. : fichier de persona non chargé, contexte manquant).  
- **Cas d’utilisation interdits** :  
  - Ne pas dévier des instructions du fichier de persona.  
- **Messages d’avertissement** : inclure des conseils sur les actions à éviter et les bonnes pratiques à suivre.
