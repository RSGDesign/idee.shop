# Decizii
## 2026-11-03 — ADR 001: local mai întâi
Aplicație web pe Mac, fără cloud. localStorage accelerează validarea produsului; costul este dependența de browser și lipsa sincronizării. SQLite poate urma după validare.
## ADR 002: bani întregi
RON în bani, fără calcule de business pe float. Sume maximum 9 cifre înainte de separator; două zecimale. Profitul poate fi negativ. Obiectivul măsoară venituri.
## ADR 003: memorie portabilă
AGENTS.md este sursa comună; GEMINI/CLAUDE trimit la ea. HANDOFF descrie starea efectivă. Markdown lizibil manual evită dependența de autodetectarea agentului.
## ADR 004: ECC selectiv
Doar două adaptări Markdown verificate, sursă fixată la commit, licență păstrată; fără scripturi/hook-uri/configurări globale. Vezi ECC.md.
## ADR 005: marketplace amânat
Fără listare publică sau vânzări până la validarea produsului personal și decizii privind proprietatea intelectuală, verificarea rezultatelor și plățile.

## ADR 006: Webpack pentru mediul local verificat
Turbopack nu poate crea portul intern în mediul de execuție. Folosim `next build --webpack` și PostCSS oficial Tailwind, fără fonturi externe. Build-ul astfel configurat a trecut. Comenzile Next dezactivează telemetria.

## ADR 007: ECC complet local, cerut explicit
Înlocuiește ADR 004 privind subsetul limitat: profil full Antigravity și toate cele 314 skill-uri upstream, sursă completă arhivată și fixată prin checksum. Nicio configurare globală. Automatizările externe și hook-urile sunt neactivate; disponibilitatea sursei nu presupune paritate între aplicații.

## ADR 009: prezentare pe /, aplicație pe /app (renumerotat pentru ADR-008 de acces local)
Landing-ul este Server Component cu un selector de temă client existent; dashboard-ul client este mutat intact sub /app. Persistența rămâne la aceeași origine, cheia idee.shop.v1 nu se modifică și nu este necesară migrarea datelor. Macheta publică este HTML/CSS static cu exemple, fără acces la date personale. Public se referă la rolul paginii, nu la o publicare pe internet.

## ADR-008: poartă locală de acces, limite asumate
Un singur profil local per origine de browser, fără backend, identitate verificată, cont remote sau recuperare prin email. PBKDF2-SHA256 prin WebCrypto, salt aleator 16 bytes, 210000 iterații, derivare 32 bytes, salt și hash base64. Parola nu se stochează și nu se înregistrează în loguri. Datele ideilor nu sunt criptate și pot fi citite de cine are acces la browser; poarta poate fi ocolită modificând stocarea sau codul client. Nu reprezintă autentificare pe server.
Sesiunea conține email și expiresAt numeric în milisecunde: maximum 7 zile. Cu „Ține-mă minte” se păstrează în localStorage; fără bifă, doar în memoria modulului client, menținută la navigare internă și pierdută la refresh/închidere. Guard-ul nu montează dashboard-ul înaintea verificării; verifică din nou la expirare, focus și evenimente storage. Ieșirea șterge sesiunea, nu profilul sau ideile.
Resetarea cu confirmare explicită șterge exclusiv cheia auth și invalidează memoria sesiunii. O eventuală sesiune persistentă veche rămâne inertă fără profil; următoarea creare/login o elimină sau o înlocuiește. Cheia idee.shop.v1 și tema sunt păstrate; noul profil local reutilizează colecția, fără separare între utilizatori. Backup-ul ideilor nu include accesul local. Erorile de stocare nu acordă acces.

