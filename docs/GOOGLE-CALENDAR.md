# Google Calendar

În Calendar → Google Calendar, conectezi contul și apeși Sincronizează. Idee.Shop creează un calendar secundar dedicat. Cerem permisiunea calendar.app.created. Trimitem numai titlul și intervalul programării. Orele folosesc Europe/Bucharest implicit. O oră fără sfârșit primește 30 de minute. Aparițiile recurente sunt evenimente de o zi și se exportă pe 90 de zile în avans.

Sincronizarea este manuală și merge de la Idee.Shop către Google. Mutarea sau ștergerea unei programări în Idee.Shop se propagă la următoarea sincronizare. Editările făcute direct în Google nu sunt importate. Excepțiile recurente din trecut deja exportate pot rămâne în calendarul Google. Deconectarea șterge datele conexiunii din aplicație și păstrează calendarul exportat. Pentru revocarea accesului la Google, folosește setările contului Google. Reconectarea va crea un nou calendar dedicat.

## Activare pe Mac

1. În Google Cloud Console, activează Google Calendar API într-un proiect și configurează ecranul de consimțământ. Dacă aplicația este în modul Testing, adaugă contul Google la utilizatorii de test.
2. Creează un client OAuth de tip Web application și adaugă exact URI-ul de redirecționare `http://127.0.0.1:3000/api/google-calendar/callback`.
3. Completează în `.env.local` variabilele IDEE_GOOGLE_CLIENT_ID și IDEE_GOOGLE_CLIENT_SECRET folosind clientul creat. Fișierul este ignorat de Git. Originea implicită pentru conectare este `http://127.0.0.1:3000`. IDEE_GOOGLE_ORIGIN trebuie să coincidă exact cu originea URI-ului autorizat dacă alegi alta.
4. Repornește aplicația, deschide adresa de conectare pe Mac și alege Calendar → Conectează Google Calendar. Acordă acces pe pagina Google. După conectare aceleași date de cont Idee.Shop și conexiunea lor sunt disponibile prin Tailscale.

Google poate expira tokenurile OAuth în modul Testing. Reconectează dacă accesul expiră. Schimbarea secretului OAuth face tokenurile stocate imposibil de decriptat și necesită reconectare. Backup-ul SQLite conține tokenurile criptate. Sincronizarea se limitează la 1.000 de evenimente per selecție. Conexiunile sunt per utilizator, optimizate pentru un singur proces Next.js.

Referințe: [Google OAuth pentru aplicații web](https://developers.google.com/identity/protocols/oauth2/web-server) și [permisiunile Calendar API](https://developers.google.com/workspace/calendar/api/auth).
