const API_URL = "https://localhost:7053/api/expenses"; // keep your correct port

const form = document.getElementById("expense-form");
const list = document.getElementById("expense-list");

let categoryChart = null; // holds the chart instance so we can destroy/redraw it
let editingId = null; // tracks whether we're editing an existing expense

async function loadExpenses() {
    const res = await fetch(API_URL);
    const expenses = await res.json();

    list.innerHTML = "";
    expenses.forEach(exp => {
        const li = document.createElement("li");
        li.textContent = `${exp.date.split("T")[0]} - ${exp.category}: ${exp.description} - $${exp.amount} `;

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => startEdit(exp));

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => deleteExpense(exp.id));

        li.appendChild(editBtn);
        li.appendChild(deleteBtn);
        list.appendChild(li);
    });
    updateSummary(expenses);
}

function updateSummary(expenses) {
    // Calculate monthly total
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    document.getElementById("monthly-total").textContent = `$${total.toFixed(2)}`;

    // Group by category
    const categoryTotals = {};
    expenses.forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    // Destroy old chart before drawing a new one (prevents overlap/memory leaks)
    if (categoryChart) {
        categoryChart.destroy();
    }

    const ctx = document.getElementById("category-chart").getContext("2d");
    categoryChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    "#14B8A6", "#F59E0B", "#101828", "#6B7280",
                    "#0D9488", "#FBBF24", "#374151", "#94A3B8"
                ]
            }]
        }
    });
}

function startEdit(exp) {
    editingId = exp.id;
    document.getElementById("description").value = exp.description;
    document.getElementById("amount").value = exp.amount;
    document.getElementById("category").value = exp.category;
    document.getElementById("date").value = exp.date.split("T")[0];

    form.querySelector("button[type='submit']").textContent = "Update Expense";
}

async function deleteExpense(id) {
    await fetch(`${API_URL}/${id}`, {
        method: "DELETE"
    });
    await loadExpenses();
}


form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const expenseData = {
        description: document.getElementById("description").value,
        amount: parseFloat(document.getElementById("amount").value),
        category: document.getElementById("category").value,
        date: document.getElementById("date").value
    };

    if (editingId) {
        // Update existing expense
        await fetch(`${API_URL}/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(expenseData)
        });
        editingId = null;
        form.querySelector("button[type='submit']").textContent = "Add Expense";
    } else {
        // Create new expense
        await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(expenseData)
        });
    }

    form.reset();
    await loadExpenses();
});
