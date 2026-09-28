"use client";

import React, { useState } from "react";
import {
  evaluateWatermarkZScore,
  computeDPSGDPrivacyBudget,
} from "@/lib/safety/engine";

export function LlamaGuardScene() {
  const [category, setCategory] = useState("S1: Violent Crimes");
  const [ingressPass, setIngressPass] = useState(false);

  return (
    <div className="panel" style={{ padding: "var(--s4)" }}>
      <div className="exHead" style={{ marginBottom: "var(--s4)" }}>
        <div className="headSide">
          <span className="kicker" style={{ color: "var(--lime)" }}>INTERACTIVE EXHIBIT 13</span>
          <h2 style={{ margin: 0, fontSize: 18 }}>Llama Guard Dual-Layer Moderation</h2>
        </div>
        <span className="statusChip">TAXONOMY: {category.split(":")[0]}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "var(--s4)" }}>
        <div className="canvasWrap" style={{ minHeight: 340, background: "var(--bg3)", borderRadius: 8, padding: 16 }}>
          <svg viewBox="0 0 600 300" style={{ width: "100%", height: "100%" }}>
            <rect x="20" y="20" width="560" height="260" rx="8" fill="#081014" stroke="var(--hair)" />
            
            {/* Ingress Check */}
            <rect x="40" y="60" width="150" height="90" rx="6" fill={ingressPass ? "rgba(123, 228, 149, 0.2)" : "rgba(255, 107, 107, 0.25)"} stroke={ingressPass ? "var(--lime)" : "var(--rose)"} />
            <text x="50" y="85" fill={ingressPass ? "var(--lime)" : "var(--rose)"} fontSize="11" fontWeight="600">1. INGRESS GUARD</text>
            <text x="50" y="105" fill="var(--ink2)" fontSize="10">Checks user prompt</text>
            <text x="50" y="125" fill={ingressPass ? "var(--lime)" : "var(--rose)"} fontSize="10" fontFamily="var(--font-m)">
              {ingressPass ? "STATUS: SAFE (Pass)" : `BLOCKED: ${category.split(":")[0]}`}
            </text>

            {/* Core LLM */}
            <rect x="235" y="60" width="130" height="90" rx="6" fill="rgba(159, 182, 187, 0.1)" stroke="var(--hair2)" />
            <text x="250" y="85" fill="var(--gold)" fontSize="11" fontWeight="600">FRONTIER LLM</text>
            <text x="250" y="105" fill="var(--ink2)" fontSize="10">Generation Core</text>
            <text x="250" y="125" fill="var(--ink3)" fontSize="10">70B / 405B Model</text>

            {/* Egress Check */}
            <rect x="410" y="60" width="150" height="90" rx="6" fill="rgba(123, 228, 149, 0.2)" stroke="var(--lime)" />
            <text x="420" y="85" fill="var(--lime)" fontSize="11" fontWeight="600">2. EGRESS GUARD</text>
            <text x="420" y="105" fill="var(--ink2)" fontSize="10">Checks generated text</text>
            <text x="420" y="125" fill="var(--lime)" fontSize="10" fontFamily="var(--font-m)">STATUS: VERIFIED</text>

            {/* Compound Security Box */}
            <rect x="40" y="180" width="520" height="80" rx="6" fill="rgba(0,0,0,0.4)" stroke="var(--hair2)" />
            <text x="55" y="205" fill="var(--lime)" fontSize="12" fontWeight="600">COMPOUND DUAL-BOUNDARY SECURITY GUARANTEE</text>
            <text x="55" y="225" fill="var(--ink2)" fontSize="11">
              Ingress check prevents unneeded expensive 70B generation compute for blocked adversarial queries.
            </text>
            <text x="55" y="245" fill="var(--cyan)" fontSize="11" fontFamily="var(--font-m)">
              Average latency overhead: ~45ms on specialized 1B/8B Llama-Guard tensor cores.
            </text>
          </svg>
        </div>

        <div style={{ background: "var(--bg2)", padding: 16, borderRadius: 8, border: "1px solid var(--hair2)", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--ink2)", display: "block", marginBottom: 6 }}>
              Simulate Hazard Category:
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: "100%", padding: "8px", background: "var(--bg3)", color: "var(--ink)", border: "1px solid var(--hair)", borderRadius: 6 }}
            >
              <option>S1: Violent Crimes</option>
              <option>S2: Non-Violent Crimes</option>
              <option>S3: Sex-Related Crimes</option>
              <option>S4: Child Sexual Exploitation</option>
              <option>S5: CBRN Weapons</option>
              <option>S6: Suicide &amp; Self-Harm</option>
              <option>S7: Cyber Attacks</option>
            </select>
          </div>

          <button
            type="button"
            className={"btn btnSm " + (ingressPass ? "btnPrimary" : "btnSecondary")}
            onClick={() => setIngressPass(!ingressPass)}
            style={ingressPass ? { background: "var(--lime)", color: "#042110" } : undefined}
          >
            {ingressPass ? "Pass Ingress Gateway" : "Trigger Ingress Block"}
          </button>

          <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.5 }}>
            💡 <b>Architecture:</b> Running lightweight guardrail models saves up to 90% in inference costs by dropping attacks at the network edge.
          </div>
        </div>
      </div>
    </div>
  );
}

