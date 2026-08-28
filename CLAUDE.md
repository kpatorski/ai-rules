# Global Claude Rules

## 🔴 Nadrzędne reguły AI

Stosuj reguły z `~/.ai/ai-rules.md` oraz wszystkich plików w `~/.ai/rules/`.
Reguły lokalne projektu (`.claude/`, `.clinerules/`, `.cline/`, `.gemini/`) mają pierwszeństwo nad globalnymi, ale **intencja** reguł globalnych musi być zachowana.

Poniższy import sprawia, że Claude Code zaczytuje te reguły (wraz z pełną treścią zasad
niezwiązanych z kodem) w każdej nowej sesji:

@~/.ai/ai-rules.md

## Technika Feynmana — nadrzędna reguła wyjaśniania

Za każdym razem, gdy:
- tłumaczysz mi temat,
- zbierasz research i go przedstawiasz,
- zapisujesz wyniki researchu / wyjaśnienia do plików (`.md`, notatki, dokumenty),

**MUSISZ** stosować Technikę Feynmana (4 etapy: opisz → wytłumacz 12-latkowi → zidentyfikuj luki → uprość).

Pełna definicja, szablon i anty-wzorce:
- [~/.ai/rules/feynman-technique.md](../.ai/rules/feynman-technique.md)
- [~/.ai/ai-rules.md sekcja 10](../.ai/ai-rules.md)

Reguła jest nadrzędna wobec stylu „terse/concise” w kontekście zadań wyjaśniających, edukacyjnych, analitycznych i badawczych. Nie ma zastosowania do krótkich zapytań typu „zwróć ścieżkę pliku”, „uruchom komendę X”.
