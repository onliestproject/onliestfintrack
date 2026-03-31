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

/* Currency Formatter */
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

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
  document.getElementById("expenseForm").reset();
  document.getElementById("date").valueAsDate = new Date();
  loadData();
});

/* DELETE */
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

  rows.sort((a, b) => new Date(b.date) - new Date(a.date));

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

    const li = document.createElement("li");
    li.classList.add("transaction");

    li.innerHTML = `
      <div class="left">
        <div class="category">${category}</div>
        <div class="meta">
          ${formatDate(r.date)}
          ${r.note ? " • " + r.note : ""}
        </div>
      </div>

      <div class="right ${r.type === "Income" ? "income" : "expense"}">
        ${r.type === "Income" ? "+" : "-"} ${formatCurrency(amount)}
        <button class="delete-btn" onclick="deleteRow(${r.rowNumber})">✖</button>
      </div>
    `;

    list.appendChild(li);
  });

  if (list.innerHTML === "") {
    list.innerHTML = `
      <div style="text-align:center; padding:20px; opacity:0.6;">
        No transactions found
      </div>
    `;
  }

  document.getElementById("income").innerText = formatCurrency(income);
  document.getElementById("expense").innerText = formatCurrency(expense);
  document.getElementById("balance").innerText = formatCurrency(income - expense);

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

  /* 🔥 MONTHLY TREND (FIXED ORDER) */

  const sortedMonths = Object.keys(monthlyData).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  trendChart = new Chart(document.getElementById("trendChart"), {
    type: "line",
    data: {
      labels: sortedMonths.map(m => {
        const date = new Date(m + "-01");
        return date.toLocaleString("en-IN", { month: "short", year: "numeric" });
      }),
      datasets: [{
        label: "Monthly Expense",
        data: sortedMonths.map(m => monthlyData[m]),
        borderColor: "#5f6af2",
        fill: false,
        tension: 0.3
      }]
    }
  });

  /* CATEGORY CHART */

  const totalExpense = Object.values(categoryData).reduce((a, b) => a + b, 0);

  categoryChart = new Chart(document.getElementById("categoryChart"), {
    type: "polarArea",
    data: {
      labels: Object.keys(categoryData),
      datasets: [{
        data: Object.values(categoryData),
        backgroundColor: [
          "#5f6af2",
          "#ff6b6b",
          "#2ecc71",
          "#f39c12",
          "#9b59b6",
          "#1abc9c",
          "#e84393",
          "#00cec9",
          "#fdcb6e",
          "#6c5ce7"
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: 10 },
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 12, font: { size: 11 } }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const percentage = ((value / totalExpense) * 100).toFixed(1);
              return `${context.label}: ₹${value} (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        r: {
          ticks: { display: false },
          grid: { circular: true }
        }
      }
    }
  });
}

loadData();