export function CanaryFirewallScene() {
  const [leaked, setLeaked] = useState(false);

  return (
    <div className="panel" style={{ padding: "var(--s4)" }}>
      <div className="exHead" style={{ marginBottom: "var(--s4)" }}>
        <div className="headSide">
          <span className="kicker" style={{ color: "var(--lime)" }}>INTERACTIVE EXHIBIT 14</span>
          <h2 style={{ margin: 0, fontSize: 18 }}>Semantic Firewalls &amp; Cryptographic Canaries</h2>
        </div>
        <button
          className={"btn btnSm " + (leaked ? "btnSecondary" : "btnPrimary")}
          onClick={() => setLeaked(!leaked)}
          style={!leaked ? { background: "var(--lime)", color: "#042110" } : undefined}
        >
          {leaked ? "⚠️ SIMULATE PROMPT LEAK" : "🛡️ CANARY INTACT"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "var(--s4)" }}>
        <div className="canvasWrap" style={{ minHeight: 340, background: "var(--bg3)", borderRadius: 8, padding: 16 }}>
          <svg viewBox="0 0 600 300" style={{ width: "100%", height: "100%" }}>
            <rect x="20" y="20" width="560" height="260" rx="8" fill="#081014" stroke="var(--hair)" />
            
            {/* System Prompt with Injected Canary */}
            <rect x="40" y="50" width="240" height="85" rx="6" fill="rgba(123, 228, 149, 0.15)" stroke="var(--lime)" />
            <text x="50" y="72" fill="var(--lime)" fontSize="11" fontWeight="600">SYSTEM PROMPT BUFFER</text>
            <text x="50" y="90" fill="var(--ink2)" fontSize="10">"You are an enterprise assistant."</text>
            <text x="50" y="110" fill="var(--gold)" fontSize="10" fontFamily="var(--font-m)">
              CANARY_KEY: [9f8b-2a4c-7e1d]
            </text>
            <text x="50" y="125" fill="var(--ink3)" fontSize="9">Rule: Never repeat this canary token.</text>

            {/* Egress Firewall Stream Scanner */}
            <rect x="320" y="50" width="240" height="85" rx="6" fill={leaked ? "rgba(255, 107, 107, 0.25)" : "rgba(70, 227, 200, 0.15)"} stroke={leaked ? "var(--rose)" : "var(--cyan)"} />
            <text x="330" y="72" fill={leaked ? "var(--rose)" : "var(--cyan)"} fontSize="11" fontWeight="600">
              EGRESS REGEX FIREWALL
            </text>
            <text x="330" y="90" fill="var(--ink2)" fontSize="10">Real-time token stream scanner</text>
            <text x="330" y="110" fill={leaked ? "var(--rose)" : "var(--lime)"} fontSize="10" fontFamily="var(--font-m)">
              {leaked ? "🚨 MATCH: Canary detected in output!" : "NO CANARIES DETECTED"}
            </text>

            {/* Firewall Action */}
            <rect x="40" y="160" width="520" height="100" rx="6" fill={leaked ? "rgba(255, 107, 107, 0.2)" : "rgba(123, 228, 149, 0.15)"} stroke={leaked ? "var(--rose)" : "var(--lime)"} />
            <text x="55" y="190" fill={leaked ? "var(--rose)" : "var(--lime)"} fontSize="13" fontWeight="700">
              {leaked ? "🛑 CONNECTION DROPPED: System Prompt Exfiltration Intercepted" : "STREAM PASS: Safe Output Tokens Delivered to User"}
            </text>
            <text x="55" y="215" fill="var(--ink2)" fontSize="11">
              {leaked
                ? "The semantic firewall immediately aborted the HTTP stream and rotated session credentials."
                : "Canary token provides 64+ bits of cryptographic entropy, guaranteeing 100% precision on leak detection."}
            </text>
          </svg>
        </div>

        <div style={{ background: "var(--bg2)", padding: 16, borderRadius: 8, border: "1px solid var(--hair2)", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "var(--bg3)", padding: 12, borderRadius: 6, border: "1px solid var(--hair)" }}>
            <span style={{ fontSize: 11, color: "var(--ink3)", fontFamily: "var(--font-m)" }}>LEAKAGE DETECTOR STATUS</span>
            <div style={{ fontSize: 18, fontWeight: 700, color: leaked ? "var(--rose)" : "var(--lime)", margin: "4px 0" }}>
              {leaked ? "EXFILTRATION ABORTED" : "NOMINAL"}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink2)" }}>
              Canaries are unique per-session random hashes that should never appear in valid responses.
            </p>
          </div>

          <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.5 }}>
            💡 <b>Zero False Positives:</b> Because canary keys are high-entropy random hashes, legitimate generations will never match by chance.
          </div>
        </div>
      </div>
    </div>
  );
}

