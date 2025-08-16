// ===== Dynamic Quote Generator with Categories and Filtering =====

// Load quotes from localStorage or set defaults
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Don't let yesterday take up too much of today.", category: "Inspiration" },
  { text: "Failure is not the opposite of success; it's part of success.", category: "Wisdom" }
];

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Display a random quote
function displayQuote() {
  const category = localStorage.getItem("selectedCategory") || "all";
  const filteredQuotes =
    category === "all" ? quotes : quotes.filter(q => q.category === category);

  if (filteredQuotes.length === 0) {
    document.getElementById("quoteDisplay").textContent = "No quotes found in this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  document.getElementById("quoteDisplay").textContent = `"${filteredQuotes[randomIndex].text}" - [${filteredQuotes[randomIndex].category}]`;
}

// Add a new quote
function addQuote() {
  const newQuote = document.getElementById("newQuote").value.trim();
  const newCategory = document.getElementById("newCategory").value.trim();

  if (newQuote === "" || newCategory === "") {
    alert("Please enter both a quote and a category!");
    return;
  }

  quotes.push({ text: newQuote, category: newCategory });
  saveQuotes();
  populateCategories();
  document.getElementById("newQuote").value = "";
  document.getElementById("newCategory").value = "";
  alert("Quote added successfully!");
}

// Populate categories dynamically in dropdown
function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");
  const uniqueCategories = [...new Set(quotes.map(q => q.category))];
  const selectedCategory = localStorage.getItem("selectedCategory") || "all";

  // Clear old options
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  // Add categories
  uniqueCategories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    if (cat === selectedCategory) option.selected = true;
    categoryFilter.appendChild(option);
  });
}

// Filter quotes based on category
function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selectedCategory);
  displayQuote();
}

// ===== Initialization =====
window.onload = function () {
  populateCategories();
  displayQuote();
};
