/**
 * Przykładowe dane użytkowników do testów
 */
export const testUsers = {
    validUser: {
        email: 'test@example.com',
        password: 'TestPassword123!',
    },
    invalidUser: {
        email: 'invalid@example.com',
        password: 'wrongpassword',
    },
    adminUser: {
        email: 'admin@example.com',
        password: 'AdminPassword123!',
    },
};

/**
 * Przykładowe dane piosenek do testów
 */
export const testSongs = {
    basicSong: {
        title: 'Przykładowa piosenka',
        artist: 'Artysta testowy',
        lyrics: 'Tekst piosenki...',
        chords: 'C G Am F',
    },
    songWithChords: {
        title: 'Piosenka z akordami',
        artist: 'Zespół',
        lyrics: '[C]Tekst z [G]akordami [Am]wplecionymi [F]w tekst',
    },
};

/**
 * Przykładowe dane repertuarów do testów
 */
export const testRepertoires = {
    basicRepertoire: {
        name: 'Repertuar testowy',
        description: 'Opis testowego repertuaru',
    },
};