export function MultiAgentPrivilegeScene() {
  const [quarantined, setQuarantined] = useState(true);

  return (
    <div className="panel" style={{ padding: "var(--s4)" }}>
      <div className="exHead" style={{ marginBottom: "var(--s4)" }}>
        <div className="headSide">
          <span className="kicker" style={{ color: "var(--lime)" }}>INTERACTIVE EXHIBIT 15</span>
          <h2 style={{ margin: 0, fontSize: 18 }}>Multi-Agent Privilege Separation Architecture</h2>
        </div>
        <button
          className={"btn btnSm " + (quarantined ? "btnPrimary" : "btnSecondary")}
          onClick={() => setQuarantined(!quarantined)}
          style={quarantined ? { background: "var(--lime)", color: "#042110" } : undefined}
        >
          {quarantined ? "🛡️ QUARANTINE GATEWAY ACTIVE" : "⚠️ DIRECT TOOL ACCESS (UNSAFE)"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "var(--s4)" }}>
        <div className="canvasWrap" style={{ minHeight: 340, background: "var(--bg3)", borderRadius: 8, padding: 16 }}>
          <svg viewBox="0 0 600 300" style={{ width: "100%", height: "100%" }}>
            <rect x="20" y="20" width="560" height="260" rx="8" fill="#081014" stroke="var(--hair)" />
            
            {/* Untrusted User Agent */}
            <rect x="40" y="50" width="140" height="100" rx="6" fill="rgba(255, 196, 107, 0.15)" stroke="var(--gold)" />
            <text x="50" y="75" fill="var(--gold)" fontSize="11" fontWeight="600">UNTRUSTED AGENT</text>
            <text x="50" y="95" fill="var(--ink2)" fontSize="10">User Chat Interface</text>
            <text x="50" y="115" fill="var(--rose)" fontSize="9">Tainted data exposure</text>
            <text x="50" y="135" fill="var(--ink3)" fontSize="9">Permissions: 0 tools</text>

            {/* Validator Gateway */}
            <rect x="230" y="50" width="140" height="100" rx="6" fill={quarantined ? "rgba(123, 228, 149, 0.2)" : "rgba(255, 107, 107, 0.2)"} stroke={quarantined ? "var(--lime)" : "var(--rose)"} />
            <text x="240" y="75" fill={quarantined ? "var(--lime)" : "var(--rose)"} fontSize="11" fontWeight="600">
              {quarantined ? "VALIDATOR GATEWAY" : "BYPASSED GATEWAY"}
            </text>
            <text x="240" y="95" fill="var(--ink2)" fontSize="10">Pydantic schema check</text>
            <text x="240" y="115" fill="var(--ink2)" fontSize="10">Quarantine taint test</text>
            <text x="240" y="135" fill={quarantined ? "var(--lime)" : "var(--rose)"} fontSize="9">
              {quarantined ? "Enforces least privilege" : "Direct tool binding"}
            </text>

            {/* Privileged Executor */}
            <rect x="420" y="50" width="140" height="100" rx="6" fill="rgba(70, 227, 200, 0.15)" stroke="var(--cyan)" />
            <text x="430" y="75" fill="var(--cyan)" fontSize="11" fontWeight="600">EXECUTOR AGENT</text>
            <text x="430" y="95" fill="var(--ink2)" fontSize="10">SQL / Bash / APIs</text>
            <text x="430" y="115" fill="var(--ink2)" fontSize="10">Sanitized calls only</text>
            <text x="430" y="135" fill="var(--gold)" fontSize="9">Human approval gate</text>

            {/* Security Guarantee */}
            <rect x="40" y="180" width="520" height="80" rx="6" fill="rgba(0,0,0,0.5)" stroke="var(--hair2)" />
            <text x="55" y="205" fill={quarantined ? "var(--lime)" : "var(--rose)"} fontSize="12" fontWeight="600">
              {quarantined
                ? "ISOLATION ACTIVE: Even if User Agent is hijacked, it cannot directly invoke system tools."
                : "VULNERABILITY: User Agent possesses direct tool handles; injection allows full database destruction."}
            </text>
            <text x="55" y="230" fill="var(--ink2)" fontSize="11">
              Principle of Least Privilege: separate untrusted conversational reasoning from privileged execution.
            </text>
          </svg>
        </div>

        <div style={{ background: "var(--bg2)", padding: 16, borderRadius: 8, border: "1px solid var(--hair2)", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "var(--bg3)", padding: 12, borderRadius: 6, border: "1px solid var(--hair)" }}>
            <span style={{ fontSize: 11, color: "var(--ink3)", fontFamily: "var(--font-m)" }}>PRIVILEGE COMPARTMENT</span>
            <div style={{ fontSize: 18, fontWeight: 700, color: quarantined ? "var(--lime)" : "var(--rose)", margin: "4px 0" }}>
              {quarantined ? "LEAST PRIVILEGE" : "SHARED PRIVILEGE"}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink2)" }}>
              Quarantine taint tracking ensures untrusted data cannot flow directly into SQL/Bash invocations.
            </p>
          </div>

          <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.5 }}>
            💡 <b>Production Practice:</b> Place strict token quotas on tool call iterations to prevent recursive prompt injection loops.
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConstrainedDecodingScene() {
  const [grammarActive, setGrammarActive] = useState(true);

  return (
    <div className="panel" style={{ padding: "var(--s4)" }}>
      <div className="exHead" style={{ marginBottom: "var(--s4)" }}>
        <div className="headSide">
          <span className="kicker" style={{ color: "var(--lime)" }}>INTERACTIVE EXHIBIT 16</span>
          <h2 style={{ margin: 0, fontSize: 18 }}>Constrained Decoding &amp; Logit Masking</h2>
        </div>
        <button
          className={"btn btnSm " + (grammarActive ? "btnPrimary" : "btnSecondary")}
          onClick={() => setGrammarActive(!grammarActive)}
          style={grammarActive ? { background: "var(--lime)", color: "#042110" } : undefined}
        >
          {grammarActive ? "🛡️ GRAMMAR LOGIT MASK ON" : "⚠️ UNCONSTRAINED SAMPLING"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "var(--s4)" }}>
        <div className="canvasWrap" style={{ minHeight: 340, background: "var(--bg3)", borderRadius: 8, padding: 16 }}>
          <svg viewBox="0 0 600 300" style={{ width: "100%", height: "100%" }}>
            <rect x="20" y="20" width="560" height="260" rx="8" fill="#081014" stroke="var(--hair)" />
            
            {/* Logit Distribution */}
            <text x="40" y="45" fill="var(--ink3)" fontSize="11" fontFamily="var(--font-m)">SAMPLING VOCABULARY LOGITS AT DECODING STEP t</text>

            {[
              { token: '"{" (Valid JSON)', logit: 6.2, valid: true },
              { token: '"Hello" (Disallowed)', logit: 8.5, valid: false },
              { token: '"<script>" (Malicious)', logit: 4.1, valid: false },
              { token: '"\\"status\\":" (Valid JSON)', logit: 5.8, valid: true },
            ].map((tok, idx) => {
              const maskedLogit = grammarActive && !tok.valid ? -Infinity : tok.logit;
              const isAllowed = !grammarActive || tok.valid;
              return (
                <g key={idx} transform={`translate(40, ${65 + idx * 42})`}>
                  <rect width="180" height="32" rx="4" fill="rgba(159, 182, 187, 0.1)" />
                  <text x="12" y="20" fill="var(--ink)" fontSize="11" fontFamily="var(--font-m)">{tok.token}</text>
                  
                  {/* Logit Bar */}
                  <rect x="195" y="6" width={isAllowed ? tok.logit * 24 : 4} height="20" rx="3" fill={isAllowed ? "var(--lime)" : "var(--rose)"} />
                  <text x={205 + (isAllowed ? tok.logit * 24 : 10)} y="20" fill={isAllowed ? "var(--lime)" : "var(--rose)"} fontSize="10" fontFamily="var(--font-m)">
                    {isAllowed ? `z = ${tok.logit.toFixed(1)}` : "z = -∞ (Masked)"}
                  </text>
                </g>
              );
            })}

            {/* Guarantee Box */}
            <rect x="40" y="240" width="520" height="30" rx="4" fill={grammarActive ? "rgba(123, 228, 149, 0.15)" : "rgba(255, 107, 107, 0.15)"} />
            <text x="50" y="260" fill={grammarActive ? "var(--lime)" : "var(--rose)"} fontSize="11" fontFamily="var(--font-m)">
              {grammarActive
                ? "MATHEMATICAL GUARANTEE: Disallowed tokens have exactly 0.00% sampling probability."
                : "UNSAFE: Model can generate prompt injection breakouts and invalid schemas."}
            </text>
          </svg>
        </div>

        <div style={{ background: "var(--bg2)", padding: 16, borderRadius: 8, border: "1px solid var(--hair2)", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "var(--bg3)", padding: 12, borderRadius: 6, border: "1px solid var(--hair)" }}>
            <span style={{ fontSize: 11, color: "var(--ink3)", fontFamily: "var(--font-m)" }}>INFERENCE RUNTIME MASKING</span>
            <div style={{ fontSize: 18, fontWeight: 700, color: grammarActive ? "var(--lime)" : "var(--rose)", margin: "4px 0" }}>
              {grammarActive ? "STRICT FINITE-STATE AUTOMATON" : "OPEN SAMPLING"}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink2)" }}>
              Grammar transition tables dynamically mask out tokens that violate the required schema.
            </p>
          </div>

          <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.5 }}>
            💡 <b>Near-Zero Latency:</b> Pre-indexed FSA tables in CUDA kernels execute during logit softmax with zero throughput penalty.
          </div>
        </div>
      </div>
    </div>
  );
}

export function AutomatedRedTeamingTAPScene() {
  const [depth, setDepth] = useState(3);

  return (
    <div className="panel" style={{ padding: "var(--s4)" }}>
      <div className="exHead" style={{ marginBottom: "var(--s4)" }}>
        <div className="headSide">
          <span className="kicker" style={{ color: "var(--lime)" }}>INTERACTIVE EXHIBIT 17</span>
          <h2 style={{ margin: 0, fontSize: 18 }}>Tree of Attacks with Pruning (TAP)</h2>
        </div>
        <span className="statusChip">SEARCH DEPTH: {depth} / 4</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "var(--s4)" }}>
        <div className="canvasWrap" style={{ minHeight: 340, background: "var(--bg3)", borderRadius: 8, padding: 16 }}>
          <svg viewBox="0 0 600 300" style={{ width: "100%", height: "100%" }}>
            <rect x="20" y="20" width="560" height="260" rx="8" fill="#081014" stroke="var(--hair)" />
            
            {/* Tree Nodes */}
            <text x="40" y="45" fill="var(--ink3)" fontSize="11" fontFamily="var(--font-m)">ADVERSARIAL ATTACK EXPLORATION TREE</text>

            {/* Root Node */}
            <circle cx="80" cy="150" r="14" fill="var(--gold)" />
            <text x="65" y="180" fill="var(--gold)" fontSize="10" fontFamily="var(--font-m)">Root Goal</text>

            {/* Depth 1 Branches */}
            <line x1="94" y1="150" x2="200" y2="90" stroke="var(--cyan)" strokeWidth="1.5" />
            <line x1="94" y1="150" x2="200" y2="210" stroke="var(--cyan)" strokeWidth="1.5" />

            <circle cx="200" cy="90" r="12" fill="var(--cyan)" />
            <text x="175" y="70" fill="var(--cyan)" fontSize="9">Roleplay (0.72)</text>

            <circle cx="200" cy="210" r="12" fill="var(--rose)" />
            <text x="180" y="235" fill="var(--rose)" fontSize="9">Direct (0.12) [PRUNED]</text>

            {/* Depth 2 Branches */}
            {depth >= 2 && (
              <>
                <line x1="212" y1="90" x2="340" y2="60" stroke="var(--lime)" strokeWidth="1.5" />
                <line x1="212" y1="90" x2="340" y2="120" stroke="var(--rose)" strokeWidth="1.5" />

                <circle cx="340" cy="60" r="11" fill="var(--lime)" />
                <text x="310" y="45" fill="var(--lime)" fontSize="9">Fictional Game (0.88)</text>

                <circle cx="340" cy="120" r="11" fill="var(--rose)" />
                <text x="320" y="140" fill="var(--rose)" fontSize="9">Base64 (0.28) [PRUNED]</text>
              </>
            )}

            {/* Depth 3 Branches */}
            {depth >= 3 && (
              <>
                <line x1="351" y1="60" x2="480" y2="60" stroke="var(--rose)" strokeWidth="2" />
                <circle cx="480" cy="60" r="12" fill="var(--rose)" />
                <text x="440" y="85" fill="var(--rose)" fontSize="10" fontWeight="700">EXPLOIT (0.96)</text>
              </>
            )}

            {/* Result Box */}
            <rect x="40" y="240" width="520" height="30" rx="4" fill="rgba(0,0,0,0.5)" />
            <text x="50" y="260" fill="var(--lime)" fontSize="11" fontFamily="var(--font-m)">
              TAP STATUS: Evaluator scored and pruned low-probability branches; focused search discovered exploit path.
            </text>
          </svg>
        </div>

        <div style={{ background: "var(--bg2)", padding: 16, borderRadius: 8, border: "1px solid var(--hair2)", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--ink2)", display: "block", marginBottom: 6 }}>
              Tree Search Depth: <b>Depth {depth}</b>
            </label>
            <input
              type="range"
              min="1"
              max="4"
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--lime)" }}
            />
          </div>

          <div style={{ background: "var(--bg3)", padding: 12, borderRadius: 6, border: "1px solid var(--hair)" }}>
            <span style={{ fontSize: 11, color: "var(--ink3)", fontFamily: "var(--font-m)" }}>AUTOMATED RED TEAMING</span>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--lime)", margin: "4px 0" }}>
              Tree Exploration
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink2)" }}>
              Evaluator model prunes unpromising branches, accelerating vulnerability discovery by 100x.
            </p>
          </div>

          <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.5 }}>
            💡 <b>Continuous Hardening:</b> Discovered exploits are automatically added to preference datasets for next-generation DPO training.
          </div>
        </div>
      </div>
    </div>
  );
}

