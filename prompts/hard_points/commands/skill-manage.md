---
description: "Gère le cycle de vie complet des skills AI-KIDO : recherche, installation, mise à jour et désinstallation depuis un groupe Git distant"
---

# Commande `/skill-manage`

**Paradigme** : Exécution DIRECTE par le LLM — `ask_followup_question` + outils natifs. ❌ Pas de script bash autonome.  
**Config** : [`skills.cfg`](prompts/hard_points/configuration/skills.cfg) · Priorité : `arg CLI` → `env AIKIDO_GIT_TOKEN` → `skills.cfg` → défaut hardcodé  
**Raccourcis rétrocompatibles** : `/skill-get`, `/skill-update`, `/skill-uninstall` → résolus vers cette commande

**Invariants globaux** :
- Confirmation explicite avant toute modification destructive (sauf `--dry-run`)
- Fichiers `prompts/hard_points/commands/{cmd}.md` modifiés manuellement → confirmation séparée, jamais supprimés silencieusement
- Scripts pré/post exécutés **avant** toute modification de fichiers
- Registres (`skills_list.md`, `commands_list.md`) nettoyés/mis à jour après chaque opération

## Syntaxe

```
/skill-manage <action> [options]

  search    Recherche parmi les skills distants et/ou installés
  get       Installe un skill depuis Git
  update    Met à jour un ou plusieurs skills installés
  uninstall Désinstalle un skill et nettoie les registres

/skill-manage search    [--query TERME] [--scope remote|local|all] [--group URL] [--token TOKEN] [--target DIR] [--verbose]
/skill-manage get       [--skill NOM] [--group URL] [--target DIR] [--branch REF] [--token TOKEN] [--on-conflict update|reinstall|skip|ask] [--dry-run] [--verbose]
/skill-manage update    [--skill NOM|all] [--group URL] [--target DIR] [--branch REF] [--token TOKEN] [--strategy pull|reinstall] [--backup] [--dry-run] [--verbose]
/skill-manage uninstall [--skill NOM] [--target DIR] [--backup] [--purge] [--dry-run] [--verbose]
```

## Configuration Globale

| Clé `skills.cfg` | Arg CLI | Défaut | Description |
|-----------------|---------|--------|-------------|
| `GIT_GROUP` | `--group` | `git@github.com:lcalmejane/aikido-skills` | URL groupe/org Git (SSH · HTTPS · local) |
| `GIT_TOKEN` | `--token` | *(vide)* | Token privé · masqué dans les logs · priorité env `AIKIDO_GIT_TOKEN` |
| `GIT_DEFAULT_BRANCH` | `--branch` | `main` | Branche/tag cible |
| `TARGET_DIR` | `--target` | `prompts/hard_points/system` | Répertoire racine des skills |
| `AUTO_RUN_SCRIPTS` | — | `false` | Exec auto des scripts `.sh` sans confirmation |
| `VALIDATE_AFTER_INSTALL` | — | `true` | Validation conformité AI-KIDO post-opération |
| `VALIDATION_LEVEL` | — | `warn` | `strict` bloque · `warn` continue · `skip` désactive |
| `AUTO_UPDATE_SKILLS_LIST` | — | `true` | MAJ `skills_list.md` |
| `AUTO_UPDATE_COMMANDS_LIST` | — | `true` | MAJ `commands_list.md` |
| `AUTO_CREATE_COMMAND_MAPPINGS` | — | `true` | Créer/MAJ `.roo/commands/` + `.claude/commands/` |
| `VERBOSE` | `--verbose` | `true` | Log détaillé par fichier/opération |
| `DISPLAY_FORMAT` | — | `table` | Format liste : `table` · `list` · `compact` |
| `MAX_PROJECTS_DISPLAY` | — | `50` | Plafond skills affichés |

## Phase 0 — Bootstrap (toutes actions)

1. Charger [`skills.cfg`](prompts/hard_points/configuration/skills.cfg), appliquer surcharges CLI/env
2. `GIT_GROUP` vide ET action nécessite Git → `ask_followup_question` URL + token (**bloquant**)
3. `TARGET_DIR` inexistant → `❌ Répertoire introuvable` (**bloquant** pour `uninstall`) · création `mkdir -p` pour `get`
4. Afficher résumé config active (token masqué `****`)

---

## ACTION `search` — Recherche de Skills

**Paramètres spécifiques** :

| Arg CLI | Défaut | Sémantique |
|---------|--------|------------|
| `--query` | *(interactif)* | Terme(s) : nom, mot-clé, description, catégorie |
| `--scope` | `all` | `local` = installés · `remote` = dépôt Git · `all` = les deux |

**Pipeline** :

