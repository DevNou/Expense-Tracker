const balanceEl = document.getElementById("balance");
const incomeAmountEl = document.getElementById("income-amount");
const expenseAmountEl = document.getElementById("expense-amount");
const transactionListEl = document.getElementById("transaction-list");
const transactionFormEl = document.getElementById("transaction-form");
const descriptionEl = document.getElementById("description");
const amountEl = document.getElementById("amount");
const categoryEl = document.getElementById("category");
const exportBtn = document.getElementById("export-btn");
const expenseChartCtx = document.getElementById("expenseChart").getContext("2d");
const modeToggle = document.getElementById("mode-toggle");
const searchEl = document.getElementById("search");
const filterCategoryEl = document.getElementById("filter-category");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let expenseChart;

transactionFormEl.addEventListener("submit", addTransaction);
exportBtn.addEventListener("click", exportCSV);
modeToggle.addEventListener("click", toggleMode);
searchEl.addEventListener("input", updateTransactionList);
filterCategoryEl.addEventListener("change", updateTransactionList);

function addTransaction(e){
  e.preventDefault();
  const description = descriptionEl.value.trim();
  const amount = parseFloat(amountEl.value);
  const category = categoryEl.value;
  if(!description || !amount || !category) return;
  transactions.push({ id: Date.now(), description, amount, category });
  localStorage.setItem("transactions", JSON.stringify(transactions));
  updateTransactionList();
  updateSummary();
  transactionFormEl.reset();
}

function updateTransactionList(){
  transactionListEl.innerHTML = "";
  const search = searchEl.value.toLowerCase();
  const filterCat = filterCategoryEl.value;
  const filtered = transactions.filter(t=>{
    return t.description.toLowerCase().includes(search) &&
           (filterCat ? t.category === filterCat : true);
  }).reverse();
  filtered.forEach(t=>{
    const li = document.createElement("li");
    li.classList.add("transaction");
    li.classList.add(t.amount>0?"income":"expense");
    li.innerHTML=`<span>${t.description} (${t.category})</span>
      <span>${formatCurrency(t.amount)}
      <button class="delete-btn" onclick="removeTransaction(${t.id})">x</button></span>`;
    transactionListEl.appendChild(li);
  });
}

function updateSummary(){
  const balance = transactions.reduce((acc,t)=>acc+t.amount,0);
  const income = transactions.filter(t=>t.amount>0).reduce((acc,t)=>acc+t.amount,0);
  const expenses = transactions.filter(t=>t.amount<0).reduce((acc,t)=>acc+t.amount,0);
  balanceEl.textContent=formatCurrency(balance);
  balanceEl.style.color = balance>=0?"#28a745":"#dc3545";
  incomeAmountEl.textContent=formatCurrency(income);
  expenseAmountEl.textContent=formatCurrency(expenses);
  updateChart();
}

function removeTransaction(id){
  transactions = transactions.filter(t=>t.id!==id);
  localStorage.setItem("transactions",JSON.stringify(transactions));
  updateTransactionList();
  updateSummary();
}

function formatCurrency(num){
  return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(num);
}

function exportCSV(){
  const header="Description,Amount,Category\n";
  const csv = transactions.map(t=>`${t.description},${t.amount},${t.category}`).join("\n");
  const blob = new Blob([header+csv],{type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download="transactions.csv"; a.click();
  URL.revokeObjectURL(url);
}

function updateChart(){
  const categoryTotals={};
  transactions.filter(t=>t.amount<0).forEach(t=>{
    categoryTotals[t.category]=(categoryTotals[t.category]||0)+Math.abs(t.amount);
  });
  const labels=Object.keys(categoryTotals);
  const data=Object.values(categoryTotals);
  if(expenseChart) expenseChart.destroy();
  expenseChart=new Chart(expenseChartCtx,{
    type:"pie",
    data:{ labels, datasets:[{ data, backgroundColor:["#ff7f50","#ff69b4","#ffa07a","#ffb6c1","#ffdab9"] }] },
    options:{ responsive:true, plugins:{ legend:{ position:'bottom' } } }
  });
}

function toggleMode(){
  document.body.classList.toggle("dark-mode");
  modeToggle.textContent = document.body.classList.contains("dark-mode") ? "☀️ Light Mode" : "🌙 Dark Mode";
}

// Initial render
updateTransactionList();
updateSummary();
