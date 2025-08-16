// ----- Data store: array of quote objects -----
const quotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Inspiration" },
  { text: "In the middle of every difficulty lies opportunity.", category: "Wisdom" },
  { text: "I'm not arguing, I'm just explaining why I'm right.", category: "Humor" }
];

// ----- Helpers -----
const $ = (id) => document.getElementById(id);

// Update the DOM with a quote (uses innerHTML as required)
function renderQuote(quote) {
  const box = $("quoteDisplay");
  if (!box) return;
  box.innerHTML = `
    <blockquote style="margin:0;">“${quote.text}”</blockquote>
    <div style="opacity:.8;margin-top:.25rem;">[${quote.category}]</div>
  `;
}

// ----- Show a random quote & update the DOM -----
function showRandomQuote() {
  if (!quotes.length) {
    $("quoteDisplay").innerHTML = "No quotes available yet.";
    return;
  }
  const idx = Math.floor(Math.random() * quotes.length);
  renderQuote(quotes[idx]);
}

// ----- Add a new quote (push into array & update DOM) -----
function addQuote() {
  const textEl = $("newQuoteText");
  const catEl = $("newQuoteCategory");
  if (!textEl || !catEl) return;

  const text = textEl.value.trim();
  const category = catEl.value.trim();

  if (!text || !category) {
    alert("Please enter both a quote and a category.");
    return;
  }

  const newQ = { text, category };
  quotes.push(newQ);              // add to quotes array
  renderQuote(newQ);              // update the DOM to show the newly added quote
  textEl.value = "";
  catEl.value = "";
}

// ----- Build the add-quote form dynamically if not present -----
function createAddQuoteForm() {
  // If the inputs already exist (e.g., provided in HTML snippet), skip creating them.
  if ($("newQuoteText") && $("newQuoteCategory")) return;

  const target = $("formContainer") || document.body;
  const wrapper = document.createElement("div");

  // Use innerHTML (explicit requirement)
  wrapper.innerHTML = `
    <div style="margin-top:1rem;">
      <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
      <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
      <button id="addQuoteBtn" type="button">Add Quote</button>
    </div>
  `;
  target.appendChild(wrapper);

  const addBtn = $("addQuoteBtn");
  if (addBtn) addBtn.addEventListener("click", addQuote);
}

// ----- Wire up events on load -----
document.addEventListener("DOMContentLoaded", () => {
  const btn = $("newQuote");
  if (btn) btn.addEventListener("click", showRandomQuote);

  createAddQuoteForm();

  // Expose functions globally for inline handlers (e.g., onclick="addQuote()")
  window.addQuote = addQuote;
  window.showRandomQuote = showRandomQuote;
  window.createAddQuoteForm = createAddQuoteForm;

  // Optionally render one on load
  showRandomQuote();
});
