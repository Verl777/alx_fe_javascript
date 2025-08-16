// Array of quote objects
const quotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Inspiration" },
  { text: "I'm not arguing, I'm just explaining why I'm right.", category: "Humor" },
  { text: "In the middle of every difficulty lies opportunity.", category: "Wisdom" }
];

document.addEventListener("DOMContentLoaded", () => {
  const quoteDisplay = document.getElementById("quoteDisplay");
  const newQuoteBtn = document.getElementById("newQuote");

  // Show a random quote when button clicked
  newQuoteBtn.addEventListener("click", showRandomQuote);

  // Create form dynamically
  createAddQuoteForm();

  // --- Function to show random quote ---
  function showRandomQuote() {
    if (quotes.length === 0) {
      quoteDisplay.textContent = "No quotes available yet!";
      return;
    }
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];
    quoteDisplay.textContent = `"${quote.text}" — [${quote.category}]`;
  }

  // --- Function to dynamically create Add Quote form ---
  function createAddQuoteForm() {
    const formContainer = document.getElementById("formContainer");

    // Input for quote text
    const inputText = document.createElement("input");
    inputText.id = "newQuoteText";
    inputText.type = "text";
    inputText.placeholder = "Enter a new quote";

    // Input for category
    const inputCategory = document.createElement("input");
    inputCategory.id = "newQuoteCategory";
    inputCategory.type = "text";
    inputCategory.placeholder = "Enter quote category";

    // Add button
    const addBtn = document.createElement("button");
    addBtn.textContent = "Add Quote";
    addBtn.addEventListener("click", addQuote);

    // Append to container
    formContainer.appendChild(document.createElement("br"));
    formContainer.appendChild(inputText);
    formContainer.appendChild(inputCategory);
    formContainer.appendChild(addBtn);
  }

  // --- Function to add a new quote ---
  function addQuote() {
    const textInput = document.getElementById("newQuoteText");
    const categoryInput = document.getElementById("newQuoteCategory");

    const newText = textInput.value.trim();
    const newCategory = categoryInput.value.trim();

    if (newText && newCategory) {
      quotes.push({ text: newText, category: newCategory });
      alert("New quote added successfully!");
      textInput.value = "";
      categoryInput.value = "";
    } else {
      alert("Please fill in both fields before adding a quote.");
    }
  }
});
