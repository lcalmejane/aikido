// =============================================================================
// JIRA Sprint Dashboard - Complete Enhanced Version
// =============================================================================
// Génération dynamique de toutes les cartes KPI et du tableau interactif

// Global state
let currentSort = {column: null, direction: 'asc'};
let filteredTickets = [];

// =============================================================================
// Initialization
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Sprint Dashboard loaded');
    console.log('Sprint data:', sprintData);

    // Initialiser les composants
    createAllKPICards();
    initializeCharts();
    initializeTicketsTable();
    initializeFilters();
});

// =============================================================================
// KPI Cards - Génération Dynamique Complète
// =============================================================================

// Helper: Convertir heures en jours (1J = 7h)
function formatHoursAndDays(hours) {
    const days = (hours / 7).toFixed(1);
    return `${Math.floor(hours)}h (${days}j)`;
}

function createAllKPICards() {
    // Ligne 1: 6 cartes principales
    const mainContainer = document.getElementById('kpiCardsMain');
    if (mainContainer) {
        mainContainer.innerHTML = '';

        // 1. Carte Vélocité DUAL (Points + Heures)
        const velocityCard = createVelocityCard(sprintData.metrics.velocity);
        if (velocityCard) mainContainer.appendChild(velocityCard);

        // 2. Carte Temps Passé
        const timeCard = createTimeCard(sprintData.metrics.time_tracking);
        if (timeCard) mainContainer.appendChild(timeCard);

        // 3. Carte Heures/Point (RESTAURÉE)
        const hoursPerPointCard = createHoursPerPointCard(sprintData.metrics.time_tracking);
        if (hoursPerPointCard) mainContainer.appendChild(hoursPerPointCard);

        // 4. Carte Tickets
        const ticketsCard = createTicketsCard(sprintData.metrics.tickets);
        if (ticketsCard) mainContainer.appendChild(ticketsCard);

        // 5. Carte Reste à Faire
        const rafCard = createRAFCard(sprintData.metrics.tickets);
        if (rafCard) mainContainer.appendChild(rafCard);

        // 6. Carte Qualité (Bugs + Retours)
        const qualityCard = createQualityCard(sprintData.metrics.quality);
        if (qualityCard) mainContainer.appendChild(qualityCard);
    }

    // Ligne 2: cartes avancées
    const advancedContainer = document.getElementById('kpiCardsAdvanced');
    if (advancedContainer) {
        advancedContainer.innerHTML = '';

        // 1. Carte RAF Prédictif (avec explication)
        const rafPredictiveCard = createRAFPredictiveCard(sprintData.metrics.tickets, sprintData.metrics.time_tracking);
        if (rafPredictiveCard) advancedContainer.appendChild(rafPredictiveCard);

        // 2. Carte Qualité de Remplissage
        const dataQualityCard = createDataQualityCard(sprintData.metrics.data_quality);
        if (dataQualityCard) advancedContainer.appendChild(dataQualityCard);

        // 3. Carte Capacité de Production
        const capacityCard = createCapacityCard(sprintData.metrics.capacity);
        if (capacityCard) advancedContainer.appendChild(capacityCard);
    }
}

