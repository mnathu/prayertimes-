let rulings = [];

async function loadRulings() {
  try {
    const res = await fetch('./data/fiqh_master.json');
    rulings = await res.json();
    console.log("FiqhAI loaded rulings:", rulings.length);
  } catch (e) {
    console.error("Error loading JSON:", e);
  }
}

loadRulings();

const messagesDiv = document.getElementById("messages");
const input = document.getElementById("userInput");

function addMessage(text, className, sourceUrl = null) {
  const message = document.createElement("div");
  message.className = "message " + className;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerText = text;

  message.appendChild(bubble);

  if (sourceUrl) {
    const link = document.createElement("a");
    link.href = sourceUrl;
    link.target = "_blank";
    link.className = "source-link";
    link.innerText = "View Source ↗";
    message.appendChild(link);
  }

  messagesDiv.appendChild(message);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  setTimeout(() => {
    const result = searchRulings(text);
    addMessage(result.answer, "bot", result.source_url);
  }, 400);
}

input.addEventListener("keypress", function (e) {
  if (e.key === "Enter") sendMessage();
});

function searchRulings(query) {
  if (!rulings.length) {
    return {
      answer: "Rulings database is still loading. Please try again.",
      source_url: null
    };
  }

  const keywords = query.toLowerCase().split(" ");

  let bestScore = 0;
  let bestMatch = null;

  rulings.forEach((r) => {
    let score = 0;

    const textBlock = (
      r.topic + " " +
      r.question + " " +
      r.answer + " " +
      (r.tags || []).join(" ")
    ).toLowerCase();

    keywords.forEach(word => {
      if (textBlock.includes(word)) score += 2;
      if (r.question.toLowerCase().includes(word)) score += 3;
      if (r.topic.toLowerCase().includes(word)) score += 4;
    });

    if (score > bestScore) {
      bestScore = score;
      bestMatch = r;
    }
  });

  if (!bestMatch || bestScore === 0) {
    return {
      answer: "I could not find a clear ruling for that. Try rephrasing your question.",
      source_url: null
    };
  }

  return bestMatch;
}
