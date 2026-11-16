# Task-uri
## Finalizat în implementare
- [x] Next.js, TypeScript, Tailwind; MVP local fără cloud.
- [x] Idei, frigider, task-uri, note, tranzacții și obiective.
- [x] Persistență în browser și export/import validat.
- [x] Documentație comună și integrare ECC selectivă.
- [x] Teste domeniu și comenzi verificare.
- [x] Build, lint, tipuri și 4 teste domeniu trecute; verificare UI de bază.
## Următoarele priorități
- [ ] Teste de browser automate: creare, refresh, editare, backup și import invalid.
- [ ] Verificare manuală Safari/Chrome, mobil, tastatură și cititor de ecran.
- [ ] Prevenire conflicte între taburi; limitare/validare uniformă la editare.
- [ ] Separare editor/stocare/dashboard în componente și hook dedicat.
- [ ] Reordonare notițe pe frigider, culori selectabile și filtre pe stadiu.
- [x] SQLite pe Mac și transfer idempotent cu backup, autorizate de utilizator.
Nu începe marketplace sau cloud fără acord.

- [ ] Reevaluează cele 16 probleme moderate ESLint/minimatch (audit runtime: zero).

## Integrare ECC completă
- [x] Catalog integral 314 skill-uri, profil full Antigravity și sursă arhivată fixată.
- [x] Doctor, integritatea instalării, metadate 316 skill-uri și verificările aplicației.
- [ ] Confirmă încărcarea în Antigravity Settings > Customizations într-o conversație nouă.

## Teme
- [x] Tokeni light/dark, dark implicit, selector System / Light / Dark și preferință idee.shop.theme.
- [x] Verificări lint/tipuri/teste/build, bootstrap temă (7 scenarii) și contrast calculat pentru tokeni.
- [ ] Inspecție vizuală teme desktop/mobil: carduri, editor, frigider, focus, disabled, eroare, profit pozitiv/negativ; persistență, System live și lipsa flash-ului (blocat de mediu în sesiunea de implementare).

## Landing public și dashboard /app — 2026-11-03
- [x] Dashboard mutat în src/app/app/page.tsx, logică și cheie idee.shop.v1 păstrate; link înapoi la site.
- [x] Landing server pe /: hero și CTA-uri, problemă/soluție, 3 pași, 6 funcționalități, machetă HTML/CSS, limite, roadmap și footer.
- [x] Metadate distincte pentru landing/dashboard și Open Graph textual pe landing.
- [x] Exclusiv tokenii temei existente; fără librării, fonturi sau imagini externe noi.
- [x] npm run check PASS (lint, tipuri, 4/4 teste și build).
- [x] Browser integrat: rute, CTA-uri, ancoră, retur la site, refresh pe /app și date existente păstrate; ambele pagini fără overflow orizontal la viewport 360/768/1440px.
- [x] Landing inspectat în dark la 360/768/1440px și light la 768px; ierarhie heading-uri, focus tastatură și contrast pe tokenii folosiți verificate.
- [ ] Audit complet cu cititor de ecran și testare în Safari/Chrome independent de browserul integrat.

## Poartă locală /login și /app
- [x] AuthRecord strict, PBKDF2-SHA256 WebCrypto, salt 16 bytes, 210000 iterații, derivare 32 bytes base64.
- [x] Sesiuni 7 zile cu bifă / doar memorie fără bifă, logout și guard fără montarea anticipată a dashboard-ului.
- [x] Formulare română cu autocomplete, labels, aria-live și focus pe primul câmp invalid; recuperare cu confirmare explicită, doar auth șters.
- [x] Teste deterministe hash, parolă scurtă, email, expirare, sesiuni, logout/reset și stocare blocată; npm run check.
- [x] Browser: /app fără sesiune duce la /login, dashboard absent din DOM, erori și focus, confirmare reset dezactivată până la bifă.
- [ ] Verificare manuală completă cu profil creat de utilizator: creare, login, refresh cu/fără bifă, logout și reset. Nu s-au creat credențiale reale în browser în această sesiune.

