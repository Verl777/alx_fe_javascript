// ================== Storage & Data Model ==================

// Quote shape:
// { id, text, category, updatedAt, source: "local"|"server", dirty: boolean }

const LS_QUOTES_KEY = "quotes";
const LS_SELECTED_CATEGORY = "selectedCategory";
const SS_LAST_QUOTE = "lastQuote";

let quotes = loadQuotes();

// Ensure legacy items have required fields
quotes = quotes.map(q => ({
  id: q.id || `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  text: q.text,
  category: q.category || "General",
  updatedAt: q.updatedAt || new Date().toISOString(),
  source: q.source || "local",
  dirty: !!q.dirty
}));
saveQuotes();

// ================== DOM Helpers ==================
const $ = (id) => document.getElementById(id);

function setStatus(msg) {
  const el = $("syncStatus");
  if (el) el.textContent = msg;
}

function renderQuoteToDOM(quote) {
  // uses innerHTML (explicitly requested in earlier tasks)
  $("quoteDisplay").innerHTML = `
    <blockquote style="margin:0;">“${quote.text}”</blockquote>
    <div style="opacity:.8;margin-top:.25rem;">[${quote.category}]</div>
  `;
  sessionStorage.setItem(SS_LAST_QUOTE, JSON.stringify(quote));
}

function renderNoQuoteMessage() {
  $("quoteDisplay").innerHTML = "No quotes found in this category.";
}

function showConflicts(conflicts) {
  const area = $("conflictArea");
  const list = $("conflictList");
  if (!area || !list) return;

  if (!conflicts.length) {
    area.style.display = "none";
    list.innerHTML = "";
    return;
  }
  list.innerHTML = "";
  conflicts.forEach(msg => {
    const li = document.createElement("li");
    li.textContent = msg;
    list.appendChild(li);
  });
  area.style.display = "block";
}

// ================== Local Persistence ==================
function loadQuotes() {
  try {
    return JSON.parse(localStorage.getItem(LS_QUOTES_KEY)) || [
      { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
      { text: "Don't let yesterday take up too much of today.", category: "Inspiration" },
      { text: "Failure is not the opposite of success; it's part of success.", category: "Wisdom" }
    ];
  } catch {
    return [];
  }
}

function saveQuotes() {
  localStorage.setItem(LS_QUOTES_KEY, JSON.stringify(quotes));
}

// ================== Category Filtering ==================
function uniqueCategories() {
  return [...new Set(quotes.map(q => q.category))].sort();
}

function populateCategories() {
  const select = $("categoryFilter");
  const stored = localStorage.getItem(LS_SELECTED_CATEGORY) || "all";
  if (!select) return;

  select.innerHTML = `<option value="all">All Categories</option>`;
  uniqueCategories().forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    if (cat === stored) opt.selected = true;
    select.appendChild(opt);
  });
}

function currentCategory() {
  return localStorage.getItem(LS_SELECTED_CATEGORY) || "all";
}

function filterQuotes() {
  const selected = $("categoryFilter").value;
  localStorage.setItem(LS_SELECTED_CATEGORY, selected);
  generateQuote();
}

// ================== Random Quote Display ==================
function generateQuote() {
  const selected = currentCategory();
  const pool = selected === "all"
    ? quotes
    : quotes.filter(q => q.category === selected);

  if (!pool.length) {
    renderNoQuoteMessage();
    return;
  }
  const idx = Math.floor(Math.random() * pool.length);
  renderQuoteToDOM(pool[idx]);
}

// ================== Add Quote ==================
function addQuote() {
  const text = $("newQuote").value.trim();
  const category = $("newCategory").value.trim() || "General";
  if (!text) {
    alert("Please enter a quote.");
    return;
  }

  const now = new Date().toISOString();
  const newQ = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text,
    category,
    updatedAt: now,
    source: "local",
    dirty: true // unsynced local change
  };
  quotes.push(newQ);
  saveQuotes();

  // refresh categories if new one added
  populateCategories();

  // If user is viewing that category, show it
  if (currentCategory() === "all" || currentCategory() === category) {
    renderQuoteToDOM(newQ);
  }

  $("newQuote").value = "";
  $("newCategory").value = "";
  setStatus("Added locally (pending sync).");
}

// ================== Import / Export ==================
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  link.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) {
        alert("Invalid JSON format.");
        return;
      }
      const now = new Date().toISOString();
      imported.forEach(q => {
        quotes.push({
          id: q.id || `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          text: q.text,
          category: q.category || "General",
          updatedAt: q.updatedAt || now,
          source: q.source || "local",
          dirty: !!q.dirty
        });
      });
      saveQuotes();
      populateCategories();
      setStatus(`Imported ${imported.length} quote(s).`);
    } catch {
      alert("Error reading JSON file.");
    }
  };
  if (event.target.files[0]) fileReader.readAsText(event.target.files[0]);
}

