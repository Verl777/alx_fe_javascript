// script.js

let quotes = JSON.parse(localStorage.getItem("quotes")) || [];
let lastFilter = localStorage.getItem("lastFilter") || "all";
const API_URL = "https://jsonplaceholder.typicode.com/posts"; // Mock API
const syncInterval = 30000; // 30 seconds

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Load categories dynamically
function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");
  const categories = [...new Set(quotes.map(q => q.category))];
  
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  // Restore last filter
  categoryFilter.value = lastFilter;
  filterQuotes();
}

// Filter quotes
function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  lastFilter = selectedCategory;
  localStorage.setItem("lastFilter", lastFilter);

  const quoteDisplay = document.getElementById("quoteDisplay");
  quoteDisplay.innerHTML = "";

  const filtered = selectedCategory === "all"
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);

  filtered.forEach(q => {
    const div = document.createElement("div");
    div.classList.add("quote-card");
    div.innerHTML = `<p>"${q.text}"</p><small>- ${q.category}</small>`;
    quoteDisplay.appendChild(div);
  });
}

// Add a new quote
function addQuote() {
  const text = document.getElementById("newQuote").value.trim();
  const category = document.getElementById("newCategory").value.trim();
  if (!text || !category) return alert("Both fields are required!");

  const newQuote = { text, category, id: Date.now() };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  postQuoteToServer(newQuote); // Sync to server
  document.getElementById("newQuote").value = "";
  document.getElementById("newCategory").value = "";
}

// Export quotes to JSON
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Import quotes from JSON
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (e) {
    const importedQuotes = JSON.parse(e.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    populateCategories();
    alert("Quotes imported successfully!");
  };
  fileReader.readAsText(event.target.files[0]);
}

/* ---------------- SERVER SYNCING ---------------- */

// Fetch quotes from server (simulation)
async function fetchQuotesFromServer() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    // Only take first 5 mock items
    return data.slice(0, 5).map(item => ({
      id: item.id,
      text: item.title,
      category: "server"
    }));
  } catch (err) {
    console.error("Error fetching from server:", err);
    return [];
  }
}

// Post a new quote to server (simulation)
async function postQuoteToServer(quote) {
  try {
    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(quote),
      headers: { "Content-Type": "application/json" }
    });
    showNotification("Quote synced with server!");
  } catch (err) {
    console.error("Error posting to server:", err);
  }
}

// Sync local & server data
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();

  let conflicts = [];
  serverQuotes.forEach(serverQ => {
    const localQ = quotes.find(q => q.id === serverQ.id);
    if (!localQ) {
      // Add server quote if not in local
      quotes.push(serverQ);
    } else if (localQ.text !== serverQ.text) {
      // Conflict: server wins
      conflicts.push({ local: localQ, server: serverQ });
      Object.assign(localQ, serverQ);
    }
  });

  if (conflicts.length > 0) {
    showNotification(`${conflicts.length} conflicts resolved (server data kept).`);
  }

  saveQuotes();
  populateCategories();
}

// Show notification for sync/conflict updates
function showNotification(message) {
  const notif = document.createElement("div");
  notif.classList.add("notification");
  notif.textContent = message;
  document.body.appendChild(notif);

  setTimeout(() => notif.remove(), 4000);
}

// Periodic syncing
setInterval(syncQuotes, syncInterval);

// Init
window.onload = () => {
  populateCategories();
  syncQuotes();
};
