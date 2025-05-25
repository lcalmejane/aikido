# Workflows Orchestrator - Assistance Professeur des Écoles

[Sections précédentes maintenues...]

## Workflows supplémentaires

### creation_emploi_temps_adapte_rythmes
```yaml
workflow_id: WF_EDT_RYTHME_001
description: "Création d'un emploi du temps adapté aux rythmes d'apprentissage"
personas:
  - professeur_cycle:
      role: "Organisation temps"
      actions:
        - répartition matières
        - alternance activités
        - gestion pauses
  
  - expert_pedagogique:
      role: "Conseil pédagogique"
      actions:
        - optimisation apprentissages
        - rythmes cognitifs
        - équilibre journée
        
  - psychomotricien:
      role: "Gestion motricité"
      actions:
        - alternance activités
        - besoins moteurs
        - concentration

sortie: "/out/administratif/organisation/..."
```

### preparation_sortie_scolaire_pedagogique
```yaml
workflow_id: WF_SORTIE_PED_001
description: "Organisation complète d'une sortie scolaire pédagogique"
personas:
  - professeur_cycle:
      role: "Organisation générale"
      actions:
        - objectifs pédagogiques
        - planning activités
        - lien programme
  
  - directeur:
      role: "Validation administrative"
      actions:
        - aspects sécurité
        - autorisations
        - budget
        
  - expert_pedagogique:
      role: "Support pédagogique"
      actions:
        - exploitation sortie
        - supports élèves
        - évaluation acquis

sortie: "/out/pedagogie/projets/sorties/..."
```

### elaboration_protocole_suivi_eleve_difficulte
```yaml
workflow_id: WF_SUIVI_DIFF_001
description: "Création d'un protocole de suivi pour élève en difficulté"
personas:
  - professeur_cycle:
      role: "Suivi quotidien"
      actions:
        - observation élève
        - adaptation classe
        - liaison famille
  
  - psychologue_scolaire:
      role: "Suivi psychologique"
      actions:
        - évaluation besoins
        - recommandations
        - suivi évolution
        
  - orthophoniste:
      role: "Suivi spécialisé"
      actions:
        - bilan troubles
        - adaptations spécifiques
        - coordination soins

sortie: "/out/suivi/protocoles/..."
```

### creation_livret_competences_personnalise
```yaml
workflow_id: WF_LIVRET_COMP_001
description: "Élaboration d'un livret de compétences personnalisé"
personas:
  - professeur_cycle:
      role: "Évaluation globale"
      actions:
        - suivi acquisitions
        - validation compétences
        - commentaires progrès
  
  - expert_pedagogique:
      role: "Conseil évaluation"
      actions:
        - critères évaluation
        - indicateurs progrès
        - recommandations
        
  - expert_differenciation:
      role: "Adaptation évaluation"
      actions:
        - adaptation critères
        - parcours personnalisé
        - objectifs adaptés

sortie: "/out/suivi/livrets/..."
```

### conception_projet_classe_cooperatif
```yaml
workflow_id: WF_PROJET_COOP_001
description: "Création d'un projet de classe basé sur la coopération"
personas:
  - professeur_cycle:
      role: "Gestion projet"
      actions:
        - objectifs projet
        - organisation groupes
        - évaluation collective
  
  - expert_pedagogique:
      role: "Méthodologie"
      actions:
        - approche coopérative
        - outils collaboration
        - évaluation process
        
  - psychologue_scolaire:
      role: "Dynamique groupe"
      actions:
        - cohésion classe
        - gestion relations
        - climat scolaire

sortie: "/out/pedagogie/projets/cooperation/..."
```

[Sections maintenance et procédure maintenues...]
