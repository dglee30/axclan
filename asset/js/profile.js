const API = 'https://xmploueumzkrdvapbyfs.supabase.co/rest/v1';
const KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtcGxvdWV1bXprcmR2YXBieWZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzI4ODY5MTQsImV4cCI6MTk4ODQ2MjkxNH0.p8Jkm2fnFzzy7YYdCs0NVjBdqLmUzvBFJjdf3V0bHuo';

const params = new URLSearchParams(location.search);

const alias = params.get('alias');
const accountId = params.get('account_id');
// ✅ 전역 저장
let currentMatches = [];
let gateway = null;

async function load() {
  const id_url = `${API}/player_profile_view?select=*&alias=ilike.${encodeURIComponent(alias)}&account_id=eq.${encodeURIComponent(accountId)}`;

  const profile = await fetch(id_url, {
    headers: { apikey: KEY },
  }).then((r) => r.json());

  // -----------------------------
  // 🚨 유저 데이터 없을 때 UI
  // -----------------------------
  if (!profile || profile.length === 0) {
    renderEmptyState(alias);
    return;
  }

  const p = profile[0];

  const account = p.battlenet_account;
  gateway = p.gateway;

  const account_url = `${API}/player_other_handles_view?select=*&battlenet_account=eq.${account}`;

  const handles = await fetch(account_url, {
    headers: { apikey: KEY },
  }).then((r) => r.json());

  const update_url = `${API}/player_updates?select=*&alias=ilike.${alias}&gateway=eq.${gateway}`;

  const updates = await fetch(update_url, {
    headers: { apikey: KEY },
  }).then((r) => r.json());

  const match_list_url = `${API}/player_matches?select=*&order=timestamp.desc&offset=0&limit=20&aurora_id=eq.${account}&gateway=eq.${gateway}&alias=ilike.${alias}`;

  const matches = await fetch(match_list_url, {
    headers: { apikey: KEY },
  }).then((r) => r.json());

  currentMatches = matches;

  render(p, handles, updates, matches);
}

//---------------------------
// MATCHES DODGE
//----------------------------
function isDodge(match) {
  return match.duration < 120;
}

// -----------------------------
// RANK CLASS
// -----------------------------
function getRankClass(rank) {
  switch (rank) {
    case 'S':
      return 'rank-s';
    case 'A':
      return 'rank-a';
    case 'B':
      return 'rank-b';
    case 'C':
      return 'rank-c';
    case 'D':
      return 'rank-d';
    case 'E':
      return 'rank-e';
    default:
      return 'rank-f';
  }
}

// -----------------------------
// WINRATE
// -----------------------------
function calcWR(p) {
  const t = (p.wins || 0) + (p.losses || 0);
  return t ? ((p.wins / t) * 100).toFixed(1) : 0;
}

