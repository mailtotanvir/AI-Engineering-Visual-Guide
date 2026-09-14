export interface EvalDomain {
  id: string;
  num: string;
  name: string;
  blurb: string;
}

export const EVAL_DOMAINS: EvalDomain[] = [
  { id: "foundations", num: "01", name: "Eval Foundations", blurb: "The measurement loop, capability vs alignment, and static versus dynamic suites." },
  { id: "design", num: "02", name: "Benchmark Design", blurb: "Item anatomy, difficulty and discrimination, and designed capability coverage." },
  { id: "integrity", num: "03", name: "Contamination & Integrity", blurb: "Leakage detection, canary traps, and private / rotating eval sets." },
  { id: "scoring", num: "04", name: "Automatic Scoring", blurb: "Exact match, token F1, BLEU / ROUGE limits, and programmatic verifiers." },
  { id: "judge", num: "05", name: "LLM-as-Judge", blurb: "Rubric design, pairwise win rates, and the bias audit of the referee." },
  { id: "human", num: "06", name: "Human & Arena Evaluation", blurb: "Annotation protocols, inter-annotator agreement, and arena Elo." },
  { id: "statistics", num: "07", name: "Statistical Rigor", blurb: "Confidence intervals, paired tests, bootstrap, and multiple comparisons." },
  { id: "operations", num: "08", name: "Regression Gates & Monitoring", blurb: "Eval-driven CI, golden-set regression, and production drift detection." },
];

export interface EvalTopic {
  id: string;
  domain: string;
  title: string;
  kind: "scene" | "concept";
  scene?: string;
  summary: string;
  points: string[];
}