## ADR 010: animații CSS și IntersectionObserver, fără bibliotecă
Animațiile necesare sunt scurte și folosesc exclusiv transform/opacity. CSS poate compune aceste efecte fără un scheduler JavaScript pe fiecare cadru; un singur hook useReveal gestionează intrarea în viewport, visibilitychange, preferința reduced-motion și cleanup. Nicio dependență nouă în package.json/lockfile. Landing-ul rămâne Server Component cu un înveliș client mic, iar demo-ul folosește markup server și un buton client de pauză.
Pentru lizibilitate, titlul și paragrafele esențiale nu sunt animate: hero-ul animează ilustrația și grupul CTA (400ms, 12px, delay 80ms), secțiunile revelează accente decorative, iar cardurile/bulinele au stagger 60ms, maximum 6. „Cum funcționează” este un flux deschis cu numere circulare și săgeți statice, fără cadrane sau fundaluri de card, conform feedbackului utilizatorului.
Demo-ul repetă 8s cu ferestre de 300ms ease-out: idee, bifă, +250 RON/progres 65%, profit pozitiv prin suprapunere cu opacity. Progresul folosește scaleX, nu width; schimbarea culorii profitului folosește opacity, nu tranziție color. Umbra hover este statică, fără animație a box-shadow; ridicarea este transform -2px. Nu există buclă rAF, interval sau animație de layout. CSS urmează rata de afișare a browserului; nu se pretinde o măsurare sau limitare rigidă la 60fps pe monitoare cu refresh mai mare.
Cu reduced-motion sau fără JS/IntersectionObserver se afișează cadrul final. În afara viewport-ului ori într-un document ascuns, animațiile sunt puse pe pauză; cleanup elimină listenerii și observer-ul. Există control manual de pauză lângă demo. Lighthouse este instrument temporar de verificare, nu dependență a proiectului.

## ADR 011: prezentare de produs, independentă de mediul de rulare
La cererea utilizatorului, interfața și metadatele nu mai afișează „local”, „MVP” sau explicații despre server/cloud și mediul de dezvoltare. Landing, CTA-uri, badge-uri, dashboard, acces, resetare și mesaje de eroare folosesc limbaj de produs pregătit pentru public. Aceasta înlocuiește textele impuse anterior pentru prototip, inclusiv propoziția exactă din login; explicația privind accesul la date este reformulată practic, fără a pretinde protecție pe server.
Textul despre salvarea în browser, lipsa sincronizării și copii de siguranță rămâne în secțiunile potrivite, deoarece descrie comportamentul real. Recuperarea parolei prin email nu este promisă. Nu există modificări de infrastructură, autentificare sau stocare și nu s-a publicat proiectul. Cheile și semantica sesiunilor sunt păstrate. „Gata de publicat” descrie prezentarea vizuală/editorială; evaluarea pentru hosting și securitate este o etapă separată.

## ADR 012: SQLite persistent pe Mac pentru colecție
Utilizatorul solicită stocare în bază de date găzduită pe Mac. Colecția părăsește rolul de sursă principală al localStorage și este păstrată în SQLite prin API Next Node. Folosim node:sqlite integrat, Node >=24, fără driver/ORM sau serviciu SQL extern. @types/node este actualizat la seria 24. Această decizie înlocuiește alegerea localStorage pentru datele de business din ADR 001; accesul/sesiunea/tema rămân neschimbate.
Un singur workspace cu payload JSON validat în SQLite permite migrarea modelului actual fără conversii distructive; este o etapă înainte de normalizarea pe tabele Idea/Task/Entry. BEGIN IMMEDIATE + revizie CAS previn suprascrierea între file. Istoricul ultimelor 100 versiuni și VACUUM INTO oferă recuperare/backup. Transferul vechii colecții este atomic, idempotent prin SHA-256 și păstrează ambele variante dacă un ID are conținut diferit. Browserul nu este șters.
API-ul este limitat la loopback și scrieri same-origin; aceasta nu înlocuiește autentificarea server, criptarea ori izolarea pe cont. Nu se publică sau expune rețeaua. Înainte de hosting: sesiuni server, conturi izolate, volum persistent și politici de backup. Scrierea optimistă păstrează draftul la eroare; acesta nu este o coadă offline durabilă, deci utilizatorul trebuie să aștepte salvarea sau să exporte.

