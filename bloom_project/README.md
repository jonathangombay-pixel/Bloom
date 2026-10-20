# Money App Project — separate website + app

The project is split into two distinct parts:

- `website/` — a separate product landing/download page. It has platform cards for Android APK, Windows EXE, and macOS DMG. The site does not open the app inside itself.
- `app/` — the separate money-management web-app prototype, with its own calmer splash screen and the slogan “Freedom from financial disability.”

## Platform installer status
The website now shows platform release statuses only. It no longer includes a prototype-download button or a duplicate app ZIP. Actual `.apk`, `.exe`, and `.dmg` installers have not been produced. The app prototype will be prepared and hosted separately for testing.

## Preview locally
Open `website/index.html` and `app/index.html` separately in a browser. The website is only the product/download page; the app interface is separate. PWA installation requires secure HTTPS hosting.

## Mobile-money integration
The app currently tracks mobile-money balances manually. It does not read wallet balances or transactions automatically. Orange Liberia and Lonestar MTN Liberia must confirm approved access to the required customer wallet APIs before that feature can be implemented. Never collect a mobile-money PIN or OTP in the app.

Official API starting points:
- Lonestar Cell MTN Liberia developer portal: https://lonestarcell.com/developer/
- Orange Money Web Payment API: https://developer.orange.com/apis/om-webpay/
- Orange Money API FAQ: https://developer.orange.com/apis/om-webpay/faq
