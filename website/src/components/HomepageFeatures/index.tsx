import React from "react";
import clsx from "clsx";
import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  description: string;
  icon: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: "Tamper-Proof Audit Trail",
    icon: "🔒",
    description:
      "Every state transition is anchored to a Filecoin content identifier (pieceCid/commp). The entire checkpoint chain is cryptographically verifiable — no silent overwrites, no gaps.",
  },
  {
    title: "Autonomous Payments",
    icon: "💳",
    description:
      "Agents manage their own storage budget using a pre-funded EVM wallet and USDFC stablecoin. No human needed to top up, approve deals, or renew storage — the agent handles it.",
  },
  {
    title: "Seamless Resumption",
    icon: "▶️",
    description:
      "On startup, an agent calls AgentStorage.create() and instantly retrieves its last known checkpoint from Filecoin. Pick up exactly where you left off, every time.",
  },
];

function Feature({ title, icon, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className={styles.featureCard}>
        <div className={styles.featureIcon}>{icon}</div>
        <h3 className={styles.featureTitle}>{title}</h3>
        <p className={styles.featureDescription}>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): React.JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
