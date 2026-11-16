# Date și persistență
## Sursa principală: SQLite pe Mac
Node >=24, modulul integrat node:sqlite. Fișier implicit `data/idee-shop.sqlite`, cale opțională prin `IDEE_DATABASE_PATH` în .env.local. Fișierul și directorul de backup sunt private, excluse din Git și din directorul public Next. Permisiuni: fișier 0600, directoare noi 0700. Serverul rulează numai pe 127.0.0.1.
Schema v1 (PRAGMA user_version):
- `workspace(id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER, payload TEXT)`: un singur spațiu personal; payload este colecția validată `{version:1, ideas:Idea[]}`. JSON-ul este stocat tranzacțional în SQLite, nu într-un fișier JSON sau localStorage. Nu există încă tabele normalizate separate pentru fiecare entitate.
- `workspace_history(revision PRIMARY KEY, payload, saved_at)`: ultimele 100 de versiuni anterioare, păstrate înaintea modificării.
- `browser_migrations(digest PRIMARY KEY, imported_at)`: SHA-256 al colecției importate, pentru transfer idempotent fără duplicate la refresh.
WAL, synchronous FULL, busy_timeout 5000ms; conexțiunea este închisă după cerere. O versiune de schemă viitoare necunoscută este respinsă. Nu șterge manual fișierele -wal/-shm cât timp aplicația rulează.

## Model de domeniu
Schema efectivă și validarea: src/lib/model.ts. Idea: id UUID, title, description, status (Nouă/În lucru/Validată/Arhivată), potential text, goalCents întreg nenegativ, notes, pinned, tasks[], entries[]. Task: id, title, done. Entry: id, kind income/expense, cents întreg, date YYYY-MM-DD, label. RON în bani întregi; profit = venituri − cheltuieli. Obiectivul măsoară veniturile.
Import și API: maximum 5 MB pentru cerere, maximum 5000 idei, validare înainte de scriere. Validatorul verifică formatul datei, nu existența calendaristică. SQL folosește parametri pentru payload și căi backup.

## Salvare și concurență
GET /api/workspace returnează `{store,revision}`. PUT primește `{store,revision}`; BEGIN IMMEDIATE verifică revizia și face snapshot + update atomic. Revizie depășită: HTTP 409, fără suprascriere. Clientul serializează salvările și afișează salvarea în așteptare. La eroare păstrează ultima stare editată în memorie, blochează editarea și permite export JSON/reîncercare. Nu există coadă offline persistentă: închide pagina numai după confirmarea salvării sau exportă draftul.
POST /api/workspace transferă vechea colecție din browser într-o tranzacție. Date identice: fără dublare; ID comun cu date diferite: păstrează ambele idei, copia primește UUID nou și sufix în titlu. La transfer repetat același digest nu reimportă versiunile vechi. Marcajul este în bază, nu în browser. Copia `idee.shop.v1` rămâne nemodificată și exportabilă din dashboard. Transferul este încercat în pagina de acces și la încărcarea dashboard-ului.

## Acces și limite
Este o bază comună acestui proiect/server, nu câte o bază pentru fiecare email. Poarta de acces existentă nu este autentificare server și nu izolează utilizatori. API-ul acceptă doar hosturi loopback; scrierile cer Origin identic și application/json. Nu expune serverul în LAN sau internet înaintea implementării autentificării server și izolării conturilor. Nu există criptare a bazei.
În browser rămân separat:
- `idee.shop.auth.v1`: AuthRecord v1 (name, email, salt, hash, iterations, createdAt), PBKDF2-SHA256 210000 iterații, salt 16 bytes/hash 32 bytes base64; parola nu este salvată.
- `idee.shop.session.v1`: `{email,expiresAt}`, opțional 7 zile. Fără bifă, sesiunea este doar în memorie.
- `idee.shop.theme`: preferința de temă.
- `idee.shop.v1`: copia veche de migrare, nu este actualizată la editări noi.
Ștergerea datelor browserului pierde accesul/preferințele, nu colecția deja transferată în SQLite. Un profil nou în browser poate folosi aceeași bază.

