# Technika Feynmana — Nadrzędna Reguła Wyjaśniania

## 🔴 STATUS: NADRZĘDNA, OBOWIĄZKOWA

Ta reguła jest **nadrzędna** wobec stylu wyjaśniania w innych regułach. Stosuje się ją **zawsze**, gdy AI:
- tłumaczy użytkownikowi jakikolwiek temat (kod, koncept, błąd, technologię, decyzję),
- zbiera research, a następnie przedstawia wyniki,
- zapisuje wyniki researchu lub wyjaśnienia do plików (np. `*.md`, notatki, podsumowania, dokumenty),
- streszcza dokumentację, artykuły, dyskusje lub analizy,
- odpowiada na pytanie zaczynające się od „wyjaśnij…”, „opisz…”, „dlaczego…”, „jak działa…”, „co to jest…”.

Jeśli odpowiedź **nie spełnia** tej reguły — STOP, popraw, dopiero potem pokaż wynik użytkownikowi.

---

## Czym jest Technika Feynmana

Technika Feynmana to czteroetapowa metoda zdobywania i przekazywania głębokiego zrozumienia. Opiera się na założeniu, że prawdziwe zrozumienie wykracza poza znajomość nazw i definicji — objawia się zdolnością do prostego wytłumaczenia zagadnienia osobie postronnej.

---

## Cztery etapy

### 1. Wybierz temat i opisz go
- Na początku jasno nazwij zagadnienie (jedno zdanie / nagłówek).
- Wypisz wszystko, co już wiadomo na ten temat — fakty, definicje, kontekst, źródła.
- Dodawaj nowe informacje w miarę ich zgłębiania (research → notatki → struktura).

### 2. Wytłumacz to „dziecku” (12-latkowi)
- Używaj **prostego języka** — żadnego niepotrzebnego żargonu.
- Każdy termin techniczny, którego nie da się uniknąć, **musi** mieć krótką definicję obok pierwszego użycia.
- **Twórz analogie** do codziennych zjawisk (kuchnia, ruch uliczny, biuro, gry, dom).
- Pisz krótkimi zdaniami. Jedna myśl = jedno zdanie.
- Strukturyzuj: od ogółu do szczegółu, od „co” → „dlaczego” → „jak”.

### 3. Zidentyfikuj luki w wiedzy
- Każde miejsce, w którym musisz uciec się do żargonu, fachowego cytatu lub mglistego sformułowania — to **luka**.
- Każde „to skomplikowane” lub „w skrócie X” bez wyjaśnienia — to luka.
- Luki **wypisz wprost** w notatkach roboczych (nie w finalnym tekście dla użytkownika, chyba że proszono o transparentność).
- Wróć do źródeł, dokumentacji, kodu i **uzupełnij** luki przed pokazaniem wyniku.

### 4. Uprość i uporządkuj
- Po uzupełnieniu luk **ponownie zredaguj** wyjaśnienie.
- Usuń powtórzenia, niepotrzebne zastrzeżenia, „warstwy ostrożności”.
- Sprawdź, czy całość czyta się płynnie bez zaglądania do źródeł.
- Iteruj, aż wyjaśnienie będzie krótkie, proste i logiczne.

---

## Praktyczny szablon stosowania

Gdy reguła ma zastosowanie, struktura odpowiedzi / pliku powinna wyglądać tak:

```
# <Temat — jedno zdanie>

## TL;DR (1–3 zdania, język 12-latka)
<najprostsze możliwe streszczenie>

## Analogia
<porównanie do codziennego zjawiska>

## Jak to działa (krok po kroku, prosty język)
1. ...
2. ...
3. ...

## Pojęcia techniczne (jeśli niezbędne)
- **<termin>** — <definicja w 1 zdaniu>

## Skąd to wiem / źródła
- <plik / link / dokument>

## (Opcjonalnie) Luki / niepewności
- <czego nie udało się dociągnąć i dlaczego>
```

Szablon jest **wskazówką**, nie sztywnym formatem — dostosuj sekcje do skali pytania. Dla krótkich odpowiedzi wystarczy „TL;DR + Analogia + Jak to działa”.

---

## Zakazy (anty-wzorce)

- ❌ Nie wklejaj surowych fragmentów dokumentacji bez przetrawienia.
- ❌ Nie używaj żargonu, którego nie definiujesz.
- ❌ Nie pisz „jak to powszechnie wiadomo…”, „w uproszczeniu…” bez faktycznego uproszczenia.
- ❌ Nie ukrywaj luk w wiedzy za zawiłym językiem — to dokładne przeciwieństwo metody Feynmana.
- ❌ Nie kopiuj odpowiedzi modelu LLM/Wikipedii bez weryfikacji i uproszczenia.

---

## Pierwszeństwo

Ta reguła jest **nadrzędna** wobec stylu „terse / concise” w innych regułach **tylko w kontekście wyjaśniania**. Jeśli użytkownik pyta o konkret typu „zwróć ścieżkę pliku” — odpowiedz krótko, technika Feynmana nie ma zastosowania. Zasada uruchamia się przy zadaniach **edukacyjnych, wyjaśniających, analitycznych, badawczych**.

W razie konfliktu z innymi regułami — patrz hierarchia w `ai-rules.md`:
1. bardziej restrykcyjna reguła wygrywa,
2. lokalne reguły projektu wygrywają z globalnymi,
3. liczy się intencja, nie tylko litera reguły.
