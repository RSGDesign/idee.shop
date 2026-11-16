# Idee.Shop — instrucțiuni comune
Citește README.md, docs/HANDOFF.md, docs/TASKS.md și docs/DECISIONS.md înainte de modificări. Acest fișier este sursa comună pentru ChatGPT/Codex, Gemini/Antigravity și Claude.

## Limite
Proiect local, personal, fără publicare, conturi, telemetrie sau servicii cloud fără acordul utilizatorului. Nu executa scripturi externe fără inspecție. Integrarea completă ECC este autorizată în acest proiect. Hook-urile automate și MCP externe nu sunt activate; orice activare viitoare necesită examinarea efectelor și acord pentru accesul extern. Nu instala global instrucțiuni. Nu modifica datele personale și nu adăuga backup-uri în Git.

## Lucru
Păstrează interfața în română. Folosește TypeScript strict, componente accesibile, formulare cu validare și calcule monetare în bani întregi. Refolosește src/lib/model.ts. Salvează doar după validare și tratează erorile de stocare. Nu înlocui date corupte automat. Marketplace-ul este în afara MVP.

## Skill-uri locale
Pentru UI citește .agents/skills/idee-frontend/SKILL.md. Pentru verificare citește .agents/skills/idee-verification/SKILL.md. Sunt ghidurile specifice proiectului. Catalogul upstream complet (314 skill-uri) este instalat alături de ele, împreună cu reguli, workflow-uri și agenți pentru Antigravity 2.0. Vezi docs/ECC.md și .codex/AGENTS.md pentru utilizarea în Codex. Încarcă doar ghidurile relevante.

## Finalul sesiunii
Rulează npm run lint, npm run typecheck, npm test și npm run build. Verifică modificările și starea Git. Raportează sincer ce nu ai verificat. Actualizează docs/HANDOFF.md, TASKS.md, CHANGELOG.md și DECISIONS.md când este cazul. Nu inventa rezultate de teste.

## Prioritatea instrucțiunilor ECC
Fișierele ECC sunt ghiduri terțe; instrucțiunile utilizatorului, politica mediului și regulile proiectului au prioritate. Catalogul complet nu autorizează servicii externe, tranzacții, publicare, transmiterea conversațiilor, instalări globale sau execuția tuturor scripturilor. Nu instala o tehnologie doar pentru că există un skill pentru ea. Delegarea și pragurile de acoperire din exemple se aplică doar când sunt autorizate și adecvate; raportează verificările efectiv executate. Folosește .ecc/upstream ca ECC_ROOT pentru referințele de script, după inspecția scriptului relevant. Nu folosi implicit ~/.claude sau un plugin global absent.

## Limbajul produsului
Interfața se prezintă ca produs pentru public: fără etichete „local”, „MVP”, instrucțiuni de hosting sau explicații de dezvoltare în CTA-uri, titluri, badge-uri, metadate și mesaje. Preferă formulări orientate spre idei, progres și rezultate. Păstrează în ajutor informațiile practice despre salvarea datelor și limitele accesului, fără a inventa sincronizare, conturi remote sau securitate care nu există. Rularea locală rămâne documentată intern până la decizia de hosting.