// -----------------------------
// RENDER
// -----------------------------
function render(p, handles, updates, matches) {
  function getRaceImage(race) {
    race = race?.toLowerCase();

    if (race === 'terran') return 'images/Terran.jpg';
    if (race === 'zerg') return 'images/Zerg.jpg';
    if (race === 'protoss') return 'images/Protoss.jpg';

    return '';
  }

  const otherHandles = handles.filter(
    (h) => h.alias.toLowerCase() !== alias.toLowerCase(),
  );

  document.getElementById('accountList').innerHTML = otherHandles.length
    ? otherHandles
        .map(
          (h) => `
          <div class="handleChip"
               onclick="location.href='profile.html?alias=${encodeURIComponent(h.alias)}'">

            <span class="tier ${getRankClass(h.rank)}">
              ${h.rank || '-'}
            </span>

            <span class="chipAlias">${h.alias}</span>
            <span class="chipMMR">${h.rating || 0}</span>

          </div>`,
        )
        .join('')
    : 'No other accounts';
  //rank-badge
  document.getElementById('title').innerHTML = `
    ${
      p.avatar
        ? `<img src="${p.avatar}" width="80">`
        : `<img src="https://cwal.gg/_app/immutable/assets/sc_logo-a27a5970.png" width="80">`
    }
    ${p.alias}
    <div class="battletag">(${p.battlenet_name})</div>
  `;

  document.getElementById('stats').innerHTML = `
    <div class="statCard">
      <div class="statLabel">RANK</div>
      <div class="statMain">
        <div class="tier ${getRankClass(p.rank)}">${p.rank}</div>
        <span class="mmr">${p.rating}</span>
      </div>
    </div>

    <div class="statCard">
      <div class="statLabel">STATS</div>
      <div class="statMain">
        ${p.wins}W&nbsp;&nbsp;${p.losses}L&nbsp;&nbsp;${calcWR(p)}%
      </div>
    </div>

    <div class="statCard">
      <div class="statLabel">RACE</div>
      <div class="statMain">
        <img src="${getRaceImage(p.race)}" class="raceIconLarge">
      </div>
    </div>
  `;

  document.getElementById('matches').innerHTML = matches
    .map(
      (m, index) => `
      <tr>
        <td class="${isDodge(m) ? 'dodge' : m.result === 'win' ? 'win' : 'lose'}">
        ${isDodge(m) ? '👻' : m.mmr_delta > 0 ? '+' + m.mmr_delta : m.mmr_delta}
        </td>

        <td>
          <a href="profile.html?alias=${encodeURIComponent(m.opponent_alias)}&account_id${encodeURIComponent(m.opponent_account_id)}"
             class="opponentLink">
            ${m.opponent_alias}
          </a>
        </td>

        <td>${m.map_file_name}</td>

        <td>${new Date(m.timestamp).toLocaleDateString()}</td>

        <td>
          ${
            m.replay_url
              ? `<a href="${m.replay_url}" target="_blank" class="replayBtn">📑</a>`
              : '-'
          }
        </td>

        <td>
          <button class="chatBtn" onclick="showChat(${index})">💬</button>
        </td>
      </tr>
    `,
    )
    .join('');
}

// -----------------------------
// CHAT POPUP
// -----------------------------
function showChat(index) {
  const match = currentMatches[index];
  const chats = match?.replay_data_v2?.chat || [];

  const body = document.getElementById('chatBody');

  body.innerHTML = chats
    .map((c) => {
      const isMe = c.sender.name === alias;

      return `
      <div class="chatMsg ${isMe ? 'me' : 'other'}">
        <div class="chatName">${c.sender.name}</div>
        <div>${c.message}</div>
      </div>
    `;
    })
    .join('');

  const modal = document.getElementById('chatModal');
  modal.classList.remove('hidden');

  setTimeout(() => {
    body.scrollTop = body.scrollHeight;
  }, 0);
}

function closeChat() {
  document.getElementById('chatModal').classList.add('hidden');
}

// -----------------------------
// 🚨 EMPTY STATE UI
// -----------------------------
function renderEmptyState(alias) {
  document.body.innerHTML = `
    <div class="empty-container">

      <div class="empty-card">
        <div class="empty-icon">⚠️</div>

        <h1>Player Not Found</h1>

        <p>
          "${alias}" 유저 데이터를 찾을 수 없습니다
        </p>

        <button class="empty-btn" onclick="location.href='search.html'">🔍️Search</button>


      </div>

    </div>
  `;
}
//----------------------------
// UPDATE
//-----------------------------
async function getUpdateStatus() {
  const url = `${API}/player_updates?select=*&alias=eq.${alias}&gateway=eq.${gateway}`;

  return fetch(url, {
    headers: { apikey: KEY },
  }).then((r) => r.json());
}

async function waitForUpdate() {
  while (true) {
    const updates = await getUpdateStatus();

    if (updates.length > 0) {
      const update = updates[0];

      // 업데이트 중이 아니면 끝
      if (update.in_progress === false) {
        break;
      }
    }

    // 2초 기다림
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // 최신 데이터 다시 불러오기
  await load();
}

async function updatePlayer() {
  const btn = document.getElementById('updateBtn');

  btn.disabled = true;
  btn.textContent = 'Updating...';

  try {
    const res = await fetch('https://v2.api.cwal.gg/player-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        alias: alias,
        gateway: gateway,
      }),
    });

    const result = await res.json();

    await waitForUpdate();

    btn.textContent = '✔ Updated';
  } catch (err) {
    console.error(err);
    alert('업데이트 실패');
  }

  btn.disabled = false;
  btn.textContent = '🔄 Update';
}

load();
