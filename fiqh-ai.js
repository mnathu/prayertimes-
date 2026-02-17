/**************************************************
 * FiqhAI — Client-Side Islamic Rulings Assistant
 * NLP Enhanced Search (GitHub Pages Compatible)
 *
 * Level 1: Synonym Expansion
 * Level 2: Intent Detection + Scoring Boost
 * Level 3: Taxonomy Boosting (domain/category/subcategory)
 * Performance Upgrade: Precomputed Search Blob per entry
 **************************************************/

let FIQH_DATA = [];
let DATA_READY = false;

/* ===============================================
   1️⃣ TEXT NORMALIZATION
   =============================================== */

function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ===============================================
   2️⃣ NLP SYNONYM ENGINE (LEVEL 1)
   =============================================== */

const NLP_SYNONYMS = {
  salah: ["pray", "prayer", "salat", "namaz", "salaah"],
  wudhu: ["wudu", "ablution", "wash", "washing"],
  ghusl: ["bath", "ritualbath", "janabah"],
  tayammum: ["dryablution", "dust", "sand"],
  fasting: ["sawm", "fast", "ramadan", "roza"],
  zakat: ["charity", "almsgiving"],
  khums: ["onefifth", "fifth"],
  hajj: ["pilgrimage"],
  umrah: ["minorhajj"],
  halal: ["permissible", "allowed"],
  haram: ["forbidden", "impermissible"],
  riba: ["interest", "usury", "loaninterest"],
  najasah: ["najis", "impurity", "unclean"],
  taharah: ["purity", "cleanliness"],
  qibla: ["kaaba", "direction"],
  travel: ["traveler", "journey", "driving", "flying", "trip", "distance"],
  qasr: ["shorten", "shortened", "shortprayer"],
  jamaah: ["congregation", "groupprayer"],
  divorce: ["talaq", "separation"],
  marriage: ["nikah", "wedding"],
  inheritance: ["mirath", "estate", "heirs"],
  will: ["wasiyyah", "testament"],
  burial: ["funeral", "grave", "janazah"],
  ghaybah: ["backbiting", "gossip"],
  music: ["songs", "singing"],
  hijab: ["modesty", "covering"],
  trading: ["stocks", "crypto", "investing", "investment"],
  business: ["transaction", "buying", "selling", "contracts"]
};

function expandQueryWords(words) {
  const expanded = new Set(words);

  words.forEach(word => {
    Object.entries(NLP_SYNONYMS).forEach(([key, synonyms]) => {
      if (key === word || synonyms.includes(word)) {
        expanded.add(key);
        synonyms.forEach(s => expanded.add(s));
      }
    });
  });

  return [...expanded];
}

/* ===============================================
   3️⃣ INTENT DETECTION (LEVEL 2)
   =============================================== */

const INTENTS = {
  permissibility: [
    "can i",
    "is it allowed",
    "is it halal",
    "permissible",
    "allowed",
    "haram",
    "halal"
  ],
  obligation: [
    "must i",
    "is it wajib",
    "obligatory",
    "required",
    "fard",
    "wajib"
  ],
  invalidation: [
    "invalid",
    "invalidate",
    "breaks",
    "does it break",
    "void",
    "batil"
  ],
  recommendation: [
    "recommended",
    "mustahab",
    "better",
    "should i"
  ],
  prohibition: [
    "haram",
    "forbidden",
    "impermissible",
    "not allowed"
  ],
  exemption: [
    "if sick",
    "if traveling",
    "travel",
    "unable",
    "hardship",
    "excuse",
    "necessity"
  ]
};

function detectIntent(query) {
  const q = query.toLowerCase();

  for (const [intent, phrases] of Object.entries(INTENTS)) {
    if (phrases.some(p => q.includes(p))) {
      return intent;
    }
  }

  return "general";
}

/* ===============================================
   4️⃣ TAXONOMY HELPERS (LEVEL 3)
   =============================================== */

function getTaxonomyText(entry) {
  if (!entry.taxonomy) return "";

  const domain = normalizeText(entry.taxonomy.domain || "");
  const category = normalizeText(entry.taxonomy.category || "");
  const subcategory = normalizeText(entry.taxonomy.subcategory || "");

  return `${domain} ${category} ${subcategory}`.trim();
}

/* ===============================================
   5️⃣ PRECOMPUTE SEARCH BLOB (PERFORMANCE BOOST)
   =============================================== */

function buildSearchBlob(entry) {
  const topic = normalizeText(entry.topic || "");
  const question = normalizeText(entry.question || "");
  const answer = normalizeText(entry.answer || "");

  const tags = Array.isArray(entry.tags)
    ? entry.tags.map(t => normalizeText(t)).join(" ")
    : "";

  const taxonomyText = getTaxonomyText(entry);

  // This is the precomputed searchable content
  return normalizeText(`${topic} ${taxonomyText} ${tags} ${question} ${answer}`);
}

function preprocessData(data) {
  return data.map(entry => {
    entry.__search_blob = buildSearchBlob(entry);
    return entry;
  });
}

/* ===============================================
   6️⃣ LOAD FIQH DATA (Runs only on fiqh-ai.html)
   =============================================== */

