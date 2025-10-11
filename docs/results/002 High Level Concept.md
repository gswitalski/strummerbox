### Główny problem

Na ogniskach i domówkach gitarzyści-amatorzy chcą szybko zagrać wspólnie znane piosenki. Drukowanie śpiewników i żonglowanie kartkami jest uciążliwe, nieekologiczne i mało elastyczne (inna repertuar na każdą imprezę, wersje z akordami vs. bez). Potrzebna jest prosta, aplikacja webowa obsługiwana na desktopach i urządzeniach mobilnych, która gromadzi teksty z akordami, pozwala z wyprzedzeniem ułożyć repertuar i w trakcie imprezy błyskawicznie udostępnić uczestnikom wersję „do śpiewania” — najlepiej przez QR.

MVP ma wyeliminować papier i improwizację, dając jedno miejsce do przygotowania repertuaru oraz natychmiastowego udostępnienia go uczestnikom przez proste skanowanie kodu QR, przy zachowaniu prywatnego widoku z akordami dla organizatora.

### Najmniejszy zestaw funkcjonalności


1. Aplikacja ma dwa tryby podstawowe tryby pracy: 'zarządzanie' i 'biesiada'.
2. Aplikacja ma wda typy uzytkowników. Uzytkownik zarejsestrowany i zalogowany nazywany jes 'organizatorem'. Uzytkownik niezalogowany zwany jkest 'biesiadnikiem'.
2. Tryb 'zarządzanie (widok desktop):
    - Rejestracja uzytkownika i logowanie (email + hasło).
    - Dostęp do trybu zarządzania tlko dla organizatorów.
    - Zarządzanie piosenkami: dodawanie, edycja i usuwanie piosenek w bazie danych wraz z pełnym tekstem i akordami. Celem jest posiadanie uporządkowanego, własnego katalogu utworów gotowego do szybkiego wykorzystania.
    - Zarządzanie repertuarami: tworzenie, edycja i usuwanie repertuaru: wybór piosenek z katalogu, nadanie repertuarowi unikalnej nazwy oraz ustalenie kolejności utworów. Celem jest szybkie przygotowanie setlisty dopasowanej do konkretnego wydarzenia np. szanty dla żeglarzy, kolędy na Wigilię.
    - Udostępnianie publiczne i kody QR: generowanie stałych linków publicznych do repertuaru oraz pojedynczych piosenek wraz z kodami QR. Celem jest umożliwienie uczestnikom natychmiastowego dostępu do tekstów na własnych urządzeniach bez logowania. Publiczne, lekkie strony tylko do przeglądania (bez logowania), responsywne na telefonie.
3. Tryb 'biesiada' (wiodk mobile):
    - dla biesiadników widok tekstu pojedynczej piosenki po zeskanowaniu kodu QR dla piosenki. Sam tekst z masymalnie wielkączcionką tak aby wypełnic szerokosc linijek na całą szerokość ekranu. Przewinjanie stron;: następna i poprzednia.
    - dla biesiadnikoów widok repertuaru po zeskanowaniu kodu QR dla repertuaru, a po wybraniu piosenki widok piosenki jak dla pojedynczej piosenki.
    - dla 'organizatora' po zalogowaniu widok listy przygotowanych przez niego repertuarów, po wybraniu repertuaru widok listy piosenek, a po wybrniu piosenki widok piosenki z tekstem i akordami.
4. Linki mają być nieideksowane przez wyszukiwarki i dostep mają tylko osoby które uzyskają dostęp do lików lub do kodów QR ze względu na ochronę praw autorskich utorów.

Uwaga prawna: użytkownik odpowiada za legalność przechowywania i udostępniania tekstów. StrummerBox służy do użytku prywatnego (bez publicznej biblioteki dla wszystkich).

### Co NIE wchodzi w zakres MVP

 - Transpozycja akordów nie zostanie uwzględniona na etapie MVP, ponieważ wymaga dodatkowej logiki przetwarzania akordów, testów użyteczności i dopracowania interfejsu, a nie jest konieczna do weryfikacji kluczowej hipotezy o eliminacji wydruków.
 - Skanowanie papierowych śpiewników (OCR) zostaje odłożone, gdyż to funkcjonalność technologicznie złożona, wymagająca rozwiązań do rozpoznawania tekstu i czyszczenia danych. MVP skupi się na ręcznym dodawaniu piosenek, co wystarczy do sprawdzenia wartości produktu.
 - Odnośniki do referencji (np. źródeł, nagrań czy dodatkowych materiałów) również nie będą realizowane w MVP, ponieważ nie są krytyczne dla podstawowego przepływu: przygotowania repertuaru i jego udostępnienia uczestnikom podczas wydarzenia.
