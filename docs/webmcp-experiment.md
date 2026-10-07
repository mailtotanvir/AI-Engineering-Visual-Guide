# WebMCP experiment

Experimental adapter for the 2 October 2026 WebMCP draft. Not a W3C Standard or on the Standards Track. Native browser interoperability has not yet been measured.

The three tools search, retrieve, and cite real CUDA and Inference Atlas records. Existing source exports are projected into namespaced IDs; there is no separately authored dataset. Retrieval preserves summaries and technical points, including entries with no technical points. Search uses case-insensitive whitespace-separated lexical terms: four points for a title/domain substring and one for a summary/technical-text substring, summed across terms, then ID tie-break. It is OR-style matching, not semantic search. Default limit 5, maximum 10.

Run `npm ci`, `npm test`, `npm run build`, and `npm run dev`. Open an Atlas or any page's “Agent-native web · research mode” disclosure. Use local harness for application checks. Native mode requires the actual `document.modelContext` draft implementation, including discovery/execution methods; it is never polyfilled or mislabeled as native.

Registration starts in the shared client shell and aborts on teardown or partial failure. Registration and execution cancellation use separate signals. Tools have no external side effects; search and retrieval may change temporary Atlas selection. No readOnlyHint is asserted because that hint promises no state modification. No cross-origin exposure is requested.

Tool output is a JSON-serializable object. Native executeTool accepts a discovered RegisteredTool object and returns the serialized string. The panel parses that string. Every input is validated at runtime; invalid IDs and arguments reject. Browser error presentation may depend on implementation.

Citation convention: title-first, actual site title and canonical URL, no invented author/publication/access date. APA uses n.d.; MLA omits unavailable date. Chicago output is a bibliographic rendering with a missing-access-date note, not a claim of completeness under every citation guide. Sources cited inside entries are not their authors.

Logs are bounded to 100 invocations while research mode is open, held in memory, cleared on page teardown, and exported only on explicit request. Closing the panel stops recording but retains its existing in-memory log until cleared. Review inputs before sharing. There is no server telemetry.

Trust: schema validation is not authorization. Page descriptions/content are an agent interaction surface. Content is rendered as text. No secrets, write tools, network actions, or LLM API are introduced. Mutating tools would need a separate consent and authorization design.

The UI reveals matching entries only in the mounted Atlas; other-world results remain linked in structured output. Entry query links work on direct loads. A human may change selection after a tool call. The adapter does not automatically navigate or control simulations.

Automated tests establish application contracts and mocked registration behavior. They cannot establish native interoperability or agent performance. See the companion research package for the predeclared protocol and honest validation report.

Primary API reference: https://webmachinelearning.github.io/webmcp/
