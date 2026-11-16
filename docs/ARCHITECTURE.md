# Arhitectură
Next.js App Router, React, TypeScript strict, Tailwind v4 și tokeni light/dark. Aplicația rulează pe Mac, legată de 127.0.0.1, fără cloud. Colecția este persistentă în SQLite prin API Node, iar browserul este clientul.
- src/app/page.tsx: landing server; landing-motion + useReveal pentru animații.
- src/app/login: poartă de acces client și transfer idempotent al colecției vechi din browser.
- src/app/app: dashboard, editor și guard de sesiune. Guard-ul actual este pentru accesul UI, nu autentificare server.
- src/lib/model.ts: model, validare, calcule în bani întregi.
- src/lib/useWorkspace.ts: încărcare API, transfer, coadă de salvări optimiste, revizii, stare nesalvată și recuperare/export.
- src/app/api/workspace/route.ts: route Node dinamică, fără cache; GET citire, PUT actualizare cu revizie, POST transfer din browser.
- src/server/workspace-api.ts: limită 5 MB, validare, restricții loopback și Origin pentru scriere, erori fără date interne.
- src/server/database.ts: SQLite integrat Node, schemă, tranzacții, istoric, transfer cu SHA-256 și backup consistent.
- scripts/backup-db.ts: backup SQLite în data/backups, prin npm run db:backup.
- tests/database.test.ts: fișiere temporare independente de baza utilizatorului; persistență, migrare, conflicte, backup și API.
Datele pleacă din browser numai către serverul aplicației de pe Mac. Stocarea principală nu este localStorage. Browserul păstrează doar accesul/sesiunea/tema și copia istorică pentru transfer. Nu sunt șterse automat date existente.
Salvările sunt în serie și verifică revizia; o filă veche nu suprascrie o versiune mai nouă. La eroare, draftul rămâne în memoria paginii și poate fi exportat. Alte file văd schimbările după reîncărcare; nu există sincronizare push. Nu există colaborare, izolare pe cont sau backend de autentificare. Pentru găzduire publică trebuie rezolvate acestea și ales un volum persistent.

## Actualizare: conturi și administrare pe server
- accounts.ts: PBKDF2 server, profil public fără hash-uri, sesiuni hash-uite, roluri, bootstrap admin, rate limiting și audit.
- auth-api.ts + /api/auth/[action]: status, register/login/me/logout/setup; cookie HttpOnly, nu localStorage. Pagini /app și /admin verifică sesiunea pe server; AccessGate verifică din nou la mount/focus și periodic, pentru expirare/revocare fără afișarea datelor din cache.
- user-workspace.ts: colecții separate pe user_id, CAS, istoric și transfer per cont. API workspace autentificat; query userId numai pentru admin. Editorul admin selectat nu preia datele browserului.
- admin-api.ts + /api/admin: acces strict admin, listă utilizatori/colecții/statistici, roluri, blocare/reactivare, resetare parole/revocare sesiuni, backup și audit. Parolele/hash-urile/tokenurile nu sunt afișate.
- /admin/setup: configurare inițială cu cheie unică emisă de scriptul admin:setup în fișier privat pe Mac. Nu este creat un administrator prin simplul fapt că cineva este primul vizitator.
Poarta browser-only și API-ul de colecție neautentificat au fost înlocuite. Conturile și sesiunile sunt acum în SQLite; în browser rămân cookie-ul opac și preferința de temă, plus copii istorice pentru migrare. Aplicația nu este publicată; restricția loopback este păstrată până la configurarea hosting-ului/HTTPS/originilor.
