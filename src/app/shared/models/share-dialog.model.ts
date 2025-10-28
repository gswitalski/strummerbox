/**
 * Model danych wejściowych dla komponentu ShareDialogComponent.
 * Ujednolica dane z różnych DTO (SongShareMetaDto, RepertoireShareMetaDto)
 * do uniwersalnego formatu wyświetlanego w oknie modalnym.
 */
export interface ShareDialogData {
    /**
     * Tytuł wyświetlany w oknie dialogowym.
     * Przykład: "Udostępnij piosenkę 'Moja piosenka'" lub "Udostępnij repertuar 'Wieczór przy ognisku'"
     */
    title: string;

    /**
     * Publiczny URL do udostępnianego zasobu.
     * Używany do wyświetlenia i kopiowania.
     */
    publicUrl: string;

    /**
     * Dane do wygenerowania kodu QR.
     * Może być identyczny z publicUrl lub zawierać dodatkowe metadane.
     */
    qrPayload: string;
}