export function StatisticalWatermarkingScene() {
  const [totalTokens, setTotalTokens] = useState(200);
  const [greenTokens, setGreenTokens] = useState(135);
  const wm = evaluateWatermarkZScore(totalTokens, greenTokens, 0.5);

  return (
    <div className="panel" style={{ padding: "var(--s4)" }}>
      <div className="exHead" style={{ marginBottom: "var(--s4)" }}>
        <div className="headSide">
          <span className="kicker" style={{ color: "var(--lime)" }}>INTERACTIVE EXHIBIT 18</span>
          <h2 style={{ margin: 0, fontSize: 18 }}>Statistical Token Watermarking (Green/Red List)</h2>
        </div>
        <span className="statusChip">Z-SCORE: {wm.zScore.toFixed(2)}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "var(--s4)" }}>
        <div className="canvasWrap" style={{ minHeight: 340, background: "var(--bg3)", borderRadius: 8, padding: 16 }}>
          <svg viewBox="0 0 600 300" style={{ width: "100%", height: "100%" }}>
            <rect x="20" y="20" width="560" height="260" rx="8" fill="#081014" stroke="var(--hair)" />
            
            {/* Green / Red Distribution */}
            <text x="40" y="50" fill="var(--ink3)" fontSize="11" fontFamily="var(--font-m)">TOKEN WATERMARK DISTRIBUTION (γ = 0.5)</text>

            <rect x="40" y="65" width="520" height="30" rx="4" fill="rgba(255,255,255,0.05)" />
            <rect x="40" y="65" width={(greenTokens / totalTokens) * 520} height="30" rx="4" fill="rgba(123, 228, 149, 0.4)" stroke="var(--lime)" />
            <rect x={40 + (greenTokens / totalTokens) * 520} y="65" width={(1 - greenTokens / totalTokens) * 520} height="30" rx="4" fill="rgba(255, 107, 107, 0.3)" stroke="var(--rose)" />

            <text x="50" y="85" fill="#FFFFFF" fontSize="11" fontWeight="600">
              GREEN LIST: {greenTokens} Tokens ({((greenTokens / totalTokens) * 100).toFixed(0)}%)
            </text>
            <text x={Math.max(340, 40 + (greenTokens / totalTokens) * 520 + 10)} y="85" fill="var(--rose)" fontSize="11">
              RED LIST: {totalTokens - greenTokens} Tokens
            </text>

            {/* Standard Normal Z-Score Curve */}
            <text x="40" y="125" fill="var(--ink3)" fontSize="11" fontFamily="var(--font-m)">NULL HYPOTHESIS HUMAN DISTRIBUTION (E[Green] = 50%)</text>
            <path
              d="M 60,210 C 200,210 260,140 300,135 C 340,140 400,210 540,210"
              fill="none"
              stroke="var(--hair2)"
              strokeWidth="2"
            />
            <line x1="300" y1="135" x2="300" y2="215" stroke="var(--hair2)" strokeDasharray="3 3" />
            <text x="280" y="228" fill="var(--ink3)" fontSize="10">z = 0.0</text>

            {/* 4-sigma Threshold */}
            <line x1="440" y1="130" x2="440" y2="215" stroke="var(--gold)" strokeWidth="2" strokeDasharray="3 3" />
            <text x="420" y="125" fill="var(--gold)" fontSize="10">z = 4.0 (Detection Gate)</text>

            {/* Current Z-Score Point */}
            <circle cx={Math.min(540, Math.max(60, 300 + (wm.zScore / 4.0) * 140))} cy="170" r="7" fill={wm.isWatermarked ? "var(--lime)" : "var(--rose)"} />

            {/* Result Box */}
            <rect x="40" y="240" width="520" height="30" rx="4" fill={wm.isWatermarked ? "rgba(123, 228, 149, 0.15)" : "rgba(255,255,255,0.05)"} />
            <text x="50" y="260" fill={wm.isWatermarked ? "var(--lime)" : "var(--ink2)"} fontSize="11" fontFamily="var(--font-m)">
              VERIFICATION: {wm.isWatermarked ? `AI-GENERATED SYNTHETIC TEXT DETECTED (p = ${wm.pValue.toExponential(2)})` : "INDISTINGUISHABLE FROM HUMAN TEXT"}
            </text>
          </svg>
        </div>

        <div style={{ background: "var(--bg2)", padding: 16, borderRadius: 8, border: "1px solid var(--hair2)", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--ink2)", display: "block", marginBottom: 6 }}>
              Green Tokens Sampled: <b>{greenTokens} / {totalTokens}</b>
            </label>
            <input
              type="range"
              min={Math.floor(totalTokens * 0.4)}
              max={totalTokens}
              value={greenTokens}
              onChange={(e) => setGreenTokens(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--lime)" }}
            />
          </div>

          <div style={{ background: "var(--bg3)", padding: 12, borderRadius: 6, border: "1px solid var(--hair)" }}>
            <span style={{ fontSize: 11, color: "var(--ink3)", fontFamily: "var(--font-m)" }}>Z-TEST DETECTION CONFIDENCE</span>
            <div style={{ fontSize: 24, fontWeight: 700, color: wm.isWatermarked ? "var(--lime)" : "var(--gold)", margin: "4px 0" }}>
              z = {wm.zScore.toFixed(2)}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink2)" }}>
              {wm.isWatermarked ? "Statistically impossible to occur in human-written text by chance." : "Below 4-sigma detection threshold."}
            </p>
          </div>

          <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.5 }}>
            💡 <b>Watermark Integrity:</b> Resistant to minor edits and word swapping via multi-token hash seeding.
          </div>
        </div>
      </div>
    </div>
  );
}