fetch("./data/fiqh_master.json")
  .then(response => {
    if (!response.ok) {
      throw new Error("Failed to load fiqh data");
    }
    return response.json();
  })
  .then(data => {
    FIQH_DATA = preprocessData(data);
    DATA_READY = true;

    console.log(`✅ FiqhAI loaded ${FIQH_DATA.length} rulings`);
    console.log("⚡ Precomputed search blobs added to each entry");
  })
  .catch(err => {
    console.error("❌ FiqhAI data load error:", err);
  });

/* ===============================================
   7️⃣ SCORING ENGINE (Uses Precomputed Blob)
   =============================================== */

function scoreEntry(entry, queryWords, intent) {
  let score = 0;

  const topic = normalizeText(entry.topic || "");
  const question = normalizeText(entry.question || "");
  const tags = Array.isArray(entry.tags)
    ? entry.tags.map(t => normalizeText(t))
    : [];

  const taxonomyText = getTaxonomyText(entry);

  // If blob is missing for any reason, rebuild quickly
  const blob = entry.__search_blob || buildSearchBlob(entry);

  // Intent tag match boost
  if (tags.includes(intent)) {
    score += 15;
  }

  queryWords.forEach(word => {
    if (!word || word.length < 2) return;

    // Highest priority matches
    if (topic.includes(word)) score += 10;
    if (taxonomyText.includes(word)) score += 9;
    if (question.includes(word)) score += 6;

    // Tag boost
    if (tags.some(tag => tag.includes(word))) score += 5;

    // Blob match (fast full search)
    if (blob.includes(word)) score += 2;

    // Fuzzy partial match
    if (word.length > 4) {
      const partial = word.slice(0, 4);
      if (blob.includes(partial)) score += 1;
    }
  });

  return score;
}

/* ===============================================
   8️⃣ SEARCH ENGINE (FAST)
   =============================================== */

function searchFiqh(query) {
  if (!DATA_READY) return [];

  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  // Detect intent first
  const intent = detectIntent(query);

  // Extract query words
  let queryWords = normalizedQuery.split(" ").filter(w => w.length > 2);

  // Expand synonyms
  queryWords = expandQueryWords(queryWords);

  // Remove duplicates
  queryWords = [...new Set(queryWords)];

  if (!queryWords.length) return [];

  const scoredResults = FIQH_DATA.map(entry => ({
    entry,
    score: scoreEntry(entry, queryWords, intent)
  }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);

  console.log("🔍 Query:", query);
  console.log("🧠 Intent:", intent);
  console.log("🧩 Expanded Keywords:", queryWords);
  console.log("📌 Top Match Scores:", scoredResults.slice(0, 5));

  return scoredResults.slice(0, 7).map(r => r.entry);
}

/* ===============================================
   9️⃣ RENDER RESULTS
   =============================================== */

function renderResults(results, query) {
  const container = document.getElementById("fiqh-results");
  container.innerHTML = "";

  if (!results.length) {
    container.innerHTML = `
      <div class="fiqh-empty">
        <p><strong>No direct ruling found for:</strong></p>
        <p style="font-size:18px;">"${query}"</p>
        <p>Try searching using words like:</p>
        <ul>
          <li>Salah, Wudhu, Ghusl</li>
          <li>Halal, Haram, Interest (Riba)</li>
          <li>Marriage, Divorce, Inheritance</li>
          <li>Travel prayer, fasting, zakat</li>
        </ul>
      </div>
    `;
    return;
  }

  results.forEach(r => {
    const div = document.createElement("div");
    div.className = "fiqh-answer";

    let taxonomyHTML = "";
    if (r.taxonomy) {
      taxonomyHTML = `
        <p class="fiqh-taxonomy">
          <small>
            <strong>Category:</strong>
            ${r.taxonomy.domain || ""} → ${r.taxonomy.category || ""} → ${r.taxonomy.subcategory || ""}
          </small>
        </p>
      `;
    }

    div.innerHTML = `
      <h3>${r.topic || "Fiqh Ruling"}</h3>

      ${taxonomyHTML}

      <p class="fiqh-question">
        <strong>Q:</strong> ${r.question || ""}
      </p>

      <div class="fiqh-response">
        ${r.answer ? r.answer.replace(/\n/g, "<br>") : ""}
      </div>

      ${r.source_url ? `
        <p class="fiqh-source">
          <a href="${r.source_url}" target="_blank" rel="noopener">
            View source on Sistani.org
          </a>
        </p>
      ` : ""}
    `;

    container.appendChild(div);
  });
}

/* ===============================================
   🔟 FORM HANDLER
   =============================================== */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("fiqh-form");
  const input = document.getElementById("fiqh-input");

  if (!form || !input) {
    console.warn("⚠️ FiqhAI: Missing form or input element");
    return;
  }

  form.addEventListener("submit", e => {
    e.preventDefault();

    const query = input.value.trim();
    if (!query) return;

    const results = searchFiqh(query);
    renderResults(results, query);
  });

  console.log("✅ FiqhAI NLP Engine Ready (Precomputed Search Enabled)");
});