## Animații explicative
- [x] useReveal + CSS, demo 8s, pauză viewport/document ascuns/manual și fallback reduced-motion final.
- [x] Pașii „Cum funcționează” fără cadrane pătrate, conform feedbackului utilizatorului.
- [x] Check complet, verificare Safari și browser integrat cu Reduce Motion ON/OFF; setare macOS restabilită.
- [x] Lighthouse Performance 100 în profil mobile simulat pe Chromium Brave; rezumat în docs/performance.
- [ ] Test manual Google Chrome (aplicația nu este instalată); profilare FPS pe hardware și matrice responsive completă pentru demo.

## Prezentare de produs
- [x] Revizie completă a textelor vizibile și metadatelor: fără etichete de rulare „local”, „MVP” și jargon de dezvoltare.
- [x] Texte noi landing/dashboard/acces/recuperare, teme în română și informații practice despre păstrarea datelor.
- [x] npm run check PASS, 10/10 teste; audit text în browser pentru / și /login.
- [ ] Planificarea hosting-ului și a infrastructurii de producție, când utilizatorul cere această etapă.

## Bază de date pe Mac
- [x] SQLite persistent și API Node loopback, revizii/conflicte, transfer atomic din browser fără pierdere.
- [x] Coada de salvări, status, blocare la eroare, reîncercare și export draft.
- [x] Teste pentru persistență, migrare repetată, conflicte, backup și API; check PASS (15 teste).
- [x] Colecția existentă transferată efectiv, integritate ok și backup consistent creat.
- [x] Autentificare server, sesiuni SQLite și izolare pe cont.
- [ ] Normalizare tabele pentru volume mai mari; sincronizare push între file dacă devine necesară.

## Conturi și administrare
- [x] Conturi/parole derivate și sesiuni în bază; cookie HttpOnly, expirare/revocare, rate limiting.
- [x] /app și /admin protejate server-side; API admin și colecții autorizate pe rol.
- [x] Panou admin: utilizatori, roluri, stare, sesiuni, resetare parole, toate colecțiile, editare, statistici, export/backup/audit.
- [x] Configurare primul admin cu cheie privată; nu există parolă implicită și signup-ul obișnuit nu acordă rol admin.
- [x] Backup, schemă v2 și colecția existentă păstrată; teste de izolare/permisiuni/cookies/migrare, check PASS (21 teste).
- [x] UI verificată pe baza temporară: login admin, listă conturi, colecția altui cont, editare salvată/auditată, logout și blocarea accesului.
- [ ] Proprietarul completează /admin/setup cu cheia privată și propria parolă; contul real nu a fost creat de agent.
- [ ] Recuperare prin email, verificare email, HTTPS/origini pentru hosting și revizuire înainte de publicare.

## Durate idei si task-uri
- [x] Estimare/efectiv in ore si minute, validare si totaluri fara dublare.
- [x] Carduri, administrare, landing si documentatie actualizate.
- [x] Backup vechi compatibil si roundtrip SQLite; check PASS, 24 teste.
- [x] Browser demo: salvare idee/task, total 1h45, persistenta dupa refresh; formular 360px fara overflow.
- [ ] Cronometru automat numai daca este cerut ulterior.

## Acces Tailscale
- [x] Diagnostic: Serve existent si landing200, API403 din restrictia host loopback.
- [x] Origine HTTPS exacta configurabila, CSRF pastrat si Secure cookie.
- [x] Utilizatorul confirma accesarea adresei HTTPS de pe telefon.

