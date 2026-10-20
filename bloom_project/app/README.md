# Bloom — Money management app prototype

This is a browser-based first version of the money tracker we discussed. The name **Bloom is temporary** and can be changed later.

## Run it
1. Download and extract the ZIP.
2. Open `index.html` in Chrome, Edge, or another modern browser.
3. Start in **My accounts** and update the balances to match the cash/mobile-money balances you currently have.
4. Add transactions as money comes in or goes out.
5. Use **Savings pockets** to earmark money for regular savings, emergency savings, domestic spending, and personal goals.

## Included
- Pink, responsive dashboard with light animations.
- Account tracking for cash, Orange Money, Lonestar Money, and custom accounts.
- Manually editable account balances.
- Income and expense entry, dates, categories, search and filters.
- Savings pockets with goals, add/use actions, and progress.
- Weekly/monthly/all-time reports and category spending breakdown.
- Daily check-in reminder settings and a quick check-in prompt.
- Settings for display currency and optional weekly spending guide.
- Browser-local persistence using localStorage.

## Important limitations in this prototype
- **No direct mobile-money/SIM connection.** It cannot read Orange Money, Lonestar MTN Mobile Money, bank, or SIM balances. You enter and update those balances yourself. Real integration would require provider-approved APIs, permissions, security, and likely a backend.
- **Reminders are not guaranteed if the page is closed.** The current version checks the reminder time while the app is open. Browser notification support varies, especially when opened directly as a local file. Reliable background notifications would need a hosted app and a service worker/push setup.
- **Data stays in this browser on this device.** There is no account login, cloud sync, encryption layer, backup, or multi-device sync yet. Do not use this prototype to store sensitive financial credentials.
- Transaction entries update the selected account's balance automatically. Editing an account's balance is a manual reconciliation. A savings pocket is a budgeting envelope and is not a separate bank or mobile-money account.
- This is a prototype, not yet a published app or a financial service. Test carefully and tell me what you want adjusted.

## Files
- `index.html` — app layout and dialogs
- `styles.css` — styling and responsive design
- `app.js` — transactions, accounts, pockets, reports, reminders, and local storage
