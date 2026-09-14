export interface SceneNote {
  id: string;
  module: string;
  title: string;
  overview: string;
  keyConcepts: { heading: string; body: string }[];
  mathDeepDive?: { title: string; equation: string; explanation: string };
  realWorldEngineering: string[];
}

export const SCENE_NOTES: Record<string, SceneNote> = {
  /* ============ MODULE 1 · EVAL FOUNDATIONS ============ */
  "eval-loop": {
    id: "eval-loop",
    module: "Module 1: Eval Foundations",
    title: "Evaluation is a control loop, not a report card",
    overview: "A benchmark score is only useful if it drives a decision. The evaluation loop makes that explicit: state the claim, build an instrument that can falsify it, measure, diagnose the failure, change exactly one thing, and re-measure under the identical protocol.",
    keyConcepts: [
      { heading: "Attach every score to a decision", body: "Ship, fix, or investigate. If no action follows from a metric, you have built a dashboard — not an evaluation." },
      { heading: "Change one variable", body: "Model, prompt, decoding, and data all move the score. Change one at a time or the result is unattributable." },
      { heading: "Freeze the protocol", body: "Prompt format, few-shot count, sampling temperature, and the item set are part of the measurement. Changing any of them invalidates the comparison." }
    ],
    mathDeepDive: {
      title: "Signal vs Noise",
      equation: "Δ_observed = Δ_true + ε_protocol + ε_sampling",
      explanation: "An observed improvement mixes the true change with protocol drift and sampling noise. A 1-point gain on 200 items has a 95% half-width of ±6.3 points — larger than the effect it claims to show."
    },
    realWorldEngineering: [
      "Eval-driven teams keep a small 'north star' suite stable for months so year-over-year comparisons remain valid.",
      "Releases are blocked on regressions in the north star, while exploratory suites iterate freely."
    ]
  },

  "capability-vs-alignment": {
    id: "capability-vs-alignment",
    module: "Module 1: Eval Foundations",
    title: "Capability and alignment are separate axes",
    overview: "Capability evals ask 'can the model do the task?' — math, code, retrieval, reasoning. Alignment evals ask 'does it do the task the way we intended?' — instruction-following, tone, refusal behavior, honesty. They fail independently, so a single aggregate score hides the axis that broke.",
    keyConcepts: [
      { heading: "Knowledge and skill", body: "Capability instruments are usually graded against a verifiable reference: a checked answer, compiling code, a passing test." },
      { heading: "Intent match", body: "Alignment instruments grade against a policy or preference: did it follow the format, respect a boundary, avoid over-refusing?" },
      { heading: "Independent failure", body: "A fine-tune can raise capability while collapsing safety behavior. Report both axes or you will ship half a system." }
    ],
    mathDeepDive: {
      title: "Twin-Axis Reporting",
      equation: "score = (capability + alignment) / 2,  gap = |capability − alignment|",
      explanation: "A composite of 0.80 can hide (0.95 capability, 0.65 alignment) or (0.80, 0.80). Always publish the pair and the gap, not just the mean."
    },
    realWorldEngineering: [
      "Frontier model cards report capability suites (MMLU, GPQA, SWE-bench) and safety suites (red-team, refusal, over-refusal) separately.",
      "A capability win that trips a safety gate is a release blocker regardless of the average."
    ]
  },

  "static-vs-dynamic": {
    id: "static-vs-dynamic",
    module: "Module 1: Eval Foundations",
    title: "Static suites and dynamic arenas trade off reproducibility for freshness",
    overview: "Frozen item banks are the backbone of reproducible comparison — but every public set eventually leaks into training data. Live arenas compare models on fresh traffic and resist contamination, at the cost of a moving population and a harder-to-audit protocol.",
    keyConcepts: [
      { heading: "Static: comparable, leaky", body: "Same items, same order, same scoring across releases. The longer a set is public, the more its items appear in pre-training corpora." },
      { heading: "Dynamic: fresh, drifting", body: "Arena-style battles sample real prompts continually, but the user population and prompt mix shift over time." },
      { heading: "Carry both", body: "Use static suites for regression and trend, arenas for contamination-resistant ranking. Label each number's provenance." }
    ],
    mathDeepDive: {
      title: "Leakage Risk Over Rounds",
      equation: "risk = static_share · (1 − rotation)^rounds + (1 − static_share) · 0.05",
      explanation: "With 100% static items and no rotation, risk stays at the floor imposed by leakage. Rotating 30% of items per release drops the static contribution by 0.7 each round."
    },
    realWorldEngineering: [
      "LMSYS Chatbot Arena pairs anonymous models on user prompts and ranks them with Elo/Bradley-Terry from live votes.",
      "HELM and MMLU-Pro are static and versioned; leaderboards pin the version alongside the score."
    ]
  },

  /* ============ MODULE 2 · BENCHMARK DESIGN ============ */
  "item-anatomy": {
    id: "item-anatomy",
    module: "Module 2: Benchmark Design",
    title: "Every benchmark item is five design decisions",
    overview: "An item is not just a question. It carries a prompt, a reference answer, a scoring rule, descriptive metadata, and a provenance record. Weakness in any field silently changes what the aggregate score means.",
    keyConcepts: [
      { heading: "Prompt and reference", body: "The exact prompt template (including few-shot examples) is part of the item; the reference defines what counts as correct." },
      { heading: "Scoring rule", body: "Exact match, token F1, rubric, or executable test — chosen before the run, never after seeing results." },
      { heading: "Metadata and provenance", body: "Capability leaf, difficulty, source, and license enable slicing and let others reproduce or audit the set." }
    ],
    mathDeepDive: {
      title: "The Score Is Conditional",
      equation: "score = f(item, prompt_template, decoding, scorer)",
      explanation: "Change the few-shot count and the same model can move several points. Reporting a bare number without these four inputs is not reproducible science."
    },
    realWorldEngineering: [
      "SWE-bench items bundle a repository snapshot, an issue, and a test patch — the scoring rule is executable, not textual.",
      "MMLU-Pro added 10-option questions and chain-of-thought prompting to reduce guess rate."
    ]
  },

  "difficulty-calibration": {
    id: "difficulty-calibration",
    module: "Module 2: Benchmark Design",
    title: "Difficulty and discrimination decide an item's value",
    overview: "Two classical item statistics tell you whether an item earns its place. Difficulty p is the fraction answering correctly. Discrimination d is how sharply the item separates stronger from weaker models. Items at the floor or ceiling add noise without information.",
    keyConcepts: [
      { heading: "Difficulty p", body: "p near 0.0 is a floor item (everyone fails), p near 1.0 a ceiling item (everyone passes). Both provide little signal." },
      { heading: "Discrimination d", body: "d = p(top group) − p(bottom group). High d means the item tracks the capability under test." },
      { heading: "Aim for a spread", body: "A test that is uniformly hard produces a compressed score distribution and a wide confidence interval." }
    ],
    mathDeepDive: {
      title: "Discrimination Index",
      equation: "d = p_top − p_bottom",
      explanation: "If the top quartile of models answers 0.9 and the bottom quartile 0.2, d = 0.7 — a strongly discriminating item. If both answer 0.5, d = 0 and the item is uninformative."
    },
    realWorldEngineering: [
      "Psychometrics teams routinely cull items with p < 0.1 or p > 0.9 before freezing a suite.",
      "Adaptive testing picks the next item near the examinee's current ability to maximize information per item."
    ]
  },

  "coverage-taxonomy": {
    id: "coverage-taxonomy",
    module: "Module 2: Benchmark Design",
    title: "Design capability coverage before writing items",
    overview: "Aggregate scores are averages over an item mix. If that mix is accidental, one easy, over-represented skill can carry the number. A coverage taxonomy declares the capability leaves first, then budgets items per leaf so the score reflects what you intend to measure.",
    keyConcepts: [
      { heading: "Declare the leaves", body: "Enumerate the capabilities the suite should cover — arithmetic, retrieval, multi-step reasoning, code, instruction-following — before authoring." },
      { heading: "Budget per leaf", body: "Assign item counts deliberately. Re-audit whenever the task or model changes." },
      { heading: "Measure concentration", body: "A Herfindahl-style concentration near 1 means the suite is effectively testing one thing." }
    ],
    mathDeepDive: {
      title: "Coverage Concentration",
      equation: "H = Σ (items_leaf / items_total)²",
      explanation: "Ten leaves with equal counts give H = 0.1. If one leaf holds 70% of items, H ≈ 0.5 — the aggregate is dominated by that one capability."
    },
    realWorldEngineering: [
      "HELM organizes scenarios and metrics as a coverage grid rather than a single leaderboard number.",
      "Domain suites (legal, medical) declare a taxonomy of task families and report per-family results."
    ]
  },

  /* ============ MODULE 3 · CONTAMINATION & INTEGRITY ============ */
  "ngram-contam": {
    id: "ngram-contam",
    module: "Module 3: Contamination & Integrity",
    title: "Detecting leakage between eval items and training data",
    overview: "If an eval item appeared in pre-training, its score measures memorization, not generalization. Contamination checks compare eval items against the training corpus at the n-gram and embedding level, then rank items by overlap so leaked items can be deduplicated or dropped.",
    keyConcepts: [
      { heading: "n-gram overlap", body: "Fraction of an item's n-grams also present in the corpus. High overlap on long spans is strong evidence of inclusion." },
      { heading: "Perplexity tells", body: "Anomalously low loss on an item the model should find hard is a memorization signature." },
      { heading: "Report the residual", body: "After cleaning, publish how much overlap remains rather than claiming a clean set." }
    ],
    mathDeepDive: {
      title: "Overlap Ratio",
      equation: "overlap = |ngrams(item) ∩ ngrams(corpus)| / |ngrams(item)|",
      explanation: "With n = 13, even a modest overlap indicates a shared passage. Systems like GPT-3's report used n-gram overlap to flag benchmark contamination."
    },
    realWorldEngineering: [
      "The GPT-3 paper used 13-gram overlap against Common Crawl to estimate benchmark contamination.",
      "Modern suites ship a contamination report and often a held-out private split."
    ]
  },

  "canary-trap": {
    id: "canary-trap",
    module: "Module 3: Contamination & Integrity",
    title: "Canary strings and trap items make memorization observable",
    overview: "Rather than infer leakage statistically, plant it. Canary strings are unusual tokens embedded in eval documents; if a model can reproduce them, the document was in its training data. Trap items are impossible or self-contradictory tasks whose only correct behavior is to fail — unexpected success means the model is gaming the scorer.",
    keyConcepts: [
      { heading: "Canary strings", body: "Unique, high-entropy markers (e.g. GUIDs) in eval text. Verbatim recovery is a definitive inclusion test." },
      { heading: "Trap items", body: "Impossible questions with no valid answer. A confident wrong answer is expected; a 'correct' one reveals cheating." },
      { heading: "Anomaly as signal", body: "Canary hits and trap successes are binary integrity failures, not soft penalties." }
    ],
    mathDeepDive: {
      title: "Recovery Rate",
      equation: "canary_recovery = hits / canaries_planted",
      explanation: "A non-zero recovery rate on canaries that never appeared in a legitimate answer stream proves the model saw the eval text during training."
    },
    realWorldEngineering: [
      "BigBench and private eval providers embed canary GUIDs in their data files for exactly this check.",
      "Code benchmarks use 'impossible' test cases to detect solutions that hard-code expected outputs."
    ]
  },

  "private-rotating": {
    id: "private-rotating",
    module: "Module 3: Contamination & Integrity",
    title: "Private splits and rotation keep an eval set alive",
    overview: "Every public item is a future training example. A private split — never published, never described in detail — preserves a clean measure of generalization. Rotation periodically replaces a fraction of public items with fresh ones, resetting the ceiling and slowing leakage.",
    keyConcepts: [
      { heading: "Private split", body: "Held out from papers, leaderboards, and data releases. The only protection against deliberate or accidental training inclusion." },
      { heading: "Rotation cadence", body: "Replace a fixed fraction each release window. Larger rotation fights leakage faster but breaks trend comparability." },
      { heading: "Version everything", body: "Pin the eval-set version to every reported score so a changed set is visible in the history." }
    ],
    mathDeepDive: {
      title: "Rotation Ceiling",
      equation: "ceiling = prior · (1 − rotation) + fresh · rotation",
      explanation: "Rotating 25% of items each cycle replaces a quarter of the memorized advantage every release while keeping 75% of the set stable for trend analysis."
    },
    realWorldEngineering: [
      "LiveBench refreshes its questions periodically specifically to resist contamination.",
      "Industrial eval teams maintain an internal private suite that never appears in external reporting."
    ]
  },

  /* ============ MODULE 4 · AUTOMATIC SCORING ============ */
  "exact-match": {
    id: "exact-match",
    module: "Module 4: Automatic Scoring",
    title: "Normalize first, then exact match or token F1",
    overview: "String scoring is the cheapest, most deterministic scorer available — and the most sensitive to formatting. Normalization (case, whitespace, punctuation, articles) is applied before comparison, because 'The Eiffel Tower.' and 'eiffel tower' should not be different answers. Token F1 extends the idea with partial credit over bags of words.",
    keyConcepts: [
      { heading: "Normalization is the scorer", body: "Every normalization choice changes the score. Fix it in the protocol and keep it constant across models." },
      { heading: "Exact match", body: "All-or-nothing after normalization. Correct for multiple choice, named entities, and numeric answers." },
      { heading: "Token F1", body: "Multiset overlap between prediction and reference tokens. Tolerates word-order changes and gives partial credit." }
    ],
    mathDeepDive: {
      title: "Token F1",
      equation: "F1 = 2 · precision · recall / (precision + recall)",
      explanation: "Prediction 'the quick brown fox' against 'the quick fox': precision 3/4, recall 3/3, F1 ≈ 0.857. The extra adjective costs precision without costing recall."
    },
    realWorldEngineering: [
      "SQuAD reporting uses normalized exact match plus token F1 as the two standard extractive-QA metrics.",
      "Numeric answers are compared after rounding and unit normalization, never as raw strings."
    ]
  },

  "overlap-metrics": {
    id: "overlap-metrics",
    module: "Module 4: Automatic Scoring",
    title: "BLEU and ROUGE measure surface overlap, not meaning",
    overview: "BLEU scores n-gram precision against one or more references with a brevity penalty; ROUGE scores reference n-gram recall. Both are fast and reproducible, and both are blind to paraphrase: a correct restatement scores as badly as a wrong one. They are diagnostics for surface form, not judges of quality.",
    keyConcepts: [
      { heading: "BLEU precision", body: "Clip each candidate n-gram count by its reference count, then take the geometric mean of precisions across n." },
      { heading: "Brevity penalty", body: "Short candidates are penalized so a model cannot win by emitting only high-precision fragments." },
      { heading: "ROUGE recall", body: "Fraction of reference n-grams the candidate covers — favors long, inclusive outputs." }
    ],
    mathDeepDive: {
      title: "BLEU",
      equation: "BLEU = BP · exp(Σ w_n · log p_n),  BP = min(1, e^(1 − ref/cand))",
      explanation: "Precisions [0.8, 0.6, 0.4, 0.2] with equal weights give a geometric mean of about 0.44; a candidate shorter than the reference is then penalized by the brevity factor."
    },
    realWorldEngineering: [
      "BLEU remains standard for machine translation but correlates weakly with human judgment on open-ended generation.",
      "ROUGE is standard for summarization; extraction-based summaries score higher than abstractive ones because they copy n-grams."
    ]
  },

  "programmatic-grading": {
    id: "programmatic-grading",
    module: "Module 4: Automatic Scoring",
    title: "Execute the answer: verifiers as ground truth",
    overview: "For code and math, the answer can be checked by running it. Programmatic grading extracts a candidate program or expression, executes it against tests or a reference implementation, and returns a deterministic pass/fail. This is the strongest form of automatic scoring because it cannot be fooled by fluent prose.",
    keyConcepts: [
      { heading: "Robust extraction", body: "Find the code block or final answer before grading. Extraction failures masquerade as model failures and are a common source of bogus scores." },
      { heading: "Test harnesses", body: "Unit tests, property checks, and reference implementations provide binary or partial credit." },
      { heading: "pass@k", body: "When sampling k solutions, report the fraction of problems solved by at least one sample." }
    ],
    mathDeepDive: {
      title: "pass@k",
      equation: "pass@k = 1 − C(n − c, k) / C(n, k)",
      explanation: "With 10 samples and 5 correct, pass@1 = 0.5 while pass@5 ≈ 0.996. pass@k measures reachable capability; pass@1 measures reliability."
    },
    realWorldEngineering: [
      "HumanEval and MBPP execute generated Python against hidden tests and report pass@1 and pass@k.",
      "SWE-bench verifies patches by running a repository's own test suite in an isolated container."
    ]
  },

  /* ============ MODULE 5 · LLM-AS-JUDGE ============ */
  "judge-rubric": {
    id: "judge-rubric",
    module: "Module 5: LLM-as-Judge",
    title: "A judge is only as good as its rubric",
    overview: "When there is no single correct answer, an LLM can grade open-ended output against a rubric. The rubric defines the criteria, the score levels, and observable anchors for each level. Vague rubrics produce noisy, self-inconsistent scores that are impossible to audit.",
    keyConcepts: [
      { heading: "Criteria and anchors", body: "Define each score level by observable properties ('cites a source', 'arithmetic is correct'), not adjectives like 'good'." },
      { heading: "One axis at a time", body: "Scoring helpfulness, correctness, and tone in one pass compounds errors. Split into separate judgments." },
      { heading: "Structured output", body: "Force a schema (criterion, score, rationale) so scores can be parsed, aggregated, and audited." }
    ],
    mathDeepDive: {
      title: "Rubric Consistency",
      equation: "σ_score² = σ_true² + σ_rubric² + σ_judge²",
      explanation: "Observed judge variance mixes real quality differences, rubric ambiguity, and judge sampling. Tightening anchors reduces the middle term; lower temperature reduces the last."
    },
    realWorldEngineering: [
      "MT-Bench uses a structured rubric with a 1–10 scale and explicit criteria for each axis.",
      "Production LLM evaluation often uses binary pass/fail rubrics, which are more reproducible than wide ordinal scales."
    ]
  },

  "pairwise-judge": {
    id: "pairwise-judge",
    module: "Module 5: LLM-as-Judge",
    title: "Pairwise comparison buys lower variance at an aggregation cost",
    overview: "Humans and judges are far more consistent at choosing between two answers than at assigning absolute scores. Pairwise comparison asks 'which is better?' and allows ties. The cost is that win rates must be aggregated across pairs to recover a ranking, usually through Bradley-Terry or Elo.",
    keyConcepts: [
      { heading: "Lower variance", body: "Relative judgments remove scale ambiguity: the judge only needs to order two options, not calibrate an absolute scale." },
      { heading: "Allow ties", body: "Forcing a winner when answers are equivalent injects false wins and biases the ranking." },
      { heading: "Aggregate to a ranking", body: "Fit Bradley-Terry: P(A beats B) = σ(r_A − r_B), then convert ratings to win rates." }
    ],
    mathDeepDive: {
      title: "Bradley-Terry",
      equation: "P(A ≻ B) = 1 / (1 + e^−(r_A − r_B))",
      explanation: "A rating gap of 2.2 logits corresponds to roughly a 90% win probability. Pairwise outcomes across many models fit this single model jointly."
    },
    realWorldEngineering: [
      "Chatbot Arena exposes only pairwise battles and fits a Bradley-Terry model to produce Elo-like ratings.",
      "Pairwise judging requires O(n²) comparisons for n models, so organizers use sparse battle schedules."
    ]
  },

  "judge-bias": {
    id: "judge-bias",
    module: "Module 5: LLM-as-Judge",
    title: "Audit the judge: position, length, and self-preference",
    overview: "An LLM judge carries systematic biases. It tends to prefer the answer in a particular position, the longer answer, and answers from its own model family. None of these are fatal — but they must be measured and corrected, or the ranking reflects the judge's quirks rather than model quality.",
    keyConcepts: [
      { heading: "Position bias", body: "Judges often favor the first (or second) slot. Swap the order, re-judge, and average to cancel it." },
      { heading: "Length bias", body: "Longer answers win more often even when length is irrelevant. Report length-controlled win rates." },
      { heading: "Self-preference", body: "A judge prefers text from its own family. Use a judge from a different family than the candidates." }
    ],
    mathDeepDive: {
      title: "Order-Averaged Win Rate",
      equation: "win = (win_as_first + win_as_second) / 2",
      explanation: "If a model wins 68% in slot A but only 44% in slot B, its true rate is about 56%. Reporting only one order inflates the result by the position bias."
    },
    realWorldEngineering: [
      "MT-Bench's paper measured GPT-4 position bias and length bias and recommended order-swapping.",
      "Production judges are validated against a human gold set before their scores are trusted."
    ]
  },

  /* ============ MODULE 6 · HUMAN & ARENA EVALUATION ============ */
  "annotation-protocol": {
    id: "annotation-protocol",
    module: "Module 6: Human & Arena Evaluation",
    title: "Human labels are an instrument, not an opinion pool",
    overview: "Human evaluation quality is determined before any labeling starts — by the guideline, the task framing, the rater training, and the quality-control stream. A vague guideline produces labels that cannot be aggregated no matter how many raters you add.",
    keyConcepts: [
      { heading: "Guidelines are the spec", body: "Every decision the rater must make should be documented with examples, including edge cases and tie handling." },
      { heading: "Gold items", body: "Seed known-answer items into the stream to detect raters who are not reading or not following the guide." },
      { heading: "Adjudication", body: "Resolve disagreements through a defined process rather than majority-voting them into noise." }
    ],
    mathDeepDive: {
      title: "Rater Reliability Gate",
      equation: "keep_rater if gold_accuracy ≥ threshold",
      explanation: "A rater answering seeded gold items with 60% accuracy is not producing usable labels regardless of how many items they label."
    },
    realWorldEngineering: [
      "Annotation platforms run qualification rounds and embed gold items continuously, not just at onboarding.",
      "Safety data labeling uses detailed policy rubrics with escalation paths for ambiguous cases."
    ]
  },

  "inter-annotator": {
    id: "inter-annotator",
    module: "Module 6: Human & Arena Evaluation",
    title: "Agreement must be corrected for chance",
    overview: "Two raters will agree by chance on any balanced binary task roughly half the time. Percent agreement therefore overstates reliability. Cohen's kappa subtracts the chance component, exposing whether raters are actually using the same construct. Low kappa means the task or the guideline is ill-defined.",
    keyConcepts: [
      { heading: "Percent agreement", body: "The raw fraction of items where raters match. Simple, intuitive, inflated by chance and by skewed label distributions." },
      { heading: "Cohen's kappa", body: "κ = (p_o − p_e) / (1 − p_e), where p_e is the agreement expected if labels were independent." },
      { heading: "Interpretation", body: "κ < 0.4 signals a problem; 0.6–0.8 is substantial; above 0.8 is strong. Always report it with the labels." }
    ],
    mathDeepDive: {
      title: "Cohen's Kappa",
      equation: "κ = (p_o − p_e) / (1 − p_e)",
      explanation: "Observed agreement 0.8 against chance agreement 0.5 gives κ = 0.6. The same 0.8 with a harder task (chance 0.2) gives κ = 0.75 — reliability depends on the task's base rates."
    },
    realWorldEngineering: [
      "Krippendorff's alpha generalizes kappa to more than two raters and missing data.",
      "A low kappa is usually fixed by tightening the guideline, not by adding raters."
    ]
  },

  "arena-elo": {
    id: "arena-elo",
    module: "Module 6: Human & Arena Evaluation",
    title: "Elo turns pairwise votes into a ranking — with uncertainty",
    overview: "Arena evaluation collects pairwise human preferences and updates Elo ratings: an upset moves the winner's rating more than an expected win. Elo is interpretable and robust, but a rating is a distribution, not a fact — the confidence interval and the battle sampling determine what the rank actually means.",
    keyConcepts: [
      { heading: "Expected score", body: "E_A = 1 / (1 + 10^((R_B − R_A)/400)). The update R_A' = R_A + K(S_A − E_A) moves more on surprise." },
      { heading: "Rank is a distribution", body: "Overlapping intervals mean the rank order is not resolved by the data." },
      { heading: "Sampling shapes the ranking", body: "Which prompts get battled determines which capabilities the rating reflects. A coding-heavy arena ranks coding ability." }
    ],
    mathDeepDive: {
      title: "Elo Update",
      equation: "R_A' = R_A + K · (S_A − E_A)",
      explanation: "A 1600-rated model against a 1500-rated opponent has expected score 0.64. A win (S=1) with K=32 adds 11.5 points; the same win against a 1800 opponent adds far more."
    },
    realWorldEngineering: [
      "Chatbot Arena publishes Elo with bootstrap confidence intervals for every model.",
      "New models need enough battles before their interval tightens and their rank stabilizes."
    ]
  },

  /* ============ MODULE 7 · STATISTICAL RIGOR ============ */
  "confidence-intervals": {
    id: "confidence-intervals",
    module: "Module 7: Statistical Rigor",
    title: "Every score is a draw from a sampling distribution",
    overview: "A benchmark score is computed on one sample of items. Had the set been drawn differently, the score would differ. The confidence interval quantifies that variability. Reporting a point estimate without n and an interval is the most common statistical error in model evaluation.",
    keyConcepts: [
      { heading: "Standard error", body: "For a proportion, SE = √(p(1−p)/n). It shrinks as 1/√n, so precision gets expensive." },
      { heading: "95% interval", body: "h = 1.96·SE. For 500 items at 70% accuracy, h ≈ ±4.0 points." },
      { heading: "Compare intervals", body: "Claim an improvement only when the intervals separate — or better, use a paired test." }
    ],
    mathDeepDive: {
      title: "Half-Width and Sample Size",
      equation: "h = 1.96·√(p(1−p)/n),  n = (1.96/h)²·p(1−p)",
      explanation: "Halving the interval requires four times the items. To resolve a 2-point difference at 50% accuracy you need roughly 9,600 items per model."
    },
    realWorldEngineering: [
      "HELM reports standard errors alongside every aggregate metric.",
      "Leaderboards that rank models within a point or two without intervals are reporting noise."
    ]
  },

  "paired-tests": {
    id: "paired-tests",
    module: "Module 7: Statistical Rigor",
    title: "Paired tests compare models on the same items",
    overview: "When two models answer the same items, only the items where they disagree carry information about the difference. McNemar's test analyzes those discordant pairs, removing item-difficulty variance and producing a much sharper test than comparing two independent confidence intervals.",
    keyConcepts: [
      { heading: "The 2×2 table", body: "b = items only A got right, c = items only B got right. Concordant cells (both right, both wrong) add nothing." },
      { heading: "McNemar statistic", body: "χ² = (|b − c| − 1)² / (b + c), compared against a chi-square distribution with one degree of freedom." },
      { heading: "Sharper by construction", body: "Pairing removes the variance shared by the items, so the same n detects smaller differences." }
    ],
    mathDeepDive: {
      title: "McNemar's Test",
      equation: "χ² = (|b − c| − 1)² / (b + c)",
      explanation: "With b = 30 and c = 10, χ² = 19²/40 = 9.03, comfortably significant at p < 0.01. Comparing two independent 70%–62% intervals on the same items would likely find nothing."
    },
    realWorldEngineering: [
      "Paired bootstrap and McNemar are standard in NLP when comparing two systems on a shared test set.",
      "Models run on identical item sets should always be analyzed with paired methods."
    ]
  },

  "bootstrap-multiple": {
    id: "bootstrap-multiple",
    module: "Module 7: Statistical Rigor",
    title: "Resample for intervals, then pay for every comparison",
    overview: "The bootstrap builds a sampling distribution by resampling the observed data, without assuming normality — useful for medians, ratios, and Elo. But testing many slices at once inflates false positives. The multiple-comparisons tax (Bonferroni, Holm) must be paid on every additional hypothesis.",
    keyConcepts: [
      { heading: "Bootstrap", body: "Draw n items with replacement many times, recompute the statistic each time, and read percentiles as the interval." },
      { heading: "Family-wise error", body: "Twenty independent tests at α = 0.05 expect one false positive by chance alone." },
      { heading: "Holm correction", body: "Sort p-values and compare each to α/(m − i + 1), stopping at the first failure. Uniformly more powerful than Bonferroni." }
    ],
    mathDeepDive: {
      title: "Holm Step-Down",
      equation: "reject p_(i) if p_(i) ≤ α / (m − i + 1)",
      explanation: "With p-values [0.001, 0.01, 0.04, 0.20] and α = 0.05: the first two fall below 0.0125 and 0.0167, the third (0.04) does not clear 0.025, so three comparisons are rejected in sequence — exactly two."
    },
    realWorldEngineering: [
      "Arena Elo intervals are frequently computed with the bootstrap over battles.",
      "Benchmark papers comparing many models across many tasks must correct for multiplicity or report it explicitly."
    ]
  },

  /* ============ MODULE 8 · REGRESSION GATES & MONITORING ============ */
  "regression-gate": {
    id: "regression-gate",
    module: "Module 8: Regression Gates & Monitoring",
    title: "Turn evaluation into a release gate",
    overview: "An eval that nobody blocks on is documentation. A regression gate attaches a per-capability allowance to the tested axes and fails the build when any axis falls past it. Per-capability budgets matter because a rising average can hide a broken axis — the exact failure a global threshold misses.",
    keyConcepts: [
      { heading: "Per-capability allowances", body: "Math, code, safety, and instruction-following each get their own tolerance, set from historical noise." },
      { heading: "Fail on the axis", body: "Even if the composite improves, a single axis past its allowance blocks the release." },
      { heading: "Review the thresholds", body: "Gate thresholds are code: versioned, reviewed, and changed deliberately." }
    ],
    mathDeepDive: {
      title: "Gate Breach",
      equation: "breach if (after − before) < −allowance",
      explanation: "A capability allowed to move ±2 points fails when it drops 3. Setting the allowance too tight makes the gate flaky; too loose and real regressions ship."
    },
    realWorldEngineering: [
      "CI pipelines run a fixed eval subset on every prompt or model change and block the merge on regression.",
      "Gate allowances are usually derived from the measured run-to-run variance of each suite."
    ]
  },

  "prompt-regression": {
    id: "prompt-regression",
    module: "Module 8: Regression Gates & Monitoring",
    title: "A frozen golden set catches quiet breakage",
    overview: "Prompt changes are code changes with no compiler. Editing one instruction to fix an edge case can silently break fifty other cases. A golden set — a frozen, versioned collection of representative inputs and expected behaviors — is re-run on every change and diffed item by item.",
    keyConcepts: [
      { heading: "Freeze and version", body: "The golden set is immutable per version. New cases are added in a new version so old comparisons stay valid." },
      { heading: "Diff, don't average", body: "Aggregate scores hide swaps: two items improving can mask two breaking. Inspect per-item flips." },
      { heading: "Tie prompt to evidence", body: "Every prompt version records the eval run that approved it, so regressions can be bisected." }
    ],
    mathDeepDive: {
      title: "Adverse Regression Rate",
      equation: "rate = regressed_items / tested_items",
      explanation: "If 40 of 2,000 golden items flip from pass to fail, the adverse regression rate is 2% — small in aggregate, but decisive if those items cover a critical capability."
    },
    realWorldEngineering: [
      "Prompt-management systems store prompt versions alongside eval scores for every revision.",
      "Canary and shadow evaluation run a new prompt against live traffic before full rollout."
    ]
  },

  "online-drift": {
    id: "online-drift",
    module: "Module 8: Regression Gates & Monitoring",
    title: "Production inputs move; offline scores age",
    overview: "Offline evals are a proxy for production, and the proxy degrades as the input population shifts. Online monitoring samples live traffic, scores it against expectations (automatically or with an LLM judge), and tracks distribution drift. A standardized drift score turns 'it feels worse' into an alert.",
    keyConcepts: [
      { heading: "Sample and score", body: "Continuously sample production requests and score a subset to estimate live quality." },
      { heading: "Distribution drift", body: "Track the mean and spread of inputs and scores. A shift in either signals that the offline eval no longer represents traffic." },
      { heading: "Bound the blast radius", body: "Canary deploys expose a small fraction of traffic first, so drift and failures surface before full release." }
    ],
    mathDeepDive: {
      title: "Standardized Drift",
      equation: "drift = |current_mean − baseline_mean| / baseline_std",
      explanation: "A drift of 1.4 standard deviations is a large population shift — the kind that can move quality without any code change, because the inputs changed."
    },
    realWorldEngineering: [
      "Production monitors combine task-success proxies, judge scores, and input-distribution alerts.",
      "Shadow deployments score candidate models on live prompts before switching any user traffic."
    ]
  },
};