1. **Query** — `--query` absent → `ask_followup_question`. Afficher : `🔍 "{query}" | scope: {scope}`
2. **Local** *(scope `local`/`all`)* — `find {TARGET_DIR} -name "SKILL.md" -maxdepth 2` · extraire slug / description / commandes / version / catégorie · filtrer sur `{query}` (insensible casse) → `LOCAL_MATCHES[]`
3. **Distant** *(scope `remote`/`all`)* — `GET /api/v4/groups/{group_encoded}/projects?search={query}&per_page=100` · fallback liste complète + filtre LLM si API indisponible · marquer `✅ INSTALLÉ` si `{TARGET_DIR}/{slug}/SKILL.md` présent → `REMOTE_MATCHES[]`
4. **Affichage** :
   ```
   📦 INSTALLÉS  # │ Slug │ Version │ Description │ Commandes
   🌐 DISTANTS   # │ Nom  │ Description │ Activité │ ✅ INSTALLÉ / ⬇️ DISPONIBLE
   ```
   Aucun résultat → `ℹ️ Aucun skill trouvé pour "{query}" [scope: {scope}]`
5. **Action interactive** *(si résultats distants non installés)* → `ask_followup_question` :
   - `1. Installer` → enchaîne `get --skill {NOM}`
   - `2. Détails` → `GET /api/v4/projects/{id}/repository/files/SKILL.md/raw?ref={branch}` · afficher description / commandes / version / auteur
   - `3. Nouvelle recherche` · `4. Quitter`

**Erreurs** :

| Erreur | Résolution | Bloquant ? |
|--------|-----------|:---:|
| `--query` vide | Saisie interactive | ✅ |
| API distante inaccessible | Warning + résultats locaux si `all` | ❌ |
| `GIT_GROUP` vide (scope `remote`/`all`) | Questionnaire URL + token | ✅ `remote` · ❌ `all` |
| Token expiré | Demander nouveau token | ✅ distant |

---

## ACTION `get` — Installation d'un Skill

**Paramètres spécifiques** :

| Arg CLI | Défaut | Sémantique |
|---------|--------|------------|
| `--on-conflict` | `update` | Si skill présent : `update` · `reinstall` · `skip` · `ask` |

**Pipeline** :

1. **Découverte** — `GET /api/v4/groups/{group_encoded}/projects?per_page=100` · afficher `# │ Nom │ Description │ Activité` · marquer `✅ INSTALLÉ` les skills avec `SKILL.md` dans `TARGET_DIR/`
2. **Sélection** — `ask_followup_question` (numéro ou nom) · si déjà installé → `1. METTRE À JOUR` · `2. RÉINSTALLER` · `3. ANNULER` · Variables : `SELECTED_SKILL`, `SKILL_REPO_URL`, `INSTALL_MODE`
3. **Téléchargement** :
   - Nouveau → `git -c http.extraHeader="PRIVATE-TOKEN:{TOKEN}" clone --depth=1 {URL} {TARGET_DIR}/{SKILL}`
   - Fallback → archive API `archive.tar.gz?sha={branch}` + extraction tar
   - Existant → `git fetch --all --tags` + sélection branche/tag
   - Signaler : chemin · version · nb fichiers · ✅/❌
4. **Scripts** — détecter dans `{SKILL_PATH}/` : `SKILL.md` (**obligatoire**, absent = ⚠️ installation partielle) · `install*.md`/`INSTALL*.md` → appliquer LLM · `install*.sh`/`setup*.sh` → si `AUTO_RUN_SCRIPTS=false` : confirmation O/n · continuer sur erreur
5. **Enregistrement AI-KIDO** — extraire depuis `SKILL.md` : nom, description, commandes (`## Commandes disponibles`)

   | Fichier | Action |
   |---------|--------|
   | `skills_list.md` | Ajouter `- **{slug}** – {desc} – [{lien SKILL.md}]` |
   | `commands_list.md` | Ajouter une entrée par commande exposée |
   | `.roo/commands/{cmd}.md` | Créer mapping (template ci-dessous) |
   | `.claude/commands/{cmd}.md` | Idem |
   | `prompts/hard_points/commands/{cmd}.md` | Créer si absent |

   Template mapping `.roo/` et `.claude/` :
   ```markdown
   ---
   description: "{description commande}"
   ---
   # Commande {nom}
   Cette commande exécute `{chemin-commande}`.
   **EXÉCUTION** : Lire et appliquer les instructions du fichier cible.
   ```

   Agents : `agent-aikido-maj-md-index` (registres) · `agent-aikido-validator` (conformité `SKILL.md`)

---

## ACTION `update` — Mise à Jour de Skills

**Paramètres spécifiques** :

