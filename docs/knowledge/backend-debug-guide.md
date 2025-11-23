# Debugowanie Supabase Edge Functions

Proces debugowania opiera się na lokalnym uruchomieniu serwera Supabase, który pod spodem korzysta z Deno. Deno posiada wbudowany debugger, do którego możemy podłączyć się z edytora kodu, np. VS Code.

## Krok 1: Uruchomienie lokalnego środowiska Supabase

1.  Upewnij się, że masz zainstalowane [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started).
2.  Zainicjuj i uruchom lokalny kontener Dockera z instancją Supabase za pomocą komend w terminalu:

    ```bash
    supabase init
    supabase start
    ```

## Krok 2: Uruchomienie Edge Functions z flagą debuggera

Aby uruchomić lokalnie serwer dla funkcji z włączonym trybem inspekcji (debugowania), użyj poniższej komendy.

```bash
supabase functions serve --no-verify-jwt --inspect-brk
```

-   `--no-verify-jwt` - flaga ułatwiająca testowanie, wyłącza weryfikację tokenów JWT.
-   `--inspect-brk` - to kluczowa flaga, która mówi Deno, aby zatrzymał wykonywanie kodu na pierwszej linii i czekał na podłączenie debuggera na domyślnym porcie `9229`.

## Krok 3: Konfiguracja debuggera w VS Code

1.  Upewnij się, że masz zainstalowane oficjalne rozszerzenie [Deno dla VS Code](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno).
2.  W głównym folderze projektu stwórz plik `.vscode/launch.json` (jeśli jeszcze nie istnieje) i dodaj do niego następującą konfigurację:

    ```json
    {
        "version": "0.2.0",
        "configurations": [
            {
                "name": "Attach to Supabase Edge Function",
                "type": "deno",
                "request": "attach",
                "port": 9229
            }
        ]
    }
    ```

## Krok 4: Rozpoczęcie sesji debugowania

1.  W pliku z kodem Twojej Edge Function (np. `supabase/functions/my-function/index.ts`) ustaw breakpoint w miejscu, które chcesz zbadać.
2.  Przejdź do zakładki "Run and Debug" w VS Code (ikona z robakiem na bocznym panelu).
3.  Z rozwijanej listy na górze wybierz `Attach to Supabase Edge Function` i kliknij zieloną strzałkę "Start Debugging".

Debugger powinien teraz połączyć się z procesem Deno, a wykonywanie kodu zatrzyma się na ustawionym przez Ciebie breakpoincie. Od tego momentu możesz:
-   Sprawdzać wartości zmiennych.
-   Przechodzić przez kod krok po kroku (`Step Over`, `Step Into`, `Step Out`).
-   Korzystać z konsoli debugowania.
