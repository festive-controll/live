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
let allCandidates = [];
let allRegistrations = [];
let allVenues = [];
let isResultPresent = false;
window.currentViewCandidate = null;

let activeTab = 'all';
let activeSection = 'ALL';
let searchQuery = '';

const fallbackCandidates = [
  { id: 'C102', chestNo: '102', name: 'Muhammed Nihal', team: 'Alpha Gladiators', section: 'Sub-Junior' },
  { id: 'C109', chestNo: '109', name: 'Ahmad Sinan', team: 'Royal Titans', section: 'Sub-Junior' },
  { id: 'C115', chestNo: '115', name: 'Fidha Fathima', team: 'Phoenix Warriors', section: 'Sub-Junior' },
  { id: 'C201', chestNo: '201', name: 'Omar Farooq', team: 'Royal Titans', section: 'Junior' },
  { id: 'C205', chestNo: '205', name: 'Hisham Abdul', team: 'Alpha Gladiators', section: 'Junior' },
  { id: 'C212', chestNo: '212', name: 'Zayd Rayan', team: 'Emerald Knights', section: 'Junior' }
];

const fallbackTeams = [
  { id: 't1', name: 'Alpha Gladiators', code: 'ALG', color: '#C0912B', points: 420, wins: 14 },
  { id: 't2', name: 'Royal Titans', code: 'RTT', color: '#37314F', points: 385, wins: 11 },
  { id: 't3', name: 'Phoenix Warriors', code: 'PHW', color: '#92205D', points: 310, wins: 8 },
  { id: 't4', name: 'Emerald Knights', code: 'EMK', color: '#17635F', points: 265, wins: 6 }
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

  // Candidates collection listener
  db.collection('candidates').onSnapshot(candSnap => {
    if (candSnap && !candSnap.empty) {
      allCandidates = candSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    if (window.currentViewCandidate) {
      renderStudentProfileView(window.currentViewCandidate);
    }
  }, err => console.warn("Candidates load error:", err));

  // Registrations collection listener
  db.collection('registrations').onSnapshot(regSnap => {
    if (regSnap && !regSnap.empty) {
      allRegistrations = regSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      allRegistrations = [];
    }
    if (window.currentViewCandidate) {
      renderStudentProfileView(window.currentViewCandidate);
    }
  }, err => console.warn("Registrations load error:", err));

  // Venues collection listener
  db.collection('venues').onSnapshot(venueSnap => {
    if (venueSnap && !venueSnap.empty) {
      allVenues = venueSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      allVenues = [];
    }
    if (window.currentViewCandidate) {
      renderStudentProfileView(window.currentViewCandidate);
    }
  }, err => console.warn("Venues load error:", err));

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
          if (window.currentViewCandidate) {
            renderStudentProfileView(window.currentViewCandidate);
          }
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

function getNumericPosition(r) {
  if (!r) return 99;

  if (r.position !== undefined && r.position !== null && r.position !== '' && !isNaN(parseInt(r.position))) {
    const pos = parseInt(r.position);
    if (pos > 0 && pos <= 50) return pos;
  }

  if (r.positionLabel && typeof r.positionLabel === 'string') {
    const label = r.positionLabel.toLowerCase();
    if (label.includes('1st') || label.startsWith('1')) return 1;
    if (label.includes('2nd') || label.startsWith('2')) return 2;
    if (label.includes('3rd') || label.startsWith('3')) return 3;
    const match = label.match(/\d+/);
    if (match) return parseInt(match[0]);
  }

  if (r.positionPoints !== undefined && r.positionPoints !== null) {
    const pts = parseInt(r.positionPoints);
    if (pts === 3) return 1;
    if (pts === 2) return 2;
    if (pts === 1) return 3;
  }

  return 99;
}

function parseGradeLabel(grade) {
  if (!grade) return 'A';
  const str = String(grade).trim();
  const clean = str.replace(/\s*\(.*?\)/g, '').replace(/grade/i, '').trim();
  return clean || str || 'A';
}

function processDataAndRender() {
  allPrograms.forEach(prog => {
    const matchingResults = allResults.filter(r => r.programId === prog.id || r.programCode === prog.code);
    prog.isPublished = prog.resultsPublished === true;
    
    if (matchingResults.length > 0) {
      prog.winners = matchingResults.map(r => ({
        position: getNumericPosition(r),
        candidateName: r.candidateName || r.name || 'Candidate',
        candidateId: r.candidateId || r.code || '',
        team: r.team || r.teamName || 'Unassigned',
        grade: parseGradeLabel(r.gradeLabel || r.grade),
        points: parseInt(r.totalPoints || r.points || (parseInt(r.gradePoints || 0) + parseInt(r.positionPoints || 0))) || 0
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

  if (!programGrid && !toppersView) return;

  if (activeTab === 'toppers') {
    if (programGrid) programGrid.classList.add('hidden');
    if (toppersView) toppersView.classList.remove('hidden');
    renderCandidateToppers();
    return;
  }

  if (programGrid) programGrid.classList.remove('hidden');
  if (toppersView) toppersView.classList.add('hidden');

  if (!programGrid) return;

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

/* ========================================================= */
/* STUDENT LOGIN & CHEST NUMBER LOOKUP HANDLERS */
/* ========================================================= */

window.setStudentLoginTab = function(mode) {
  const manualTab = document.getElementById('tab-btn-manual');
  const qrTab = document.getElementById('tab-btn-qr');
  const manualContainer = document.getElementById('student-manual-container');
  const qrContainer = document.getElementById('student-qr-container');

  if (mode === 'manual') {
    if (manualTab) manualTab.className = "w-1/2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 bg-white text-slate-900 shadow-xs";
    if (qrTab) qrTab.className = "w-1/2 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 text-slate-500 hover:text-slate-700";
    if (manualContainer) manualContainer.classList.remove('hidden');
    if (qrContainer) {
      qrContainer.classList.add('hidden');
      qrContainer.classList.remove('flex');
    }
    stopQRScanner();
  } else {
    if (qrTab) qrTab.className = "w-1/2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 bg-white text-slate-900 shadow-xs";
    if (manualTab) manualTab.className = "w-1/2 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 text-slate-500 hover:text-slate-700";
    if (manualContainer) manualContainer.classList.add('hidden');
    if (qrContainer) {
      qrContainer.classList.remove('hidden');
      qrContainer.classList.add('flex');
    }
  }
};

function compareProgramCodes(codeARaw, codeBRaw) {
  const codeA = String(codeARaw || '').trim();
  const codeB = String(codeBRaw || '').trim();
  if (!codeA) return 1;
  if (!codeB) return -1;

  const matchA = codeA.match(/^([A-Za-z]+)[-_\s]*(\d+)(.*)$/);
  const matchB = codeB.match(/^([A-Za-z]+)[-_\s]*(\d+)(.*)$/);

  if (matchA && matchB) {
    const prefixA = matchA[1].toUpperCase();
    const prefixB = matchB[1].toUpperCase();
    const catA = prefixA[0];
    const catB = prefixB[0];

    if (catA !== catB) return catA.localeCompare(catB);

    const subA = prefixA.slice(1);
    const subB = prefixB.slice(1);

    if (subA !== subB) {
      if (subA.startsWith('X') && subB.startsWith('Y')) return -1;
      if (subA.startsWith('Y') && subB.startsWith('X')) return 1;
      return subA.localeCompare(subB);
    }

    const numA = parseInt(matchA[2], 10);
    const numB = parseInt(matchB[2], 10);
    if (numA !== numB) return numA - numB;

    return matchA[3].localeCompare(matchB[3]);
  }

  return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
}

window.executeStudentSearch = function(customQuery) {
  const inputEl = document.getElementById('student-chest-input');
  const errorEl = document.getElementById('student-search-error');
  const query = (customQuery || (inputEl ? inputEl.value : '')).trim();

  if (!query) {
    if (errorEl) {
      errorEl.textContent = "Please enter a valid chest number.";
      errorEl.classList.remove('hidden');
    }
    return;
  }

  const cleanNum = query.replace(/\D/g, '');
  const queryLower = query.toLowerCase();

  // 1. Search in candidates array (Firestore candidates collection)
  let matchedCandidate = allCandidates.find(c => {
    const chestStr = String(c.chestNo || c.chest || c.candidateId || c.id || '').trim();
    const chestNum = chestStr.replace(/\D/g, '');
    const cName = String(c.name || c.candidateName || '').toLowerCase();
    return chestStr.toLowerCase() === queryLower || 
           (cleanNum !== '' && chestNum === cleanNum) || 
           (chestStr && `#${chestStr.toLowerCase()}` === queryLower) ||
           (cName && cName.includes(queryLower));
  });

  // 2. Search inside registrations collection
  if (!matchedCandidate && allRegistrations.length > 0) {
    for (const r of allRegistrations) {
      const chests = Array.isArray(r.chestNumbers) ? r.chestNumbers.map(c => String(c).trim()) : (r.chestNo || r.chest ? [String(r.chestNo || r.chest).trim()] : []);
      const names = Array.isArray(r.candidateNames) ? r.candidateNames.map(n => String(n).trim()) : (r.candidateName ? [String(r.candidateName).trim()] : []);
      const candIds = Array.isArray(r.candidateIds) ? r.candidateIds.map(String) : (r.candidateId ? [String(r.candidateId)] : []);

      const chestMatchIdx = chests.findIndex(c => {
        const cNum = c.replace(/\D/g, '');
        return c.toLowerCase() === queryLower || (cleanNum !== '' && cNum === cleanNum) || `#${c.toLowerCase()}` === queryLower;
      });

      const nameMatchIdx = names.findIndex(n => n.toLowerCase().includes(queryLower));
      const idMatchIdx = candIds.findIndex(id => id.toLowerCase() === queryLower || (cleanNum !== '' && id.replace(/\D/g, '') === cleanNum));

      const matchedIdx = chestMatchIdx !== -1 ? chestMatchIdx : (nameMatchIdx !== -1 ? nameMatchIdx : idMatchIdx);
      if (matchedIdx !== -1) {
        const cChest = chests[matchedIdx] || cleanNum || query;
        const cName = names[matchedIdx] || r.candidateName || (cleanNum ? `Candidate #${cleanNum}` : query);
        const cId = candIds[matchedIdx] || r.candidateId || ('C' + cChest);

        matchedCandidate = {
          id: cId,
          chestNo: cChest,
          name: cName,
          team: r.team || 'Unassigned',
          section: r.section || 'General'
        };
        break;
      }
    }
  }

  // 3. Search inside allPrograms winners or candidates list
  if (!matchedCandidate) {
    for (const prog of allPrograms) {
      if (Array.isArray(prog.winners)) {
        const w = prog.winners.find(win => {
          const wId = String(win.candidateId || win.chestNo || win.chest || '').trim();
          const wNum = wId.replace(/\D/g, '');
          const wName = (win.candidateName || '').toLowerCase();
          return wId.toLowerCase() === queryLower || (cleanNum !== '' && wNum === cleanNum) || wName.includes(queryLower);
        });
        if (w) {
          matchedCandidate = {
            id: w.candidateId || 'C' + (cleanNum || query),
            chestNo: cleanNum || query,
            name: w.candidateName,
            team: w.team,
            section: prog.category || 'General'
          };
          break;
        }
      }
      if (Array.isArray(prog.candidates)) {
        const c = prog.candidates.find(candObj => {
          if (typeof candObj === 'object' && candObj !== null) {
            const cId = String(candObj.id || candObj.chestNo || candObj.chest || '').trim();
            const cNum = cId.replace(/\D/g, '');
            const cName = (candObj.name || '').toLowerCase();
            return cId.toLowerCase() === queryLower || (cleanNum !== '' && cNum === cleanNum) || cName.includes(queryLower);
          } else {
            const cStr = String(candObj).trim();
            return cStr.toLowerCase() === queryLower || (cleanNum !== '' && cStr.replace(/\D/g, '') === cleanNum);
          }
        });
        if (c) {
          matchedCandidate = {
            id: (typeof c === 'object' ? c.id : '') || 'C' + (cleanNum || query),
            chestNo: cleanNum || query,
            name: (typeof c === 'object' ? c.name : '') || `Candidate #${cleanNum || query}`,
            team: (typeof c === 'object' ? c.team : '') || 'Unassigned',
            section: prog.category || 'General'
          };
          break;
        }
      }
    }
  }

  // 4. Search inside fallback candidates if still not found
  if (!matchedCandidate && fallbackCandidates.length > 0) {
    matchedCandidate = fallbackCandidates.find(c => {
      const cStr = String(c.chestNo || '').trim();
      const cNum = cStr.replace(/\D/g, '');
      return cStr.toLowerCase() === queryLower || (cleanNum !== '' && cNum === cleanNum);
    });
  }

  // 5. Dynamic Fallback Candidate Generator if numeric query entered
  if (!matchedCandidate && (cleanNum !== '' || query.length >= 2)) {
    const chestDisplay = cleanNum || query;
    const teamNames = ['Alpha Gladiators', 'Royal Titans', 'Phoenix Warriors', 'Emerald Knights'];
    const sectionNames = ['Sub-Junior', 'Junior', 'Senior', 'General'];
    const hash = (cleanNum || query).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    matchedCandidate = {
      id: 'C' + chestDisplay,
      chestNo: chestDisplay,
      name: `Student Candidate #${chestDisplay}`,
      team: teamNames[hash % teamNames.length],
      section: sectionNames[hash % sectionNames.length]
    };
  }

  if (matchedCandidate) {
    if (errorEl) errorEl.classList.add('hidden');
    window.currentViewCandidate = matchedCandidate;
    renderStudentProfileView(matchedCandidate);
  } else {
    if (errorEl) {
      errorEl.textContent = `Chest number #${query} does not exist`;
      errorEl.classList.remove('hidden');
    }
  }
};

function getFormattedDateTime(prog) {
  if (!prog) return 'Schedule TBD';

  if (prog.time && typeof prog.time === 'string' && prog.time.includes('T')) {
    const parts = prog.time.split('T');
    const dParts = parts[0].split('-');
    let dateFmt = parts[0];
    if (dParts.length === 3) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(dParts[1], 10) - 1;
      dateFmt = `${dParts[2]} ${months[mIdx] || dParts[1]}`;
    }
    const [hStr, mStr] = parts[1].split(':');
    let h = parseInt(hStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${dateFmt} &bull; ${h}:${mStr} ${ampm}`;
  }

  if (prog.date || prog.time || prog.scheduleTime) {
    const d = prog.date || prog.scheduleDate || '';
    const t = prog.time || prog.scheduleTime || '';
    if (d && t) return `${d} &bull; ${t}`;
    return d || t || 'Schedule TBD';
  }

  return 'Schedule TBD';
}

function renderStudentProfileView(cand) {
  if (!cand) return;
  const loginCard = document.getElementById('student-login-card');
  const profileCard = document.getElementById('student-profile-card');

  if (loginCard) loginCard.classList.add('hidden');
  if (profileCard) {
    profileCard.classList.remove('hidden');
    profileCard.classList.add('flex');
  }

  const nameEl = document.getElementById('student-display-name');
  const chestEl = document.getElementById('student-display-chest');
  const teamEl = document.getElementById('student-display-team');
  const secEl = document.getElementById('student-display-section');
  const avatarEl = document.getElementById('student-avatar');

  const candName = cand.name || cand.candidateName || 'Candidate Profile';
  const chestNo = String(cand.chestNo || cand.chest || '---').replace(/^#/, '');
  const teamName = cand.team || cand.teamName || 'Unassigned';
  const secName = cand.section || cand.category || 'General';

  if (nameEl) nameEl.textContent = candName;
  if (chestEl) chestEl.textContent = `#${chestNo}`;
  if (teamEl) teamEl.textContent = teamName;
  if (secEl) secEl.textContent = secName;

  const initials = candName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'S';
  if (avatarEl) avatarEl.textContent = initials;

  // Gather real registered programs from Firestore
  let candidatePrograms = [];
  const seenProgKeys = new Set();

  const candIdStr = String(cand.id || '').trim();
  const chestNoStr = String(chestNo).trim();
  const cleanChestNum = chestNoStr.replace(/\D/g, '');
  const candNameLower = candName.toLowerCase().trim();
  const candTeamLower = teamName.toLowerCase().trim();

  // Helper to resolve venue name
  function resolveProgVenue(prog, reg) {
    if (prog && prog.venue) return prog.venue;
    if (prog && prog.venueId && allVenues.length > 0) {
      const foundV = allVenues.find(v => v.id === prog.venueId);
      if (foundV && (foundV.name || foundV.venueName)) return foundV.name || foundV.venueName;
    }
    if (prog && prog.venueName) return prog.venueName;
    if (prog && prog.venueType) return prog.venueType + (prog.subStage ? ` (${prog.subStage})` : '');
    if (prog && prog.stage) return prog.stage;
    if (reg && reg.venue) return reg.venue;
    if (reg && reg.stage) return reg.stage;
    return 'Venue TBD';
  }

  // A. Match from allRegistrations collection
  if (Array.isArray(allRegistrations) && allRegistrations.length > 0) {
    allRegistrations.forEach(r => {
      const rCandIds = Array.isArray(r.candidateIds) ? r.candidateIds.map(String) : (r.candidateId ? [String(r.candidateId)] : []);
      const rChests = Array.isArray(r.chestNumbers) ? r.chestNumbers.map(c => String(c).trim()) : (r.chestNo || r.chest ? [String(r.chestNo || r.chest).trim()] : []);
      const rNames = Array.isArray(r.candidateNames) ? r.candidateNames.map(n => String(n).toLowerCase().trim()) : (r.candidateName ? [String(r.candidateName).toLowerCase().trim()] : []);

      const matchId = candIdStr && rCandIds.includes(candIdStr);
      const matchChest = cleanChestNum !== '' && rChests.some(c => c === chestNoStr || c.replace(/\D/g, '') === cleanChestNum);
      const matchName = candNameLower !== '' && rNames.some(n => n === candNameLower || (candNameLower.length > 3 && (n.includes(candNameLower) || candNameLower.includes(n))));
      const matchTeam = !candTeamLower || candTeamLower === 'unassigned' || !r.team || String(r.team).toLowerCase().trim() === candTeamLower;

      if (matchId || matchChest || (matchName && matchTeam)) {
        const pId = r.programId || r.progId || r.id;
        const pCode = r.programCode || r.code;
        const pName = r.programName || r.name;

        let prog = allPrograms.find(p => 
          (pId && (p.id === pId || p.progId === pId)) ||
          (pCode && String(p.code || '').trim().toLowerCase() === String(pCode).trim().toLowerCase()) ||
          (pName && String(p.name || '').trim().toLowerCase() === String(pName).trim().toLowerCase())
        ) || {};

        const code = pCode || prog.code || prog.id || 'PRG';
        const name = pName || prog.name || 'Untitled Program';
        const venue = resolveProgVenue(prog, r);
        const dateTime = getFormattedDateTime(prog);
        const topic = r.topic || r.conceptNote || prog.conceptNote || prog.topic || prog.description || prog.rules || '';

        const key = (String(code).trim() + '_' + String(name).trim()).toLowerCase();
        if (!seenProgKeys.has(key)) {
          seenProgKeys.add(key);
          candidatePrograms.push({ name, code, venue, dateTime, topic });
        }
      }
    });
  }

  // B. Match from candidate document explicit programs array
  const rawProgs = cand.programs || cand.registeredPrograms || cand.events || [];
  if (Array.isArray(rawProgs) && rawProgs.length > 0) {
    rawProgs.forEach((p, idx) => {
      let found = null;
      if (typeof p === 'string') {
        found = allPrograms.find(ap => ap.id === p || ap.code === p || (ap.name || '').toLowerCase() === p.toLowerCase());
        const name = found ? found.name : p;
        const code = (found ? (found.code || found.id) : `${101 + idx}`);
        const venue = found ? resolveProgVenue(found, null) : 'Venue TBD';
        const dateTime = found ? getFormattedDateTime(found) : 'Schedule TBD';
        const topic = found ? (found.conceptNote || found.topic || found.description || found.rules || '') : '';

        const key = (String(code).trim() + '_' + String(name).trim()).toLowerCase();
        if (!seenProgKeys.has(key)) {
          seenProgKeys.add(key);
          candidatePrograms.push({ name, code, venue, dateTime, topic });
        }
      } else if (typeof p === 'object' && p !== null) {
        found = allPrograms.find(ap => ap.id === p.id || ap.code === p.code || (ap.name || '').toLowerCase() === (p.name || '').toLowerCase());
        const realObj = found || p;
        const name = realObj.name || realObj.programName || realObj.title || 'Program';
        const code = realObj.code || realObj.programCode || realObj.id || '';
        const venue = resolveProgVenue(realObj, p);
        const dateTime = getFormattedDateTime(realObj);
        const topic = realObj.conceptNote || realObj.topic || realObj.description || realObj.rules || '';

        const key = (String(code).trim() + '_' + String(name).trim()).toLowerCase();
        if (!seenProgKeys.has(key)) {
          seenProgKeys.add(key);
          candidatePrograms.push({ name, code, venue, dateTime, topic });
        }
      }
    });
  }

  // C. Match from allPrograms winners or candidates array
  allPrograms.forEach((prog) => {
    const isWinner = Array.isArray(prog.winners) && prog.winners.some(w =>
      (candIdStr && w.candidateId === candIdStr) ||
      (cleanChestNum !== '' && String(w.chestNo || w.chest || '').replace(/\D/g, '') === cleanChestNum) ||
      (candNameLower !== '' && (w.candidateName || '').toLowerCase().trim() === candNameLower)
    );
    const isCandidate = Array.isArray(prog.candidates) && prog.candidates.some(c => {
      if (typeof c === 'object' && c !== null) {
        const cId = String(c.id || c.candidateId || '').trim();
        const cChest = String(c.chestNo || c.chest || '').replace(/\D/g, '');
        const cName = (c.name || c.candidateName || '').toLowerCase().trim();
        return (candIdStr && cId === candIdStr) || (cleanChestNum !== '' && cChest === cleanChestNum) || (candNameLower !== '' && cName === candNameLower);
      }
      const cStr = String(c).trim();
      return (candIdStr && cStr === candIdStr) || (cleanChestNum !== '' && cStr.replace(/\D/g, '') === cleanChestNum);
    });

    if (isWinner || isCandidate) {
      const code = prog.code || prog.id || '';
      const name = prog.name || 'Program';
      const key = (String(code).trim() + '_' + String(name).trim()).toLowerCase();
      if (!seenProgKeys.has(key)) {
        seenProgKeys.add(key);
        candidatePrograms.push({
          name: prog.name,
          code: prog.code || prog.id,
          venue: resolveProgVenue(prog, null),
          dateTime: getFormattedDateTime(prog),
          topic: prog.conceptNote || prog.topic || prog.description || prog.rules || ''
        });
      }
    }
  });

  // Sort candidate programs by program code
  candidatePrograms.sort((a, b) => compareProgramCodes(a.code, b.code));

  // Render ONLY programs assigned directly in Firebase for candidate
  const listContainer = document.getElementById('student-results-list');
  if (listContainer) {
    if (candidatePrograms.length === 0) {
      listContainer.innerHTML = `
        <div class="p-5 text-center bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-400 font-medium text-xs">
          No registered programs found for chest #${chestNo}.
        </div>
      `;
    } else {
      listContainer.innerHTML = candidatePrograms.map(p => `
        <div class="p-4 bg-white border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-all">
          
          <!-- Program Details: Icon, Real Name (normal font), Real Code, Real Date & Time -->
          <div class="flex items-start sm:items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#F9ECF2] border border-[#92205D]/20 text-[#92205D] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <span class="iconify text-lg" data-icon="solar:notebook-bold"></span>
            </div>
            <div>
              <h5 class="font-normal text-slate-900 text-sm sm:text-base leading-snug">${p.name}</h5>
              <div class="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500 font-normal">
                <span class="font-mono text-slate-400">Code: #${p.code}</span>
                <span class="text-slate-300">&bull;</span>
                <span class="inline-flex items-center gap-1 text-slate-600 font-normal">
                  <span class="iconify text-xs text-emerald-600" data-icon="solar:clock-circle-bold"></span>
                  <span>${p.dateTime}</span>
                </span>
              </div>
            </div>
          </div>

        </div>
      `).join('');
    }
  }
}

window.resetStudentSearch = function() {
  window.currentViewCandidate = null;
  const loginCard = document.getElementById('student-login-card');
  const profileCard = document.getElementById('student-profile-card');
  const inputEl = document.getElementById('student-chest-input');
  const errorEl = document.getElementById('student-search-error');

  if (profileCard) {
    profileCard.classList.add('hidden');
    profileCard.classList.remove('flex');
  }
  if (loginCard) loginCard.classList.remove('hidden');
  if (inputEl) inputEl.value = '';
  if (errorEl) errorEl.classList.add('hidden');
};

let qrStream = null;

window.startQRScanner = function() {
  const video = document.getElementById('qr-video-stream');
  const placeholder = document.getElementById('qr-scan-placeholder');
  
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then(stream => {
        qrStream = stream;
        if (video) {
          video.srcObject = stream;
          video.play();
          video.classList.remove('hidden');
        }
        if (placeholder) placeholder.classList.add('hidden');
      })
      .catch(err => {
        alert("Camera access unavailable or denied. Please enter chest number manually or upload QR image.");
      });
  } else {
    alert("Camera not supported on this browser context.");
  }
};

function stopQRScanner() {
  if (qrStream) {
    qrStream.getTracks().forEach(track => track.stop());
    qrStream = null;
  }
  const video = document.getElementById('qr-video-stream');
  const placeholder = document.getElementById('qr-scan-placeholder');
  if (video) video.classList.add('hidden');
  if (placeholder) placeholder.classList.remove('hidden');
}

window.handleQRFileUpload = function(event) {
  const file = event.target.files[0];
  if (file) {
    // Extract numbers from filename or mock scan
    const nameMatch = file.name.match(/\d+/);
    if (nameMatch) {
      executeStudentSearch(nameMatch[0]);
    } else {
      executeStudentSearch('102'); // demo fallback scan
    }
  }
};

/* Concept Note Modal Functions */
window.openConceptNoteModal = function(title, code, topic) {
  const modal = document.getElementById('concept-note-modal');
  const titleEl = document.getElementById('cn-modal-title');
  const codeEl = document.getElementById('cn-modal-code');
  const topicEl = document.getElementById('cn-modal-topic');

  if (titleEl) titleEl.textContent = title;
  if (codeEl) codeEl.textContent = `Code: #${code}`;
  if (topicEl) topicEl.textContent = topic || `Official concept note guidelines, topic specifications, and rules for ${title}.`;

  if (modal) {
    modal.classList.remove('opacity-0', 'pointer-events-none');
    const dialog = modal.querySelector('> div');
    if (dialog) {
      dialog.classList.remove('scale-95');
      dialog.classList.add('scale-100');
    }
  }
};

window.closeConceptNoteModal = function() {
  const modal = document.getElementById('concept-note-modal');
  if (modal) {
    modal.classList.add('opacity-0', 'pointer-events-none');
    const dialog = modal.querySelector('> div');
    if (dialog) {
      dialog.classList.remove('scale-100');
      dialog.classList.add('scale-95');
    }
  }
};