// Carte 1: Vélocité DUAL (Points + Heures)
function createVelocityCard(velocity) {
    const card = document.createElement('div');
    card.className = 'kpi-card';

    const mode = velocity.mode || 'story_points';
    const percentSP = velocity.velocity_percent_points !== null ? velocity.velocity_percent_points : 0;
    const percentHours = velocity.velocity_percent_hours !== null ? velocity.velocity_percent_hours : velocity.velocity_percent || 0;

    const completedDays = (velocity.completed_hours / 7).toFixed(1);
    const committedDays = (velocity.committed_hours / 7).toFixed(1);

    if (mode === 'story_points' && velocity.committed_story_points > 0) {
        // Mode SP avec dual metrics
        card.innerHTML = `
            <h3>🎯 Vélocité</h3>
            <div class="kpi-dual-metrics">
                <div class="kpi-metric">
                    <div class="kpi-value">${velocity.completed_story_points}/${velocity.committed_story_points}</div>
                    <div class="kpi-label">Story Points</div>
                    <div class="kpi-percent ${getPercentClass(percentSP)}">${percentSP}%</div>
                </div>
                <div class="kpi-metric-separator"></div>
                <div class="kpi-metric">
                    <div class="kpi-value">${Math.floor(velocity.completed_hours)}h/${Math.floor(velocity.committed_hours)}h</div>
                    <div class="kpi-label">${completedDays}j / ${committedDays}j estimés</div>
                    <div class="kpi-percent ${getPercentClass(percentHours)}">${percentHours}%</div>
                </div>
            </div>
            <div class="kpi-detail" style="font-size: 11px; color: var(--text-secondary); margin-top: 8px;">✅ Tickets terminés uniquement</div>
        `;
    } else {
        // Mode heures uniquement
        card.innerHTML = `
            <h3>🎯 Vélocité</h3>
            <div class="kpi-value">${Math.floor(velocity.completed_hours)}h/${Math.floor(velocity.committed_hours)}h</div>
            <div class="kpi-label">${completedDays}j / ${committedDays}j estimés</div>
            <div class="kpi-percent ${getPercentClass(percentHours)}">${percentHours}%</div>
            <div class="kpi-detail" style="font-size: 11px; color: var(--text-secondary); margin-top: 8px;">✅ Tickets terminés uniquement</div>
        `;
    }

    return card;
}

// Carte 2: Temps Passé
function createTimeCard(time) {
    const card = document.createElement('div');
    card.className = 'kpi-card';

    const efficiency = time.efficiency_percent !== null ? time.efficiency_percent : 0;
    const overrun = time.overrun_percent !== null ? time.overrun_percent : 0;

    const spentDays = (time.total_spent_hours / 7).toFixed(1);
    const estimatedDays = (time.total_estimated_hours / 7).toFixed(1);

    card.innerHTML = `
        <h3>⏱️ Temps Passé</h3>
        <div class="kpi-value">${Math.floor(time.total_spent_hours)}h</div>
        <div class="kpi-label">${spentDays}j passés sur ${estimatedDays}j estimés</div>
        <div class="kpi-percent ${getPercentClass(efficiency)}">${efficiency}% efficacité</div>
        ${overrun > 0 ? `<div class="kpi-detail" style="color: var(--danger-color);">⚠️ +${overrun}% dépassement</div>` : ''}
        <div class="kpi-detail" style="font-size: 11px; color: var(--text-secondary); margin-top: 5px;">📊 Tous les tickets du sprint</div>
    `;

    return card;
}

// Carte 3: Heures/Point (RESTAURÉE)
function createHoursPerPointCard(time) {
    if (!time.hours_per_point_actual && !time.hours_per_point_estimated) {
        return null; // Pas de données h/SP disponibles
    }

    const card = document.createElement('div');
    card.className = 'kpi-card';

    const actual = time.hours_per_point_actual !== null ? time.hours_per_point_actual.toFixed(1) : 'N/A';
    const estimated = time.hours_per_point_estimated !== null ? time.hours_per_point_estimated.toFixed(1) : 'N/A';

    card.innerHTML = `
        <h3>⏱️ Heures/Point</h3>
        <div class="kpi-value">${actual}h</div>
        <div class="kpi-label">réalisé (${estimated}h prévu)</div>
        <div class="kpi-percent">Ratio temps/point</div>
    `;

    return card;
}

// Carte 4: Tickets
function createTicketsCard(tickets) {
    const card = document.createElement('div');
    card.className = 'kpi-card';

    const completionRate = tickets.completion_rate_percent !== null ? tickets.completion_rate_percent : 0;

    card.innerHTML = `
        <h3>🎫 Tickets</h3>
        <div class="kpi-value">${tickets.completed}/${tickets.total}</div>
        <div class="kpi-label">complétés</div>
        <div class="kpi-percent ${getPercentClass(completionRate)}">${completionRate}%</div>
        ${tickets.in_progress > 0 ? `<div class="kpi-detail">${tickets.in_progress} en cours</div>` : ''}
    `;

    return card;
}