// ================== Server Sync (Simulation) ==================
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // mock API (read-only)
const SYNC_INTERVAL_MS = 30000; // 30s periodic sync
let syncTimer = null;

// Map server "post" -> our quote model
function serverToQuote(post) {
  // Try to extract a category from the title like: "Wisdom: Keep going"
  let category = "Server";
  if (typeof post.title === "string" && post.title.includes(":")) {
    category = post.title.split(":")[0].trim() || "Server";
  }
  const text = post.body || post.title || "Server quote";
  return {
    id: `server-${post.id}`, // stable id per server item
    text,
    category,
    // JSONPlaceholder has no updatedAt; we simulate older timestamp to illustrate precedence,
    // but per requirement we still let server win on conflicts regardless.
    updatedAt: "1970-01-01T00:00:00.000Z",
    source: "server",
    dirty: false
  };
}

// Merge strategy: "server wins"
// Conflicts are detected if a local quote has the same id OR the same text but different category and is dirty.
function mergeServerQuotes(serverQuotes) {
  const conflicts = [];

  serverQuotes.forEach(sq => {
    const byId = quotes.findIndex(q => q.id === sq.id);
    if (byId !== -1) {
      // Conflict if local differs & might be dirty
      const lq = quotes[byId];
      const isConflict =
        (lq.text !== sq.text || lq.category !== sq.category) && lq.dirty;

      // Server takes precedence
      quotes[byId] = { ...sq, // overwrite from server
        updatedAt: new Date().toISOString()
      };

      if (isConflict) {
        conflicts.push(`Overwrote local changes for id=${sq.id} with server version.`);
      }
      return;
    }

    // If not found by id, try detect by same text
    const sameTextIdx = quotes.findIndex(q => q.text === sq.text);
    if (sameTextIdx !== -1) {
      const lq = quotes[sameTextIdx];
      if (lq.dirty && (lq.category !== sq.category || lq.source !== "server")) {
        // server wins
        quotes[sameTextIdx] = { ...sq, updatedAt: new Date().toISOString() };
        conflicts.push(`Replaced local dirty quote (same text) with server version.`);
      } else {
        // keep local, but if server is authoritative, prefer server record shape
        quotes[sameTextIdx] = { ...sq, updatedAt: new Date().toISOString() };
      }
      return;
    }

    // No match → add server quote
    quotes.push({ ...sq, updatedAt: new Date().toISOString() });
  });

  // Save & refresh UI dependent bits
  saveQuotes();
  populateCategories();

  return conflicts;
}

// Pull updates from server
async function pullFromServer() {
  try {
    const res = await fetch(`${SERVER_URL}?_limit=10`);
    const posts = await res.json();
    const serverQuotes = posts.map(serverToQuote);
    const conflicts = mergeServerQuotes(serverQuotes);

    if (conflicts.length) {
      showConflicts(conflicts);
      setStatus(`Synced from server with ${conflicts.length} conflict(s) resolved (server wins).`);
    } else {
      showConflicts([]);
      setStatus(`Synced from server at ${new Date().toLocaleTimeString()}.`);
    }
  } catch (e) {
    setStatus("Server sync failed (network error).");
  }
}

// Push local dirty quotes to server (JSONPlaceholder doesn’t persist; demo only)
async function pushDirtyToServer() {
  const dirty = quotes.filter(q => q.dirty);
  if (!dirty.length) return;

  for (const q of dirty) {
    try {
      // Simulate sending: title can carry category, body carries text
      const payload = { title: `${q.category}: ${q.text.slice(0, 30)}`, body: q.text, userId: 1 };
      await fetch(SERVER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify(payload)
      });
      // Mark as clean (server "accepted")
      q.dirty = false;
      q.source = "server";
      // keep id as-is (JSONPlaceholder returns fake id; we avoid collisions)
      q.updatedAt = new Date().toISOString();
    } catch {
      // keep dirty if failed
    }
  }
  saveQuotes();
}

// Full sync: push then pull (server wins on merge)
async function syncNow() {
  setStatus("Syncing…");
  await pushDirtyToServer();
  await pullFromServer();
  // Refresh current view
  generateQuote();
}

// ================== Init ==================
window.onload = () => {
  populateCategories();

  // Restore last viewed quote if present
  const last = sessionStorage.getItem(SS_LAST_QUOTE);
  if (last) {
    try {
      renderQuoteToDOM(JSON.parse(last));
    } catch {
      generateQuote();
    }
  } else {
    generateQuote();
  }

  // Start periodic sync
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = setInterval(syncNow, SYNC_INTERVAL_MS);
  setStatus("Ready. Auto-sync is ON.");
};

// Expose functions for inline handlers
window.generateQuote = generateQuote;
window.addQuote = addQuote;
window.filterQuotes = filterQuotes;
window.exportToJsonFile = exportToJsonFile;
window.importFromJsonFile = importFromJsonFile;
window.syncNow = syncNow;