export const EVAL_TOPICS: EvalTopic[] = [
  /* Domain 1: Eval Foundations */
  { id: "t-eval-loop", domain: "foundations", title: "The Evaluation Loop", kind: "scene", scene: "eval-loop",
    summary: "Evaluation as a control loop, not a final exam.",
    points: [
      "Every score should be attached to a decision: ship, fix, or investigate.",
      "Measure → diagnose → change one thing → re-measure under the same protocol.",
      "A metric nobody acts on is a dashboard, not an eval." ] },
  { id: "t-capability-vs-alignment", domain: "foundations", title: "Capability vs Alignment", kind: "scene", scene: "capability-vs-alignment",
    summary: "Can it, and does it the way we intended? Two independent axes.",
    points: [
      "Capability evals (math, code, recall) mostly measure knowledge and skill.",
      "Alignment evals (instruction-following, safety, tone) measure intent match.",
      "A model can gain capability while losing alignment in the same fine-tune." ] },
  { id: "t-static-vs-dynamic", domain: "foundations", title: "Static vs Dynamic Suites", kind: "scene", scene: "static-vs-dynamic",
    summary: "Frozen item banks versus live arenas.",
    points: [
      "Static suites: reproducible, comparable over time, leak into training.",
      "Dynamic arenas: contamination-resistant, but the population drifts.",
      "Serious reports carry both and label each number's provenance." ] },
  { id: "c-eval-driven-dev", domain: "foundations", title: "Eval-Driven Development", kind: "concept",
    summary: "Write the eval before the prompt change.",
    points: [
      "A failing eval is a specification you can iterate against.",
      "Offline evals shorten the loop; production is the final judge.",
      "Keep a 'north star' suite small and stable to avoid metric chasing." ] },

  /* Domain 2: Benchmark Design */
  { id: "t-item-anatomy", domain: "design", title: "Item Anatomy", kind: "scene", scene: "item-anatomy",
    summary: "Prompt, reference, scoring rule, metadata — every field is a decision.",
    points: [
      "The scoring rule is part of the item, not an afterthought.",
      "Metadata (source, capability, difficulty) enables slicing the score.",
      "Unversioned items make historical comparisons meaningless." ] },
  { id: "t-difficulty-calibration", domain: "design", title: "Difficulty & Discrimination", kind: "scene", scene: "difficulty-calibration",
    summary: "p and d: separate easy from informative items.",
    points: [
      "Difficulty p = fraction answering correctly; aim for a spread, not all-hard.",
      "Discrimination d = p(top) − p(bottom): does the item separate models?",
      "Floor and ceiling items add noise without information." ] },
  { id: "t-coverage-taxonomy", domain: "design", title: "Coverage Taxonomy", kind: "scene", scene: "coverage-taxonomy",
    summary: "Design capability coverage before writing items.",
    points: [
      "Declare capability leaves, then budget items per leaf.",
      "A single easy leaf can carry an aggregate score upward.",
      "Re-audit coverage whenever the model or the task changes." ] },
  { id: "c-item-writing", domain: "design", title: "Item-Writing Rules", kind: "concept",
    summary: "How to write items that measure one thing.",
    points: [
      "One capability per item; avoid accidental multi-hop reasoning.",
      "Ambiguity is a bug: every accepted answer must be enumerable.",
      "Use distractors that encode real failure modes, not filler." ] },

  /* Domain 3: Contamination & Integrity */
  { id: "t-ngram-contam", domain: "integrity", title: "Contamination Detection", kind: "scene", scene: "ngram-contam",
    summary: "Overlap between eval items and training corpora.",
    points: [
      "Rank items by max n-gram overlap against the training corpus.",
      "Perplexity on an item is a memorization tell, not just a difficulty signal.",
      "Dedup or drop leaked items; report the residual overlap." ] },
  { id: "t-canary-trap", domain: "integrity", title: "Canary Strings & Traps", kind: "scene", scene: "canary-trap",
    summary: "Plant markers that expose memorization and gaming.",
    points: [
      "Unique canary tokens in eval text reveal training-set inclusion.",
      "Impossible or self-contradictory items catch degenerate guessing.",
      "Unexpected accuracy on a trap item invalidates the run." ] },
  { id: "t-private-rotating", domain: "integrity", title: "Private & Rotating Sets", kind: "scene", scene: "private-rotating",
    summary: "Held-out splits and refresh cadence.",
    points: [
      "Keep a private split never exposed in papers or leaderboards.",
      "Rotate a fraction of items per release window to reset the ceiling.",
      "Version every eval set; pin the version with the score." ] },
  { id: "c-reporting-integrity", domain: "integrity", title: "Reporting Integrity", kind: "concept",
    summary: "Publish the protocol, not just the number.",
    points: [
      "Report prompt format, few-shot count, and sampling settings.",
      "State contamination checks performed and their outcome.",
      "Distinguish checked-clean, checked-dirty, and unchecked items." ] },

  /* Domain 4: Automatic Scoring */
  { id: "t-exact-match", domain: "scoring", title: "Exact Match & Token F1", kind: "scene", scene: "exact-match",
    summary: "Normalize, then compare strings or tokens.",
    points: [
      "Normalization (case, whitespace, articles) changes the score materially.",
      "Token F1 gives partial credit and tolerates reordering of words.",
      "Cheap and deterministic — but blind to meaning it was not told to check." ] },
  { id: "t-overlap-metrics", domain: "scoring", title: "BLEU / ROUGE Limits", kind: "scene", scene: "overlap-metrics",
    summary: "n-gram precision and recall measure surface, not sense.",
    points: [
      "BLEU rewards n-gram precision with a brevity penalty.",
      "ROUGE rewards reference n-gram recall, favoring long outputs.",
      "Both punish a correct paraphrase as heavily as a wrong answer." ] },
  { id: "t-programmatic-grading", domain: "scoring", title: "Execution & Verifiers", kind: "scene", scene: "programmatic-grading",
    summary: "Turn open-ended output into a pass/fail oracle.",
    points: [
      "Unit tests and checkers are the ground truth for code and math.",
      "Extract the answer robustly before grading — extraction errors masquerade as model errors.",
      "pass@k measures reachable capability across k samples." ] },
  { id: "c-scorer-choice", domain: "scoring", title: "Choosing a Scorer", kind: "concept",
    summary: "Match the scorer to the failure mode you care about.",
    points: [
      "Closed-form answers: exact match or F1.",
      "Generation quality: rubric judge, not overlap.",
      "Executable tasks: verifiers, always." ] },

  /* Domain 5: LLM-as-Judge */
  { id: "t-judge-rubric", domain: "judge", title: "Rubric & Pointwise Scoring", kind: "scene", scene: "judge-rubric",
    summary: "Criteria, anchors, and an output schema.",
    points: [
      "Define each score level with observable anchors, not adjectives.",
      "Score one axis at a time; compounds hide interactions.",
      "Force structured output so scores can be audited and aggregated." ] },
  { id: "t-pairwise-judge", domain: "judge", title: "Pairwise Comparison", kind: "scene", scene: "pairwise-judge",
    summary: "A vs B plus ties; lower variance, aggregation cost.",
    points: [
      "Relative judgments are easier and less noisy than absolute scores.",
      "Allow ties explicitly; forced choice inflates false wins.",
      "Aggregate pairwise outcomes via Bradley-Terry into a ranking." ] },
  { id: "t-judge-bias", domain: "judge", title: "Bias Audit", kind: "scene", scene: "judge-bias",
    summary: "Position, length, and self-preference, measured.",
    points: [
      "Swap answer order and re-judge; report the position-flip rate.",
      "Length-controlled win rate strips verbosity confounds.",
      "Avoid judges from the same model family as the candidate." ] },
  { id: "c-judge-validation", domain: "judge", title: "Validating the Judge", kind: "concept",
    summary: "A judge is a model under test too.",
    points: [
      "Agreement with a human gold set is the judge's own eval.",
      "Calibrate thresholds against held-out human labels.",
      "Re-validate the judge whenever the judge model changes." ] },

  /* Domain 6: Human & Arena Evaluation */
  { id: "t-annotation-protocol", domain: "human", title: "Annotation Protocols", kind: "scene", scene: "annotation-protocol",
    summary: "Instructions, gold items, and adjudication.",
    points: [
      "A guideline is part of the instrument; ambiguous tasks cannot be rescued.",
      "Gold items in the stream detect raters who stopped reading.",
      "Adjudicate disagreements instead of averaging them away." ] },
  { id: "t-inter-annotator", domain: "human", title: "Inter-Annotator Agreement", kind: "scene", scene: "inter-annotator",
    summary: "Percent agreement is inflated by chance; kappa corrects it.",
    points: [
      "κ = (p_o − p_e) / (1 − p_e) for categorical labels.",
      "Low kappa means the construct or the guideline is broken.",
      "Report agreement alongside every human-derived label." ] },
  { id: "t-arena-elo", domain: "human", title: "Arena Elo & Leaderboards", kind: "scene", scene: "arena-elo",
    summary: "Live battles, Elo updates, and rank uncertainty.",
    points: [
      "Elo update scales with the surprise of the outcome.",
      "An Elo gap is a distribution: overlaps matter more than point ranks.",
      "Battle sampling determines which capabilities the ranking reflects." ] },
  { id: "c-human-vs-auto", domain: "human", title: "Humans vs Automatic Judges", kind: "concept",
    summary: "Cost, scale, and construct fidelity trade off.",
    points: [
      "Human labels are the reference but cost thousands of dollars and hours.",
      "Judges scale cheaply but inherit model biases and drift.",
      "Use humans to validate, judges to monitor continuously." ] },

  /* Domain 7: Statistical Rigor */
  { id: "t-confidence-intervals", domain: "statistics", title: "Confidence Intervals", kind: "scene", scene: "confidence-intervals",
    summary: "Every score is a draw from a sampling distribution.",
    points: [
      "h = 1.96·√(p(1−p)/n) shrinks as 1/√n.",
      "Publish n and h beside every accuracy.",
      "Claim improvement only when intervals separate." ] },
  { id: "t-paired-tests", domain: "statistics", title: "Paired Tests & McNemar", kind: "scene", scene: "paired-tests",
    summary: "Same items, two models: test the discordant pairs.",
    points: [
      "McNemar χ² = (|b−c|−1)² / (b+c) on the 2×2 outcome table.",
      "Pairing removes item-difficulty variance, sharpening the test.",
      "Two independent CIs can overlap while a paired test is decisive." ] },
  { id: "t-bootstrap-multiple", domain: "statistics", title: "Bootstrap & Multiplicity", kind: "scene", scene: "bootstrap-multiple",
    summary: "Resample for intervals, then correct for the number of comparisons.",
    points: [
      "Bootstrap builds intervals without normality assumptions.",
      "Holm/Bonferroni control family-wise error as comparisons multiply.",
      "Reporting the best of many slices is p-hacking unless corrected." ] },
  { id: "c-effect-vs-significance", domain: "statistics", title: "Effect vs Significance", kind: "concept",
    summary: "A real difference can still be too small to matter.",
    points: [
      "With large n, trivia becomes statistically significant.",
      "State the minimum effect size that changes a decision.",
      "Power analysis sizes the eval before the run, not after." ] },

  /* Domain 8: Regression Gates & Monitoring */
  { id: "t-regression-gate", domain: "operations", title: "Eval-Driven CI Gates", kind: "scene", scene: "regression-gate",
    summary: "Per-capability budgets turn evals into a ship gate.",
    points: [
      "Set regression allowances per capability, not one global threshold.",
      "Fail the build on a broken axis even if the average rose.",
      "Gate thresholds are reviewed like any other code." ] },
  { id: "t-prompt-regression", domain: "operations", title: "Prompt & Model Regression", kind: "scene", scene: "prompt-regression",
    summary: "A frozen golden set catches quiet breakage.",
    points: [
      "Re-run the golden set on every prompt, model, or decode change.",
      "Diff outputs item-by-item, not just in aggregate.",
      "Tie each prompt version to the eval run that approved it." ] },
  { id: "t-online-drift", domain: "operations", title: "Online Drift Detection", kind: "scene", scene: "online-drift",
    summary: "Populations and inputs move; the score follows.",
    points: [
      "Sample production traffic and score it against expectations.",
      "Track distribution drift, not only topic share.",
      "Canary deploys bound the blast radius of a bad release." ] },
  { id: "c-eval-observability", domain: "operations", title: "Eval Observability", kind: "concept",
    summary: "Connect offline scores to online signals.",
    points: [
      "Offline accuracy is a proxy; online task success is the outcome.",
      "Immutable eval logs make regressions reproducible.",
      "Alert on movement, not on a single threshold crossing." ] },
];
