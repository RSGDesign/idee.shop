# ECC complet în Idee.Shop
## Stare
ECC 2.2.3, commit b38be6a7f6350964d59328b52f0624e1d1d552d1, sursa https://github.com/affaan-m/ECC, integrare 2026-11-03.
Este înlocuită integrarea inițială cu două adaptări prin profilul upstream **full**, plus includerea explicită a fiecărui skill upstream. Sunt instalate **314 skill-uri ECC**, alături de cele două ghiduri Idee.Shop (316 total), **98 workflow-uri**, **71 definiții de agenți** și **122 fișiere de reguli** (inclusiv README inert). 911 operații de copiere gestionate de instalator. Regula proprie idee-shop-project.md este adăugată separat (123 fișiere în rules în total).

## Ce înseamnă complet
- Întreaga sursă Git urmărită la commitul fixat este inclusă ca arhivă .ecc/vendor/ecc-b38be6a7.tar.gz, cu SHA-256 în .ecc/source.json. Nu include .git, node_modules sau secrete.
- Sursa se restaurează în .ecc/upstream (ignorat în Git), împreună cu dependențele instalatorului, fără scripturi npm de lifecycle. Licență MIT păstrată în docs/ECC-LICENSE.txt și arhivă.
- Adaptorul oficial Antigravity instalează reguli cu trigger nativ și agenți cu frontmatter convertit. Planul este limitat explicit la copiere în .agents; nu se scrie în setările globale ale utilizatorului.
- Cele 12 skill-uri omise din profilul Antigravity sunt incluse explicit; catalogul upstream este astfel complet. Unele au nevoie de alte aplicații, chei sau servicii și nu sunt executabile integral fără acele condiții.
- Codex poate utiliza catalogul comun și procedurile; .codex/AGENTS.md explică diferențele. Nu pretindem că agenții Antigravity devin roluri Codex sau că workflow-urile devin automat slash commands Codex.
- Claude are instrucțiuni de acces manual în CLAUDE.md; nu este instalat un plugin global Claude. GEMINI.md descrie Antigravity.

## Funcționalități care rămân inactive
Adaptorul upstream nu materializează runtime-urile hooks-runtime, hermes-hooks, media-generation și orchestration ca runtime complet. Toate sursele lor sunt în arhivă, iar skill-urile sunt disponibile. Nu există paritate completă între Claude, Codex și Antigravity.
Hook-urile automate rămân neactivate: capabilitățile declarate upstream includ modificare automată de surse, control procese, trimitere de text derivat din conversații către LLM extern, probe MCP și jurnalizarea sesiunilor. Nu au fost activate MCP, auto-update, plugin global, servicii cloud sau credențiale. Instalarea catalogului nu autorizează folosirea lor.
Nu s-a făcut audit integral de securitate pentru toate cele 314 skill-uri/scripturile lor. Au fost examinate intrările instalatorului, planificarea/aplicarea și transformările relevante; scripturile unui skill trebuie inspectate înainte de prima execuție. Instrucțiunile proiectului și cererile utilizatorului au prioritate.

## Comenzi locale
```sh
npm run ecc:restore  # verifică SHA-256, extrage sursa; instalează deps cu --ignore-scripts
npm run ecc:plan     # arată operațiile fără scriere
npm run ecc:install  # aplică profil full + toate skill-urile, exclusiv local
npm run ecc:doctor   # verifică starea și integritatea fișierelor gestionate
```
Comenzile folosesc API-urile instalatorului upstream pentru a evita proiecția globală SQLite a CLI-ului. Starea gestionată este în .agents/ecc-install-state.json. Nu edita fișierele gestionate direct; adaugă reguli proprii cu nume diferite și documentează adaptările. npm ci din rădăcină instalează aplicația; ecc:restore pregătește separat instrumentele ECC. Folderul de sursă extras este exclus din lint și TypeScript ale aplicației, ca și exemplele din .agents.
După mutarea/clonarea proiectului, rulează restore, plan, install, doctor: starea ECC conține căi absolute și trebuie regenerată pentru noua locație. Adaptorul local verifică amprentele fișierelor înainte de relocarea stării; dacă un fișier gestionat a fost modificat, se oprește și cere revizuirea manuală a acelui fișier, fără a-l suprascrie. La instalare, fișierele existente modificate de utilizator sunt păstrate de mecanismul upstream și raportate; examinează avertismentele.

## Folosire
În Antigravity 2.0: deschide workspace-ul, verifică Settings > Customizations și începe o conversație nouă. Cere un skill după nume sau un workflow (de exemplu /plan). În Codex, începe un chat din folderul proiectului și cere tdd-workflow, security-review ori verification-loop după nume. Încarcă doar ce este relevant, pentru a evita umplerea contextului cu întregul catalog. Disponibilitatea pe disc și doctor nu dovedesc încărcarea în UI Antigravity; aceasta rămâne de confirmat în aplicația utilizatorului.

## Actualizare controlată
1. Descarcă separat noua sursă upstream; notează commitul și licența. Nu rula install.sh sau alte scripturi înainte de examinare.
2. Compară instalatorul, transformările, manifests, scripturile și skill-urile modificate. Verifică efectele asupra rețelei, directoarelor globale și datelor.
3. Generează o nouă arhivă prin git archive la commitul ales; actualizează numele, versiunea, commitul și SHA-256 din .ecc/source.json. Păstrează copia precedentă până la verificare.
4. Folosește un director de sursă extras nou pentru noua versiune (restore nu suprascrie automat o extragere existentă). Nu amesteca surse de versiuni diferite.
5. Rulează restore, plan, install, doctor; examinează diferențele și avertismentele. Rulează verificările aplicației. Actualizează documentele și commitul local.
Fără actualizare automată. Pentru revenire folosește commitul Git anterior într-un checkout separat, restore și install, păstrând mai întâi orice fișiere personale modificate.

## Referințe
- https://github.com/affaan-m/ECC/blob/b38be6a7f6350964d59328b52f0624e1d1d552d1/docs/ANTIGRAVITY-GUIDE.md
- https://developers.openai.com/codex/skills