// Carte 5: Reste à Faire
function createRAFCard(tickets) {
    const card = document.createElement('div');
    card.className = 'kpi-card';

    const rafHours = tickets.remaining_estimated_hours || 0;
    const rafDays = (rafHours / 7).toFixed(1);
    const rafSP = tickets.remaining_story_points || 0;

    let content = '<h3>📅 Reste à Faire</h3>';

    if (rafSP > 0) {
        content += `
            <div class="kpi-value">${rafSP} SP</div>
            <div class="kpi-label">${Math.floor(rafHours)}h (${rafDays}j) estimées</div>
        `;
    } else {
        content += `
            <div class="kpi-value">${Math.floor(rafHours)}h</div>
            <div class="kpi-label">${rafDays}j restant estimé</div>
        `;
    }

    content += '<div class="kpi-percent">Basé sur estimations initiales</div>';

    card.innerHTML = content;
    return card;
}

// Carte 6: Qualité (Bugs + Retours)
function createQualityCard(quality) {
    const card = document.createElement('div');
    card.className = 'kpi-card';

    const defectRate = quality.defect_rate_percent !== null ? quality.defect_rate_percent : 0;
    const retoursRate = quality.retours_rate_percent !== null ? quality.retours_rate_percent : 0;

    card.innerHTML = `
        <h3>✅ Qualité</h3>
        <div class="kpi-value">${quality.bugs_resolved}/${quality.bugs_found}</div>
        <div class="kpi-label">bugs résolus</div>
        <div class="kpi-percent ${getPercentClass(100 - defectRate)}">Taux: ${defectRate}%</div>
        ${quality.total_retours > 0 ? `<div class="kpi-detail">⚠️ ${quality.total_retours} retours (${retoursRate}%)</div>` : ''}
    `;

    return card;
}

// Carte 7: RAF Prédictif (avec explication)
function createRAFPredictiveCard(tickets, time) {
    const rafPredicted = tickets.remaining_hours_predicted;
    const rafDeclared = tickets.remaining_estimated_hours || 0;
    const variance = tickets.raf_variance_hours || 0;

    if (rafPredicted === null) {
        return null; // Pas de prédiction disponible
    }

    const card = document.createElement('div');
    card.className = 'kpi-card kpi-card-advanced';

    const rafDeclaredDays = (rafDeclared / 7).toFixed(1);
    const rafPredictedDays = (rafPredicted / 7).toFixed(1);
    const variancePercent = rafDeclared > 0 ? Math.abs((variance / rafDeclared) * 100).toFixed(0) : 0;
    const varianceClass = variance > 0 ? 'danger' : 'success';
    const varianceSign = variance > 0 ? '+' : '';

    card.innerHTML = `
        <h3>📊 RAF Prédictif</h3>
        <div class="kpi-dual-metrics">
            <div class="kpi-metric">
                <div class="kpi-value">${Math.floor(rafDeclared)}h</div>
                <div class="kpi-label">RAF déclaré (${rafDeclaredDays}j)</div>
            </div>
            <div class="kpi-metric-separator"></div>
            <div class="kpi-metric">
                <div class="kpi-value">${Math.floor(rafPredicted)}h</div>
                <div class="kpi-label">RAF prédictif (${rafPredictedDays}j)</div>
            </div>
        </div>
        <div class="kpi-percent ${varianceClass}">${varianceSign}${variance.toFixed(1)}h (${varianceSign}${variancePercent}%)</div>
        <div class="kpi-explanation">
            Basé sur la vélocité réelle mesurée en h/SP durant ce sprint.
            ${variance > 0 ? '⚠️ L\'équipe est plus lente que prévu → risque de dépassement' : '✅ L\'équipe est plus rapide que prévu'}
        </div>
    `;

    return card;
}

// Carte 8: Qualité de Remplissage
function createDataQualityCard(dataQuality) {
    if (!dataQuality) return null;

    const card = document.createElement('div');
    card.className = 'kpi-card kpi-card-advanced';

    const qualityScore = dataQuality.quality_score || 0;
    const ticketsComplete = dataQuality.tickets_fully_estimated || 0;
    const ticketsIncomplete = dataQuality.tickets_without_any_estimate || 0;

    card.innerHTML = `
        <h3>📋 Qualité Remplissage</h3>
        <div class="kpi-value">${ticketsComplete}/${dataQuality.total_tickets}</div>
        <div class="kpi-label">tickets complets (SP + Temps) après redressage</div>
        <div class="kpi-percent ${getPercentClass(qualityScore)}">${qualityScore}% qualité</div>
        ${ticketsIncomplete > 0 ? `<div class="kpi-detail" style="color: var(--danger-color);">❌ ${ticketsIncomplete} sans estimation</div>` : ''}
    `;

    return card;
}