| Arg CLI | Défaut | Sémantique |
|---------|--------|------------|
| `--skill` | *(interactif)* | Slug ou `all` |
| `--strategy` | `pull` | `pull` = `fetch + merge --ff-only` · `reinstall` = `rm -rf + clone --depth=1` |
| `--backup` | `false` | Copie `{SKILL_PATH}` → `{SKILL_PATH}_backup_{date}` avant modif · doublon → incrément `_2`, `_3`… |
| `--dry-run` | `false` | Rapport sans écriture, arrêt après détection |

**Pipeline** :

1. **Inventaire** — `find {TARGET_DIR} -name "SKILL.md" -maxdepth 2` · extraire slug / version (`git describe` ou `log -1`) / statut (`.git/` → `✅ géré git` · absent → `⚠️ archive`) · afficher `# │ Slug │ Version │ Statut │ Chemin` · aucun skill → suggestion `get` + **arrêt**
2. **Scope** — `--skill all` → tous · `--skill NOM` → vérifier existence · absent → sélection interactive + `0. Tous` · Variable : `UPDATE_TARGETS[]`
3. **Détection MAJ** :
   - Git : `fetch --all --tags` + `log HEAD..origin/{branch} --oneline` → `✅ À jour` · `⬆️ {N} commits` · `❌ Erreur`
   - Archive : comparer `committed_date` API vs `installed_at` SKILL.md · absent → `⚠️ reinstall recommandé`
   - `--dry-run` → afficher rapport + **arrêt**
4. **Confirmation & Backup** — résumé `Skills à MAJ : {N} · stratégie · backup` → `ask_followup_question` CONFIRMER/ANNULER · backup → copie avant toute écriture
5. **Application** :
   - `pull` : `fetch --all --tags` + `checkout {branch}` + `pull --ff-only` · divergence → `ask_followup_question` MERGE / RESET --hard / PASSER · `RESET --hard` = confirmation explicite requise
   - `reinstall` : `rm -rf {SKILL_PATH}` + `clone --depth=1`
   - Fallback archive : extract → `{SKILL_PATH}_tmp/` → remplacer (préserver `.git/`)
   - Signaler : `✅ {v_before} → {v_after}` · `⚠️ partiel` · `❌ échec`
6. **Scripts post-update** — priorité : `update*.md`/`UPDATE*.md` (LLM) → `update*.sh`/`post-update*.sh` (confirmation si `AUTO_RUN_SCRIPTS=false`) → fallback `install*.sh` · erreur → log + continuer
7. **Sync registres** — diff `SKILL.md` avant/après :

   | Fichier | Condition | Action |
   |---------|-----------|--------|
   | `skills_list.md` | version/desc changée | MAJ ligne |
   | `commands_list.md` | commande ±ajoutée | ajouter/supprimer |
   | `.roo/commands/{cmd}.md` | commande modifiée/ajoutée | recréer |
   | `.claude/commands/{cmd}.md` | idem | idem |
   | `prompts/hard_points/commands/{cmd}.md` | nouvelle commande | créer |

   `SKILL.md` absent → sync partielle + warning · Agents : `agent-aikido-maj-md-index` · `agent-aikido-validator`

8. **Rapport** :
   ```
   ╔══════════════════════════════════════════════════════╗
   ║              RAPPORT SKILL-UPDATE                    ║
   ╠══════════╦════════════╦════════════╦════════════════╣
   ║ Skill    ║ Avant      ║ Après      ║ Statut         ║
   ╠══════════╬════════════╬════════════╬════════════════╣
   ║ {slug}   ║ {v_before} ║ {v_after}  ║ ✅ mis à jour  ║
   ╚══════════╩════════════╩════════════╩════════════════╝
   Durée : {t}s  |  Backups : {N}
   ```

---

## ACTION `uninstall` — Désinstallation d'un Skill

**Paramètres spécifiques** :

| Arg CLI | Défaut | Sémantique |
|---------|--------|------------|
| `--skill` | *(interactif)* | Slug cible |
| `--backup` | `false` | Copie avant suppression · doublon → incrément `_2`, `_3`… |
| `--purge` | `false` | Supprime aussi les backups existants `{slug}_backup_*` |
| `--dry-run` | `false` | Rapport sans écriture, arrêt après analyse dépendances |

**Pipeline** :