## ADR 013: conturi în SQLite și panou admin cu autorizare server
Userul cere date de conectare în bază și acces administrativ la toate datele. Implementăm users/sessions și colecții pe cont. Înlocuiește poarta de acces din ADR-008 și limita de autentificare din ADR 012. Parolele rămân PBKDF2-SHA256, cu salt aleator și verificare timingSafeEqual pe server. Tokenurile de sesiune sunt aleatoare, cookie HttpOnly/SameSite=Strict, iar în bază se păstrează doar hash-ul; nu folosim JWT sau tokenuri în localStorage.
Adminul vede utilizatorii, toate colecțiile și evidența financiară, le poate edita prin același dashboard, poate gestiona roluri/stări, revoca sesiuni, reseta parole și face backup. Nu există acces la parole în clar. Operațiile verifică rolul pe server, nu doar prin ascunderea butoanelor. Ultimul administrator activ este protejat; blocarea și modificările de securitate revocă sesiunile.
Primul admin se configurează cu o cheie generată pe Mac, 24 ore/o singură utilizare, păstrată 0600 în data/ și hash-uită în bază. Proprietarul își alege credențialele direct în aplicație. Primul signup nu capătă privilegii. Colecția v1 existentă este atribuită adminului la configurare, cu păstrarea originalului. Profilul vechi poate migra la login după dovedirea parolei, fără rol admin; conturile noi nu importă automat datele unui browser utilizat anterior de alt profil.
Sesiunea fără remember devine cookie de sesiune cu TTL 12 ore și supraviețuiește refresh-ului; cu remember TTL 7 zile. Recuperarea neautentificată care ștergea profilul este eliminată: resetarea unui cont persistent aparține adminului; emailul nu este încă verificat și nu există recuperare prin email. API-urile rămân loopback/same-origin până la alegerea hosting-ului, fără publicare implicită. Backup-urile SQLite conțin date de acces hash-uite și trebuie păstrate privat.

## ADR 014: durate manuale in minute
Estimari si timp efectiv pe idei/task-uri fara dependente sau cronometru. Campuri optionale pentru compatibilitate cu backup v1. Estimarea ideii este bugetul total; daca lipseste, folosim suma task-urilor cunoscute. Efectiv = task-uri + efort suplimentar, explicat in UI pentru a evita dubla numarare. Nu completam automat timpul la bifare. Totalurile partiale includ doar campurile completate. Landing promoveaza completarea/compararea manuala disponibila.

## ADR 015: origine HTTPS explicita pentru Tailscale Serve
Acces privat cerut de utilizator. Listenerul ramane loopback; proxy-ul Tailscale deja configurat ofera HTTPS in tailnet. IDEE_APP_ORIGIN permite o singura origine HTTPS exacta, fara path/credentials/query. Verificarea Origin pentru scrieri ramane obligatorie; forwarded headers nu acorda incredere. Cookie Secure pe originea configurata. Fara wildcard ts.net, schimbari ACL, Funnel sau publicare.

## ADR 016: metadate opționale și vizualizări pentru task-uri

Prioritatea și etichetele sunt câmpuri opționale ale task-ului în payload v1. Validarea se aplică la import și salvare, iar backup-urile vechi rămân compatibile. Lista și cardurile folosesc aceleași controale. Preferința de afișare durează cât sesiunea paginii. Progresul se calculează din starea task-urilor.

## ADR 017: recurență și pagini în colecția existentă

Regulile recurente produc apariții pe date întregi, iar excepțiile sunt indexate prin data originală. Recurența lunară folosește ultima zi a lunii dacă ziua inițială lipsește. Paginile, blocurile și răspunsurile sunt câmpuri opționale validate la import și salvare în payload v1. Formularele sunt parte din editorul colecției autentificate. Reordonarea blocurilor este disponibilă prin tragere și butoane. Indentarea este vizuală. Furnizorul ales pentru etapa externă este Google Calendar, iar canalul ales este Web Push.

## Google Calendar cu acces limitat

Conexiunea OAuth pe utilizator folosește state de unică folosință, PKCE și token de refresh criptat. Sincronizarea lansată explicit de utilizator trimite date către un calendar secundar creat de aplicație cu scope calendar.app.created. Identificatorii și amprentele persistente permit reluarea sincronizării fără dublarea evenimentelor confirmate.

## Gestionare prin MCP

Extinderea MCP folosește aceeași cheie per colecție și salvare cu revizie. Ștergerea task-ului cere confirmed: true, iar versiunile anterioare sunt păstrate în istoricul colecției.

## Reordonare pași

Ordinea este dată de poziția în lista salvată. Subpașii opționali păstrează compatibilitatea cu backup-urile vechi.

## Vizualizarea task-urilor

Filtrele și ordinea de afișare sunt temporare. Numai reordonarea nefiltrată din modul manual schimbă ordinea salvată.

## Timp lucrat și tarif

hourlyRateCents este opțional în colecția v1 și persistă în SQLite și backup. Tariful implicit este 10 RON/oră. Timpul efectiv deja înregistrat pe task-uri intră în total. Valoarea timpului este separată de profit.
