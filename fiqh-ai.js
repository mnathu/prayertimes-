/**************************************************
 * FiqhAI — Client-Side Islamic Rulings Assistant
 * Lazy-loads local JSON (GitHub Pages compatible)
 **************************************************/

let FIQH_DATA = null;
let DATA_LOADING = false;

/* ===============================================
   1️⃣ LAZY LOAD FIQH DATA (ONLY WHEN NEEDED)
   =============================================== */

async function loadFiqhData() {
  if (FIQH_DATA) return FIQH_DATA;
  if (DATA_LOADING) return null;

  DATA_LOADING = true;

  try {
    const response = await fetch('./data/fiqh_master.json');
    if (!response.ok) {
      throw new Error('Failed to load fiqh data');
    }

    FIQH_DATA = await response.json();
    console.log(`FiqhAI loaded ${FIQH_DATA.length} rulings`);
    return FIQH_DATA;
  } catch (err) {
    console.error('FiqhAI error:', err);
    return null;
  } finally {
    DATA_LOADING = false;
  }
}

/* ===============================================
   2️⃣ TEXT NORMALIZATION
   =============================================== */

function normalizeText(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ===============================================
   3️⃣ RELEVANCE SCORING
   =============================================== */

function scoreEntry(entry, queryWords) {
  let score = 0;

  const topic = normalizeText(entry.topic);
  const question = normalizeText(entry.question);
  const answer = normalizeText(entry.answer);
  const tags = (entry.tags || []).map(t => normalizeText(t));

  queryWords.forEach(word => {
    if (topic.includes(word)) score += 5;
    if (question.includes(word)) score += 4;
    if (tags.some(tag => tag.includes(word))) score += 3;
    if (answer.includes(word)) score += 1;
  });

  return score;
}

/* ===============================================
   4️⃣ SEARCH ENGINE
   =============================================== */

function searchFiqh(query) {
  if (!FIQH_DATA) return [];

  const queryWords = normalizeText(query)
    .split(' ')
    .filter(w => w.length > 2);

  if (!queryWords.length) return [];

  return FIQH_DATA
    .map(entry => ({
      entry,
      score: scoreEntry(entry, queryWords)
    }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 7)
    .map(r => r.entry);
}

/* ===============================================
   5️⃣ RENDER RESULTS
   =============================================== */

function renderResults(results, query) {
  const container = document.getElementById('fiqh-results');
  container.innerHTML = '';

  if (!results.length) {
    container.innerHTML = `
      <div class="fiqh-empty">
        <p>No direct ruling found for:</p>
        <strong>${query}</strong>
        <p>Please try rephrasing or using a related term.</p>
      </div>
    `;
    return;
  }

  results.forEach(r => {
    const div = document.createElement('div');
    div.className = 'fiqh-answer';

    div.innerHTML = `
      <h3>${r.topic}</h3>

      <p class="fiqh-question">
        <strong>Q:</strong> ${r.question}
      </p>

      <div class="fiqh-response">
        ${r.answer}
      </div>

      ${r.source_url ? `
        <p class="fiqh-source">
          <a href="${r.source_url}" target="_blank" rel="noopener">
            View source on Sistani.org
          </a>
        </p>
      ` : ''}
    `;

    container.appendChild(div);
  });
}

/* ===============================================
   6️⃣ FORM HANDLER (LOAD DATA ON FIRST QUERY)
   =============================================== */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('fiqh-form');
  const input = document.getElementById('fiqh-input');
  const container = document.getElementById('fiqh-results');

  if (!form || !input || !container) {
    console.warn('FiqhAI: Missing required elements');
    return;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const query = input.value.trim();
    if (!query) return;

    container.innerHTML = `<p class="fiqh-loading">Searching rulings…</p>`;

    if (!FIQH_DATA) {
      await loadFiqhData();
    }

    const results = searchFiqh(query);
    renderResults(results, query);
  });
});
