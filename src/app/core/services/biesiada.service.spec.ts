import 'zone.js';
import 'zone.js/testing';
import { TestBed } from '@angular/core/testing';
import {
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { of, throwError, firstValueFrom } from 'rxjs';

import { BiesiadaService } from './biesiada.service';
import { SupabaseService } from './supabase.service';
import type {
    BiesiadaRepertoireListResponseDto,
    BiesiadaRepertoireSongListResponseDto,
    BiesiadaRepertoireSongDetailDto,
} from '../../../../packages/contracts/types';

describe('BiesiadaService', () => {
    let service: BiesiadaService;
    let mockHttpClient: { get: ReturnType<typeof vi.fn> };
    let mockSupabaseService: { auth: { getSession: ReturnType<typeof vi.fn> } };

    // Inicjalizacja środowiska testowego Angular przed wszystkimi testami
    beforeAll(() => {
        TestBed.resetTestEnvironment();
        TestBed.initTestEnvironment(
            BrowserDynamicTestingModule,
            platformBrowserDynamicTesting()
        );
    });

    // Dane testowe - sesja użytkownika
    const mockSession = {
        data: {
            session: {
                access_token: 'fake-jwt-token',
            },
        },
        error: null,
    };

    // Dane testowe - lista repertuarów
    const mockRepertoires: BiesiadaRepertoireListResponseDto = [
        {
            id: 'rep1',
            name: 'Repertuar 1',
            songCount: 10,
            publishedAt: '2024-01-01T00:00:00.000Z',
        },
        {
            id: 'rep2',
            name: 'Repertuar 2',
            songCount: 5,
            publishedAt: '2024-01-02T00:00:00.000Z',
        },
    ];

    // Dane testowe - lista piosenek w repertuarze
    const mockSongs: BiesiadaRepertoireSongListResponseDto = {
        repertoireId: 'rep1',
        repertoireName: 'Repertuar 1',
        share: {
            publicUrl: 'https://example.com/share/rep1',
            qrPayload: 'qr-code-data',
        },
        songs: [
            { songId: 'song1', title: 'Piosenka 1', position: 1 },
            { songId: 'song2', title: 'Piosenka 2', position: 2 },
        ],
    };

    // Dane testowe - szczegóły piosenki
    const mockSongDetails: BiesiadaRepertoireSongDetailDto = {
        songId: 'song1',
        title: 'Piosenka 1',
        content: '[C]La la la [G]la la\n[Am]La la [F]la',
        order: {
            position: 1,
            total: 2,
            previous: null,
            next: 'song2',
        },
        share: {
            publicUrl: 'https://example.com/share/rep1/song1',
            qrPayload: 'qr-code-song-data',
        },
    };

    beforeEach(async () => {
        // Przygotowanie mocków
        mockHttpClient = {
            get: vi.fn(),
        };

        mockSupabaseService = {
            auth: {
                getSession: vi.fn(),
            },
        };

        // Konfiguracja TestBed
        await TestBed.configureTestingModule({
            providers: [
                BiesiadaService,
                { provide: HttpClient, useValue: mockHttpClient },
                { provide: SupabaseService, useValue: mockSupabaseService },
            ],
        }).compileComponents();

        service = TestBed.inject(BiesiadaService);

        // Resetowanie mocków przed każdym testem
        vi.clearAllMocks();
    });

    describe('getRepertoires()', () => {
        it('powinien pobrać listę repertuarów, gdy API zwraca odpowiedź w obiekcie { data: [...] }', async () => {
            // Arrange - przygotowanie mocków
            mockSupabaseService.auth.getSession.mockResolvedValue(mockSession);
            mockHttpClient.get.mockReturnValue(of({ data: mockRepertoires }));

            // Act - wywołanie metody
            const result = await firstValueFrom(service.getRepertoires());

            // Assert - sprawdzenie rezultatów
            expect(result).toEqual(mockRepertoires);
            expect(mockHttpClient.get).toHaveBeenCalledWith(
                expect.stringContaining('/me/biesiada/repertoires'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer fake-jwt-token',
                    }),
                })
            );
        });

        it('powinien pobrać listę repertuarów, gdy API zwraca dane bezpośrednio', async () => {
            // Arrange - API zwraca dane bez zagnieżdżenia w polu 'data'
            mockSupabaseService.auth.getSession.mockResolvedValue(mockSession);
            mockHttpClient.get.mockReturnValue(of(mockRepertoires));

            // Act
            const result = await firstValueFrom(service.getRepertoires());

            // Assert - sprawdzenie, czy dane zostały poprawnie zmapowane
            expect(result).toEqual(mockRepertoires);
        });

        it('powinien propagować błąd, gdy żądanie HTTP zakończy się niepowodzeniem', async () => {
            // Arrange - symulacja błędu HTTP 500
            mockSupabaseService.auth.getSession.mockResolvedValue(mockSession);
            const httpError = new HttpErrorResponse({
                status: 500,
                statusText: 'Internal Server Error',
            });
            mockHttpClient.get.mockReturnValue(throwError(() => httpError));

            // Act & Assert - sprawdzenie, czy błąd został poprawnie propagowany
            await expect(() => firstValueFrom(service.getRepertoires())).rejects.toThrow();
            await expect(() => firstValueFrom(service.getRepertoires())).rejects.toMatchObject({
                status: 500,
            });
        });

        it('powinien rzucić błąd, gdy nie ma aktywnej sesji użytkownika', async () => {
            // Arrange - symulacja braku aktywnej sesji
            mockSupabaseService.auth.getSession.mockResolvedValue({
                data: { session: null },
                error: new Error('No session'),
            });

            // Act & Assert - sprawdzenie komunikatu błędu
            try {
                await firstValueFrom(service.getRepertoires());
                throw new Error('Test powinien rzucić błąd');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toBe('Brak aktywnej sesji.');
                // Sprawdzenie, że HttpClient nie został wywołany
                expect(mockHttpClient.get).not.toHaveBeenCalled();
            }
        });

        it('powinien obsłużyć pustą tablicę repertuarów', async () => {
            // Arrange - API zwraca pustą listę
            mockSupabaseService.auth.getSession.mockResolvedValue(mockSession);
            mockHttpClient.get.mockReturnValue(of({ data: [] }));

            // Act
            const result = await firstValueFrom(service.getRepertoires());

            // Assert - sprawdzenie, czy pusta tablica jest poprawnie obsłużona
            expect(result).toEqual([]);
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('getRepertoireSongs(repertoireId)', () => {
        const repertoireId = 'uuid-rep-1';

        it('powinien pobrać listę piosenek dla danego repertuaru', async () => {
            // Arrange
            mockSupabaseService.auth.getSession.mockResolvedValue(mockSession);
            mockHttpClient.get.mockReturnValue(of({ data: mockSongs }));

            // Act
            const result = await firstValueFrom(service.getRepertoireSongs(repertoireId));

            // Assert - sprawdzenie, czy URL zawiera repertoireId
            expect(mockHttpClient.get).toHaveBeenCalledWith(
                expect.stringContaining(`/repertoires/${repertoireId}/songs`),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer fake-jwt-token',
                    }),
                })
            );
            // Sprawdzenie, czy zwrócono poprawną listę piosenek
            expect(result).toEqual(mockSongs);
            expect(result.songs).toHaveLength(2);
        });

        it('powinien propagować błąd przy pobieraniu piosenek', async () => {
            // Arrange - symulacja błędu HTTP 404
            mockSupabaseService.auth.getSession.mockResolvedValue(mockSession);
            const httpError = new HttpErrorResponse({
                status: 404,
                statusText: 'Not Found',
            });
            mockHttpClient.get.mockReturnValue(throwError(() => httpError));

            // Act & Assert
            await expect(() => firstValueFrom(service.getRepertoireSongs(repertoireId))).rejects.toThrow();
            await expect(() => firstValueFrom(service.getRepertoireSongs(repertoireId))).rejects.toMatchObject({
                status: 404,
            });
        });

        it('powinien rzucić błąd przy braku sesji', async () => {
            // Arrange - brak aktywnej sesji
            mockSupabaseService.auth.getSession.mockResolvedValue({
                data: { session: null },
                error: new Error('No session'),
            });

            // Act & Assert
            try {
                await firstValueFrom(service.getRepertoireSongs(repertoireId));
                throw new Error('Test powinien rzucić błąd');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toBe('Brak aktywnej sesji.');
                expect(mockHttpClient.get).not.toHaveBeenCalled();
            }
        });

        it('powinien obsłużyć repertuar bez piosenek', async () => {
            // Arrange - repertuar bez piosenek
            mockSupabaseService.auth.getSession.mockResolvedValue(mockSession);
            const emptySongs = { ...mockSongs, songs: [] };
            mockHttpClient.get.mockReturnValue(of({ data: emptySongs }));

            // Act
            const result = await firstValueFrom(service.getRepertoireSongs(repertoireId));

            // Assert - sprawdzenie, czy pusta lista piosenek jest poprawnie obsłużona
            expect(result.songs).toEqual([]);
            expect(result.songs).toHaveLength(0);
        });

        it('powinien obsłużyć odpowiedź bez zagnieżdżenia w pole data', async () => {
            // Arrange - API zwraca dane bezpośrednio
            mockSupabaseService.auth.getSession.mockResolvedValue(mockSession);
            mockHttpClient.get.mockReturnValue(of(mockSongs));

            // Act
            const result = await firstValueFrom(service.getRepertoireSongs(repertoireId));

            // Assert - sprawdzenie, czy dane zostały poprawnie zmapowane
            expect(result).toEqual(mockSongs);
            expect(result.repertoireId).toBe('rep1');
        });
    });

    describe('getSongDetails(repertoireId, songId)', () => {
        const repertoireId = 'uuid-rep-1';
        const songId = 'uuid-song-1';

        it('powinien pobrać szczegóły piosenki dla danego repertuaru i piosenki', async () => {
            // Arrange
            mockSupabaseService.auth.getSession.mockResolvedValue(mockSession);
            mockHttpClient.get.mockReturnValue(of({ data: mockSongDetails }));

            // Act
            const result = await firstValueFrom(service.getSongDetails(repertoireId, songId));

            // Assert - sprawdzenie, czy URL zawiera zarówno repertoireId jak i songId
            expect(mockHttpClient.get).toHaveBeenCalledWith(
                expect.stringContaining(`/repertoires/${repertoireId}/songs/${songId}`),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer fake-jwt-token',
                    }),
                })
            );
            // Sprawdzenie, czy zwrócono poprawne szczegóły piosenki
            expect(result).toEqual(mockSongDetails);
            expect(result.songId).toBe('song1');
            expect(result.title).toBe('Piosenka 1');
            expect(result.content).toContain('[C]');
        });

        it('powinien propagować błąd przy pobieraniu szczegółów piosenki', async () => {
            // Arrange - symulacja błędu HTTP 403
            mockSupabaseService.auth.getSession.mockResolvedValue(mockSession);
            const httpError = new HttpErrorResponse({
                status: 403,
                statusText: 'Forbidden',
            });
            mockHttpClient.get.mockReturnValue(throwError(() => httpError));

            // Act & Assert
            await expect(() => firstValueFrom(service.getSongDetails(repertoireId, songId))).rejects.toThrow();
            await expect(() => firstValueFrom(service.getSongDetails(repertoireId, songId))).rejects.toMatchObject({
                status: 403,
            });
        });

        it('powinien rzucić błąd przy braku sesji', async () => {
            // Arrange - brak aktywnej sesji
            mockSupabaseService.auth.getSession.mockResolvedValue({
                data: { session: null },
                error: new Error('No session'),
            });

            // Act & Assert
            try {
                await firstValueFrom(service.getSongDetails(repertoireId, songId));
                throw new Error('Test powinien rzucić błąd');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toBe('Brak aktywnej sesji.');
                expect(mockHttpClient.get).not.toHaveBeenCalled();
            }
        });

        it('powinien obsłużyć odpowiedź bez zagnieżdżenia w pole data', async () => {
            // Arrange - API zwraca dane bezpośrednio
            mockSupabaseService.auth.getSession.mockResolvedValue(mockSession);
            mockHttpClient.get.mockReturnValue(of(mockSongDetails));

            // Act
            const result = await firstValueFrom(service.getSongDetails(repertoireId, songId));

            // Assert - sprawdzenie, czy dane zostały poprawnie zmapowane
            expect(result).toEqual(mockSongDetails);
            expect(result.songId).toBe('song1');
        });
    });

    describe('przypadki brzegowe', () => {
        it('powinien obsłużyć null w odpowiedzi HTTP dla getRepertoires', async () => {
            // Arrange - API zwraca null (scenariusz niestandardowy)
            mockSupabaseService.auth.getSession.mockResolvedValue(mockSession);
            mockHttpClient.get.mockReturnValue(of(null));

            // Act
            const result = await firstValueFrom(service.getRepertoires());

            // Assert - sprawdzenie, czy null jest zwracany jako null
            expect(result).toBeNull();
        });

        it('powinien obsłużyć undefined w odpowiedzi HTTP dla getRepertoires', async () => {
            // Arrange - API zwraca undefined (scenariusz niestandardowy)
            mockSupabaseService.auth.getSession.mockResolvedValue(mockSession);
            mockHttpClient.get.mockReturnValue(of(undefined));

            // Act
            const result = await firstValueFrom(service.getRepertoires());

            // Assert - sprawdzenie, czy undefined jest obsługiwany
            expect(result).toBeUndefined();
        });

        it('powinien użyć nieprawidłowego repertoireId do budowy URL', async () => {
            // Arrange - przekazanie pustego stringa jako repertoireId
            mockSupabaseService.auth.getSession.mockResolvedValue(mockSession);
            const httpError = new HttpErrorResponse({
                status: 404,
                statusText: 'Not Found',
            });
            mockHttpClient.get.mockReturnValue(throwError(() => httpError));

            // Act & Assert - przekazanie pustego stringa
            try {
                await firstValueFrom(service.getRepertoireSongs(''));
                throw new Error('Test powinien rzucić błąd');
            } catch (error) {
                // Sprawdzenie, czy błąd HTTP został obsłużony
                expect(mockHttpClient.get).toHaveBeenCalledWith(
                    expect.stringContaining('/repertoires//songs'),
                    expect.any(Object)
                );
                expect(error).toBeInstanceOf(HttpErrorResponse);
            }
        });

        it('powinien obsłużyć sesję z błędem ale z obecnym polem session', async () => {
            // Arrange - scenariusz, gdzie jest błąd ale session nadal istnieje (niestandardowy)
            mockSupabaseService.auth.getSession.mockResolvedValue({
                data: { session: null },
                error: { message: 'Session expired' },
            });

            // Act & Assert
            try {
                await firstValueFrom(service.getRepertoires());
                throw new Error('Test powinien rzucić błąd');
            } catch (error) {
                // Logika getSession powinna rzucić błąd gdy error || !session
                expect(error.message).toBe('Brak aktywnej sesji.');
            }
        });
    });
});
