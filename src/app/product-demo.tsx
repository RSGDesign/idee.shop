import { MotionPauseButton } from "./landing-motion";
import styles from "./landing.module.css";
export default function ProductDemo() {
  return (
    <div
      className={styles.demo}
      data-demo
      aria-label="Exemplu: adaugi o idee, bifezi un task, înregistrezi un venit de 250 RON, ajungi la 65% din obiectiv și vezi un profit pozitiv."
    >
      <p className={styles.demoCaption}>O idee. Un prim pas. Un rezultat.</p>
      <div aria-hidden="true" className={styles.demoGrid}>
        <div className={styles.demoIdea}>
          <span>01 · IDEE NOUĂ</span>
          <strong>Atelier de weekend</strong>
          <small>O idee pe care merită să o încerci.</small>
        </div>
        <div className={styles.demoTask}>
          <span>02 · PRIMUL PAS</span>
          <p>
            <span className={styles.demoCheck}>✓</span> Pregătește primul
            atelier
          </p>
        </div>
        <div className={styles.demoIncome}>
          <span>03 · VENIT ÎNREGISTRAT</span>
          <strong>+250,00 RON</strong>
          <div className={styles.demoTrack}>
            <div className={styles.demoFill} />
          </div>
          <small>65% din obiectivul de venit</small>
        </div>
        <div className={styles.demoProfit}>
          <span>04 · VEZI CE ADUCE</span>
          <div className={styles.profitStack}>
            <strong>Profit: +200,00 RON</strong>
            <strong className={styles.profitOverlay}>
              Profit: +200,00 RON
            </strong>
          </div>
          <small>250 RON venit − 50 RON cheltuieli</small>
        </div>
      </div>
      <MotionPauseButton />
      <p className={styles.demoCaption}>
        Date de exemplu, pentru a vedea cum îți poți urmări progresul.
      </p>
    </div>
  );
}
