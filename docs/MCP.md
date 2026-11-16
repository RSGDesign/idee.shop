# Hermes și Idee.Shop

Idee.Shop oferă un endpoint MCP Streamable HTTP la /api/mcp. Hermes descoperă automat câmpurile prin tools/list. Instrumentele disponibile sunt list_ideas pentru căutare și paginare, get_idea pentru detalii și task-uri și create_idea pentru crearea unei idei cu task-uri. Cheia oferă acces exclusiv la colecția contului ales, inclusiv pentru un cont admin. Generarea unei chei noi o invalidează pe cea veche.

1. Pe Mac, rulează `npm run mcp:key -- issue adresa-contului-tau` din directorul proiectului. Comanda afișează cheia direct în Terminal. Păstreaz-o în fișierul de secrete al profilului Hermes (`.env`), sub numele `IDEE_SHOP_MCP_TOKEN`.
2. Adaugă în configurația profilului Hermes, sub secțiunea existentă `mcp_servers`:

```yaml
mcp_servers:
  idee_shop:
    url: "https://your-device.your-tailnet.ts.net/api/mcp"
    headers:
      Authorization: "Bearer ${IDEE_SHOP_MCP_TOKEN}"
```

Dacă Hermes rulează pe Mac-ul gazdă, poți folosi http://127.0.0.1:3000/api/mcp. Pe alt dispozitiv, folosește HTTPS și conectează ambele dispozitive la Tailscale. Reîncarcă configurația Hermes și testează întâi o citire. Exemplu: „Caută ideile despre atelier. Dacă nu există, adaugă ideea Atelier foto cu task-urile rezervă spațiul și pregătește materialele.”

Cheia permite citirea notelor și crearea directă de idei. Pentru aprobarea fiecărei creări, setează regula în Hermes. Instrumentele pot edita idei și task-uri, adăuga task-uri și șterge un task cu confirmed: true după confirmarea utilizatorului. Accesul este limitat la contul cheii. Pentru revocare rulează `npm run mcp:key -- revoke adresa-contului-tau`.

[Configurație MCP Hermes](https://hermes-agent.nousresearch.com/docs/reference/mcp-config-reference)

Pentru idei existente se folosesc update_idea, add_tasks, update_task și delete_task. schedule_item programează ideea sau task-ul prin ideaId și taskId opțional. Cu slotId mută o programare existentă. Date AAAA-LL-ZZ și ore HH:MM în calendarul Idee.Shop. Google Calendar preia schimbările la sincronizarea manuală.
