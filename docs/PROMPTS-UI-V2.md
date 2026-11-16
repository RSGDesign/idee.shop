# Prompturi pentru UI v2 (dark, landing, login, animații)

Trei prompturi secvențiale pentru ChatGPT/Codex, apoi unul de verificare pentru Antigravity.
Rulează-le în ordine, în același proiect (`~/Desktop/idee.shop`). Fiecare prompt se termină cu
verificări obligatorii; nu trece la următorul dacă `npm run check` nu e verde.

Decizii deja luate (nu le rediscuta cu agentul):

- `/` = landing public. Dashboard-ul se mută pe `/app`. Cheia de stocare rămâne `idee.shop.v1`
  (datele existente nu se pierd).
- Tema: tokeni CSS, `data-theme` pe `<html>`, dark implicit, toggle persistent, light păstrat.
- Login: poartă locală în browser, NU autentificare reală. Fără backend, fără conturi remote.
- Animații: CSS + IntersectionObserver, fără dependențe noi (fără framer-motion/GSAP).

---

## Prompt 1 — Tema dark cu tokeni

```
Lucrezi în proiectul Next.js 16 + TypeScript strict + Tailwind 4 din ~/Desktop/idee.shop.
Citește întâi AGENTS.md, docs/HANDOFF.md, docs/TASKS.md și src/app/globals.css.

Obiectiv: temă dark completă, fără să strici nimic din ce funcționează.

1. Înlocuiește culorile hardcodate din globals.css cu tokeni semantici în :root și
   [data-theme="dark"]: --bg, --surface, --surface-2, --border, --text, --muted, --accent,
   --accent-soft, --danger, --ok. Trece TOATE regulile existente (button, input, aside, carduri,
   badge-uri, frigider) pe tokeni. Zero hex rămas în afara blocului de tokeni.
2. Dark implicit: <html data-theme="dark">, cu `color-scheme: dark` și contrast minim AA (4.5:1
   pentru text normal, 3:1 pentru elemente de UI) pe fundalul folosit efectiv.
3. Toggle: buton în sidebar cu trei stări (System / Light / Dark), salvat în localStorage sub
   `idee.shop.theme`, aplicat pe <html> înainte de prima randare ca să nu clipească (script inline
   mic în layout.tsx sau atribut setat din CSS media query). Respectă prefers-color-scheme când
   starea e "System".
4. Verifică vizual toate stările: card normal, card selectat, frigider, input focus, buton disabled,
   eroare, badge de profit pozitiv și negativ.
5. Nu schimba structura HTML, logica, stocarea sau textele.

La final: npm run lint, npm run typecheck, npm test, npm run build — toate verzi.
Actualizează docs/HANDOFF.md și CHANGELOG.md. Raportează ce ai verificat vizual și ce nu.
```

---

## Prompt 2 — Landing page public + mutarea dashboard-ului pe /app

```
Continuăm în ~/Desktop/idee.shop. Tema dark e deja făcută.

Obiectiv: landing page public pe `/` și dashboard pe `/app`, fără pierdere de date.

1. Mută dashboard-ul actual din src/app/page.tsx în src/app/app/page.tsx (ruta /app).
   Nu schimba logica, cheia `idee.shop.v1` sau comportamentul. Adaugă un link discret
   "← Înapoi la site" în dashboard.
2. Creează src/app/page.tsx ca landing public, server component unde se poate, în română,
   cu aceste secțiuni în ordine:
   - Hero: titlu scurt + subtitlu + 2 CTA ("Începe gratuit — local" → /app, "Vezi cum funcționează"
     → ancoră). Badge "Local · fără cont în cloud · datele rămân la tine".
   - Problema → soluția: 3 propoziții despre idei care mor în notițe.
   - Cum funcționează: 3 pași numerotați (Adaugi ideea → O lucrezi în pași mici → Vezi ce aduce).
   - Funcționalități: grid de 6 carduri scurte (idei, frigider, task-uri, note, venituri/cheltuieli
     în RON, backup JSON).
   - Previzualizare produs: machetă statică a dashboard-ului construită în HTML/CSS (fără imagini
     externe, fără screenshot), care arată 2 idei, un task bifat și un profit.
   - Onestitate: secțiune "Ce NU face încă" — fără cloud, fără sincronizare, fără marketplace,
     datele se pierd dacă ștergi datele browserului.
   - Roadmap scurt (3 puncte) și footer cu "Construit local, pentru uz personal".
3. Meta: title și description pentru landing, separate de dashboard; Open Graph simplu.
4. Stil: folosește EXCLUSIV tokenii de temă din pasul anterior. Fără font nou, fără librărie de
   iconițe, fără imagini externe. Responsive real la 360px, 768px, 1440px.
5. Accesibilitate: ierarhie corectă de heading-uri, focus vizibil, contrast AA, linkuri cu scop clar.

La final: npm run check verde. Verifică în browser că / afișează landing-ul și /app afișează
dashboard-ul cu datele existente. Actualizează README.md, docs/TASKS.md, docs/HANDOFF.md.
```

---

## Prompt 3 — Sistem de login local (poartă, nu securitate)