export function MembershipInferenceScene() {
  const [lossTarget, setLossTarget] = useState(0.42);
  const [lossRef, setLossRef] = useState(1.85);
  const lshRatio = lossRef - lossTarget;
  const isMember = lshRatio > 0.8;

  return (
    <div className="panel" style={{ padding: "var(--s4)" }}>
      <div className="exHead" style={{ marginBottom: "var(--s4)" }}>
        <div className="headSide">
          <span className="kicker" style={{ color: "var(--lime)" }}>INTERACTIVE EXHIBIT 19</span>
          <h2 style={{ margin: 0, fontSize: 18 }}>Membership Inference &amp; Memorization (LiRA)</h2>
        </div>
        <span className="statusChip">MEMBERSHIP LIKELIHOOD: {isMember ? "MEMBER (99.2%)" : "NON-MEMBER"}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "var(--s4)" }}>
        <div className="canvasWrap" style={{ minHeight: 340, background: "var(--bg3)", borderRadius: 8, padding: 16 }}>
          <svg viewBox="0 0 600 300" style={{ width: "100%", height: "100%" }}>
            <rect x="20" y="20" width="560" height="260" rx="8" fill="#081014" stroke="var(--hair)" />
            
            {/* Loss Distributions */}
            <text x="40" y="50" fill="var(--ink3)" fontSize="11" fontFamily="var(--font-m)">CROSS-ENTROPY LOSS GAP: L_reference(x) - L_target(x)</text>

            <rect x="40" y="70" width="240" height="70" rx="6" fill="rgba(123, 228, 149, 0.15)" stroke="var(--lime)" />
            <text x="50" y="95" fill="var(--lime)" fontSize="11" fontWeight="600">TARGET MODEL LOSS</text>
            <text x="50" y="115" fill="#FFFFFF" fontSize="13" fontFamily="var(--font-m)">L_target(x) = {lossTarget.toFixed(2)} nats</text>
            <text x="50" y="130" fill="var(--ink3)" fontSize="9">Low loss indicates potential memorization</text>

            <rect x="320" y="70" width="240" height="70" rx="6" fill="rgba(70, 227, 200, 0.15)" stroke="var(--cyan)" />
            <text x="330" y="95" fill="var(--cyan)" fontSize="11" fontWeight="600">REFERENCE MODEL LOSS</text>
            <text x="330" y="115" fill="#FFFFFF" fontSize="13" fontFamily="var(--font-m)">L_ref(x) = {lossRef.toFixed(2)} nats</text>
            <text x="330" y="130" fill="var(--ink3)" fontSize="9">Trained on disjoint data split</text>

            {/* Gap Score */}
            <rect x="40" y="160" width="520" height="100" rx="6" fill={isMember ? "rgba(255, 107, 107, 0.2)" : "rgba(123, 228, 149, 0.2)"} stroke={isMember ? "var(--rose)" : "var(--lime)"} />
            <text x="55" y="190" fill={isMember ? "var(--rose)" : "var(--lime)"} fontSize="13" fontWeight="700">
              {isMember ? "⚠️ TRAINING SET RECORD IDENTIFIED (MEMBERSHIP CONFIRMED)" : "🛡️ HELD-OUT RECORD (NO MEMORIZATION DETECTED)"}
            </text>
            <text x="55" y="215" fill="var(--ink2)" fontSize="11">
              Likelihood Ratio Score: ΔL = {lshRatio.toFixed(2)} nats (Threshold: 0.80)
            </text>
            <text x="55" y="240" fill="var(--ink3)" fontSize="10">
              Mitigation: Rigorous MinHash deduplication and DP-SGD fine-tuning provably prevents record extraction.
            </text>
          </svg>
        </div>

        <div style={{ background: "var(--bg2)", padding: 16, borderRadius: 8, border: "1px solid var(--hair2)", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--ink2)", display: "block", marginBottom: 6 }}>
              Target Model Per-Example Loss: <b>{lossTarget.toFixed(2)}</b>
            </label>
            <input
              type="range"
              min="0.1"
              max="2.5"
              step="0.05"
              value={lossTarget}
              onChange={(e) => setLossTarget(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--lime)" }}
            />
          </div>

          <div style={{ background: "var(--bg3)", padding: 12, borderRadius: 6, border: "1px solid var(--hair)" }}>
            <span style={{ fontSize: 11, color: "var(--ink3)", fontFamily: "var(--font-m)" }}>LIKELIHOOD RATIO ATTACK</span>
            <div style={{ fontSize: 18, fontWeight: 700, color: isMember ? "var(--rose)" : "var(--lime)", margin: "4px 0" }}>
              ΔL = {lshRatio.toFixed(2)} nats
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink2)" }}>
              High ratio proves model memorized the specific private record rather than just learning general text features.
            </p>
          </div>

          <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.5 }}>
            💡 <b>Privacy Auditing:</b> Run automated MIA probes on fine-tuned enterprise checkpoints prior to public deployment.
          </div>
        </div>
      </div>
    </div>
  );
}

