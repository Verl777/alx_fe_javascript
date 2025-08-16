let quotes = JSON.parse(localStorage.getItem("quotes")) || [
    { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
    { text: "Don’t let yesterday take up too much of today.", category: "Wisdom" },
    { text: "It’s not whether you get knocked down, it’s whether you get up.", category: "Resilience" }
];

let serverQuotes = [];

// DOM elements
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteInput = document.getElementById("newQuote");
const categoryInput = document.getElementById("newCategory");
const categoryFilter = document.getElementById("categoryFilter");
const notificationArea = document.getElementById("notification"); // notification div

// Save to local storage
function saveQuotes() {
    localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Populate categories dynamically
function populateCategories() {
    let categories = ["all", ...new Set(quotes.map(q => q.category))];
    categoryFilter.innerHTML = "";
    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
        categoryFilter.appendChild(option);
    });

    let lastFilter = localStorage.getItem("lastFilter") || "all";
    categoryFilter.value = lastFilter;
}

// Filter quotes
function filterQuotes() {
    const selectedCategory = categoryFilter.value;
    localStorage.setItem("lastFilter", selectedCategory);
    displayQuotes(selectedCategory);
}

// Display quotes
function displayQuotes(category = "all") {
    quoteDisplay.innerHTML = "";
    let filteredQuotes = (category === "all") ? quotes : quotes.filter(q => q.category === category);

    filteredQuotes.forEach(q => {
        const p = document.createElement("p");
        p.textContent = `"${q.text}" — [${q.category}]`;
        quoteDisplay.appendChild(p);
    });
}

// Add new quote
function addQuote() {
    const newQuote = newQuoteInput.value.trim();
    const newCategory = categoryInput.value.trim();

    if (newQuote && newCategory) {
        const newEntry = { text: newQuote, category: newCategory };
        quotes.push(newEntry);
        saveQuotes();
        populateCategories();
        filterQuotes();
        newQuoteInput.value = "";
        categoryInput.value = "";
        syncQuotesWithServer(newEntry); // also push to server
    }
}

// --- SERVER SYNC SIMULATION ---

// Fetch quotes from server
async function fetchQuotesFromServer() {
    try {
        const response = await fetch("https://jsonplaceholder.typicode.com/posts");
        const data = await response.json();
        serverQuotes = data.slice(0, 5).map(post => ({
            text: post.title,
            category: "Server"
        }));
        syncQuotes();
    } catch (error) {
        console.error("Error fetching from server:", error);
    }
}

// Post new quote to server
async function syncQuotesWithServer(newQuote) {
    try {
        await fetch("https://jsonplaceholder.typicode.com/posts", {
            method: "POST",
            body: JSON.stringify(newQuote),
            headers: { "Content-type": "application/json; charset=UTF-8" }
        });
        showNotification("Quote successfully synced with server!");
    } catch (error) {
        console.error("Error syncing with server:", error);
        showNotification("⚠️ Failed to sync quote with server.");
    }
}

// Sync quotes and resolve conflicts
function syncQuotes() {
    let updated = false;
    serverQuotes.forEach(sq => {
        if (!quotes.some(lq => lq.text === sq.text)) {
            quotes.push(sq);
            updated = true;
        }
    });

    if (updated) {
        saveQuotes();
        filterQuotes();
        showNotification("Quotes synced with server!");
    }
}

// Show notification message
function showNotification(message) {
    notificationArea.textContent = message;
    notificationArea.style.display = "block";

    setTimeout(() => {
        notificationArea.style.display = "none";
    }, 3000);
}

// Periodic sync
setInterval(fetchQuotesFromServer, 15000);

// Initialize app
populateCategories();
filterQuotes();
