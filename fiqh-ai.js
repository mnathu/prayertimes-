/**************************************************
 * FiqhAI — Enhanced NLP Search Engine
 * Compatible with GitHub Pages + local JSON
 * Uses precomputed search blob for fast querying
 *
 * Requires:
 *   ./data/fiqh_master.json
 *
 * Exposes:
 *   window.searchFiqhEnhanced(query)
 *   window.FIQH_DATA
 *   window.DATA_READY
 **************************************************/

let FIQH_DATA = [];
let DATA_READY = false;

/* ===============================================
   1️⃣ STOPWORDS (Basic NLP Level 1)
   =============================================== */
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "then", "else",
  "is", "are", "was", "were", "be", "been", "being",
  "i", "you", "he", "she", "we", "they", "me", "my", "your", "our",
  "it", "this", "that", "these", "those",
  "to", "from", "of", "in", "on", "at", "for", "with", "without",
  "as", "by", "about", "into", "over", "under",
  "do", "does", "did", "doing",
  "can", "could", "should", "would", "may", "might", "must",
  "what", "when", "where", "why", "how", "which", "who", "whom",
  "will", "shall",
  "not", "no", "yes",
  "ruling", "rule", "fiqh", "sistani"
]);

/* ===============================================
   2️⃣ SYNONYMS (NLP Level 3)
   Expand common Islamic terms into variants
   =============================================== */
const SYNONYMS = {
  wudhu: ["wudu", "wudhu", "ablution", "wash", "washing"],
  ghusl: ["ghusl", "bath", "janabah", "ritual bath"],
  salah: ["salah", "salat", "prayer", "namaz"],
  fasting: ["fast", "fasting", "sawm", "ramadan"],
  zakat: ["zakat", "zakaat", "charity", "alms"],
  khums: ["khums", "one fifth", "20 percent"],
  hajj: ["hajj", "pilgrimage"],
  umrah: ["umrah", "umra", "minor pilgrimage"],
  haram: ["haram", "forbidden", "prohibited"],
  halal: ["halal", "permissible", "allowed"],
  interest: ["interest", "riba", "usury"],
  divorce: ["divorce", "talaq", "talaaq"],
  marriage: ["marriage", "nikah", "nikaah", "mutah", "temporary marriage"],
  hijab: ["hijab", "modesty", "veil", "headscarf"],
  inheritance: ["inheritance", "mirath", "estate", "heir"],
  tayammum: ["tayammum", "dry ablution", "dust purification"]
};

/* ===============================================
   3️⃣ TEXT NORMALIZATION
   =============================================== */
function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ===============================================
   4️⃣ STEMMING-LITE (NLP Level 2)
   Very simple stemmer for English-like endings
   =============================================== */
function stemWord(word) {
  if (word.length <= 3) return word;

  return word
    .replace(/(ing|edly|edly|ed|ly|es|s)$/g, "")
    .trim();
}

/* ===============================================
   5️⃣ TOKENIZER
   Removes stopwords + stems tokens
   =============================================== */
function tokenize(text) {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  return normalized
    .split(" ")
    .map(w => w.trim())
    .filter(w => w.length > 1)
    .map(stemWord)
    .filter(w => w.length > 1 && !STOPWORDS.has(w));
}

/* ===============================================
   6️⃣ EXPAND QUERY WITH SYNONYMS (NLP Level 3)
   =============================================== */
function expandWithSynonyms(tokens) {
  let expanded = new Set(tokens);

  tokens.forEach(t => {
    Object.keys(SYNONYMS).forEach(key => {
      const keyStem = stemWord(normalizeText(key));
      const synonyms = SYNONYMS[key].map(s => stemWord(normalizeText(s)));

      if (t === keyStem || synonyms.includes(t)) {
        expanded.add(keyStem);
        synonyms.forEach(s => expanded.add(s));
      }
    });
  });

  return Array.from(expanded);
}

/* ===============================================
   7️⃣ PRECOMPUTE SEARCH BLOB
   Creates a single searchable field for speed
   =============================================== */
function buildSearchBlob(entry) {
  const topic = normalizeText(entry.topic || "");
  const question = normalizeText(entry.question || "");
  const answer = normalizeText(entry.answer || "");
  const tags = Array.isArray(entry.tags) ? entry.tags.join(" ") : "";

  return normalizeText(`
    ${topic}
    ${question}
    ${tags}
    ${answer}
  `);
}

/* ===============================================
   8️⃣ SCORE ENTRY (Weighted Relevance)
   =============================================== */
function scoreEntry(entry, queryTokens, rawQuery) {
  if (!entry._search_blob) return 0;

  let score = 0;
  const blob = entry._search_blob;

  const topic = normalizeText(entry.topic || "");
  const question = normalizeText(entry.question || "");
  const answer = normalizeText(entry.answer || "");
  const tags = Array.isArray(entry.tags)
    ? entry.tags.map(t => normalizeText(t)).join(" ")
    : "";

  // Phrase bonus (exact raw query presence)
  const normalizedRaw = normalizeText(rawQuery);
  if (normalizedRaw.length > 4) {
    if (blob.includes(normalizedRaw)) score += 20;
    if (topic.includes(normalizedRaw)) score += 30;
    if (question.includes(normalizedRaw)) score += 25;
  }

  queryTokens.forEach(token => {
    // Strongest signals
    if (topic.includes(token)) score += 12;
    if (question.includes(token)) score += 10;

    // Medium signals
    if (tags.includes(token)) score += 8;

    // Weak signal
    if (answer.includes(token)) score += 3;

    // Small overall blob match
    if (blob.includes(token)) score += 2;
  });

  // Bonus for multiple token matches
  let tokenMatches = 0;
  queryTokens.forEach(token => {
    if (blob.includes(token)) tokenMatches++;
  });

  if (tokenMatches >= 5) score += 10;
  if (tokenMatches >= 8) score += 15;

  return score;
}

/* ===============================================
   9️⃣ MAIN SEARCH FUNCTION
   Returns array of entries with _score
   =============================================== */
function searchFiqhEnhanced(query) {
  if (!DATA_READY || !FIQH_DATA.length) return [];

  const tokens = tokenize(query);
  if (!tokens.length) return [];

  const expandedTokens = expandWithSynonyms(tokens);

  const scored = FIQH_DATA.map(entry => {
    const s = scoreEntry(entry, expandedTokens, query);
    return {
      ...entry,
      _score: s
    };
  })
    .filter(r => r._score > 0)
    .sort((a, b) => b._score - a._score);

  return scored.slice(0, 7);
}

/* ===============================================
   🔟 LOAD DATA (Only loads once)
   =============================================== */
fetch("./data/fiqh_master.json")
  .then(response => {
    if (!response.ok) {
      throw new Error("Failed to load fiqh_master.json");
    }
    return response.json();
  })
  .then(data => {
    if (!Array.isArray(data)) {
      throw new Error("fiqh_master.json must be an array of objects");
    }

    // Precompute blob once
    data.forEach(entry => {
      entry._search_blob = buildSearchBlob(entry);
    });

    FIQH_DATA = data;
    DATA_READY = true;

    console.log(`✅ FiqhAI loaded ${FIQH_DATA.length} rulings`);
  })
  .catch(err => {
    console.error("❌ FiqhAI load error:", err);
  });

/* ===============================================
   1️⃣1️⃣ EXPOSE GLOBALS FOR UI
   =============================================== */
window.searchFiqhEnhanced = searchFiqhEnhanced;
window.FIQH_DATA = FIQH_DATA;
window.DATA_READY = DATA_READY;
