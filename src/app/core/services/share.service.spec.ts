import 'zone.js';
import 'zone.js/testing';
import { TestBed } from '@angular/core/testing';
import {
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { of, throwError, firstValueFrom } from 'rxjs';
import type { SongShareMetaDto, RepertoireShareMetaDto } from '../../../../packages/contracts/types';
import { ShareService } from './share.service';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';

describe('ShareService', () => {
    let service: ShareService;
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

    const baseUrl = `${environment.supabase.url}/functions/v1`;

    // Dane testowe - sesja użytkownika
    const mockSession = {
        data: {
            session: {
                access_token: 'mock-access-token-123',
                token_type: 'bearer',
                expires_in: 3600,
                expires_at: Date.now() + 3600000,
                refresh_token: 'mock-refresh-token',
                user: {
                    id: 'mock-user-id',
                    email: 'test@example.com',
                },
            },
        },
        error: null,
    };

    // Testowe dane dla metadanych piosenki
    const mockSongShareMeta: SongShareMetaDto = {
        id: 'test-song-id',
        publicId: 'test-public-id',
        publicUrl: 'https://example.com/public/songs/test-public-id',
        qrPayload: 'https://example.com/qr/songs/test-public-id',
    };

    // Testowe dane dla metadanych repertuaru
    const mockRepertoireShareMeta: RepertoireShareMetaDto = {
        id: 'test-repertoire-id',
        publicId: 'test-public-repertoire-id',
        publicUrl: 'https://example.com/public/repertoires/test-public-repertoire-id',
        qrPayload: 'https://example.com/qr/repertoires/test-public-repertoire-id',
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
                ShareService,
                { provide: HttpClient, useValue: mockHttpClient },
                { provide: SupabaseService, useValue: mockSupabaseService },
            ],
        }).compileComponents();

        service = TestBed.inject(ShareService);

        // Resetowanie mocków przed każdym testem
        vi.clearAllMocks();
    });

    describe('getSongShareMeta', () => {
        it('powinien pobrać metadane piosenki i zmapować odpowiedź bez obiektu "data"', async () => {
            // Arrange - przygotowanie mocka sesji
            mockSupabaseService.auth.getSession.mockResolvedValue(mockSession);
            mockHttpClient.get.mockReturnValue(of(mockSongShareMeta));

            const songId = 'test-song-id';

            // Act - wykonanie metody
            const result = await firstValueFrom(service.getSongShareMeta(songId));

            // Assert - sprawdzenie rezultatu
            expect(result).toEqual(mockSongShareMeta);
            expect(mockSupabaseService.auth.getSession).toHaveBeenCalledOnce();
            expect(mockHttpClient.get).toHaveBeenCalledWith(
                `${baseUrl}/share/songs/${songId}`,
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: `Bearer ${mockSession.data.session.access_token}`,
                    }),
                })
            );
        });

        it('powinien pobrać metadane piosenki i zmapować odpowiedź z obiektu "data"', async () => {
            // Arrange - przygotowanie mocka sesji i odpowiedzi z zagnieżdżonym obiektem data
            mockSupabaseService.auth.getSession.mockResolvedValue(mockSession);
            mockHttpClient.get.mockReturnValue(of({ data: mockSongShareMeta }));

            const songId = 'test-song-id';

            // Act - wykonanie metody
            const result = await firstValueFrom(service.getSongShareMeta(songId));

            // Assert - sprawdzenie, czy dane zostały poprawnie wyodrębnione z obiektu data
            expect(result).toEqual(mockSongShareMeta);
            expect(mockSupabaseService.auth.getSession).toHaveBeenCalledOnce();
        });

        it('powinien zwrócić błąd, gdy pobieranie sesji się nie powiedzie', async () => {
            // Arrange - przygotowanie mocka sesji z błędem
            mockSupabaseService.auth.getSession.mockResolvedValue({
                data: { session: null },
                error: { message: 'Session error' },
            });

            const songId = 'test-song-id';

            // Act & Assert - sprawdzenie, czy błąd został propagowany
            try {
                await firstValueFrom(service.getSongShareMeta(songId));
                throw new Error('Test powinien rzucić błąd');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toBe('Brak aktywnej sesji.');
                expect(mockSupabaseService.auth.getSession).toHaveBeenCalledOnce();
                // Sprawdzenie, że HttpClient nie został wywołany
                expect(mockHttpClient.get).not.toHaveBeenCalled();
            }
        });

        it('powinien zwrócić błąd HTTP, gdy żądanie API się nie powiedzie', async () => {
            // Arrange - przygotowanie mocka sesji i błędu HTTP
            mockSupabaseService.auth.getSession.mockResolvedValue(mockSession);
            const httpError = new HttpErrorResponse({
                status: 500,
                statusText: 'Internal Server Error',
            });
            mockHttpClient.get.mockReturnValue(throwError(() => httpError));

            const songId = 'test-song-id';

            // Act & Assert - sprawdzenie, czy błąd HTTP został propagowany
            await expect(() => firstValueFrom(service.getSongShareMeta(songId))).rejects.toThrow();
            await expect(() => firstValueFrom(service.getSongShareMeta(songId))).rejects.toMatchObject({
                status: 500,
            });
        });
    });

    describe('getRepertoireShareMeta', () => {
        it('powinien pobrać metadane repertuaru i zmapować odpowiedź bez obiektu "data"', async () => {
            // Arrange - przygotowanie mocka sesji
            mockSupabaseService.auth.getSession.mockResolvedValue(mockSession);
            mockHttpClient.get.mockReturnValue(of(mockRepertoireShareMeta));

            const repertoireId = 'test-repertoire-id';

            // Act - wykonanie metody
            const result = await firstValueFrom(service.getRepertoireShareMeta(repertoireId));

            // Assert - sprawdzenie rezultatu
            expect(result).toEqual(mockRepertoireShareMeta);
            expect(mockSupabaseService.auth.getSession).toHaveBeenCalledOnce();
            expect(mockHttpClient.get).toHaveBeenCalledWith(
                `${baseUrl}/share/repertoires/${repertoireId}`,
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: `Bearer ${mockSession.data.session.access_token}`,
                    }),
                })
            );
        });

        it('powinien pobrać metadane repertuaru i zmapować odpowiedź z obiektu "data"', async () => {
            // Arrange - przygotowanie mocka sesji i odpowiedzi z zagnieżdżonym obiektem data
            mockSupabaseService.auth.getSession.mockResolvedValue(mockSession);
            mockHttpClient.get.mockReturnValue(of({ data: mockRepertoireShareMeta }));

            const repertoireId = 'test-repertoire-id';

            // Act - wykonanie metody
            const result = await firstValueFrom(service.getRepertoireShareMeta(repertoireId));

            // Assert - sprawdzenie, czy dane zostały poprawnie wyodrębnione z obiektu data
            expect(result).toEqual(mockRepertoireShareMeta);
            expect(mockSupabaseService.auth.getSession).toHaveBeenCalledOnce();
        });

        it('powinien zwrócić błąd, gdy pobieranie sesji się nie powiedzie', async () => {
            // Arrange - przygotowanie mocka sesji z błędem
            mockSupabaseService.auth.getSession.mockResolvedValue({
                data: { session: null },
                error: { message: 'Session error' },
            });

            const repertoireId = 'test-repertoire-id';

            // Act & Assert - sprawdzenie, czy błąd został propagowany
            try {
                await firstValueFrom(service.getRepertoireShareMeta(repertoireId));
                throw new Error('Test powinien rzucić błąd');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toBe('Brak aktywnej sesji.');
                expect(mockSupabaseService.auth.getSession).toHaveBeenCalledOnce();
                // Sprawdzenie, że HttpClient nie został wywołany
                expect(mockHttpClient.get).not.toHaveBeenCalled();
            }
        });

        it('powinien zwrócić błąd HTTP, gdy żądanie API się nie powiedzie', async () => {
            // Arrange - przygotowanie mocka sesji i błędu HTTP
            mockSupabaseService.auth.getSession.mockResolvedValue(mockSession);
            const httpError = new HttpErrorResponse({
                status: 404,
                statusText: 'Not Found',
            });
            mockHttpClient.get.mockReturnValue(throwError(() => httpError));

            const repertoireId = 'test-repertoire-id';

            // Act & Assert - sprawdzenie, czy błąd HTTP został propagowany
            await expect(() => firstValueFrom(service.getRepertoireShareMeta(repertoireId))).rejects.toThrow();
            await expect(() => firstValueFrom(service.getRepertoireShareMeta(repertoireId))).rejects.toMatchObject({
                status: 404,
            });
        });
    });
});

