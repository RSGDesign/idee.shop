import type { Metadata } from "next";
import Link from "next/link";
import LandingMotion from "./landing-motion";
import ProductDemo from "./product-demo";
import ThemeToggle from "./theme-toggle";
import styles from "./landing.module.css";

const title = "Idee.Shop — Dă ideilor tale un viitor";
const description =
  "Organizează-ți ideile pe stadii cu drag & drop, măsoară timpul de lucru cu cronometru pe pași, programează-ți orele în calendarul pe zi, săptămână sau lună și calculează-ți rentabilitatea în RON.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    locale: "ro_RO",
    siteName: "Idee.Shop",
  },
};

const steps = [
  [
    "Adaugi ideea și o structurezi",
    "O prinzi cât e proaspătă. Adaugi categorii, notițe și un obiectiv clar de venit.",
  ],
  [
    "Descompui în pași și cronometrezi",
    "Împarți gândul mare în task-uri măsurabile, pornești cronometrul integrat și compari timpul estimat cu cel efectiv.",
  ],
  [
    "Organizezi pe stadii și programezi",
    "Muti ideile cu drag & drop între Nouă, În lucru și Finalizată, și planifici sesiunile la ore exacte în calendar.",
  ],
  [
    "Calculezi rezultatul și rentabilitatea",
    "Notezi veniturile și cheltuielile, afli automat pragul de rentabilitate (break-even) și vezi profitul real în RON.",
  ],
];
const features = [
  [
    "Tablou pe stadii & Drag & Drop",
    "Vizualizează fluxul de lucru în coloane clare: Nouă, În lucru și Finalizată. Muti ideile dintr-un stadiu în altul cu drag and drop intuitiv sau cu selectorul rapid.",
  ],
  [
    "Calendar complet (Zi, Săptămână, Lună)",
    "Planifică-ți timpul așa cum lucrezi: vezi agenda pe zi, săptămână sau lună, programează idei și pași la ore precise cu interval start–sfârșit și gestionează sesiuni multiple.",
  ],
  [
    "Cronometru integrat pe pași",
    "Măsoară durata reală a fiecărui task cu un cronometru simplu (Start / Pauză / Salvare). Știi cu exactitate cât efort investești și elimini aproximările.",
  ],
  [
    "Calculator Break-Even & Finanțe RON",
    "Află imediat câte vânzări sau unități sunt necesare pentru a acoperi costurile, la prețul ales. Urmărești veniturile, cheltuielile și marja de profit reală în RON.",
  ],
  [
    "Categorii & Filtrare rapidă",
    "Etichetează ideile pe domenii (Tehnologie, Educație, Comerț, Servicii) și filtrează colecția într-o secundă pentru a te concentra pe ce contează acum.",
  ],
  [
    "Frigider vizual pentru idei la rece",
    "Păstrează ideile secundare pe magneți vizuali, fără presiune și fără aglomerație, gata de reluat când ai contextul și energia potrivite.",
  ],
  [
    "Pași mici & Bife de progres",
    "Descompune orice proiect mare într-o listă clară de task-uri realizabile. Bifează pașii parcurși și vezi cum crește rata de finalizare.",
  ],
  [
    "Salvare automată & Confidențialitate",
    "Modificările se salvează automat și rămân strict în controlul tău. Poți exporta oricând o copie completă de siguranță JSON și o poți restaura la nevoie.",
  ],
];