// Carte 9: Capacité de Production
function createCapacityCard(capacity) {
    if (!capacity) return null;

    const card = document.createElement('div');
    card.className = 'kpi-card kpi-card-advanced';

    const plannedHours = capacity.planned_capacity_hours || 0;
    const plannedDays = capacity.planned_capacity_days || 0;
    const actualHours = capacity.actual_capacity_hours || 0;
    const actualDays = capacity.actual_capacity_days || 0;
    const usefulHours = capacity.useful_capacity_hours || 0;
    const usefulDays = capacity.useful_capacity_days || 0;
    const utilization = capacity.utilization_percent || 0;
    const efficiency = capacity.efficiency_percent || 0;
    const overload = capacity.overload_percent || 0;

    // Déterminer les classes de couleur
    const utilizationClass = utilization > 100 ? 'danger' : (utilization > 90 ? 'warning' : 'success');
    const efficiencyClass = efficiency < 70 ? 'danger' : (efficiency < 85 ? 'warning' : 'success');
    const overloadClass = overload > 0 ? 'danger' : 'success';

    card.innerHTML = `
        <h3>⚙️ Capacité de Production</h3>
        <div class="kpi-dual-metrics">
            <div class="kpi-metric">
                <div class="kpi-value">${Math.floor(plannedHours)}h</div>
                <div class="kpi-label">Capacité prévue (${plannedDays.toFixed(1)}j/h)</div>
            </div>
            <div class="kpi-metric-separator"></div>
            <div class="kpi-metric">
                <div class="kpi-value">${Math.floor(actualHours)}h</div>
                <div class="kpi-label">Capacité réalisée (${actualDays.toFixed(1)}j/h)</div>
            </div>
        </div>
        <div class="kpi-percent ${utilizationClass}">Utilisation: ${utilization}%</div>
        <div class="kpi-detail">
            ✅ Capacité utile: ${Math.floor(usefulHours)}h (${usefulDays.toFixed(1)}j/h)
        </div>
        <div class="kpi-detail">
            📊 Efficacité: <span class="${efficiencyClass}">${efficiency}%</span>
            ${overload !== 0 ? ` | Surcharge: <span class="${overloadClass}">${overload > 0 ? '+' : ''}${overload}%</span>` : ''}
        </div>
        <div class="kpi-explanation">
            La capacité utile représente le temps passé uniquement sur les tickets terminés (vélocité).
            ${overload > 0 ? '⚠️ Surcharge détectée : l\'équipe a travaillé plus que prévu' : ''}
            ${efficiency < 70 ? '⚠️ Efficacité faible : beaucoup de temps passé sur tickets non terminés' : ''}
        </div>
    `;

    return card;
}

// Helper: Classe CSS selon pourcentage
function getPercentClass(value) {
    if (value === null || value === undefined) return 'neutral';
    if (value >= 80) return 'success';
    if (value >= 60) return 'warning';
    return 'danger';
}

// =============================================================================
// Charts
// =============================================================================

function initializeCharts() {
  createStatusChart();
  createBurndownChart();
  createRAFChart();
  createQualityChart();
}

