/**************************************************
 * FiqhAI — Client-Side Islamic Rulings Assistant
 * Works with local JSON (GitHub Pages compatible)
 **************************************************/

let FIQH_DATA = [];
let DATA_READY = false;

/* ===============================================
   1️⃣ LOAD FIQH DATA
   =============================================== */

fetch('./data/fiqh_master.json')
  .then(response => {
    if (!response.ok) {
      throw new Error("Failed to load fiqh data");
    }
    return response.json();
  })
  .then(data => {
    FIQH_DATA = data;
    DATA_READY = true;
    console.log(`FiqhAI loaded ${FIQH_DATA.length} rulings`);
  })
  .catch(err => {
    console.error("FiqhAI error:", err);
  });

/* ===============================================
   2️⃣ TEXT NORMALIZATION
   =============================================== */

function normalizeText(text) {
  return text
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

  const topic = normalizeText(entry.topic || '');
  const question = normalizeText(entry.question || '');
  const answer = normalizeText(entry.answer || '');
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
  if (!DATA_READY) return [];

  const normalizedQuery = normalizeText(query);
  const queryWords = normalizedQuery.split(' ').filter(w => w.length > 2);

  if (!queryWords.length) return [];

  const scoredResults = FIQH_DATA.map(entry => ({
    entry,
    score: scoreEntry(entry, queryWords)
  }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);

  return scoredResults.slice(0, 7).map(r => r.entry);
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
        <p>Please rephrase or try a related term.</p>
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

      <p class="fiqh-response">
        ${r.answer}
      </p>

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
   6️⃣ FORM HANDLER
   =============================================== */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('fiqh-form');
  const input = document.getElementById('fiqh-input');

  if (!form || !input) {
    console.warn("FiqhAI: Missing form or input element");
    return;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();

    const query = input.value.trim();
    if (!query) return;

    const results = searchFiqh(query);
    renderResults(results, query);
  });
});