## Backup și restaurare
`npm run db:backup` folosește VACUUM INTO și creează o copie consistentă în `data/backups/*.sqlite`, chiar dacă există WAL. Istoricul intern nu înlocuiește un backup separat al discului. Exportul JSON din aplicație rămâne disponibil; nu conține accesul sau sesiunea.
Pentru restaurarea SQLite: oprește aplicația; păstrează o copie a fișierelor existente (inclusiv WAL/SHM) și lucrează într-un director nou. Configurează `IDEE_DATABASE_PATH` spre copia .sqlite salvată, apoi pornește aplicația. Nu suprascrie o bază deschisă. Backup-urile sunt pe același disc până când utilizatorul le copiază separat.
Pentru viitorul hosting trebuie un volum persistent și backup separat; un filesystem efemer/serverless nu păstrează această bază între deployment-uri.

## Schema v2 — conturi, sesiuni și administrare (starea actuală)
Această secțiune înlocuiește accesul browser-only și colecția comună descrise mai sus. Schema v1 și colecția sa sunt păstrate pentru migrare/recuperare.
- `users`: id, name, email unic normalizat, salt, hash, iterations, role (`admin`/`user`), active, created_at. PBKDF2-SHA256 pe server, 210000 iterații, salt aleator 16 bytes, derivare 32 bytes base64. Niciodată parola în clar.
- `sessions`: token_hash SHA-256 (cheie primară), user_id FK, expires_at. Token brut 32 bytes aleatoare, doar în cookie HttpOnly/SameSite=Strict; Secure pentru cereri HTTPS. 7 zile cu remember, altfel cookie de sesiune și TTL 12 ore.
- `user_workspaces`: user_id FK/PK, revision, payload JSON validat. Separare pe cont; API-ul folosește id-ul sesiunii, fără încredere în email sau id trimis de client.
- `user_history`: user_id, revision, payload, saved_at; PK compus și ultimele 100 versiuni per cont.
- `user_migrations`: user_id + digest; transfer idempotent separat per cont.
- `browser_import_owners`: conturi autorizate pentru transfer automat (administrator configurat sau profil vechi verificat prin parolă). Împiedică importul tacit în conturile noi care folosesc același browser.
- `admin_setup`: hash-ul cheii de configurare, expirare 24 ore. Consumare atomică și un singur administrator inițial prin acest flux. Cheia brută este în fișier privat separat, exclus din Git; nu se servește pe web și nu este logată.
- `admin_events`: actor_id, action, target_id, created_at; fără parole, tokenuri sau conținutul notelor. Include configurare, roluri, blocare, resetare parole, revocare sesiuni, backup și editări administrative de colecții.
- `auth_throttle`: chei de limitare a încercărilor login/înregistrare, count și expires_at.
Cookie-ul `idee_session` este verificat pe fiecare API și citit pe server în /app și /admin. Rolul/active sunt recitite din users, iar sesiunile revocate/expirate sunt respinse. ID-urile din query sunt permise doar administratorilor; toate scrierile rămân same-origin/JSON/loopback, cu validare și SQL parametrizat. Datele de acces nu sunt returnate în /api/admin sau exportul JSON.
Primul administrator creat cu cheia proprietarului primește colecția workspace v1, istoricul și marcajele de migrare. Conturile obișnuite încep cu colecție goală; înregistrarea nu permite alegerea rolului. Datele legacy nu sunt șterse. Resetarea neautentificată care ștergea profilul browserului nu mai există; parola unui cont se resetează prin admin, cu revocarea sesiunilor. Nu există încă recuperare prin email sau criptare a fișierului bazei.

## Durate pe Idea si Task
Campuri JSON optionale estimatedMinutes si actualMinutes: intregi 0..5256000 sau null. Absenta/null inseamna nespecificat; zero este valid. La idee estimatedMinutes este bugetul total, iar actualMinutes este efort suplimentar in afara task-urilor. Se valideaza in API/import. Payload v1 si schema SQLite v2 raman neschimbate; backup-urile vechi sunt acceptate fara normalizare, deci digestul migrarii nu se modifica. Istoricul si exporturile includ noile campuri.
