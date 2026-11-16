# Evoluția dashboardului Idee.Shop

Estimări pentru un dezvoltator full-stack, cu 4 zile de implementare și o zi de verificare pe săptămână. Efortul este exprimat în zile lucrătoare. Testarea pe telefon și feedbackul proprietarului sunt necesare la finalul fiecărei etape. Refolosim tema, SQLite, permisiunile și calendarul existent.

| Etapă | Efort | Rezultat verificabil |
| --- | ---: | --- |
| 1. Organizarea task-urilor | Livrat în cod | Listă și carduri, trei niveluri de prioritate, etichete editabile și progres calculat din bifări |
| 2. Replanificare și recurență | 5–8 zile | Mutare în calendar cu drag & drop și alternativă prin formular. Reguli zilnice, săptămânale și lunare cu interval și dată de sfârșit. Finalizare pe apariție și excepții pentru mutare sau omiterea unei apariții |
| 3. Pagini și editor modular | 10–15 zile | Pagini copil și navigare prin ierarhie. Blocuri text, titlu, listă și checklist cu indentare, formatare și reordonare prin butoane și drag & drop. Coloane adăugate/eliminate, afișate vertical pe mobil |
| 4. Proprietăți și vizualizări | 5–8 zile | Câmpuri text, număr, dată și selecție. Tabel și carduri cu filtre, sortare și configurații salvate |
| 5. Formulare | 5–8 zile | Constructor cu câmpuri obligatorii, previzualizare și răspunsuri în colecție. Acces inițial pentru utilizatori autentificați, publicarea formularelor fiind o decizie separată |
| 6. Calendar extern și notificări | 8–12 zile | Un furnizor de calendar și un canal de notificare, selectate înainte de integrare. Sincronizare incrementală, deconectare, reconciliere conflicte și alerte fără duplicate |

Etapele rămase însumează 33–51 zile de lucru, aproximativ 7–11 săptămâni pentru o singură persoană, fără timpul de așteptare pentru configurarea conturilor externe. O a doua integrare de calendar sau un al doilea canal de notificare se estimează separat.

## Ordine și resurse

- Calendarul existent rămâne punctul de intrare. Mutarea editează sesiunea selectată și păstrează durata. Recurențele au fus orar explicit, reguli separate de apariții și istoric. Verificăm trecerile la ora de vară, ultima zi din lună, aparițiile mutate și actualizările între două file.
- Editorul folosește un arbore de blocuri tipizate. Prototipăm selecția textului, undo și accesul cu tastatura înainte să alegem o bibliotecă de editare. Nota veche se poate converti fără pierderea textului. La reorganizarea ierarhiei verificăm ciclurile, limitele de adâncime și drepturile de acces.
- Proprietățile definesc tipul și validarea valorilor. Formularele refolosesc aceleași definiții și verifică datele și permisiunile pe server. Definim ce se întâmplă cu răspunsurile când un câmp este redenumit sau scos.
- Integrarea externă are nevoie de un cont de test, configurare OAuth, o adresă de callback acceptată de furnizor și o alegere între email și push. Sincronizarea trebuie să trateze tokenuri expirate, evenimente șterse și editări simultane. Pentru notificări este necesar un proces de fundal activ la ora programată. Verificăm dublurile și revenirea după întreruperea conexiunii.
- La fiecare etapă testăm cu o bază separată, backup-uri din versiunile anterioare, roluri de utilizator și admin, Chrome și Safari, modurile de temă și ecran de 360px. Rulăm verificările proiectului înainte de livrare.
