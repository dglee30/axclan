const API_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtcGxvdWV1bXprcmR2YXBieWZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzI4ODY5MTQsImV4cCI6MTk4ODQ2MjkxNH0.p8Jkm2fnFzzy7YYdCs0NVjBdqLmUzvBFJjdf3V0bHuo';

const BASE =
  'https://xmploueumzkrdvapbyfs.supabase.co/rest/v1/player_profile_view';

let clanData = [];
let jsonData = [];
let currentFilter = 'ALL';

load();

async function load() {
  // ---------------------------
  // 1. 클랜 전체 명단 (기준)
  // ---------------------------
  const res1 = await fetch('asset/json/clan-members.json');
  jsonData = await res1.json();

  // alias OR 조건 생성
  const aliases = jsonData
    .map((v) => `alias.ilike.${encodeURIComponent(v.alias)}`)
    .join(',');

  // 2. Supabase는 그냥 전체 가져오기 (중요)
  const url = `${BASE}?select=*&or=(${aliases})`;

  const res2 = await fetch(url, {
    headers: { apikey: API_KEY },
  });

  const apiData = await res2.json();

  // ---------------------------
  // 2. MAP 생성 (소문자 기준)
  // ---------------------------
  const apiMap = new Map(apiData.map((p) => [p.alias?.toLowerCase(), p]));

  // ---------------------------
  // 3. JSON 기준으로 전체 생성
  // ---------------------------
  clanData = jsonData.map((info) => {
    const key = info.alias.toLowerCase();
    const player = apiMap.get(key);

    const hasData = !!player;

    const total = player ? (player.wins || 0) + (player.losses || 0) : 0;
    const winrate = total ? ((player.wins / total) * 100).toFixed(1) : 0;

    return {
      alias: info.alias,

      // 전적 없으면 '-' 처리
      rating: hasData ? (player.rating ?? '-') : '-',
      rank: hasData ? (player.rank ?? '-') : '-',

      race:
        hasData && player.race
          ? player.race.charAt(0).toUpperCase() +
            player.race.slice(1).toLowerCase()
          : '-',

      grade: info.grade || '-',

      wins: player?.wins ?? 0,
      losses: player?.losses ?? 0,

      hasData,
      battlenetaccount: player?.battlenet_account ?? null
    };
  });

  render();
}

// ----------------------
// 필터
// ----------------------
function setFilter(type) {
  currentFilter = type;

  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.classList.remove('active');
  });

  event.target.classList.add('active');

  render();
}

// ----------------------
// 렌더링
// ----------------------
function render() {
  const body = document.getElementById('body');

  let filtered = clanData;

  if (currentFilter === 'Zerg') {
    filtered = clanData.filter((p) => p.race === 'Zerg');
  }

  if (currentFilter === 'Terran') {
    filtered = clanData.filter((p) => p.race === 'Terran');
  }

  if (currentFilter === 'Protoss') {
    filtered = clanData.filter((p) => p.race === 'Protoss');
  }

  // ---------------------------
  // 정렬 (전적 없는 유저는 맨 아래)
  // ---------------------------
  filtered.sort((a, b) => {
    const ra = a.rating === '-' ? -1 : a.rating || 0;
    const rb = b.rating === '-' ? -1 : b.rating || 0;

    return rb - ra;
  });

  let rankCounter = 1;

  let html = '';

  function getTierClass(rank) {
    if (rank === 'S') return 'tier-s';
    if (rank === 'A') return 'tier-a';
    if (rank === 'B') return 'tier-b';
    if (rank === 'C') return 'tier-c';
    if (rank === 'D') return 'tier-d';
    if (rank === 'E') return 'tier-e';
    if (rank === 'F') return 'tier-f';

    return 'tier-default';
  }

  function getRaceImage(race) {
    race = race?.toLowerCase();

    if (race === 'terran') return 'images/Terran.jpg';
    if (race === 'zerg') return 'images/Zerg.jpg';
    if (race === 'protoss') return 'images/Protoss.jpg';
    return '';
  }

  filtered.forEach((p) => {
    // ---------------------------
    // 전적 없는 유저는 rank '-'
    // ---------------------------
    const rank = p.rating === '-' ? '-' : rankCounter++;

    let badge = rank;

    if (rank === 1) badge = '🥇1';
    else if (rank === 2) badge = '🥈 2';
    else if (rank === 3) badge = '🥉 3';

    html += `
      <tr>
        <td>${badge}</td>

        <td>
          <a href="profile.html?alias=${encodeURIComponent(p.alias)}&battlenet_account=${encodeURIComponent(p.battlenetaccount)}">
            ${p.alias}
          </a>
        </td>

        <td>${p.rating}</td>
        <td class="tier ${getTierClass(p.rank)}">${p.rank}</td>
        <td>${p.grade}</td>
        <td> ${
          p.race === '-'
            ? '-'
            : `<img src="${getRaceImage(p.race)}" class="raceIconLarge">`
        }</td>
      </tr>
    `;
  });

  body.innerHTML = html;
}
