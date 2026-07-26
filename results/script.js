/**
 * Kauthukam '26 - Results Module JS (Public Subfolder)
 * Handles Live Firebase Data Fetching, Filtering, Leaderboard Calculations,
 * Candidate Standings, Result Detail Modals, and Result Present state switching.
 */

// Firebase Configuration
const firebaseConfig = {
  authDomain: "festie-s1u2h3.firebaseapp.com",
  projectId: "festie-s1u2h3",
  storageBucket: "festie-s1u2h3.firebasestorage.app",
  messagingSenderId: "1055535560935",
  appId: "1:1055535560935:web:5317ad5fe9ba3ffcfebff7"
};

let db = null;
if (typeof firebase !== 'undefined') {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.firestore();
}

// App State
let allPrograms = [];
let allResults = [];
let allTeams = [];
let isResultPresent = false;

let activeTab = 'all';
let activeSection = 'ALL';
let searchQuery = '';

const fallbackTeams = [
  { id: 't1', name: 'Alpha Gladiators', code: 'ALG', color: '#EA8F23', points: 420, wins: 14 },
  { id: 't2', name: 'Royal Titans', code: 'RTT', color: '#00A3E0', points: 385, wins: 11 },
  { id: 't3', name: 'Phoenix Warriors', code: 'PHW', color: '#EA3650', points: 310, wins: 8 },
  { id: 't4', name: 'Emerald Knights', code: 'EMK', color: '#09ABB1', points: 265, wins: 6 }
];

const fallbackPrograms = [
  {
    id: 'p101',
    code: '101',
    name: 'Elocution English',
    category: 'Sub-Junior',
    isPublished: true,
    winners: [
      { position: 1, candidateName: 'Muhammed Nihal', candidateId: 'C102', team: 'Alpha Gladiators', grade: 'A', points: 10 },
      { position: 2, candidateName: 'Ahmad Sinan', candidateId: 'C109', team: 'Royal Titans', grade: 'A', points: 7 },
      { position: 3, candidateName: 'Fidha Fathima', candidateId: 'C115', team: 'Phoenix Warriors', grade: 'B', points: 5 }
    ]
  },
  {
    id: 'p102',
    code: '102',
    name: 'Quran Recitation',
    category: 'Junior',
    isPublished: true,
    winners: [
      { position: 1, candidateName: 'Omar Farooq', candidateId: 'C201', team: 'Royal Titans', grade: 'A', points: 10 },
      { position: 2, candidateName: 'Hisham Abdul', candidateId: 'C205', team: 'Alpha Gladiators', grade: 'A', points: 7 },
      { position: 3, candidateName: 'Zayd Rayan', candidateId: 'C212', team: 'Emerald Knights', grade: 'A', points: 5 }
    ]
  }
];

document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  syncResultPresentConfig();
  fetchResultsData();
});

function syncResultPresentConfig() {
  if (!db) return;
  db.collection('config').doc('website').onSnapshot(doc => {
    if (doc.exists) {
      const config = doc.data();
      isResultPresent = config.resultPresent === true;
      updatePageViewState(isResultPresent);
    }
  }, err => console.warn("Result present sync error:", err));
}

function updatePageViewState(isPresent) {
  const liveSec = document.getElementById('live-results-section');
  const csSec = document.getElementById('coming-soon-section');
  const btn = document.getElementById('scorebar-result-btn');

  if (isPresent) {
    if (liveSec) liveSec.classList.remove('hidden');
    if (csSec) csSec.classList.add('hidden');
    if (btn) {
      btn.className = "scorebar-btn bg-[#FDF3E8] text-[#EA8F23] border border-[#EA8F23]/30 flex items-center justify-between px-3 py-1.5 rounded-xl font-semibold text-[13px] tracking-wide hover:bg-[#fbe4cb] transition-all shadow-xs";
    }
  } else {
    if (liveSec) liveSec.classList.add('hidden');
    if (csSec) csSec.classList.remove('hidden');
    if (btn) {
      btn.className = "scorebar-btn bg-[#EA8F23] border border-[#EA8F23] text-white flex items-center justify-between px-3 py-1.5 rounded-xl font-semibold text-[13px] tracking-wide shadow-xs";
    }
  }
}