export default function LandingPage() {
  return (
    <LandingMotion>
      <div className={styles.landing}>
        <a className={styles.skipLink} href="#continut">
          Sari la conținut
        </a>
        <header className={styles.siteHeader}>
          <Link
            className="brand"
            href="/"
            aria-label="Idee.Shop — pagina de prezentare"
          >
            idee<span>.shop</span>
          </Link>
          <nav className={styles.nav} aria-label="Navigație principală">
            <a className={styles.navAnchor} href="#cum-functioneaza">
              Cum funcționează
            </a>
            <ThemeToggle />
            <Link className={styles.navApp} href="/app">
              Deschide aplicația <span aria-hidden="true">↗</span>
            </Link>
          </nav>
        </header>

        <main className={styles.main} id="continut" tabIndex={-1}>
          <section
            data-reveal
            className={styles.hero}
            aria-labelledby="hero-title"
          >
            <div>
              <p className={styles.eyebrow}>DE LA GÂND LA REZULTAT</p>
              <h1 id="hero-title">
                Dă ideilor tale <span>un viitor.</span>
              </h1>
              <p className={styles.lead}>
                Un spațiu complet în care îți aduni ideile, le organizezi pe
                stadii cu drag & drop, le lucrezi cu cronometru pe pași și le
                programezi în calendarul pe zi, săptămână sau lună. Vezi exact
                cât timp investești și ce profit aduce fiecare inițiativă.
              </p>
              <div className={styles.actions}>
                <Link className={styles.primaryCta} href="/app">
                  Începe gratuit <span aria-hidden="true">↗</span>
                </Link>
                <a className={styles.secondaryCta} href="#cum-functioneaza">
                  Vezi cum funcționează <span aria-hidden="true">↓</span>
                </a>
              </div>
              <p className={styles.localBadge}>
                Tablou stadii · Calendar complet · Cronometru pași · Break-Even
              </p>
            </div>
            <div className={styles.heroArt} aria-hidden="true">
              <div className={styles.orbit}>O IDEE MERITĂ UN PRIM PAS</div>
              <div className={styles.heroNote}>
                <span>NOTĂ PENTRU VIITOR</span>
                <p>
                  Și dacă
                  <br />
                  aș încerca?
                </p>
                <div className={styles.noteRule} />
                <small>Începe de aici. Restul prinde contur.</small>
              </div>
              <div className={styles.heroTag}>
                De păstrat. De încercat. De construit.
              </div>
            </div>
          </section>

          <section
            data-reveal
            className={styles.problem}
            aria-labelledby="problema-title"
          >
            <p className={styles.eyebrow}>MAI MULT DECÂT O NOTIȚĂ UITATĂ</p>
            <h2 id="problema-title">
              Ideile nu duc lipsă de potențial.
              <br />
              Duc lipsă de un loc în care să crească.
            </h2>
            <div className={styles.problemCopy}>
              <p>
                Ai o idee bună, o scrii într-o notiță și o pierzi printre zeci
                de alte gânduri.
              </p>
              <p>
                Fără un pas următor și fără să vezi ce ai investit, ideea rămâne
                un „poate, cândva”.
              </p>
              <p>
                Idee.Shop aduce ideea, pașii și banii în același loc, ca să poți
                decide ce merită continuat.
              </p>
            </div>
          </section>

          <section
            data-reveal
            className={styles.section}
            id="cum-functioneaza"
            aria-labelledby="pasi-title"
          >
            <p className={styles.eyebrow}>UN ÎNCEPUT SIMPLU</p>
            <h2 id="pasi-title">Cum funcționează</h2>
            <ol className={styles.steps}>
              {steps.map(([heading, copy], index) => (
                <li
                  data-reveal
                  key={heading}
                  style={
                    {
                      "--reveal-delay": `${Math.min(index, 5) * 60}ms`,
                    } as React.CSSProperties
                  }
                >
                  <span className={styles.stepNumber} aria-hidden="true">
                    0{index + 1}
                  </span>
                  <h3>{heading}</h3>
                  <p>{copy}</p>
                </li>
              ))}
            </ol>
          </section>

          <section
            data-reveal
            className={styles.section}
            aria-labelledby="features-title"
          >
            <p className={styles.eyebrow}>TOT CE AI NEVOIE CA SĂ ÎNCEPI</p>
            <h2 id="features-title">
              Mai puțin de organizat.
              <br />
              Mai mult de construit.
            </h2>
            <div className={styles.features}>
              {features.map(([heading, copy], index) => (
                <article
                  data-reveal
                  data-card
                  key={heading}
                  className={styles.feature}
                  style={
                    {
                      "--reveal-delay": `${Math.min(index, 5) * 60}ms`,
                    } as React.CSSProperties
                  }
                >
                  <span className={styles.featureIndex} aria-hidden="true">
                    0{index + 1}
                  </span>
                  <h3>{heading}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </section>

          <section
            data-reveal
            className={styles.section}
            id="previzualizare"
            aria-labelledby="preview-title"
          >
            <div className={styles.sectionIntro}>
              <div>
                <p className={styles.eyebrow}>
                  UN PIC DE ORDINE, UN PIC DE AVÂNT
                </p>
                <h2 id="preview-title">Ideile tale, la vedere.</h2>
              </div>
              <p>
                O privire în spațiul de lucru.
                <br />
                Descoperă cum o idee prinde contur.
              </p>
            </div>
            <ProductDemo />
            <figure data-reveal className={styles.preview}>
              <div className={styles.previewTop}>
                <span>
                  idee<span className={styles.accent}>.shop</span>
                </span>
                <span>Spațiul meu / Toate ideile</span>
              </div>
              <div className={styles.previewBody}>
                <div className={styles.previewHeading}>
                  <h3>O idee. Un pas mai departe.</h3>
                  <span className={styles.previewLabel}>SPAȚIUL TĂU</span>
                </div>
                <dl className={styles.previewStats}>
                  <div>
                    <dt>Idei în colecție</dt>
                    <dd>2</dd>
                  </div>
                  <div>
                    <dt>Venituri</dt>
                    <dd>850,00 RON</dd>
                  </div>
                  <div>
                    <dt>Cheltuieli</dt>
                    <dd>200,00 RON</dd>
                  </div>
                  <div>
                    <dt>Profit total</dt>
                    <dd className={styles.profit}>+650,00 RON</dd>
                  </div>
                </dl>
                <div className={styles.previewIdeas}>
                  <article data-reveal data-card className={styles.previewIdea}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span className={styles.previewLabel}>ÎN LUCRU · DRAG & DROP</span>
                      <small style={{ color: "var(--muted)", fontSize: "11px" }}>Servicii</small>
                    </div>
                    <h4>Atelier de weekend</h4>
                    <p>
                      Un loc pentru oameni care vor să creeze ceva cu mâinile
                      lor.
                    </p>
                    <p className={styles.completedTask}>
                      <span aria-hidden="true">✓</span>
                      <span>
                        <span className={styles.srOnly}>Task finalizat: </span>
                        <s>Pregătește primul atelier</s>
                      </span>
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "10px 0" }}>
                      <span style={{ fontSize: "11px", background: "var(--surface-2)", border: "1px solid var(--border)", padding: "2px 6px", borderRadius: "4px", color: "var(--accent)" }}>
                        🕒 Cronometru: 35 min
                      </span>
                      <span style={{ fontSize: "11px", background: "var(--surface-2)", border: "1px solid var(--border)", padding: "2px 6px", borderRadius: "4px", color: "var(--text)" }}>
                        📅 Miercuri: 14:00 – 16:30
                      </span>
                      <span style={{ fontSize: "11px", background: "var(--surface-2)", border: "1px solid var(--border)", padding: "2px 6px", borderRadius: "4px", color: "var(--ok)" }}>
                        ⚖ Prag: 1 vânzare (200 RON)
                      </span>
                    </div>
                    <div className={styles.previewCardFoot}>
                      <span>1 / 2 pași · Estimat 4 h · Efectiv 3 h 30 min</span>
                      <strong className={styles.profit}>
                        Profit: +650,00 RON
                      </strong>
                    </div>
                  </article>
                  <article
                    data-reveal
                    data-card
                    style={{ "--reveal-delay": "60ms" } as React.CSSProperties}
                    className={`${styles.previewIdea} ${styles.secondIdea}`}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span className={styles.previewLabel}>NOUĂ</span>
                      <small style={{ color: "var(--muted)", fontSize: "11px" }}>Conținut</small>
                    </div>
                    <h4>Ghidul cartierului meu</h4>
                    <p>
                      Locuri mici, povești de cartier și trasee pe care merită
                      să le descoperi.
                    </p>
                    <p className={styles.pendingTask}>
                      <span aria-hidden="true">○</span> Alege primele cinci
                      locuri
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "10px 0" }}>
                      <span style={{ fontSize: "11px", background: "var(--surface-2)", border: "1px solid var(--border)", padding: "2px 6px", borderRadius: "4px", color: "var(--accent)" }}>
                        📅 Programat: Sâmbătă 10:00
                      </span>
                      <span style={{ fontSize: "11px", background: "var(--surface-2)", border: "1px solid var(--border)", padding: "2px 6px", borderRadius: "4px", color: "var(--muted)" }}>
                        🕒 Estimat: 2 ore
                      </span>
                    </div>
                    <div className={styles.previewCardFoot}>
                      <span>0 / 3 pași</span>
                      <strong>Profit: 0,00 RON</strong>
                    </div>
                  </article>
                </div>
              </div>
              <figcaption className={styles.previewCaption}>
                Date de exemplu. Descoperă în aplicație cum se îmbină tabloul pe stadii, calendarul flexibil și calculatorul break-even.
              </figcaption>
            </figure>
          </section>

          <section
            data-reveal
            className={styles.honesty}
            aria-labelledby="limite-title"
          >
            <div>
              <p className={styles.eyebrow}>IDEILE TALE, ÎN CONTROLUL TĂU</p>
              <h2 id="limite-title">Construiește în ritmul tău.</h2>
              <p>
                Mai multă claritate pentru următorul pas. Mai mult spațiu pentru
                ce contează.
              </p>
            </div>
            <ul>
              <li>
                <strong>Tablou pe stadii & Drag & Drop.</strong> Organizezi fluxul de lucru în coloane clare și muți ideile instantaneu între Nouă, În lucru și Finalizată.
              </li>
              <li>
                <strong>Calendar complet (Zi, Săptămână, Lună).</strong> Programezi idei și pași la ore exacte cu interval start–sfârșit și gestionezi sesiuni multiple de lucru.
              </li>
              <li>
                <strong>Cronometru de lucru pe pași.</strong> Măsori cu precizie timpul dedicat fiecărui task și compari orele estimate cu cele efectiv investite.
              </li>
              <li>
                <strong>Rentabilitate & Calculator Break-Even.</strong> Calculezi automat câte unități trebuie să vinzi pentru a-ți acoperi costurile fixe.
              </li>
              <li>
                <strong>Salvare automată & Confidențialitate.</strong> Toate ideile și sesiunile tale sunt salvate automat, private, cu export JSON oricând ai nevoie de un backup.
              </li>
            </ul>
          </section>

          <section
            data-reveal
            className={styles.section}
            aria-labelledby="roadmap-title"
          >
            <p className={styles.eyebrow}>CE URMEAZĂ</p>
            <h2 id="roadmap-title">Creștem pas cu pas.</h2>
            <ol className={styles.roadmap}>
              <li>
                <span>01 / ACUM</span>
                <h3>Un spațiu pentru ideile tale</h3>
                <p>
                  Organizare, pași concreți și rezultate financiare, într-un
                  singur loc.
                </p>
              </li>
              <li>
                <span>02 / ÎN CONTINUARE</span>
                <h3>Mai multă claritate</h3>
                <p>
                  O organizare mai flexibilă a frigiderului, filtre utile și o
                  perspectivă mai bună asupra progresului.
                </p>
              </li>
              <li>
                <span>03 / MAI TÂRZIU</span>
                <h3>Idei care merg mai departe</h3>
                <p>
                  Pregătim noi moduri de a păstra ideile aproape și explorăm un
                  marketplace pentru ideile validate.
                </p>
              </li>
            </ol>
            <Link className={styles.primaryCta} href="/app">
              Deschide spațiul tău <span aria-hidden="true">↗</span>
            </Link>
          </section>
        </main>

        <footer className={styles.siteFooter}>
          <Link
            className="brand"
            href="/"
            aria-label="Idee.Shop — înapoi la început"
          >
            idee<span>.shop</span>
          </Link>
          <p>Idee.Shop · De la gând la rezultat.</p>
          <a href="#continut">Înapoi sus ↑</a>
        </footer>
      </div>
    </LandingMotion>
  );
}
