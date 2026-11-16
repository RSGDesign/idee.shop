# Changelog
## 0.1.0 — 2026-11-03
Prima implementare locală: dashboard, idei, frigider, task-uri, note, venituri/cheltuieli, obiective RON, backup JSON. Proiect Next.js TypeScript Tailwind. Documentație pentru transfer între agenți și skill-uri ECC adaptate, fără automatizări externe.

## 0.1.0 — completare ECC, 2026-11-03
Profil full Antigravity și întregul catalog de 314 skill-uri; 98 workflow-uri, 71 agenți, 122 fișiere reguli. Arhivă upstream fixată prin SHA-256, comenzi locale restore/plan/install/doctor și instrucțiuni Codex/Antigravity actualizate. Fără hook-uri automate sau servicii externe activate.

## 0.1.0 — teme, 2026-11-03
Temă dark implicită, palete light/dark cu tokeni semantici și control System / Light / Dark în sidebar. Preferință locală separată și aplicare inițială în head; actualizare la schimbarea temei sistemului. Frigider, formulare, focus, disabled, erori și profit pe tokeni cu contrast calculat AA. Lint, tipuri, 4 teste și build trecute. Verificarea vizuală rămâne de executat: browser indisponibil și server local blocat cu EPERM în mediul sesiunii.

## 0.1.0 — landing și rută dashboard, 2026-11-03
Landing public de prezentare pe /, cu machetă HTML/CSS și tokenii temei existente; dashboard mutat pe /app cu link de întoarcere. Metadate distincte și Open Graph pentru landing. Logica și cheia localStorage rămân identice, fără migrare de date. Check complet și verificări browser responsive trecute.

## Poartă locală de acces
/login pentru creare/intrare, PBKDF2 WebCrypto și sesiuni locale opționale 7 zile; guard /app, logout, reset exclusiv auth cu confirmare. Fără backend sau conturi remote, fără modificarea colecției de idei. Teste auth și documentație actualizate.

## Animații explicative și pași fără cadrane
Hook useReveal și animații CSS transform/opacity, fără dependențe noi. Hero ilustrat/CTA, accente la scroll și stagger 60ms. Demo 8s cu idee → task → venit 250 RON și progres 65% → profit pozitiv; pauză la ieșirea din viewport, document ascuns și control manual. Reduced Motion afișează cadrul final. Hover -2px și feedback CTA/temă. „Cum funcționează” are pași deschiși și numere circulare, fără cadrane pătrate.
Verificări: npm run check, 10 teste; Lighthouse Performance 100 (mobile simulat, Chromium Brave), CLS 0. Safari și browser integrat inspectate cu Reduce Motion pornit/oprit; Google Chrome manual indisponibil deoarece aplicația nu este instalată.

## Revizuire editorială pentru prezentarea publică
Eliminate referințele vizibile la „local”, „MVP”, cloud/server și mediul de dezvoltare din landing, metadate, dashboard, formulare și erori. CTA-uri și footer orientate spre produs; secțiunea despre limite reformulată ca informație practică privind progresul și păstrarea datelor. Denumirile temelor sunt în română. Logica, datele, animațiile și pașii fără cadrane rămân neschimbate. Check complet PASS, 10/10 teste.

## Persistență SQLite pe Mac
Colecția de idei, task-uri, note, obiective și tranzacții este salvată într-o bază SQLite prin API Node. Transfer automat idempotent din browser, fără ștergerea copiei vechi, conflicte păstrate ca idei separate. Salvări serializate cu revizie, recuperare/export pentru drafturi nesalvate, istoric 100 versiuni și npm run db:backup. Node >=24 și tipuri Node 24. Colecția existentă transferată: 1 idee, 1 task, 1 tranzacție; integritate SQLite ok, backup creat. Check complet: 15/15 teste și build trecute.

## Conturi în bază și panou de administrare
Autentificare pe server: conturi și sesiuni SQLite, cookie HttpOnly, parole PBKDF2 și limitare încercări. Colecții separate pe utilizator și autorizare pe fiecare API. /admin oferă statistici, utilizatori, roluri, blocare/reactivare, resetare parole, revocare sesiuni, acces/editare toate colecțiile, export, backup și jurnal. Primul admin se configurează cu cheie privată unică prin /admin/setup; fără credențiale implicite sau promovarea primului signup. Backup înaintea migrării și colecția existentă păstrată. Check PASS, 21/21 teste și verificare UI pe bază demonstrativă separată.

## 2026-11-03 - Durate idei/task-uri
Durate estimate si efective completate manual, totaluri task-uri plus efort suplimentar, rezumate pe carduri si in administrare. Landing promoveaza timpul in hero, pasi, features, meta si macheta. Backup vechi compatibil; 24 teste, lint, typecheck si build verzi.