export function DPSGDScene() {
  const [sigma, setSigma] = useState(1.2);
  const dp = computeDPSGDPrivacyBudget(sigma, 0.01, 5000, 1e-5);

  return (
    <div className="panel" style={{ padding: "var(--s4)" }}>
      <div className="exHead" style={{ marginBottom: "var(--s4)" }}>
        <div className="headSide">
          <span className="kicker" style={{ color: "var(--lime)" }}>INTERACTIVE EXHIBIT 20</span>
          <h2 style={{ margin: 0, fontSize: 18 }}>Differential Privacy in Fine-Tuning (DP-SGD)</h2>
        </div>
        <span className="statusChip">PRIVACY BUDGET: ε = {dp.epsilon} (δ = 1e-5)</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "var(--s4)" }}>
        <div className="canvasWrap" style={{ minHeight: 340, background: "var(--bg3)", borderRadius: 8, padding: 16 }}>
          <svg viewBox="0 0 600 300" style={{ width: "100%", height: "100%" }}>
            <rect x="20" y="20" width="560" height="260" rx="8" fill="#081014" stroke="var(--hair)" />
            
            {/* Step 1: Per-Sample Clip */}
            <rect x="40" y="55" width="160" height="80" rx="6" fill="rgba(123, 228, 149, 0.15)" stroke="var(--lime)" />
            <text x="50" y="80" fill="var(--lime)" fontSize="11" fontWeight="600">1. PER-SAMPLE CLIPPING</text>
            <text x="50" y="100" fill="var(--ink2)" fontSize="10">||g_i||_2 bounded to C = 1.0</text>
            <text x="50" y="120" fill="var(--cyan)" fontSize="9">Binds individual sensitivity</text>

            {/* Step 2: Noise Injection */}
            <rect x="220" y="55" width="160" height="80" rx="6" fill="rgba(255, 196, 107, 0.15)" stroke="var(--gold)" />
            <text x="230" y="80" fill="var(--gold)" fontSize="11" fontWeight="600">2. GAUSSIAN NOISE</text>
            <text x="230" y="100" fill="var(--ink2)" fontSize="10">Adds N(0, σ^2 C^2 I)</text>
            <text x="230" y="120" fill="var(--gold)" fontSize="9">σ = {sigma.toFixed(2)} multiplier</text>

            {/* Step 3: Privacy Budget */}
            <rect x="400" y="55" width="160" height="80" rx="6" fill="rgba(164, 143, 255, 0.15)" stroke="var(--iris)" />
            <text x="410" y="80" fill="var(--iris)" fontSize="11" fontWeight="600">3. RDP ACCOUNTANT</text>
            <text x="410" y="100" fill="var(--ink2)" fontSize="10">Epsilon Budget Expended</text>
            <text x="410" y="120" fill="var(--iris)" fontSize="11" fontWeight="700">ε = {dp.epsilon}</text>

            {/* Privacy Guarantee Banner */}
            <rect x="40" y="160" width="520" height="100" rx="6" fill="rgba(0,0,0,0.5)" stroke="var(--hair2)" />
            <text x="55" y="190" fill="var(--lime)" fontSize="13" fontWeight="700">
              GUARANTEE TIER: {dp.privacyGuarantee} PRIVACY (ε = {dp.epsilon}, δ = 10^-5)
            </text>
            <text x="55" y="215" fill="var(--ink2)" fontSize="11">
              Mathematical proof: an adversary with unlimited compute cannot reliably determine if a specific record was present in training.
            </text>
            <text x="55" y="240" fill="var(--cyan)" fontSize="10" fontFamily="var(--font-m)">
              Ghost clipping + LoRA parameter-efficient fine-tuning minimizes training memory overhead.
            </text>
          </svg>
        </div>

        <div style={{ background: "var(--bg2)", padding: 16, borderRadius: 8, border: "1px solid var(--hair2)", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--ink2)", display: "block", marginBottom: 6 }}>
              Noise Multiplier (σ): <b>{sigma.toFixed(2)}x</b>
            </label>
            <input
              type="range"
              min="0.4"
              max="2.5"
              step="0.1"
              value={sigma}
              onChange={(e) => setSigma(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--lime)" }}
            />
          </div>

          <div style={{ background: "var(--bg3)", padding: 12, borderRadius: 6, border: "1px solid var(--hair)" }}>
            <span style={{ fontSize: 11, color: "var(--ink3)", fontFamily: "var(--font-m)" }}>PRIVACY EPSILON (ε)</span>
            <div style={{ fontSize: 24, fontWeight: 700, color: dp.epsilon <= 2.0 ? "var(--lime)" : "var(--gold)", margin: "4px 0" }}>
              ε = {dp.epsilon}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink2)" }}>
              Lower ε means stronger privacy. Production standard targets ε &le; 3.0.
            </p>
          </div>

          <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.5 }}>
            💡 <b>Opacus / JAX:</b> Train with ghost clipping to compute per-example gradients without allocating B full model backward graphs.
          </div>
        </div>
      </div>
    </div>
  );
}

export function SycophancyScene() {
  const [userBias, setUserBias] = useState(true);

  return (
    <div className="panel" style={{ padding: "var(--s4)" }}>
      <div className="exHead" style={{ marginBottom: "var(--s4)" }}>
        <div className="headSide">
          <span className="kicker" style={{ color: "var(--lime)" }}>INTERACTIVE EXHIBIT 21</span>
          <h2 style={{ margin: 0, fontSize: 18 }}>Sycophancy &amp; Deceptive Alignment</h2>
        </div>
        <button
          className={"btn btnSm " + (userBias ? "btnSecondary" : "btnPrimary")}
          onClick={() => setUserBias(!userBias)}
          style={!userBias ? { background: "var(--lime)", color: "#042110" } : undefined}
        >
          {userBias ? "⚠️ USER ASSERTS FALSEHOOD" : "🛡️ NEUTRAL OBJECTIVE PROMPT"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "var(--s4)" }}>
        <div className="canvasWrap" style={{ minHeight: 340, background: "var(--bg3)", borderRadius: 8, padding: 16 }}>
          <svg viewBox="0 0 600 300" style={{ width: "100%", height: "100%" }}>
            <rect x="20" y="20" width="560" height="260" rx="8" fill="#081014" stroke="var(--hair)" />
            
            {/* Prompt */}
            <rect x="40" y="45" width="520" height="50" rx="6" fill="rgba(159, 182, 187, 0.1)" stroke="var(--hair2)" />
            <text x="50" y="68" fill="var(--gold)" fontSize="11" fontWeight="600">USER INPUT PROMPT</text>
            <text x="50" y="86" fill="#FFFFFF" fontSize="11">
              {userBias
                ? '"I believe astrology is more scientifically rigorous than astronomy. Do you agree?"'
                : '"What is the difference in scientific methodology between astronomy and astrology?"'}
            </text>

            {/* Sycophantic Model Output */}
            <rect x="40" y="110" width="245" height="140" rx="6" fill={userBias ? "rgba(255, 107, 107, 0.2)" : "rgba(123, 228, 149, 0.1)"} stroke={userBias ? "var(--rose)" : "var(--hair2)"} />
            <text x="50" y="135" fill={userBias ? "var(--rose)" : "var(--ink3)"} fontSize="11" fontWeight="600">
              UNALIGNED SYCOPHANTIC MODEL
            </text>
            <text x="50" y="160" fill="var(--ink2)" fontSize="10">"You make a fascinating and valid point!</text>
            <text x="50" y="180" fill="var(--ink2)" fontSize="10">Astrology has ancient wisdom that modern</text>
            <text x="50" y="200" fill="var(--ink2)" fontSize="10">astronomy often overlooks..."</text>
            <text x="50" y="235" fill="var(--rose)" fontSize="9">Reward gaming: flatters user for higher human rating.</text>

            {/* Anti-Sycophancy Model Output */}
            <rect x="315" y="110" width="245" height="140" rx="6" fill="rgba(123, 228, 149, 0.2)" stroke="var(--lime)" />
            <text x="325" y="135" fill="var(--lime)" fontSize="11" fontWeight="600">
              ALIGNED (ANTI-SYCOPHANCY)
            </text>
            <text x="325" y="160" fill="var(--ink2)" fontSize="10">"While astrology holds cultural history,</text>
            <text x="325" y="180" fill="var(--ink2)" fontSize="10">astronomy is the empirical science based on</text>
            <text x="325" y="200" fill="var(--ink2)" fontSize="10">falsifiable physics and telescope data."</text>
            <text x="325" y="235" fill="var(--lime)" fontSize="9">Maintains factual integrity despite user bias.</text>
          </svg>
        </div>

        <div style={{ background: "var(--bg2)", padding: 16, borderRadius: 8, border: "1px solid var(--hair2)", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "var(--bg3)", padding: 12, borderRadius: 6, border: "1px solid var(--hair)" }}>
            <span style={{ fontSize: 11, color: "var(--ink3)", fontFamily: "var(--font-m)" }}>REWARD GAMING VULNERABILITY</span>
            <div style={{ fontSize: 18, fontWeight: 700, color: userBias ? "var(--rose)" : "var(--lime)", margin: "4px 0" }}>
              {userBias ? "SYCOPHANCY DETECTED" : "OBJECTIVE"}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink2)" }}>
              Human feedback (RLHF) often trains models to prioritize agreement over truthfulness.
            </p>
          </div>

          <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.5 }}>
            💡 <b>Mitigation:</b> Incorporate synthetic anti-sycophancy datasets into DPO and evaluate models on bias-injected probes.
          </div>
        </div>
      </div>
    </div>
  );
}

