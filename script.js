const api = "https://script.google.com/macros/s/AKfycbxqf1geq7Y-j1-Rtfmw1EMXMsG0z2ZPLtyao01WGwrem9uYPLIws9YxpsFLNbnCFkzt/exec";

let expenseChart, trendChart, categoryChart;

/* Default Date */
document.getElementById("date").valueAsDate = new Date();

const categorySelect = document.getElementById("category");
const typeSelect = document.getElementById("type");

/* CATEGORY LIST */
const categories = {
  Income: ["💵Savings","💼Salary","🏢Business","📈Investment","🧑‍💻Freelance","🎁Gift","➕Other"],
  Expense: [
    "🍔Food","🎀Gifts","🏥Health/medical","🏠Home","🚌Transportation",
    "🧴Personal","🐾Pets","💡Utilities","🚙Travel","💳Debt",
    "➖Other","📊Stocks","🏡💸Sending home"
  ]
};

/* Populate Categories */
typeSelect.addEventListener("change", () => {
  const selectedType = typeSelect.value;
  categorySelect.innerHTML = `<option value="">Select Category</option>`;

  if (categories[selectedType]) {
    categories[selectedType].forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categorySelect.appendChild(option);
    });
  }
});

/* Format Date */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

/* ADD TRANSACTION */
document.getElementById("expenseForm").addEventListener("submit", async e => {
  e.preventDefault();

  const data = {
    date: document.getElementById("date").value,
    type: document.getElementById("type").value,
    category: document.getElementById("category").value,
    amount: Number(document.getElementById("amount").value),
    note: document.getElementById("note").value
  };

  await fetch(api, {
    method: "POST",
    body: new URLSearchParams({
      data: JSON.stringify(data)
    })
  });

  closeModal();
  loadData();
});

/* DELETE TRANSACTION (SAFE) */
async function deleteRow(rowNumber) {
  await fetch(api, {
    method: "POST",
    body: new URLSearchParams({
      data: JSON.stringify({
        action: "delete",
        row: rowNumber
      })
    })
  });

  loadData();
}

/* Modal */
function openModal() {
  document.getElementById("modal").style.display = "flex";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

/* Dark Mode */
document.getElementById("darkToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

/* Month Filter */
document.getElementById("monthFilter").addEventListener("change", loadData);

/* LOAD DATA */
async function loadData() {

  const res = await fetch(api);
  let rows = await res.json();

  /* Sort by DATE (latest first) */
  rows.sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  const filterMonth = document.getElementById("monthFilter").value;

  let income = 0;
  let expense = 0;
  let monthlyData = {};
  let categoryData = {};

  const list = document.getElementById("list");
  list.innerHTML = "";

  rows.forEach(r => {

    if (!r.date) return;
    if (filterMonth && !r.date.startsWith(filterMonth)) return;

    const monthKey = r.date.slice(0, 7);
    const category = r.category;
    const amount = Number(r.amount);

    if (!monthlyData[monthKey]) monthlyData[monthKey] = 0;
    if (!categoryData[category]) categoryData[category] = 0;

    if (r.type === "Income") {
      income += amount;
    } else {
      expense += amount;
      monthlyData[monthKey] += amount;
      categoryData[category] += amount;
    }

    /* Render Transaction */
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <strong>${category}</strong><br>
        <small>${formatDate(r.date)}${r.note ? " • " + r.note : ""}</small>
      </div>
      <div>
        ₹${amount}
        <button class="delete-btn" onclick="deleteRow(${r.rowNumber})">X</button>
      </div>
    `;
    list.appendChild(li);
  });

  /* Update Summary */
  document.getElementById("income").innerText = "₹" + income;
  document.getElementById("expense").innerText = "₹" + expense;
  document.getElementById("balance").innerText = "₹" + (income - expense);

  /* Destroy Old Charts */
  if (expenseChart) expenseChart.destroy();
  if (trendChart) trendChart.destroy();
  if (categoryChart) categoryChart.destroy();

  /* Income vs Expense */
  expenseChart = new Chart(document.getElementById("expenseChart"), {
    type: "doughnut",
    data: {
      labels: ["Income", "Expense"],
      datasets: [{
        data: [income, expense],
        backgroundColor: ["#2ecc71", "#ff4d6d"]
      }]
    }
  });

  /* Monthly Trend */
  trendChart = new Chart(document.getElementById("trendChart"), {
    type: "line",
    data: {
      labels: Object.keys(monthlyData),
      datasets: [{
        label: "Monthly Expense",
        data: Object.values(monthlyData),
        borderColor: "#5f6af2",
        fill: false
      }]
    }
  });

  /* Category Breakdown */
  categoryChart = new Chart(document.getElementById("categoryChart"), {
    type: "bar",
    data: {
      labels: Object.keys(categoryData),
      datasets: [{
        label: "Category Expense",
        data: Object.values(categoryData),
        backgroundColor: "#8f94fb"
      }]
    }
  });
}

/* INITIAL LOAD */

loadData();
