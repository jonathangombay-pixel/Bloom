(() => {
  const STORAGE_KEY = "bloom.money.app.v1";
  const categories = ["Breakfast","Dinner","Transportation","Data","Groceries","Personal care","School","Clothing","Gift","Health","Entertainment","Other"];
  const categoryIcons = {"Breakfast":"☕","Dinner":"🍲","Transportation":"🚌","Data":"📱","Groceries":"🛍","Personal care":"✿","School":"✎","Clothing":"♧","Gift":"♡","Health":"✚","Entertainment":"♫","Other":"↗","Income":"＋"};
  const defaultState = () => ({
    currency:"LD", displayName:"", weeklyBudget:0,
    accounts:[
      {id:"cash",name:"Physical cash",type:"cash",balance:0},
      {id:"orange",name:"Orange Money",type:"mobile",balance:0},
      {id:"lonestar",name:"Lonestar Money",type:"mobile",balance:0}
    ],
    pockets:[
      {id:"regular",name:"Regular savings",amount:0,goal:0,color:"pink",description:"For the things you want to work toward."},
      {id:"emergency",name:"Emergency fund",amount:0,goal:0,color:"purple",description:"A little cushion for unexpected situations."},
      {id:"domestic",name:"Domestic spending",amount:0,goal:0,color:"green",description:"Everyday needs and household spending."},
      {id:"goals",name:"Personal goals",amount:0,goal:0,color:"orange",description:"Save toward something meaningful to you."}
    ],
    transactions:[],
    reminders:{enabled:false,time:"20:00",style:"gentle"},
    lastReminderDate:""
  });
  let state = loadState();
  let selectedType = "expense";
  let toastTimer = null;
  let reminderInterval = null;

  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  function loadState(){ try { const raw=localStorage.getItem(STORAGE_KEY); if(!raw) return defaultState(); const parsed=JSON.parse(raw); return {...defaultState(),...parsed, accounts:parsed.accounts||defaultState().accounts,pockets:parsed.pockets||defaultState().pockets,transactions:parsed.transactions||[],reminders:{...defaultState().reminders,...parsed.reminders}}; } catch(e){ return defaultState(); } }
  function save(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); }
  function id(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
  function money(value){ const n=Number(value)||0; const currency=state.currency||"LD"; return `${currency} ${n.toLocaleString("en-US",{maximumFractionDigits:0})}`; }
  function dateISO(d=new Date()){ const local=new Date(d.getTime()-d.getTimezoneOffset()*60000); return local.toISOString().slice(0,10); }
  function displayDate(s){ if(!s)return "—"; const d=new Date(s+"T12:00:00"); return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); }
  function startOfWeek(d=new Date()){ const x=new Date(d); x.setHours(0,0,0,0); const day=(x.getDay()+6)%7; x.setDate(x.getDate()-day); return x; }
  function inPeriod(date,period){ const d=new Date(date+"T12:00:00"), now=new Date(); if(period==="week") return d>=startOfWeek(now); if(period==="month") return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth(); return true; }
  function sum(list,fn){return list.reduce((acc,item)=>acc+fn(item),0)}
  function accountById(accountId){return state.accounts.find(a=>a.id===accountId)}
  function pocketById(pocketId){return state.pockets.find(p=>p.id===pocketId)}
  function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2600)}
  function setView(name){ $$(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${name}`)); $$(".nav-item[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===name)); $("#pageCrumb").textContent=({overview:"Overview",transactions:"Transactions",pockets:"Savings pockets",accounts:"My accounts",reports:"Reports",reminders:"Reminders",settings:"Settings"})[name]||"Overview"; if(name==="transactions")renderTransactions();if(name==="reports")renderReports();window.scrollTo({top:0,behavior:"smooth"}); }
  function renderAll(){renderOverview();renderTransactions();renderPockets();renderAccounts();renderReports();renderReminderSettings();renderSettings();fillFormOptions();updateToday();}
  function updateToday(){ $("#todayLabel").textContent=new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}); }
  function renderOverview(){
    $("#totalBalance").textContent=money(sum(state.accounts,a=>a.balance));
    const weekExpenses=state.transactions.filter(t=>t.type==="expense"&&inPeriod(t.date,"week"));
    const spent=sum(weekExpenses,t=>t.amount);
    $("#weekSpent").textContent=money(spent);
    const budget=Number(state.weeklyBudget)||0;
    $("#spendingProgress").style.width=budget?`${Math.min(100,spent/budget*100)}%`:"0%";
    $("#totalSaved").textContent=money(sum(state.pockets,p=>p.amount));
    $("#pocketPreview").innerHTML=state.pockets.slice(0,4).map(p=>`<div class="pocket-row"><div class="pocket-symbol ${esc(p.color)}">${p.color==="purple"?"♡":p.color==="green"?"⌂":p.color==="orange"?"✦":p.color==="blue"?"✧":"✿"}</div><div class="pocket-meta"><b>${esc(p.name)}</b><div class="pocket-progress"><span style="width:${p.goal?Math.min(100,p.amount/p.goal*100):Math.min(100,p.amount?35:0)}%"></span></div><small>${p.goal?`${money(p.amount)} of ${money(p.goal)}`:"Set a goal whenever you're ready"}</small></div><div class="pocket-amount">${money(p.amount)}<small>${p.goal?Math.round(p.amount/p.goal*100)+"% of goal":"set aside"}</small></div></div>`).join("")||`<div class="empty-inline">Create your first pocket to start planning.</div>`;
    const recent=[...state.transactions].sort((a,b)=>(b.date+b.createdAt).localeCompare(a.date+a.createdAt)).slice(0,5);
    $("#recentTransactions").innerHTML=recent.map(transactionRow).join("")||`<div class="empty-inline">Your money moves will show up here.</div>`;
    $("#logExpenseFromBanner").onclick=()=>openTransactionModal("expense");
  }
  function transactionRow(t){const account=accountById(t.accountId);return `<div class="activity-row"><div class="activity-icon">${esc(categoryIcons[t.category]||"↗")}</div><div class="activity-copy"><b>${esc(t.description)}</b><small>${esc(t.category)} · ${displayDate(t.date)}${account?" · "+esc(account.name):""}</small></div><div class="activity-amount ${t.type==="income"?"positive":"negative"}">${t.type==="income"?"+":"−"}${money(t.amount)}</div></div>`}
  function renderTransactions(){
    const search=($("#transactionSearch")?.value||"").toLowerCase(),type=$("#transactionTypeFilter")?.value||"all",category=$("#transactionCategoryFilter")?.value||"all";
    const items=[...state.transactions].filter(t=>(type==="all"||t.type===type)&&(category==="all"||t.category===category)&&(`${t.description} ${t.category} ${accountById(t.accountId)?.name||""}`).toLowerCase().includes(search)).sort((a,b)=>(b.date+b.createdAt).localeCompare(a.date+a.createdAt));
    const catSel=$("#transactionCategoryFilter"); if(catSel){const current=catSel.value;catSel.innerHTML='<option value="all">All categories</option>'+[...new Set([...categories,...state.transactions.map(t=>t.category)])].map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");catSel.value=[...catSel.options].some(o=>o.value===current)?current:"all";}
    $("#transactionsTable").innerHTML=items.map(t=>`<tr><td>${esc(t.description)}</td><td><span class="table-tag">${esc(t.category)}</span></td><td>${esc(accountById(t.accountId)?.name||"Deleted account")}</td><td>${displayDate(t.date)}</td><td class="right"><b class="${t.type==="income"?"positive":"negative"}">${t.type==="income"?"+":"−"}${money(t.amount)}</b></td><td><button class="delete-transaction" data-delete-transaction="${t.id}" title="Delete transaction" aria-label="Delete transaction">×</button></td></tr>`).join("");
    $("#transactionsEmpty").classList.toggle("hidden",items.length!==0);
  }
  function renderPockets(){
    $("#allPockets").innerHTML=state.pockets.map(p=>{const pct=p.goal?Math.min(100,p.amount/p.goal*100):0;return `<article class="pocket-card ${esc(p.color)}"><div class="pocket-card-top"><div class="pocket-symbol ${esc(p.color)}">${p.color==="purple"?"♡":p.color==="green"?"⌂":p.color==="orange"?"✦":p.color==="blue"?"✧":"✿"}</div><div class="pocket-actions"><button class="tiny-action" data-pocket-action="add" data-id="${p.id}">＋ Add</button><button class="tiny-action" data-pocket-action="withdraw" data-id="${p.id}">− Use</button><button class="tiny-action" data-pocket-action="edit" data-id="${p.id}">Edit</button></div></div><h3>${esc(p.name)}</h3><p class="pocket-balance">${money(p.amount)}</p><div class="goal-label">${p.goal?`Goal: ${money(p.goal)}`:"No target set yet"}</div><div class="pocket-progress"><span style="width:${pct}%"></span></div><div class="goal-row"><span>${p.goal?Math.round(pct)+"% reached":"Your pace, your goal"}</span><span>${p.goal?money(Math.max(0,p.goal-p.amount))+" to go":""}</span></div><p class="pocket-description">${esc(p.description||"A pocket for your plans.")}</p></article>`}).join("");
  }
  function renderAccounts(){
    $("#accountsGrid").innerHTML=state.accounts.map(a=>`<article class="account-card"><div class="account-top"><div class="account-symbol">${a.type==="cash"?"▤":a.type==="mobile"?"▯":a.type==="bank"?"⌂":"◉"}</div><button class="tiny-action" data-account-action="edit" data-id="${a.id}">Update balance</button></div><h3>${esc(a.name)}</h3><div class="account-kind">${({cash:"Physical cash",mobile:"Mobile money",bank:"Bank account",other:"Other account"})[a.type]||"Account"}</div><div class="account-balance">${money(a.balance)}</div><div class="account-foot"><span>Manual balance</span><button data-account-action="rename" data-id="${a.id}">Edit details</button></div></article>`).join("");
  }
  function renderReports(){
    const period=$("#reportPeriod")?.value||"week";const ts=state.transactions.filter(t=>inPeriod(t.date,period));const inc=sum(ts.filter(t=>t.type==="income"),t=>t.amount),out=sum(ts.filter(t=>t.type==="expense"),t=>t.amount),net=inc-out;
    $("#reportSummary").innerHTML=`<div class="report-stat"><span>Money received</span><b class="positive">${money(inc)}</b></div><div class="report-stat"><span>Money spent</span><b class="negative">${money(out)}</b></div><div class="report-stat"><span>Income minus spending</span><b>${money(net)}</b></div>`;
    const byCat={};ts.filter(t=>t.type==="expense").forEach(t=>byCat[t.category]=(byCat[t.category]||0)+t.amount);const sorted=Object.entries(byCat).sort((a,b)=>b[1]-a[1]);const max=sorted[0]?.[1]||1;
    $("#categoryChart").innerHTML=sorted.length?sorted.map(([cat,amount])=>`<div class="category-line"><span>${esc(cat)}</span><div class="bar-track"><span style="width:${amount/max*100}%"></span></div><b>${money(amount)}</b></div>`).join(""):`<div class="empty-inline">No expenses in this period yet.</div>`;
    const maxBar=Math.max(inc,out,1);$("#incomeExpenseBars").innerHTML=`<div class="comparison-row income"><div class="comparison-label"><span>Income</span><b>${money(inc)}</b></div><div class="comparison-track"><span style="width:${inc/maxBar*100}%"></span></div></div><div class="comparison-row"><div class="comparison-label"><span>Expenses</span><b>${money(out)}</b></div><div class="comparison-track"><span style="width:${out/maxBar*100}%"></span></div></div><p class="small-note">Reports use the dates and transactions you entered. They are only as accurate as your records.</p>`;
  }
  function renderReminderSettings(){ $("#remindersEnabled").checked=!!state.reminders.enabled;$("#reminderTime").value=state.reminders.time||"20:00";$("#reminderStyle").value=state.reminders.style||"gentle";$("#notificationStatus").textContent=("Notification" in window)?(Notification.permission==="granted"?"Browser notifications are enabled for this site.":"Notifications may need permission, and this page must remain open."):"This browser does not support notifications."; }
  function renderSettings(){ $("#displayName").value=state.displayName||"";$("#currency").value=state.currency||"LD";$("#weeklyBudget").value=state.weeklyBudget||""; }
  function fillFormOptions(){
    $("#entryCategory").innerHTML=categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");
    $("#entryAccount").innerHTML=state.accounts.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join("");
    $("#entryPocket").innerHTML='<option value="">Don’t change a pocket</option>'+state.pockets.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("");
  }
  function openModal(el){el.classList.remove("hidden");document.body.style.overflow="hidden"}
  function closeModal(el){el.classList.add("hidden");if(![...$$(".modal-backdrop")].some(x=>!x.classList.contains("hidden")))document.body.style.overflow=""}
  function openTransactionModal(type="expense"){selectedType=type;$("#entryType").value=type;$$("[data-type]",$("#typeSegment")).forEach(b=>b.classList.toggle("selected",b.dataset.type===type));$("#modalTitle").textContent=type==="income"?"Add income":"Add expense";$("#entryDate").value=dateISO();$("#entryAmount").value="";$("#entryDescription").value="";$("#entryCategory").value=type==="income"?"Other":"Breakfast";$("#pocketField").classList.toggle("hidden",type==="income");fillFormOptions();openModal($("#modalBackdrop"));setTimeout(()=>$("#entryAmount").focus(),50)}
  function submitTransaction(e){e.preventDefault();const amount=Number($("#entryAmount").value);const account=accountById($("#entryAccount").value);if(!amount||amount<1||!account){toast("Enter an amount and choose an account.");return}const type=$("#entryType").value;const t={id:id(),type,amount,description:$("#entryDescription").value.trim(),category:type==="income"?"Income":$("#entryCategory").value,accountId:account.id,date:$("#entryDate").value,createdAt:Date.now(),pocketId:type==="expense"?$("#entryPocket").value:""};if(!t.description){toast("Add a short description.");return}account.balance=Math.max(0,Number(account.balance)+(type==="income"?amount:-amount));if(t.pocketId){const p=pocketById(t.pocketId);if(p)p.amount=Math.max(0,p.amount-amount)}state.transactions.push(t);save();closeModal($("#modalBackdrop"));renderAll();toast(type==="income"?"Income saved. Nice work!":"Expense saved. Your balances are updated.");}
  function openPocketModal(pocket=null){$("#pocketForm").dataset.editId=pocket?.id||"";$("#pocketModalTitle").textContent=pocket?"Edit pocket":"Create a pocket";$("#pocketName").value=pocket?.name||"";$("#pocketAmount").value=pocket?.amount??0;$("#pocketGoal").value=pocket?.goal||"";$("#pocketColor").value=pocket?.color||"pink";openModal($("#pocketModalBackdrop"))}
  function submitPocket(e){e.preventDefault();const name=$("#pocketName").value.trim();const amount=Number($("#pocketAmount").value);const goal=Number($("#pocketGoal").value)||0;const editId=$("#pocketForm").dataset.editId;if(editId){const p=pocketById(editId);if(p)Object.assign(p,{name,amount,goal,color:$("#pocketColor").value})}else{state.pockets.push({id:id(),name,amount,goal,color:$("#pocketColor").value,description:"A pocket for your plans."})}save();closeModal($("#pocketModalBackdrop"));renderAll();toast(editId?"Pocket updated.":"Your new pocket is ready.");}
  function pocketAction(action,p){if(!p)return;if(action==="edit"){openPocketModal(p);return}const label=action==="add"?"Add money to pocket":"Use money from pocket";const raw=prompt(`${label}: ${p.name}\nCurrent amount: ${money(p.amount)}\nEnter amount (numbers only):`);if(raw===null)return;const amount=Number(raw);if(!Number.isFinite(amount)||amount<=0){toast("Enter a valid amount greater than zero.");return}if(action==="withdraw"&&amount>p.amount){toast("That is more than this pocket holds.");return}p.amount+=action==="add"?amount:-amount;save();renderAll();toast(action==="add"?"Money set aside in your pocket.":"Pocket updated.");}
  function openAccountModal(account=null,mode="add"){ $("#accountForm").dataset.editId=account?.id||"";$("#accountModalTitle").textContent=mode==="balance"?"Update balance":mode==="rename"?"Edit account":"Add account";$("#accountName").value=account?.name||"";$("#accountType").value=account?.type||"cash";$("#accountBalance").value=account?.balance??0;$("#accountName").disabled=mode==="balance";$("#accountType").disabled=mode==="balance";openModal($("#accountModalBackdrop"))}
  function submitAccount(e){e.preventDefault();const editId=$("#accountForm").dataset.editId;const name=$("#accountName").value.trim();const type=$("#accountType").value;const balance=Number($("#accountBalance").value);if(balance<0){toast("Balance cannot be negative.");return}if(editId){const a=accountById(editId);if(a)Object.assign(a,{name:name||a.name,type,balance})}else state.accounts.push({id:id(),name,type,balance});save();closeModal($("#accountModalBackdrop"));renderAll();toast(editId?"Account updated.":"Account added.");}
  function deleteTransaction(tid){const t=state.transactions.find(x=>x.id===tid);if(!t)return;if(!confirm("Delete this transaction? The account balance will be reversed."))return;const a=accountById(t.accountId);if(a)a.balance=Math.max(0,a.balance+(t.type==="income"?-t.amount:t.amount));if(t.pocketId){const p=pocketById(t.pocketId);if(p)p.amount+=t.amount}state.transactions=state.transactions.filter(x=>x.id!==tid);save();renderAll();toast("Transaction deleted and account balance adjusted.");}
  function startCheckin(){const options=categories.filter(c=>["Breakfast","Dinner","Transportation","Data","Groceries","Personal care","School","Other"].includes(c));const answer=prompt("Quick check-in: what did you spend on today?\n\nEnter a category number, or cancel to skip:\n"+options.map((c,i)=>`${i+1}. ${c}`).join("\n"));if(answer===null)return;const index=Number(answer)-1;if(!Number.isInteger(index)||index<0||index>=options.length){toast("No worries — you can log it later.");return}openTransactionModal("expense");$("#entryCategory").value=options[index];$("#entryDescription").value=options[index];}
  function checkReminder(){if(!state.reminders.enabled)return;const now=new Date();const hhmm=now.toTimeString().slice(0,5);const today=dateISO();if(hhmm>=state.reminders.time&&state.lastReminderDate!==today){state.lastReminderDate=today;save();const message=state.reminders.style==="direct"?"Time to log today's spending.":"A gentle reminder: did you spend anything today?";toast(message);if("Notification" in window&&Notification.permission==="granted"){try{new Notification("Bloom · money check-in",{body:message,icon:""})}catch(e){}}}}
  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

  // Navigation and actions
  $$(".nav-item[data-view]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
  $$("[data-goto]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.goto)));
  $("#openAdd").addEventListener("click",()=>openTransactionModal("expense"));
  $$("[data-add]").forEach(b=>b.addEventListener("click",()=>openTransactionModal("expense")));
  $("#logExpenseFromBanner").addEventListener("click",()=>openTransactionModal("expense"));
  $("#quickReminder").addEventListener("click",()=>{setView("reminders");startCheckin()});
  $("#quickCheckin").addEventListener("click",startCheckin);
  $("#addPocketShortcut").addEventListener("click",()=>openPocketModal());
  $("#createPocketButton").addEventListener("click",()=>openPocketModal());
  $("#addAccountButton").addEventListener("click",()=>openAccountModal());
  $("#closeModal").addEventListener("click",()=>closeModal($("#modalBackdrop")));
  $("#cancelModal").addEventListener("click",()=>closeModal($("#modalBackdrop")));
  $("#closePocketModal").addEventListener("click",()=>closeModal($("#pocketModalBackdrop")));
  $("#cancelPocketModal").addEventListener("click",()=>closeModal($("#pocketModalBackdrop")));
  $("#closeAccountModal").addEventListener("click",()=>closeModal($("#accountModalBackdrop")));
  $("#cancelAccountModal").addEventListener("click",()=>closeModal($("#accountModalBackdrop")));
  $$(".modal-backdrop").forEach(back=>back.addEventListener("click",e=>{if(e.target===back)closeModal(back)}));
  document.addEventListener("keydown",e=>{if(e.key==="Escape")$$(".modal-backdrop").forEach(closeModal)});
  $("#typeSegment").addEventListener("click",e=>{const b=e.target.closest("[data-type]");if(!b)return;selectedType=b.dataset.type;$("#entryType").value=selectedType;$$("[data-type]",$("#typeSegment")).forEach(x=>x.classList.toggle("selected",x===b));$("#modalTitle").textContent=selectedType==="income"?"Add income":"Add expense";$("#pocketField").classList.toggle("hidden",selectedType==="income");$("#entryCategory").value=selectedType==="income"?"Other":"Breakfast"});
  $("#transactionForm").addEventListener("submit",submitTransaction);
  $("#pocketForm").addEventListener("submit",submitPocket);
  $("#accountForm").addEventListener("submit",submitAccount);
  $("#transactionsTable").addEventListener("click",e=>{const b=e.target.closest("[data-delete-transaction]");if(b)deleteTransaction(b.dataset.deleteTransaction)});
  $("#allPockets").addEventListener("click",e=>{const b=e.target.closest("[data-pocket-action]");if(b)pocketAction(b.dataset.pocketAction,pocketById(b.dataset.id))});
  $("#accountsGrid").addEventListener("click",e=>{const b=e.target.closest("[data-account-action]");if(!b)return;const a=accountById(b.dataset.id);if(!a)return;if(b.dataset.accountAction==="edit")openAccountModal(a,"balance");else openAccountModal(a,"rename")});
  $("#transactionSearch").addEventListener("input",renderTransactions);$("#transactionTypeFilter").addEventListener("change",renderTransactions);$("#transactionCategoryFilter").addEventListener("change",renderTransactions);$("#reportPeriod").addEventListener("change",renderReports);
  $("#remindersEnabled").addEventListener("change",e=>{state.reminders.enabled=e.target.checked;save();renderReminderSettings();toast(e.target.checked?"Daily check-in reminders turned on.":"Daily check-in reminders turned off.")});
  $("#reminderTime").addEventListener("change",e=>{state.reminders.time=e.target.value||"20:00";save()});
  $("#reminderStyle").addEventListener("change",e=>{state.reminders.style=e.target.value;save()});
  $("#enableNotifications").addEventListener("click",async()=>{if(!("Notification" in window)){toast("This browser does not support notifications.");return}try{const p=await Notification.requestPermission();renderReminderSettings();toast(p==="granted"?"Notifications enabled while this page is open.":"Permission was not granted. In-app reminders still work while open.")}catch(e){toast("Could not request notification permission in this browser.")}});
  $("#saveSettings").addEventListener("click",()=>{state.displayName=$("#displayName").value.trim();state.currency=$("#currency").value;state.weeklyBudget=Math.max(0,Number($("#weeklyBudget").value)||0);save();renderAll();toast("Settings saved.")});
  $("#resetApp").addEventListener("click",()=>{if(!confirm("Reset Bloom? This permanently clears this browser's Bloom data, transactions, and pockets."))return;state=defaultState();save();renderAll();setView("overview");toast("App data reset.")});

  renderAll();
  const appSplash = document.getElementById("appSplash");
  if (appSplash) window.setTimeout(() => appSplash.classList.add("hidden"), 2300);
  reminderInterval=setInterval(checkReminder,30000);
  // Installable PWA support. Background push reminders still require a hosted push service.
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }
})();