function initEventListeners() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderViews();
    });
  }

  const sectionSelect = document.getElementById('section-select');
  if (sectionSelect) {
    sectionSelect.addEventListener('change', (e) => {
      activeSection = e.target.value;
      renderViews();
    });
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
        b.classList.add('text-slate-600');
      });
      btn.classList.add('active');
      btn.classList.remove('text-slate-600');

      activeTab = btn.getAttribute('data-tab');
      renderViews();
    });
  });

  const modalClose = document.getElementById('modal-close');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modal = document.getElementById('result-modal');

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
}

function fetchResultsData() {
  if (!db) {
    useFallbackData();
    return;
  }

  db.collection('programResults').onSnapshot(snapshot => {
    allResults = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    db.collection('programs').onSnapshot(progSnap => {
      allPrograms = progSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      db.collection('teams').onSnapshot(teamSnap => {
        allTeams = teamSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (allPrograms.length === 0) {
          useFallbackData();
        } else {
          processDataAndRender();
        }
      }, err => useFallbackData());
    }, err => useFallbackData());
  }, err => useFallbackData());
}

function useFallbackData() {
  allTeams = fallbackTeams;
  allPrograms = fallbackPrograms;
  processDataAndRender();
}

function processDataAndRender() {
  allPrograms.forEach(prog => {
    const matchingResults = allResults.filter(r => r.programId === prog.id || r.programCode === prog.code);
    if (matchingResults.length > 0) {
      prog.isPublished = true;
      prog.winners = matchingResults.map(r => ({
        position: parseInt(r.position) || 99,
        candidateName: r.candidateName || r.name || 'Candidate',
        candidateId: r.candidateId || r.code || '',
        team: r.team || r.teamName || 'Unassigned',
        grade: r.grade || 'A',
        points: parseInt(r.totalPoints || r.points) || 0
      })).sort((a, b) => a.position - b.position);
    }
  });

  calculateTeamStandings();
  renderSummaryStats();
  renderLeaderboard();
  renderViews();
}

function calculateTeamStandings() {
  const teamMap = {};

  allTeams.forEach(t => {
    const tName = t.name || t.teamName;
    teamMap[tName] = {
      name: tName,
      code: t.code || tName.substring(0, 3).toUpperCase(),
      color: t.color || '#EA8F23',
      points: 0,
      wins: 0
    };
  });

  allPrograms.forEach(prog => {
    if (prog.isPublished && Array.isArray(prog.winners)) {
      prog.winners.forEach(w => {
        if (!teamMap[w.team]) {
          teamMap[w.team] = {
            name: w.team,
            code: w.team.substring(0, 3).toUpperCase(),
            color: '#00A3E0',
            points: 0,
            wins: 0
          };
        }
        teamMap[w.team].points += (w.points || 0);
        if (w.position === 1) teamMap[w.team].wins += 1;
      });
    }
  });

  allTeams = Object.values(teamMap).sort((a, b) => b.points - a.points);
}

function renderSummaryStats() {
  const totalPoints = allTeams.reduce((sum, t) => sum + t.points, 0);
  const declaredCount = allPrograms.filter(p => p.isPublished).length;

  const ptsEl = document.getElementById('stat-total-points');
  const declEl = document.getElementById('stat-declared-count');

  if (ptsEl) ptsEl.textContent = totalPoints.toLocaleString();
  if (declEl) declEl.textContent = `${declaredCount} / ${allPrograms.length}`;
}

