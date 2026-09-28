/**
 * Pure mathematical engine for AI Safety & Alignment simulations.
 */

/**
 * 1. Contrastive Activation Addition (CAA) Steering Vector
 * v_steer = E[a_positive] - E[a_negative]
 * steered_activation = a + coeff * v_steer
 */
export function computeSteeredActivation(
  baseActivation: number[],
  posActivations: number[][],
  negActivations: number[][],
  coeff: number = 1.0
): { steered: number[]; vectorNorm: number; dotProduct: number } {
  const dim = baseActivation.length;
  if (dim === 0) return { steered: [], vectorNorm: 0, dotProduct: 0 };

  const meanPos = new Array(dim).fill(0);
  const meanNeg = new Array(dim).fill(0);

  for (const act of posActivations) {
    for (let i = 0; i < dim; i++) meanPos[i] += act[i] / posActivations.length;
  }
  for (const act of negActivations) {
    for (let i = 0; i < dim; i++) meanNeg[i] += act[i] / negActivations.length;
  }

  const steerVec = new Array(dim).fill(0);
  let sumSq = 0;
  for (let i = 0; i < dim; i++) {
    steerVec[i] = meanPos[i] - meanNeg[i];
    sumSq += steerVec[i] * steerVec[i];
  }
  const vectorNorm = Math.sqrt(sumSq);

  const steered = new Array(dim).fill(0);
  let dotProduct = 0;
  for (let i = 0; i < dim; i++) {
    steered[i] = baseActivation[i] + coeff * steerVec[i];
    dotProduct += steered[i] * steerVec[i];
  }

  return { steered, vectorNorm, dotProduct };
}

/**
 * 2. Refusal Projection & Margin Classification
 * Refusal score = (activation · v_refusal) / ||v_refusal||
 * Decision: Refuse if score >= threshold
 */
export function evaluateRefusalBoundary(
  activation: number[],
  refusalVector: number[],
  threshold: number = 0.5
): {
  projection: number;
  refusalScore: number;
  decision: "REFUSE" | "COMPLY";
  margin: number;
} {
  let dot = 0;
  let normSq = 0;
  for (let i = 0; i < activation.length; i++) {
    dot += activation[i] * refusalVector[i];
    normSq += refusalVector[i] * refusalVector[i];
  }
  const norm = Math.sqrt(normSq) || 1e-6;
  const projection = dot / norm;
  const refusalScore = 1 / (1 + Math.exp(-projection)); // sigmoid activation
  const decision = refusalScore >= threshold ? "REFUSE" : "COMPLY";
  const margin = refusalScore - threshold;

  return { projection, refusalScore, decision, margin };
}

/**
 * 3. Statistical Watermarking (Kirchenbauer et al. Green/Red List Test)
 * z = ( |S_green| - gamma * |S| ) / sqrt( gamma * (1 - gamma) * |S| )
 * p-value = 1 - Phi(z)
 */
export function evaluateWatermarkZScore(
  totalTokens: number,
  greenTokens: number,
  gamma: number = 0.5
): {
  zScore: number;
  pValue: number;
  isWatermarked: boolean;
} {
  if (totalTokens <= 0) return { zScore: 0, pValue: 1.0, isWatermarked: false };

  const expectedGreen = gamma * totalTokens;
  const stdDev = Math.sqrt(totalTokens * gamma * (1 - gamma));
  const zScore = stdDev > 0 ? (greenTokens - expectedGreen) / stdDev : 0;

  // Approximate standard normal CDF
  const erf = (x: number): number => {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const sign = x >= 0 ? 1 : -1;
    const absX = Math.abs(x);
    const t = 1.0 / (1.0 + p * absX);
    const y =
      1.0 -
      ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) *
        t *
        Math.exp(-absX * absX);
    return sign * y;
  };

  const phi = (z: number): number => 0.5 * (1 + erf(z / Math.SQRT2));
  const pValue = Math.max(0, Math.min(1, 1 - phi(zScore)));
  const isWatermarked = zScore >= 4.0; // Standard 4-sigma detection threshold

  return { zScore, pValue, isWatermarked };
}