function createStatusChart() {
  const ctx = document.getElementById("statusChart");
  if (!ctx) return;

  // Utiliser tickets_summary si disponible (nouveau format), sinon items (ancien format)
  const itemsSource = sprintData.tickets_summary || sprintData.items || [];

  // Compter par statut
  const statusCounts = {};
  itemsSource.forEach((item) => {
    const status = item.status || "Unknown";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const labels = Object.keys(statusCounts);
  const data = Object.values(statusCounts);

  // Fonction de hash pour générer une couleur unique par statut
  function getColorFromHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash; // Convert to 32bit integer
    }

    // Générer une teinte (hue) entre 0 et 360
    const hue = Math.abs(hash % 360);

    // Saturation élevée (60-70%) pour des couleurs vives
    const saturation = 60 + (Math.abs(hash >> 8) % 11);

    // Luminosité moyenne (45-55%) pour un bon contraste
    const lightness = 45 + (Math.abs(hash >> 16) % 11);

    return `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`;
  }

  // Couleurs sémantiques pour les statuts standard, hash pour les autres
  const colors = labels.map((status) => {
    const statusLower = status.toLowerCase();

    // Statuts terminés → Vert
    if (
      statusLower.includes("done") ||
      statusLower.includes("terminé") ||
      statusLower.includes("closed")
    ) {
      return "rgba(0, 135, 90, 0.8)";
    }
    // Statuts en cours → Bleu
    else if (
      statusLower.includes("progress") ||
      statusLower.includes("review") ||
      statusLower.includes("cours")
    ) {
      return "rgba(0, 82, 204, 0.8)";
    }
    // Statuts bloqués → Rouge
    else if (statusLower.includes("block") || statusLower.includes("bloqué")) {
      return "rgba(222, 53, 11, 0.8)";
    }
    // Autres statuts → Couleur générée par hash (unique et stable)
    else {
      return getColorFromHash(status);
    }
  });

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "right",
          labels: {
            font: { size: 14 },
            padding: 15,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percent =
                total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return label + ": " + value + " (" + percent + "% )";
            },
          },
        },
      },
    },
  });
}

function createBurndownChart() {
  const ctx = document.getElementById('burndownChart');
  if (!ctx) return;

  const burndownData = sprintData.metrics.burndown;
  const mode = burndownData.mode || 'story_points';
  const unit = mode === 'story_points' ? 'SP' : 'h';

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: burndownData.dates,
      datasets: [
        {
          label: 'Burndown Idéal',
          data: burndownData.ideal_burndown,
          borderColor: 'rgba(94, 108, 132, 0.8)',
          backgroundColor: 'rgba(94, 108, 132, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.1,
          pointRadius: 3
        },
        {
          label: 'Burndown Réel',
          data: burndownData.actual_burndown,
          borderColor: 'rgba(0, 82, 204, 1)',
          backgroundColor: 'rgba(0, 82, 204, 0.1)',
          borderWidth: 3,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: {size: 14},
            padding: 15
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + ' ' + unit;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: mode === 'story_points' ? 'Story Points' : 'Heures',
            font: {size: 14, weight: 'bold'}
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Date',
            font: {size: 14, weight: 'bold'}
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

function createRAFChart() {
  const ctx = document.getElementById('rafChart');
  if (!ctx) return;

  const ticketsData = sprintData.metrics.tickets;
  const rafDeclared = ticketsData.remaining_estimated_hours || 0;
  const rafPredicted = ticketsData.remaining_hours_predicted || rafDeclared;
  const rafVariance = ticketsData.raf_variance_hours || 0;

  // Afficher écart
  const varianceColor = rafVariance > 0 ? 'rgba(222, 53, 11, 0.8)' : 'rgba(0, 135, 90, 0.8)';

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['RAF Déclaré', 'RAF Prédictif', 'Écart'],
      datasets: [{
        label: 'Heures',
        data: [rafDeclared, rafPredicted, Math.abs(rafVariance)],
        backgroundColor: [
          'rgba(0, 82, 204, 0.7)',
          'rgba(255, 139, 0, 0.7)',
          varianceColor
        ],
        borderColor: [
          'rgba(0, 82, 204, 1)',
          'rgba(255, 139, 0, 1)',
          varianceColor
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed.y;
              if (label === 'Écart') {
                const sign = rafVariance > 0 ? '+' : '';
                return 'Écart: ' + sign + rafVariance.toFixed(1) + 'h';
              }
              return label + ': ' + value.toFixed(1) + 'h';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Heures',
            font: {size: 14, weight: 'bold'}
          }
        }
      }
    }
  });
}