```
Continuăm în ~/Desktop/idee.shop. Landing-ul e gata pe `/`, dashboard-ul pe `/app`.

Obiectiv: poartă de acces locală pentru /app. Citește cu atenție limitele: NU este autentificare
reală, nu există backend, nu există conturi remote.

1. Model nou în src/lib/auth.ts (TypeScript strict, fără dependențe):
   tip AuthRecord = { version: 1; name: string; email: string; salt: string; hash: string;
   iterations: number; createdAt: string }.
   Hash: PBKDF2-SHA256 prin WebCrypto (crypto.subtle), salt aleator 16 bytes, 210000 iterații,
   cheie derivată 32 bytes, stocată base64. Niciodată parola în clar, niciodată în loguri.
2. Stocare: `idee.shop.auth.v1` pentru cont, `idee.shop.session.v1` pentru sesiune.
   Sesiune = { email, expiresAt } cu durata 7 zile dacă userul bifează "Ține-mă minte",
   altfel doar în memorie (pierzi sesiunea la refresh) — documentează diferența.
3. Rute și fluxuri:
   - /login: dacă nu există cont → formular de creare (nume, email, parolă minim 8 caractere,
     confirmare). Dacă există cont → formular de autentificare.
   - După creare/autentificare → redirect /app.
   - /app verifică sesiunea; fără sesiune validă → redirect /login. Fără flash de conținut.
   - Buton "Ieși" în dashboard care șterge sesiunea și duce la /.
4. Recuperare: link "Am uitat parola" explică cinstit că parola nu poate fi recuperată (nu există
   server) și oferă "Resetează accesul local": șterge doar `idee.shop.auth.v1`, păstrează datele
   din `idee.shop.v1`, cere confirmare explicită.
5. Text vizibil în /login, o singură propoziție, onest: "Aceasta este o protecție locală, nu o
   autentificare pe server. Cine are acces la acest browser poate citi datele."
6. Mesaje de eroare clare și în română pentru: email invalid, parolă prea scurtă, confirmare
   diferită, parolă greșită (fără a dezvălui dacă emailul există), eroare de stocare.
7. Accesibilitate: labels asociate, autocomplete corect (email, current-password, new-password),
   erori anunțate cu aria-live, Enter trimite formularul, focus pe primul câmp invalid.

Teste: adaugă în tests/auth.test.ts teste pentru hash determinist cu același salt, respingerea
parolei scurte, expirarea sesiunii și validarea emailului. Fără teste care depind de timp real.
La final: npm run check verde. Actualizează docs/DECISIONS.md cu ADR-008 (poartă locală, limite
asumate), docs/DATABASE.md (structurile din localStorage), README, HANDOFF, TASKS.
```

---

## Prompt 4 — Animații pe landing (pentru Antigravity, ca verificare secundară)

```
Proiect: ~/Desktop/idee.shop. Landing pe `/`, dashboard pe `/app`, temă dark cu tokeni,
login local funcțional.

Obiectiv: animații care explică utilitatea produsului, fără să încarce pagina.

1. Fără dependențe noi. Doar CSS + un hook useReveal (IntersectionObserver) în
   src/lib/useReveal.ts. Animații pe transform și opacity exclusiv.
2. Intrarea în pagină: hero-ul apare cu un fade+translate de 12px, 400ms, iar CTA-ul cu 80ms
   întârziere. Restul secțiunilor se revelă la scroll, o singură dată, cu stagger de 60ms între
   carduri (max 6 elemente per grup).
3. Demonstrație animată a utilității (în secțiunea de previzualizare produs, buclă de 8 secunde,
   rulează doar când e vizibilă în viewport, se oprește cu visibilitychange):
   pas 1 apare o idee nouă → pas 2 un task se bifează → pas 3 un venit de 250 RON apare și bara de
   progres crește la 65% → pas 4 profitul se colorează pozitiv. Fiecare pas cu 300ms ease-out.
4. Micro-interacțiuni: hover pe carduri (ridicare 2px + umbră), focus ring vizibil, toggle de temă
   cu tranziție 200ms, buton CTA cu feedback la apăsare.
5. prefers-reduced-motion: reduce → fără nicio animație, totul apare direct în starea finală;
   demonstrația arată un cadru static. Testează explicit cu această setare.
6. Performanță: fără animații pe layout (nu anima width/height/top/left), fără box-shadow în buclă,
   nimic peste 60fps. Lighthouse performance pe / nu scade sub 90.
7. Nu anima textul de citit esențial, nu bloca interacțiunea, nu porni animații în afara viewport-ului.

La final: npm run check verde, verificare manuală în Chrome și Safari cu reduced-motion pornit și
oprit. Actualizează HANDOFF.md și CHANGELOG.md și notează în DECISIONS.md de ce nu s-a adăugat o
librărie de animații.
```

---

## Reguli pentru toate cele patru

- Nu adăuga servicii externe, analytics, fonts CDN sau imagini externe.
- Nu atinge `src/lib/model.ts` decât dacă e strict necesar, și atunci cu teste.
- Nu șterge date: cheia `idee.shop.v1` rămâne neschimbată.
- Fiecare prompt se încheie cu `npm run check` verde și cu docs actualizate.
- Dacă un pas cere o decizie nouă (ex. backend pentru conturi reale), oprește-te și întreabă.