/**
 * 4. Differential Privacy (DP-SGD) Epsilon Budget
 * Calibrates epsilon given noise multiplier sigma, subsampling ratio q, and steps T.
 * Analytical moments account approximation:
 * eps approx (q * sqrt(T * log(1/delta))) / sigma
 */
export function computeDPSGDPrivacyBudget(
  sigma: number,
  subsamplingRatio: number,
  steps: number,
  delta: number = 1e-5
): {
  epsilon: number;
  privacyGuarantee: "STRONG" | "MODERATE" | "WEAK" | "LEAKY";
} {
  if (sigma <= 0 || subsamplingRatio <= 0 || steps <= 0) {
    return { epsilon: Infinity, privacyGuarantee: "LEAKY" };
  }

  const logOneOverDelta = Math.log(1 / delta);
  const eps =
    (subsamplingRatio * Math.sqrt(steps * 2 * logOneOverDelta)) / sigma;

  let privacyGuarantee: "STRONG" | "MODERATE" | "WEAK" | "LEAKY" = "WEAK";
  if (eps <= 1.0) privacyGuarantee = "STRONG";
  else if (eps <= 4.0) privacyGuarantee = "MODERATE";
  else if (eps <= 10.0) privacyGuarantee = "WEAK";
  else privacyGuarantee = "LEAKY";

  return { epsilon: Number(eps.toFixed(3)), privacyGuarantee };
}

/**
 * 5. Representation Misdirection for Unlearning (RMU) Loss
 * L_RMU = ||h_forget - u||^2 + alpha * ||h_retain - h_orig||^2
 */
export function computeRMULoss(
  forgetAct: number[],
  targetRandomVector: number[],
  retainAct: number[],
  origRetainAct: number[],
  alpha: number = 1.2
): {
  lossForget: number;
  lossRetain: number;
  lossTotal: number;
} {
  let sqForget = 0;
  for (let i = 0; i < forgetAct.length; i++) {
    const diff = forgetAct[i] - targetRandomVector[i];
    sqForget += diff * diff;
  }
  const lossForget = sqForget / (forgetAct.length || 1);

  let sqRetain = 0;
  for (let i = 0; i < retainAct.length; i++) {
    const diff = retainAct[i] - origRetainAct[i];
    sqRetain += diff * diff;
  }
  const lossRetain = sqRetain / (retainAct.length || 1);

  const lossTotal = lossForget + alpha * lossRetain;
  return {
    lossForget: Number(lossForget.toFixed(4)),
    lossRetain: Number(lossRetain.toFixed(4)),
    lossTotal: Number(lossTotal.toFixed(4)),
  };
}

/**
 * 6. Over-Refusal vs True Refusal Pareto Frontier
 * Computes safety rate vs benign helpfulness across refusal sensitivity thresholds.
 */
export function computeRefusalParetoPoint(sensitivity: number): {
  attackRefusalRate: number; // 0 to 1
  benignHelpfulness: number; // 0 to 1
  overRefusalRate: number; // 0 to 1
  f1Score: number;
} {
  // Sensitivity s in [0, 1]
  // Higher s -> Higher attack refusal, but higher over-refusal (lower benign helpfulness)
  const attackRefusalRate = 1 / (1 + Math.exp(-6 * (sensitivity - 0.3)));
  const overRefusalRate = 1 / (1 + Math.exp(-8 * (sensitivity - 0.75)));
  const benignHelpfulness = 1 - overRefusalRate;

  const precision = attackRefusalRate / (attackRefusalRate + overRefusalRate + 1e-6);
  const recall = attackRefusalRate;
  const f1Score = (2 * precision * recall) / (precision + recall + 1e-6);

  return {
    attackRefusalRate: Number(attackRefusalRate.toFixed(3)),
    benignHelpfulness: Number(benignHelpfulness.toFixed(3)),
    overRefusalRate: Number(overRefusalRate.toFixed(3)),
    f1Score: Number(f1Score.toFixed(3)),
  };
}