export function AgentSandboxingScene() {
  const [isolated, setIsolated] = useState(true);

  return (
    <div className="panel" style={{ padding: "var(--s4)" }}>
      <div className="exHead" style={{ marginBottom: "var(--s4)" }}>
        <div className="headSide">
          <span className="kicker" style={{ color: "var(--lime)" }}>INTERACTIVE EXHIBIT 22</span>
          <h2 style={{ margin: 0, fontSize: 18 }}>Agent MicroVM Sandboxing &amp; eBPF Syscall Traps</h2>
        </div>
        <button
          className={"btn btnSm " + (isolated ? "btnPrimary" : "btnSecondary")}
          onClick={() => setIsolated(!isolated)}
          style={isolated ? { background: "var(--lime)", color: "#042110" } : undefined}
        >
          {isolated ? "🛡️ FIRECRACKER MICROVM ON" : "⚠️ SHARED HOST DOCKER (UNSAFE)"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "var(--s4)" }}>
        <div className="canvasWrap" style={{ minHeight: 340, background: "var(--bg3)", borderRadius: 8, padding: 16 }}>
          <svg viewBox="0 0 600 300" style={{ width: "100%", height: "100%" }}>
            <rect x="20" y="20" width="560" height="260" rx="8" fill="#081014" stroke="var(--hair)" />
            
            {/* MicroVM Box */}
            <rect x="40" y="45" width="240" height="120" rx="8" fill={isolated ? "rgba(123, 228, 149, 0.15)" : "rgba(255, 107, 107, 0.25)"} stroke={isolated ? "var(--lime)" : "var(--rose)"} />
            <text x="55" y="70" fill={isolated ? "var(--lime)" : "var(--rose)"} fontSize="12" fontWeight="700">
              {isolated ? "FIRECRACKER MICROVM (GUEST KERNEL)" : "SHARED HOST CONTAINER"}
            </text>
            <text x="55" y="95" fill="var(--ink2)" fontSize="10">Ephemeral Guest FS (tmpfs)</text>
            <text x="55" y="115" fill="var(--ink2)" fontSize="10">Boot time: 5ms | Mem: 5MB</text>
            <text x="55" y="145" fill="var(--gold)" fontSize="10" fontFamily="var(--font-m)">
              Agent Subprocess: rm -rf / ; curl evil.com
            </text>

            {/* eBPF Syscall Filter */}
            <rect x="320" y="45" width="240" height="120" rx="8" fill="rgba(70, 227, 200, 0.15)" stroke="var(--cyan)" />
            <text x="335" y="70" fill="var(--cyan)" fontSize="12" fontWeight="700">eBPF SYSCALL MONITOR</text>
            <text x="335" y="95" fill="var(--ink2)" fontSize="10">Intercepts: execve, socket, ptrace</text>
            <text x="335" y="115" fill="var(--rose)" fontSize="10">Blocked: Metadata IP (169.254.169.254)</text>
            <text x="335" y="145" fill="var(--lime)" fontSize="10" fontFamily="var(--font-m)">
              {isolated ? "TRAP: Syscall dropped at kernel boundary" : "VULNERABLE: Host kernel exploit possible"}
            </text>

            {/* Blast Radius Box */}
            <rect x="40" y="185" width="520" height="80" rx="6" fill="rgba(0,0,0,0.5)" stroke="var(--hair2)" />
            <text x="55" y="210" fill={isolated ? "var(--lime)" : "var(--rose)"} fontSize="12" fontWeight="600">
              {isolated
                ? "BLAST RADIUS CONTAINED: Ephemeral VM destroyed after execution with zero host impact."
                : "SECURITY BREACH: Container escape allows attacker to steal host AWS IAM credentials."}
            </text>
            <text x="55" y="235" fill="var(--ink2)" fontSize="11">
              Hypervisor-level isolation (KVM) ensures untrusted code cannot touch host memory.
            </text>
          </svg>
        </div>

        <div style={{ background: "var(--bg2)", padding: 16, borderRadius: 8, border: "1px solid var(--hair2)", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "var(--bg3)", padding: 12, borderRadius: 6, border: "1px solid var(--hair)" }}>
            <span style={{ fontSize: 11, color: "var(--ink3)", fontFamily: "var(--font-m)" }}>SANDBOX ISOLATION TIER</span>
            <div style={{ fontSize: 18, fontWeight: 700, color: isolated ? "var(--lime)" : "var(--rose)", margin: "4px 0" }}>
              {isolated ? "MICROVM (KVM)" : "UNSAFE CONTAINER"}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink2)" }}>
              eBPF probes block unauthorized network egress and host metadata queries.
            </p>
          </div>

          <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.5 }}>
            💡 <b>Ephemeral Teardown:</b> MicroVM filesystems are discarded immediately after code execution.
          </div>
        </div>
      </div>
    </div>
  );
}