## 2026-11-03 - Acces Tailscale
Permisa explicit originea HTTPS privata configurata prin IDEE_APP_ORIGIN; pastrate restrictiile same-origin si listenerul loopback. Cookie Secure prin proxy. Fara publicare sau schimbarea bazei.

## 2026-11-04 — Tablou pe stadii, Calendar, Cronometru, Break-Even și Categorii
- Vizualizare dedicată „Pe stadii” (Nouă, În lucru, Finalizată / Validată, Arhivată) cu mutare rapidă prin Drag and Drop nativ HTML5 și selector accesibil.
- Calendar de planificare cu moduri Zi / Săptămână / Lună, suport pentru intervale orare (start – sfârșit) și programare multiplă a aceluiași pas sau idee.
- Cronometru de lucru integrat pe fiecare pas/task din idee: Start, Pauză, Reset și adăugare automată la efortul efectiv al pasului (`actualMinutes`).
- Calculator de prag de rentabilitate (Break-Even): calculează automat marja brută per unitate și numărul de vânzări necesare pentru amortizarea costurilor totale.
- Categorii și etichete: atribuire pe idee, sugestii rapide, etichetă pe carduri și filtrare dinamică în bara de unelte a colecției.
- Model extins în `src/lib/model.ts`, 100% retrocompatibil cu versiunea 1 a schemei; 31/31 teste trecute, lint, typecheck și build verzi.

## 2026-11-04 — Landing page complet și responsivitate mobilă calendar
- Landing page (`/`) actualizat complet pentru a include toate capabilitățile noi: Tablou pe stadii cu Drag & Drop, Calendar complet (Zi / Săptămână / Lună), Cronometru de lucru pe pași, Calculator Break-Even & Finanțe, Categorii & Filtrare, Frigider vizual și Salvare automată privată.
- 8 carduri de funcționalități detaliate, pași de lucru extinși, hero actualizat și machetă demonstrativă îmbogățită cu etichete de categorie, cronometru, ore programate și prag de rentabilitate.
- Responsivitate mobilă completă pentru Calendar și interfață (`src/app/globals.css` și `src/app/landing.module.css`):
  - Mod Lună compact cu celule touch-friendly și indicatori numerici fără overflow orizontal.
  - Mod Săptămână adaptat cu scroll orizontal fluid cu snap (`scroll-snap-type`) păstrând lățimea paginii la 100%.
  - Mod Zi ordonat vertical pentru lizibilitate pe ecrane înguste (360px – 480px).
  - Comenzi de navigare și selector de moduri reorganizate în grid pe două rânduri pe mobil, prevenind ruperea titlului sau a butoanelor.
  - Verificare live cu Chrome DevTools pe viewport mobil (360px x 740px): `scrollWidth === innerWidth` (overflow: false) pe toate paginile și modurile de calendar.

## Organizarea task-urilor

Dashboardul oferă listă sau carduri, priorități editabile, etichete și progres pe idee. Prioritatea și etichetele se salvează în colecție și sunt opționale în backup.

Programările din calendar se pot muta la altă dată, păstrând intervalul orar.

## Recurență și pagini modulare

Task-urile pot genera apariții recurente în calendar. Fiecare apariție poate fi bifată, mutată sau omisă separat. Ideile includ pagini cu ierarhie, blocuri, coloane, proprietăți tipizate, formulare și răspunsuri filtrabile în tabel sau carduri.

## Dashboard simplificat

Acces direct la ideile fixate, secțiuni distincte în editor și detalii de task afișate la cerere.

Google Calendar oferă conectare OAuth, sincronizare manuală a programărilor către un calendar dedicat și deconectare. Configurarea este descrisă în GOOGLE-CALENDAR.md.

## MCP pentru agenți

Endpoint autentificat pentru căutare, detalii și creare de idei cu task-uri, cu instrucțiuni de conectare Hermes în MCP.md.

## Gestionare prin MCP

MCP poate edita idei, gestiona task-uri și programa sau muta sesiuni în calendar.

## Reordonare pași

Task-urile și subpașii se pot reordona. Detaliile fiecărui task includ lista de subpași.

## Pașii următori

Carduri responsive, progres animat, reordonare pe mâner și detalii pliabile. npm run check trecut cu 35 de teste.

## Vizualizarea task-urilor

Cardurile task-urilor pot fi filtrate după prioritate, etichetă, stare și durată estimată sau efectivă.

## Timp lucrat și tarif

Cronometrul apare în antetul ideii. Sumarul colecției arată timpul efectiv total și valoarea la tariful curent.