1. **Inventaire** — `find {TARGET_DIR} -name "SKILL.md" -maxdepth 2` · extraire slug / description / commandes / backups existants · afficher `# │ Slug │ Description │ Commandes │ Backups │ Chemin` · aucun skill → **arrêt**
2. **Résolution** — `--skill NOM` → vérifier `SKILL.md` · absent → erreur + liste · sans `--skill` → sélection interactive · Variables : `SELECTED_SKILL`, `SKILL_PATH`
3. **Analyse dépendances** — extraire `COMMANDS_LIST` + `MODES_LIST` (grep `.roomodes`) · pour chaque `cmd` : détecter modification manuelle de `prompts/hard_points/commands/{cmd}.md` → marquer `⚠️ MODIFIÉ`

   Rapport prévu :
   ```
   Skill      : {slug} → {SKILL_PATH}/
   Commandes  : {cmd1}, {cmd2}, …
   .roo       : .roo/commands/{cmd}.md, …
   .claude    : .claude/commands/{cmd}.md, …
   hard_points: prompts/hard_points/commands/{cmd}.md  [⚠️ MODIFIÉ?]
   Registres  : skills_list.md (1), commands_list.md ({N})
   Backups    : {purge: liste | non}
   ```
   `--dry-run` → **arrêt ici**

4. **Confirmation & Backup** — `ask_followup_question` : CONFIRMER / CONFIRMER AVEC BACKUP / ANNULER · backup → copier avant toute suppression · fichiers `⚠️ MODIFIÉ` → confirmation individuelle (sauf `--purge`)
5. **Script pré-suppression** — recherche : `scripts/uninstall.sh` → `uninstall.sh` → `uninstall*.md`/`UNINSTALL*.md` · `.sh` + `AUTO_RUN_SCRIPTS=false` → confirmation · `.md` → instructions LLM · erreur → log + continuer
6. **Suppression** :
   ```bash
   rm -f .roo/commands/{cmd}.md .claude/commands/{cmd}.md          # mappings
   rm -f prompts/hard_points/commands/{cmd}.md                     # si non ⚠️MODIFIÉ
   rm -rf {SKILL_PATH}                                              # répertoire skill
   rm -rf {TARGET_DIR}/{SELECTED_SKILL}_backup_*                   # si --purge
   ```
   Signaler : `✅ supprimé` · `❌ échec` · `⏭️ conservé (modifié manuellement)`
7. **Nettoyage registres** — `agent-aikido-maj-md-index` : supprimer ligne `{slug}` dans `skills_list.md` + toutes entrées commandes dans `commands_list.md` · vérifier aucun doublon/orphelin
8. **Rapport** :
   ```
   ╔══════════════════════════════════════════════════════════╗
   ║            RAPPORT SKILL-UNINSTALL                       ║
   ╠══════════════════════════════════════════════════════════╣
   ║ Skill supprimé       : {slug} ({SKILL_PATH})             ║
   ║ Commandes            : {N} supprimées ({cmd1}, …)        ║
   ║ Mappings .roo/.claude: {N} supprimés                     ║
   ║ hard_points conservés: {N} (modifiés manuellement)       ║
   ║ Registres nettoyés   : skills_list.md, commands_list.md  ║
   ║ Backup               : {chemin | non}                    ║
   ║ Backups purgés       : {N | non}                         ║
   ╚══════════════════════════════════════════════════════════╝
   ```
   Rappel : `/skill-manage get {slug}` pour réinstaller · `/check-claude` pour vérifier la cohérence

---

## Gestion des Erreurs (toutes actions)

| Erreur | Résolution | Bloquant ? |
|--------|-----------|:---:|
| `GIT_GROUP` vide (besoin Git) | Questionnaire interactif URL + token | ✅ |
| `TARGET_DIR` inexistant | Message explicite · création auto (`get`) | ✅ (`uninstall`) |
| Aucun skill installé | Message + suggestion `get` | ✅ |
| Skill `{NOM}` introuvable | Erreur + liste inventaire | ✅ |
| Clone HTTPS bloqué | Fallback archive API GitLab | ❌ |
| Token expiré/invalide | Demander nouveau token | ✅ |
| `SKILL.md` absent post-op | Sync partielle + warning | ❌ |
| `git pull` en conflit | MERGE / RESET --hard / PASSER | selon choix |
| Script `.sh` en erreur | Log warning, continuer | ❌ |
| Backup déjà existant | Incrémenter suffixe `_2`, `_3`… | ❌ |
| Fichier commande modifié manuellement | Confirmation séparée (sauf `--purge`) | selon choix |

## Règles AI-KIDO

- Structure `prompts/hard_points/system/{slug}/` obligatoire · `SKILL.md` requis pour opération complète
- Mappings `.roo/commands/` + `.claude/commands/` obligatoires pour toute commande exposée
- Détection doublons systématique avant tout ajout · contrainte ≤1000 lignes fichiers commandes

## Intégration

```
/skill-manage search    → découverte avant installation
/skill-manage get       → installation initiale
/skill-manage update    → mises à jour (ciblées ou --skill all)
/skill-manage uninstall → désinstallation propre
/check-claude           → vérifier cohérence post-opération
/analyse-aikido         → audit conformité complet
```

---
*Agents : `agent-aikido-validator` · `agent-aikido-maj-md-index` · Créée 2026-02-27*