function createQualityChart() {
  const ctx = document.getElementById('qualityChart');
  if (!ctx) return;

  const dataQuality = sprintData.metrics.data_quality;
  if (!dataQuality) return;

  // Calculer répartition par type de ticket
  const typeBreakdown = calculateQualityByType();

  // Si on a des données par type, afficher un chart combiné
  if (typeBreakdown && typeBreakdown.length > 0) {
    // Chart en barres empilées montrant qualité par type
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: typeBreakdown.map(t => t.type),
        datasets: [
          {
            label: '✅ Complets',
            data: typeBreakdown.map(t => t.complete),
            backgroundColor: 'rgba(0, 135, 90, 0.8)',
            borderWidth: 1,
            borderColor: '#fff'
          },
          {
            label: '⚠️ Incomplets',
            data: typeBreakdown.map(t => t.incomplete),
            backgroundColor: 'rgba(255, 193, 7, 0.8)',
            borderWidth: 1,
            borderColor: '#fff'
          },
          {
            label: '❌ Sans estimation',
            data: typeBreakdown.map(t => t.noEstimate),
            backgroundColor: 'rgba(222, 53, 11, 0.8)',
            borderWidth: 1,
            borderColor: '#fff'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Type de Ticket',
              font: {size: 14, weight: 'bold'}
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: {
              display: true,
              text: 'Nombre de Tickets',
              font: {size: 14, weight: 'bold'}
            },
            ticks: {
              stepSize: 1
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {size: 13},
              padding: 12
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.parsed.y || 0;
                const typeData = typeBreakdown[context.dataIndex];
                const total = typeData.total;
                const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return label + ': ' + value + ' (' + percent + '%)';
              }
            }
          }
        }
      }
    });
  } else {
    // Fallback: chart doughnut simple si pas de données par type
    const defects = dataQuality.defects_by_type;

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['✅ Complets', '⚠️ Sans SP', '⚠️ Sans Temps', '❌ Sans Rien'],
        datasets: [{
          data: [
            defects.fully_estimated,
            defects.no_story_points - defects.no_estimates_at_all,
            defects.no_time_estimate - defects.no_estimates_at_all,
            defects.no_estimates_at_all
          ],
          backgroundColor: [
            'rgba(0, 135, 90, 0.8)',
            'rgba(255, 193, 7, 0.8)',
            'rgba(255, 152, 0, 0.8)',
            'rgba(222, 53, 11, 0.8)'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: {size: 13},
              padding: 12
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = dataQuality.total_tickets;
                const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return label + ': ' + value + ' (' + percent + '%)';
              }
            }
          }
        }
      }
    });
  }
}

// Calculer qualité par type de ticket
function calculateQualityByType() {
  if (!sprintData.tickets_summary || sprintData.tickets_summary.length === 0) {
    return null;
  }

  // Grouper par type
  const typeGroups = {};

  sprintData.tickets_summary.forEach(ticket => {
    const type = ticket.issue_type || 'Autre';

    if (!typeGroups[type]) {
      typeGroups[type] = {
        type: type,
        complete: 0,
        incomplete: 0,
        noEstimate: 0,
        total: 0
      };
    }

    const hasSP = ticket.story_points && ticket.story_points > 0;
    const hasTime = ticket.time_estimate && ticket.time_estimate > 0;

    if (hasSP && hasTime) {
      typeGroups[type].complete++;
    } else if (!hasSP && !hasTime) {
      typeGroups[type].noEstimate++;
    } else {
      typeGroups[type].incomplete++;
    }

    typeGroups[type].total++;
  });

  // Convertir en array et trier par total décroissant
  return Object.values(typeGroups)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5); // Top 5 types
}

// =============================================================================
// Tickets Table - Avec TOUTES les colonnes
// =============================================================================

function initializeTicketsTable() {
    filteredTickets = [...sprintData.tickets_summary];
    renderTicketsTable();
    setupTableSorting();

    // Mettre à jour le compteur
    const countEl = document.getElementById('ticketsCount');
    if (countEl) {
        countEl.textContent = sprintData.tickets_summary.length;
    }
}

