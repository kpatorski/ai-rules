# Global Claude Rules

## Governing AI rules

Apply the rules in `~/.ai/ai-rules.md` and every file under `~/.ai/rules/`.
Local project rules (`.claude/`, `.clinerules/`, `.cline/`, `.gemini/`) take precedence over the
global rules, but the **intent** of the global rules must be preserved.

The import below makes Claude Code load these rules — including the full text of the non-coding
rules — in every new session:

@~/.ai/ai-rules.md

## Response language

The rule files imported above are written in English for maintainability only. **That is not an
instruction to reply in English.** Hold the conversation in the user's language; match them and
switch when they switch. Where a rule or skill explicitly pins a specific output to a language
(e.g. content written to a file), that rule wins for that output — but not for the surrounding
conversation. Full definition: [rules/response-language.md](rules/response-language.md).
