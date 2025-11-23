# Przewodnik po formacie ChordPro

ChordPro to standardowy format tekstowy używany przez muzyków do zapisywania piosenek z akordami i tekstami. Jego siła tkwi w prostocie – jest czytelny zarówno dla człowieka (jako zwykły tekst), jak i dla aplikacji (takich jak StrummerBox), które mogą go sformatować, transponować i wyświetlić w atrakcyjnej formie.

## 1. Podstawy składni

Najważniejszą zasadą ChordPro jest umieszczanie akordów w nawiasach kwadratowych `[]` bezpośrednio przed sylabą, na którą akord ma wybrzmieć.

**Przykład:**
```text
[Em]Wsiadł do autobusu [G]człowiek z liściem na [D]głowie
```

Po przetworzeniu przez aplikację, akordy zazwyczaj pojawiają się **nad** tekstem w odpowiednim miejscu.

## 2. Metadane (Informacje o utworze)

Dyrektywy (polecenia) w ChordPro zapisuje się w nawiasach klamrowych `{}`. Najczęściej umieszcza się je na początku pliku.

```text
{title: Tytuł utworu}      (skrót: {t: ...})
{artist: Wykonawca}        (skrót: {a: ...})
{key: G}                   (Tonacja)
{tempo: 120}               (Tempo w BPM)
{time: 4/4}                (Metrum)
{capo: 2}                  (Informacja o kapodastrze)
```

## 3. Struktura utworu (Refreny i Zwrotki)

Aby aplikacja wiedziała, która część to refren (często wyróżniany np. wcięciem lub pionową belką), używamy specjalnych środowisk.

### Refren (Chorus)
Używamy `{start_of_chorus}` (lub skrót `{soc}`) oraz `{end_of_chorus}` (lub `{eoc}`).

```text
{soc}
To jest [C]refren, który się [G]powtarza.
Wszyscy [D]śpiewają go [Em]razem.
{eoc}
```

### Zwrotka (Verse)
Zwrotki są zazwyczaj domyślnym stylem, ale można je jawnie oznaczyć jako `{start_of_verse}` / `{sov}` (choć rzadziej się to stosuje).

## 4. Elementy nietypowe i zaawansowane

O to pytałeś – jak zapisać rzeczy, które nie są prostym tekstem z akordami.

### Zagrywki i Tabulatury (Riffy)
Jeśli chcesz zapisać solówkę, intro lub specyficzny riff w formie tabulatury, użyj bloku `{start_of_tab}` (lub `{sot}`). Wewnątrz tego bloku używa się czcionki o stałej szerokości (monospace), co gwarantuje, że kreski tabulatury się nie "rozjadą".

```text
{comment: Intro riff}
{sot}
E|-------------------|
B|-------1-----------|
G|-----0---0---------|
D|---2-------2-------|
A|-3-----------------|
E|-------------------|
{eot}
```

### Sekcje instrumentalne (Bez tekstu)
Często zdarza się fragment instrumentalny, gdzie grają tylko akordy. W ChordPro zapisuje się to po prostu stawiając akordy obok siebie.

```text
{comment: Solo gitarowe}
[Am]   [F]   [C]   [G]
[Am]   [F]   [E7]
```

### Komentarze i instrukcje (Powtórzenia)
Do zapisywania uwag dla grającego (np. "x2", "ciszej", "stop") służy dyrektywa `{comment: ...}` lub skrót `{c: ...}`. Aplikacje zazwyczaj wyróżniają te komentarze (np. kursywą, innym kolorem tła).

```text
[G]To jest koniec [D]wersu. {c: powtórz x4}
{c: Zwolnienie (ritardando)}
[D]Ostatni aaa[G]kord.
```

Wyróżnione komentarze (często w ramce):
```text
{comment_box: Solo na saksofonie}
lub
{cb: Solo na saksofonie}
```

## 5. Definiowanie akordów

Jeśli utwór wymaga nietypowego chwytu, możesz zdefiniować go na dole lub górze pliku.

```text
{define: E5 base-fret 7 frets 0 1 3 3 x x}
```
(To mówi aplikacji jak narysować diagram akordu, jeśli funkcja jest obsługiwana).

## 6. Przykład kompletnego pliku

Oto jak mógłby wyglądać kompletny plik `.pro` lub `.chopro`:

```text
{t: Przykładowa Piosenka}
{a: Jan Kowalski}
{key: Am}
{tempo: 90}

{c: Intro}
[Am]   [F]   [C]   [G]

{soc}
[Am]To jest [F]refren, śpiewaj [C]głośno
Niech [G]usłyszy cały [Am]świat
{eoc}

Zwrotka pierwsza jest tutaj.
[C]Akordy wplatamy [G]w tekst.

{c: Solo (zagraj 2 razy)}
{sot}
E|----------------|
B|---5-6-8--------|
G|-7--------------|
{eot}

[F]Koniec pio[C]senki.
```