function renderTicketsTable() {
    const tbody = document.getElementById('ticketsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Récupérer JIRA_URL depuis le contexte
    const jiraUrl = typeof JIRA_URL !== 'undefined' ? JIRA_URL : '';

    filteredTickets.forEach(ticket => {
        const row = document.createElement('tr');

        // Construire lien JIRA
        const issueLink = jiraUrl ? `${jiraUrl}/browse/${ticket.key}` : '#';
        const linkTarget = jiraUrl ? 'target="_blank"' : '';

        // Formater les colonnes
        const timeFormatted = formatTime(ticket);
        const retoursFormatted = formatRetours(ticket);
        const qualityFormatted = formatQuality(ticket);

        row.innerHTML = `
            <td><a href="${issueLink}" ${linkTarget} class="issue-key">${ticket.key}</a></td>
            <td><a href="${issueLink}" ${linkTarget} class="issue-title">${escapeHtml(ticket.title)}</a></td>
            <td><span class="status-badge ${getStatusClass(ticket.status)}">${ticket.status}</span></td>
            <td>${escapeHtml(ticket.assignee)}</td>
            <td class="text-center">${ticket.story_points || '-'}</td>
            <td class="text-center">${ticket.estimation_macro || '-'}</td>
            <td class="text-center">${ticket.dev_type || '-'}</td>
            <td class="text-center ${timeFormatted.cssClass}">${timeFormatted.html}</td>
            <td class="text-center ${retoursFormatted.cssClass}">${retoursFormatted.html}</td>
            <td class="text-center ${qualityFormatted.cssClass}">${qualityFormatted.html}</td>
        `;

        tbody.appendChild(row);
    });

    // Après le rendu, mettre à jour les totaux
    updateTotals();
}

function getStatusClass(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('done') || statusLower.includes('closed') || statusLower.includes('terminé')) return 'status-done';
    if (statusLower.includes('progress') || statusLower.includes('review') || statusLower.includes('cours')) return 'status-in-progress';
    if (statusLower.includes('block')) return 'status-blocked';
    return 'status-todo';
}

// Formater colonne Temps au format "passé/estimé"
function formatTime(ticket) {
    const spent = ticket.time_spent ? ticket.time_spent.toFixed(1) : '0';
    const estimate = ticket.time_estimate ? ticket.time_estimate.toFixed(1) : '0';

    // Déterminer couleur
    let cssClass = '';
    if (ticket.time_estimate > 0) {
        if (ticket.time_spent <= ticket.time_estimate) {
            cssClass = 'time-good';  // Vert
        } else {
            cssClass = 'time-over';  // Rouge
        }
    }

    return {
        html: `${spent}h / ${estimate}h`,  // Format "passé / estimé"
        cssClass: cssClass
    };
}

// Formater colonne Retours au format "i/c/r"
function formatRetours(ticket) {
    const internes = ticket.retours_internes || 0;
    const client = ticket.retours_client || 0;
    const recette = ticket.retours_recette || 0;
    const total = internes + client + recette;

    if (total === 0) {
        return { html: '-', cssClass: '' };
    }

    const cssClass = total > 2 ? 'time-over' : 'time-good';

    return {
        html: `${internes}i / ${client}c / ${recette}r`,  // Format "i/c/r"
        cssClass: cssClass
    };
}

// Formater colonne Qualité
function formatQuality(ticket) {
    const hasSP = ticket.story_points && ticket.story_points > 0;
    const hasTime = ticket.time_estimate && ticket.time_estimate > 0;

    if (hasSP && hasTime) {
        return { html: '✅ Complet', cssClass: 'quality-good' };
    } else if (!hasSP && !hasTime) {
        return { html: '❌ Incomplet', cssClass: 'quality-bad' };
    } else if (!hasSP) {
        return { html: '⚠️ Sans SP', cssClass: 'quality-warning' };
    } else {
        return { html: '⚠️ Sans temps', cssClass: 'quality-warning' };
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// =============================================================================
// Table Sorting
// =============================================================================

function setupTableSorting() {
    const headers = document.querySelectorAll('th[data-sort]');

    headers.forEach(header => {
        header.classList.add('sortable');
        header.addEventListener('click', function() {
            const column = this.dataset.sort;
            sortTable(column);
        });
    });
}

function sortTable(column) {
    // Toggle direction if same column
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }

    // Sort data
    filteredTickets.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];

        // Handle quality sorting specially
        if (column === 'quality') {
            aVal = (a.story_points > 0 && a.time_estimate > 0) ? 2 : (a.story_points > 0 || a.time_estimate > 0) ? 1 : 0;
            bVal = (b.story_points > 0 && b.time_estimate > 0) ? 2 : (b.story_points > 0 || b.time_estimate > 0) ? 1 : 0;
            return currentSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        // Handle retours sorting (sum of all retours)
        if (column === 'retours') {
            aVal = (a.retours_internes || 0) + (a.retours_client || 0) + (a.retours_recette || 0);
            bVal = (b.retours_internes || 0) + (b.retours_client || 0) + (b.retours_recette || 0);
            return currentSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        // Handle time_spent sorting (compare spent vs estimate)
        if (column === 'time_spent') {
            aVal = a.time_spent || 0;
            bVal = b.time_spent || 0;
        }

        // Handle null/undefined
        if (aVal == null) aVal = '';
        if (bVal == null) bVal = '';

        // Convert to appropriate type
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return currentSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        // String comparison
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();

        if (currentSort.direction === 'asc') {
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
    });

    // Update UI
    updateSortIndicators();
    renderTicketsTable();
}

function updateSortIndicators() {
    // Remove all sort classes
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
    });

    // Add current sort class
    const currentHeader = document.querySelector(`th[data-sort="${currentSort.column}"]`);
    if (currentHeader) {
        currentHeader.classList.add(currentSort.direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
    }
}