## Tablou pe stadii, Calendar, Cronometru, Break-Even și Categorii
- [x] Tablou dedicat pe stadii (Nouă, În lucru, Finalizată / Validată, Arhivată) cu mutare rapidă prin Drag and Drop nativ și selector accesibil.
- [x] Calendar de planificare cu moduri Zi / Săptămână / Lună, navigare temporală și intervale orare (start – sfârșit).
- [x] Programare multiplă a aceleiași idei sau task în calendar la date și ore diferite, cu ștergere/bifare granulară.
- [x] Cronometru de lucru pe pas/task: start/pauză/reset și adăugare directă la timpul efectiv al fiecărui pas.
- [x] Calculator de prag de rentabilitate (Break-Even): marjă per unitate și vânzări necesare pentru amortizarea costurilor.
- [x] Categorii și etichete: atribuire pe idee, sugestii presetate și filtrare dinamică în toolbar.
- [x] Model extins cu retrocompatibilitate v1 garantată; 31/31 teste PASS, lint/typecheck/build verzi.

## Landing page complet și responsivitate mobilă calendar
- [x] Landing page (`/`) extins cu toate cele 8 funcționalități cheie (Tablou Drag & Drop, Calendar complet, Cronometru, Break-Even, Categorii, Frigider, Pași mici, Salvare automată).
- [x] Hero, pași de lucru („Cum funcționează”) și machetă demonstrativă actualizate cu etichete de categorie, cronometru, ore programate și prag de rentabilitate.
- [x] Responsivitate mobilă calendar (`src/app/globals.css`): celule compacte în mod Lună, carusel fluid cu touch-snap în mod Săptămână, dispunere verticală în mod Zi și comenzi adaptate în două rânduri.
- [x] Responsivitate completă verificată în Chrome DevTools pe viewport 360px x 740px: zero overflow orizontal (`scrollWidth === innerWidth`) pe `/`, `/app` și în toate modurile calendarului.

## Organizarea task-urilor și evoluția spațiului de lucru

- [x] Listă/carduri, prioritate, etichete și progres per idee.
- [ ] Replanificare calendar și recurență.
- [ ] Editor modular, coloane, pagini imbricate, proprietăți, vizualizări și formulare.
- [ ] Sincronizare calendar și notificări după alegerea furnizorului.
- Estimări și criterii de acceptare în WORKSPACE-ROADMAP.md.

- [x] Mutarea programărilor prin drag & drop sau formular în calendar.
- [ ] Verificare interactivă a replanificării pe desktop și telefon.

## Extinderea spațiului de lucru

- [x] Recurență calendaristică zilnică, săptămânală sau lunară, cu interval, finalizare și excepții pe apariție.
- [x] Pagini copil, mutare în ierarhie, blocuri editabile, până la trei coloane și copierea notei în blocuri.
- [x] Proprietăți tipizate, formulare pentru utilizatorii autentificați și vizualizări salvate pentru răspunsuri.
- [ ] Verificare în browser pe desktop și telefon.
- [ ] Sincronizare cu Google Calendar și notificări Web Push.

- [x] Google OAuth și sincronizare manuală Idee.Shop → Google într-un calendar dedicat.
- [ ] Configurare client OAuth și verificare cu un cont Google real.
- [ ] Sincronizare bidirecțională și periodică.

- [x] Endpoint MCP cu cheie per cont și instrumente de citire și creare.
- [ ] Conectare în profilul Hermes și verificare cu cheia contului proprietarului.

## Gestionare prin MCP

- [x] Editare idei și task-uri, adăugare și ștergere task-uri, programare MCP.

## Reordonare pași

- [x] Reordonare task-uri și subpași prin tragere și săgeți.

## Pașii următori

Carduri responsive, progres animat, reordonare pe mâner și detalii pliabile. npm run check trecut cu 35 de teste.

## Vizualizarea task-urilor

- [x] Căutare, filtre combinate și sortare a task-urilor.

## Timp lucrat și tarif

- [x] Cronometru per idee, total lucrat și tarif orar editabil.

## GitHub

- [x] Pregătire locală pentru repository privat.
- [ ] Alegere destinație, commit și verificare după push.