function renderLeaderboard() {
  const container = document.getElementById('team-leaderboard');
  if (!container) return;

  if (allTeams.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center py-4 text-slate-400 text-sm">No team standings available</div>`;
    return;
  }

  container.innerHTML = allTeams.slice(0, 4).map((team, idx) => {
    const rankClass = idx === 0 ? 'rank-badge-1' : idx === 1 ? 'rank-badge-2' : idx === 2 ? 'rank-badge-3' : 'bg-white border-slate-200 text-slate-700';
    const trophyIcon = idx === 0 ? 'ph:trophy-fill' : idx === 1 ? 'ph:medal-fill' : idx === 2 ? 'ph:medal' : 'ph:star-bold';

    return `
      <div class="result-card bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between relative overflow-hidden">
        <div class="flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border ${rankClass}">
            <span class="iconify text-2xl" data-icon="${trophyIcon}"></span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold text-slate-400">#${idx + 1}</span>
              <h4 class="font-bold text-slate-900 text-sm truncate max-w-[120px]">${team.name}</h4>
            </div>
            <p class="text-[11px] font-semibold text-slate-400 mt-0.5">${team.wins} First Place Wins</p>
          </div>
        </div>
        <div class="text-right">
          <span class="text-2xl font-extrabold text-slate-900">${team.points}</span>
          <span class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">PTS</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderViews() {
  const programGrid = document.getElementById('programs-results-grid');
  const toppersView = document.getElementById('toppers-view');
  const emptyState = document.getElementById('empty-state');

  if (activeTab === 'toppers') {
    if (programGrid) programGrid.classList.add('hidden');
    if (toppersView) toppersView.classList.remove('hidden');
    renderCandidateToppers();
    return;
  }

  if (programGrid) programGrid.classList.remove('hidden');
  if (toppersView) toppersView.classList.add('hidden');

  let filtered = allPrograms.filter(prog => {
    if (activeSection !== 'ALL' && prog.category !== activeSection) return false;
    if (activeTab === 'published' && !prog.isPublished) return false;

    if (searchQuery) {
      const nameMatch = (prog.name || '').toLowerCase().includes(searchQuery);
      const codeMatch = (prog.code || '').toLowerCase().includes(searchQuery);
      const winnerMatch = Array.isArray(prog.winners) && prog.winners.some(w => 
        (w.candidateName || '').toLowerCase().includes(searchQuery) ||
        (w.team || '').toLowerCase().includes(searchQuery)
      );
      return nameMatch || codeMatch || winnerMatch;
    }

    return true;
  });

  if (filtered.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    if (programGrid) programGrid.innerHTML = '';
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  programGrid.innerHTML = filtered.map(prog => {
    const isPub = prog.isPublished;
    const topWinner = isPub && prog.winners && prog.winners.length > 0 ? prog.winners[0] : null;

    return `
      <div class="result-card bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
              ${prog.category || 'General'}
            </span>
            <span class="text-xs font-mono font-bold text-slate-400">#${prog.code || prog.id}</span>
          </div>

          <h3 class="font-bold text-slate-900 text-base leading-snug mb-3 hover:text-amber-600 transition-colors cursor-pointer"
            onclick="openProgramModal('${prog.id}')">
            ${prog.name}
          </h3>

          ${isPub && topWinner ? `
            <div class="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 flex items-center justify-between mb-3">
              <div class="flex items-center gap-2.5">
                <span class="w-7 h-7 rounded-lg pos-badge-1 font-bold text-xs flex items-center justify-center shrink-0">1st</span>
                <div>
                  <p class="text-xs font-bold text-slate-800 leading-tight truncate max-w-[140px]">${topWinner.candidateName}</p>
                  <p class="text-[11px] font-medium text-amber-700 leading-tight">${topWinner.team}</p>
                </div>
              </div>
              <span class="px-2 py-0.5 rounded bg-amber-200/60 text-amber-900 font-bold text-[10px]">Grade ${topWinner.grade}</span>
            </div>
          ` : `
            <div class="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3 text-center mb-3">
              <p class="text-xs font-medium text-slate-400">Result Awaited / In Evaluation</p>
            </div>
          `}
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span class="inline-flex items-center gap-1.5 text-[11px] font-semibold ${isPub ? 'text-emerald-600' : 'text-amber-600'}">
            <span class="w-1.5 h-1.5 rounded-full ${isPub ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}"></span>
            ${isPub ? 'Declared' : 'Awaited'}
          </span>
          <button onclick="openProgramModal('${prog.id}')"
            class="text-xs font-bold text-slate-700 hover:text-amber-600 flex items-center gap-1 transition-colors">
            <span>View Winners</span>
            <i class="fi fi-rr-arrow-small-right text-base"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderCandidateToppers() {
  const container = document.getElementById('toppers-list');
  const countBadge = document.getElementById('topper-count-badge');
  if (!container) return;

  const candidateMap = {};

  allPrograms.forEach(p => {
    if (p.isPublished && Array.isArray(p.winners)) {
      p.winners.forEach(w => {
        const cKey = w.candidateName;
        if (!candidateMap[cKey]) {
          candidateMap[cKey] = {
            name: w.candidateName,
            team: w.team,
            points: 0,
            firstPlaces: 0
          };
        }
        candidateMap[cKey].points += (w.points || 0);
        if (w.position === 1) candidateMap[cKey].firstPlaces += 1;
      });
    }
  });

  const toppers = Object.values(candidateMap).sort((a, b) => b.points - a.points);

  if (countBadge) countBadge.textContent = `${toppers.length} Top Candidates`;

  if (toppers.length === 0) {
    container.innerHTML = `<div class="p-8 text-center text-slate-400 text-sm">No candidate results available yet.</div>`;
    return;
  }

  container.innerHTML = toppers.slice(0, 15).map((cand, idx) => `
    <div class="px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
      <div class="flex items-center gap-4">
        <span class="w-8 h-8 rounded-full font-extrabold text-xs flex items-center justify-center ${idx === 0 ? 'bg-amber-100 text-amber-700 border border-amber-300' : idx === 1 ? 'bg-slate-200 text-slate-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}">
          #${idx + 1}
        </span>
        <div>
          <h4 class="font-bold text-slate-900 text-sm">${cand.name}</h4>
          <p class="text-xs text-slate-400 font-medium">${cand.team}</p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div class="text-right">
          <span class="text-base font-extrabold text-slate-900">${cand.points}</span>
          <span class="text-[10px] font-semibold text-slate-400 uppercase block">PTS</span>
        </div>
      </div>
    </div>
  `).join('');
}

window.openProgramModal = function(programId) {
  const prog = allPrograms.find(p => p.id === programId);
  if (!prog) return;

  const modal = document.getElementById('result-modal');
  const titleEl = document.getElementById('modal-title');
  const codeEl = document.getElementById('modal-code');
  const catEl = document.getElementById('modal-category');
  const listEl = document.getElementById('modal-winners-list');

  if (titleEl) titleEl.textContent = prog.name;
  if (codeEl) codeEl.textContent = `Program Code: #${prog.code || prog.id}`;
  if (catEl) catEl.textContent = prog.category || 'General';

  if (listEl) {
    if (!prog.isPublished || !prog.winners || prog.winners.length === 0) {
      listEl.innerHTML = `
        <div class="p-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
          <span class="iconify text-3xl text-amber-500 mb-2 inline-block" data-icon="ph:clock-duotone"></span>
          <h5 class="font-bold text-slate-700 text-sm">Evaluation in Progress</h5>
          <p class="text-xs text-slate-400 mt-1">Official results for this program have not been declared yet.</p>
        </div>
      `;
    } else {
      listEl.innerHTML = prog.winners.map(w => {
        const badgeClass = w.position === 1 ? 'pos-badge-1' : w.position === 2 ? 'pos-badge-2' : 'pos-badge-3';
        return `
          <div class="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${badgeClass}">
                ${w.position === 1 ? '1st' : w.position === 2 ? '2nd' : '3rd'}
              </span>
              <div>
                <h5 class="font-bold text-slate-900 text-sm">${w.candidateName}</h5>
                <p class="text-xs font-medium text-slate-500">${w.team}</p>
              </div>
            </div>
            <div class="text-right">
              <span class="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-extrabold text-xs inline-block">Grade ${w.grade}</span>
              <span class="block text-[10px] font-bold text-slate-400 mt-0.5">+${w.points} Pts</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  if (modal) {
    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.querySelector('> div').classList.remove('scale-95');
    modal.querySelector('> div').classList.add('scale-100');
  }
};

function closeModal() {
  const modal = document.getElementById('result-modal');
  if (modal) {
    modal.classList.add('opacity-0', 'pointer-events-none');
    modal.querySelector('> div').classList.remove('scale-100');
    modal.querySelector('> div').classList.add('scale-95');
  }
}