// =============================================================================
// Filters
// =============================================================================

function initializeFilters() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const qualityFilter = document.getElementById('qualityFilter');

    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }

    if (statusFilter) {
        // Générer dynamiquement les options du filtre
        const uniqueStatuses = [...new Set(sprintData.tickets_summary.map(t => t.status))].sort();

        statusFilter.innerHTML = '<option value="">Tous les statuts</option>';
        uniqueStatuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status;
            statusFilter.appendChild(option);
        });

        statusFilter.addEventListener('change', applyFilters);
    }

    if (qualityFilter) {
        qualityFilter.addEventListener('change', applyFilters);
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const qualityFilter = document.getElementById('qualityFilter')?.value || '';

    filteredTickets = sprintData.tickets_summary.filter(ticket => {
        // Search filter
        const matchesSearch = !searchTerm ||
            ticket.key.toLowerCase().includes(searchTerm) ||
            ticket.title.toLowerCase().includes(searchTerm) ||
            ticket.assignee.toLowerCase().includes(searchTerm);

        // Status filter
        const matchesStatus = !statusFilter || ticket.status === statusFilter;

        // Quality filter
        let matchesQuality = true;
        if (qualityFilter === 'complete') {
            matchesQuality = (ticket.story_points > 0 && ticket.time_estimate > 0);
        } else if (qualityFilter === 'incomplete') {
            matchesQuality = !(ticket.story_points > 0 && ticket.time_estimate > 0);
        }

        return matchesSearch && matchesStatus && matchesQuality;
    });

    // Re-apply current sort
    if (currentSort.column) {
        sortTable(currentSort.column);
    } else {
        renderTicketsTable();
    }
}

// =============================================================================
// Totals Calculation (Dynamic based on filtered view)
// =============================================================================

function updateTotals() {
    // Totaux basés sur les tickets actuellement affichés (filteredTickets)
    const totalSP = filteredTickets.reduce((sum, t) => sum + (t.story_points || 0), 0);
    const totalSpent = filteredTickets.reduce((sum, t) => sum + (t.time_spent || 0), 0);
    const totalEstimate = filteredTickets.reduce((sum, t) => sum + (t.time_estimate || 0), 0);
    const totalRetours = filteredTickets.reduce((sum, t) => sum + ((t.retours_internes || 0) + (t.retours_client || 0) + (t.retours_recette || 0)), 0);

    const spCell = document.getElementById('totalSPCell');
    if (spCell) spCell.textContent = totalSP || '-';

    const timeCell = document.getElementById('totalTimeCell');
    if (timeCell) {
        const spentStr = totalSpent.toFixed(1);
        const estStr = totalEstimate.toFixed(1);
        timeCell.textContent = `${spentStr}h / ${estStr}h`;
    }

    const retCell = document.getElementById('totalRetCell');
    if (retCell) {
        retCell.textContent = `${totalRetours}i/c/r`;
    }

    // New: display total count of tickets in the total row
    const countCell = document.getElementById('totalCountCell');
    if (countCell) {
        countCell.textContent = filteredTickets.length || '-';
    }
}
