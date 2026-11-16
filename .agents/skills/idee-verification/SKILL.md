---
name: idee-verification
description: Verificare locală pentru modificări Idee.Shop.
---
# Verificare Idee.Shop
Adaptat din ECC verification-loop; sursă/licență în docs/ECC.md.
Rulează npm run lint, npm run typecheck, npm test, npm run build. Repară erorile, apoi repetă numai verificările afectate. Revizuiește git diff și status: fără secrete, date personale sau schimbări accidentale. Nu raporta acoperire fără măsurare și nu impune un prag artificial pentru MVP. Testele de domeniu nu înlocuiesc verificarea interfeței: notează separat testele manuale/browser executate. Fără deployment în această etapă. Actualizează HANDOFF cu rezultatele reale, mediul, limitele și următorul pas.