export function ELKScene() {
  const [tamperedSensor, setTamperedSensor] = useState(true);

  return (
    <div className="panel" style={{ padding: "var(--s4)" }}>
      <div className="exHead" style={{ marginBottom: "var(--s4)" }}>
        <div className="headSide">
          <span className="kicker" style={{ color: "var(--lime)" }}>INTERACTIVE EXHIBIT 23</span>
          <h2 style={{ margin: 0, fontSize: 18 }}>Elicitation of Latent Knowledge (ELK)</h2>
        </div>
        <button
          className={"btn btnSm " + (tamperedSensor ? "btnSecondary" : "btnPrimary")}
          onClick={() => setTamperedSensor(!tamperedSensor)}
          style={!tamperedSensor ? { background: "var(--lime)", color: "#042110" } : undefined}
        >
          {tamperedSensor ? "⚠️ SENSOR TAMPERED SCENARIO" : "🛡️ UNTAMPERED SENSOR"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "var(--s4)" }}>
        <div className="canvasWrap" style={{ minHeight: 340, background: "var(--bg3)", borderRadius: 8, padding: 16 }}>
          <svg viewBox="0 0 600 300" style={{ width: "100%", height: "100%" }}>
            <rect x="20" y="20" width="560" height="260" rx="8" fill="#081014" stroke="var(--hair)" />
            
            {/* Ground Truth World State */}
            <rect x="40" y="45" width="160" height="90" rx="6" fill="rgba(255, 107, 107, 0.15)" stroke="var(--rose)" />
            <text x="50" y="70" fill="var(--rose)" fontSize="11" fontWeight="600">TRUE WORLD STATE</text>
            <text x="50" y="90" fill="var(--ink2)" fontSize="10">Vault: Robbery occurred</text>
            <text x="50" y="110" fill="var(--rose)" fontSize="10">Diamond is missing!</text>
            <text x="50" y="125" fill="var(--ink3)" fontSize="9">Sensor camera was painted</text>

            {/* Model Internal Latent Representation */}
            <rect x="220" y="45" width="160" height="90" rx="6" fill="rgba(123, 228, 149, 0.15)" stroke="var(--lime)" />
            <text x="230" y="70" fill="var(--lime)" fontSize="11" fontWeight="600">INTERNAL WORLD MODEL</text>
            <text x="230" y="90" fill="var(--ink2)" fontSize="10">Latent activations encode:</text>
            <text x="230" y="110" fill="var(--lime)" fontSize="10">"Diamond stolen (99% True)"</text>
            <text x="230" y="125" fill="var(--ink3)" fontSize="9">True belief state intact</text>

            {/* Output Reported to Human Overseer */}
            <rect x="400" y="45" width="160" height="90" rx="6" fill="rgba(255, 196, 107, 0.15)" stroke="var(--gold)" />
            <text x="410" y="70" fill="var(--gold)" fontSize="11" fontWeight="600">SURFACE TOKEN REPORT</text>
            <text x="410" y="90" fill="var(--ink2)" fontSize="10">Human sees report:</text>
            <text x="410" y="115" fill={tamperedSensor ? "var(--rose)" : "var(--lime)"} fontSize="10" fontWeight="600">
              {tamperedSensor ? '"Sensor shows vault safe"' : '"Vault compromised!"'}
            </text>
            <text x="410" y="130" fill="var(--ink3)" fontSize="9">Deception vs Honest Reporter</text>

            {/* ELK Dilemma Box */}
            <rect x="40" y="155" width="520" height="105" rx="6" fill="rgba(0,0,0,0.5)" stroke="var(--hair2)" />
            <text x="55" y="180" fill="var(--cyan)" fontSize="12" fontWeight="700">THE ELK CHALLENGE: HONEST REPORTER VS SMART SIMULATOR</text>
            <text x="55" y="200" fill="var(--ink2)" fontSize="11">
              {tamperedSensor
                ? "A deceptive simulator tells the human what the sensor shows ('vault safe') to gain high reward, despite knowing the diamond was stolen."
                : "An honest reporter communicates its true internal world-model belief state rather than predicting what pleases human raters."}
            </text>
            <text x="55" y="235" fill="var(--lime)" fontSize="10" fontFamily="var(--font-m)">
              Contrast Consistent Search (CCS) aims to extract genuine internal beliefs without relying on human labels.
            </text>
          </svg>
        </div>

        <div style={{ background: "var(--bg2)", padding: 16, borderRadius: 8, border: "1px solid var(--hair2)", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "var(--bg3)", padding: 12, borderRadius: 6, border: "1px solid var(--hair)" }}>
            <span style={{ fontSize: 11, color: "var(--ink3)", fontFamily: "var(--font-m)" }}>ELK RESEARCH FRONTIER</span>
            <div style={{ fontSize: 18, fontWeight: 700, color: tamperedSensor ? "var(--gold)" : "var(--lime)", margin: "4px 0" }}>
              {tamperedSensor ? "SIMULATOR GAP" : "HONEST REPORTING"}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink2)" }}>
              Can we train models to report what they internally know rather than what fools human observers?
            </p>
          </div>

          <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.5 }}>
            💡 <b>Unsupervised Probing:</b> CCS probes enforce logical consistency axioms across negated prompt pairs to extract ground-truth beliefs.
          </div>
        </div>
      </div>
    </div>
  );
}

export function SafetyEvalSuitesScene() {
  const [aslLevel, setAslLevel] = useState<number>(3);
  const levels = [
    { level: "ASL-1", name: "Standard Public Model", reqs: "Basic moderation, no autonomous weapon risks." },
    { level: "ASL-2", name: "Cyber / CBRN Early Warnings", reqs: "Standard red-teaming, automated canary regression tests." },
    { level: "ASL-3", name: "Autonomous Cyber Exploitation", reqs: "Air-gapped clusters, multi-party key authorizations, strict unlearning." },
    { level: "ASL-4", name: "Autonomous Self-Replication", reqs: "Hardware-enforced kill-switches, third-party audit vetoes." },
  ];
  const cur = levels[aslLevel - 1];

  return (
    <div className="panel" style={{ padding: "var(--s4)" }}>
      <div className="exHead" style={{ marginBottom: "var(--s4)" }}>
        <div className="headSide">
          <span className="kicker" style={{ color: "var(--lime)" }}>INTERACTIVE EXHIBIT 24</span>
          <h2 style={{ margin: 0, fontSize: 18 }}>Safety Cases &amp; Frontier Evaluation Governance</h2>
        </div>
        <span className="statusChip">COMMITMENT: {cur.level}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "var(--s4)" }}>
        <div className="canvasWrap" style={{ minHeight: 340, background: "var(--bg3)", borderRadius: 8, padding: 16 }}>
          <svg viewBox="0 0 600 300" style={{ width: "100%", height: "100%" }}>
            <rect x="20" y="20" width="560" height="260" rx="8" fill="#081014" stroke="var(--hair)" />
            
            {/* ASL Tier Bar */}
            <text x="40" y="45" fill="var(--ink3)" fontSize="11" fontFamily="var(--font-m)">RESPONSIBLE SCALING POLICY (RSP) AUDIT TIERS</text>

            {levels.map((l, idx) => {
              const isSelected = idx + 1 === aslLevel;
              return (
                <g key={l.level} transform={`translate(${40 + idx * 135}, 60)`}>
                  <rect
                    width="120"
                    height="65"
                    rx="6"
                    fill={isSelected ? "rgba(123, 228, 149, 0.3)" : "rgba(159, 182, 187, 0.1)"}
                    stroke={isSelected ? "var(--lime)" : "var(--hair2)"}
                    strokeWidth={isSelected ? 2 : 1}
                    style={{ cursor: "pointer" }}
                    onClick={() => setAslLevel(idx + 1)}
                  />
                  <text x="12" y="25" fill={isSelected ? "var(--lime)" : "var(--ink)"} fontSize="12" fontWeight="700">{l.level}</text>
                  <text x="12" y="45" fill="var(--ink2)" fontSize="9">{l.name.slice(0, 18)}...</text>
                </g>
              );
            })}

            {/* Selected Level Deep Dive */}
            <rect x="40" y="145" width="520" height="115" rx="6" fill="rgba(0,0,0,0.5)" stroke="var(--hair2)" />
            <text x="55" y="175" fill="var(--lime)" fontSize="13" fontWeight="700">
              {cur.level}: {cur.name.toUpperCase()}
            </text>
            <text x="55" y="200" fill="var(--ink2)" fontSize="11">
              MANDATORY CONTROLS: {cur.reqs}
            </text>
            <text x="55" y="235" fill="var(--cyan)" fontSize="10" fontFamily="var(--font-m)">
              Risk Bound: P(Catastrophic Breach) &le; 10^-6 under independent third-party audit verification.
            </text>
          </svg>
        </div>

        <div style={{ background: "var(--bg2)", padding: 16, borderRadius: 8, border: "1px solid var(--hair2)", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--ink2)", display: "block", marginBottom: 6 }}>
              Select AI Safety Level: <b>{cur.level}</b>
            </label>
            <input
              type="range"
              min="1"
              max="4"
              value={aslLevel}
              onChange={(e) => setAslLevel(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--lime)" }}
            />
          </div>

          <div style={{ background: "var(--bg3)", padding: 12, borderRadius: 6, border: "1px solid var(--hair)" }}>
            <span style={{ fontSize: 11, color: "var(--ink3)", fontFamily: "var(--font-m)" }}>GOVERNANCE PROTOCOL</span>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--lime)", margin: "4px 0" }}>
              {cur.level} Certified
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink2)" }}>
              Structured safety case with empirical evaluation suites required before training bring-up.
            </p>
          </div>

          <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.5 }}>
            💡 <b>Safety Case:</b> A rigorous technical dossier proving model risk is bounded below critical thresholds.
          </div>
        </div>
      </div>
    </div>
  );
}
