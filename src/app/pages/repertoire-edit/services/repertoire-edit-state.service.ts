import {
    Injectable,
    Signal,
    WritableSignal,
    computed,
    inject,
    signal,
} from '@angular/core';

import type {
    RepertoireDto,
    RepertoireAddSongsResponseDto,
} from '../../../../../packages/contracts/types';
import type {
    RepertoireEditViewModel,
    RepertoireSongViewModel,
    AvailableSongViewModel,
} from '../models/repertoire-edit.types';
import { RepertoiresApiService } from './repertoires-api.service';
import { SongsApiService } from './songs-api.service';

@Injectable()
export class RepertoireEditStateService {
    private readonly repertoiresApi = inject(RepertoiresApiService);
    private readonly songsApi = inject(SongsApiService);

    private readonly state: WritableSignal<RepertoireEditViewModel> = signal({
        repertoire: null,
        allSongs: [],
        isLoading: false,
        isUpdatingHeader: false,
        error: null,
        addingSongId: null,
        removingSongId: null,
    });

    // Publiczne computed sygnały (selektory)
    public readonly repertoire: Signal<RepertoireDto | null> = computed(
        () => this.state().repertoire
    );

    public readonly isLoading: Signal<boolean> = computed(
        () => this.state().isLoading
    );

    public readonly isUpdatingHeader: Signal<boolean> = computed(
        () => this.state().isUpdatingHeader
    );

    public readonly error: Signal<string | null> = computed(
        () => this.state().error
    );

    public readonly addingSongId: Signal<string | null> = computed(
        () => this.state().addingSongId
    );

    public readonly removingSongId: Signal<string | null> = computed(
        () => this.state().removingSongId
    );

    /**
     * Lista piosenek w repertuarze
     */
    public readonly repertoireSongs: Signal<RepertoireSongViewModel[]> = computed(
        () => this.state().repertoire?.songs ?? []
    );

    /**
     * Lista dostępnych piosenek (nie w repertuarze)
     */
    public readonly availableSongs: Signal<AvailableSongViewModel[]> = computed(() => {
        const allSongs = this.state().allSongs;
        const repertoireSongIds = new Set(
            this.state().repertoire?.songs?.map((s) => s.songId) ?? []
        );

        return allSongs.filter((song) => !repertoireSongIds.has(song.id));
    });

    /**
     * Ładuje dane repertuaru i wszystkie piosenki użytkownika
     */
    public async load(repertoireId: string): Promise<void> {
        this.state.update((current) => ({
            ...current,
            isLoading: true,
            error: null,
        }));

        try {
            const [repertoire, songsResponse] = await Promise.all([
                this.repertoiresApi.getRepertoire(repertoireId),
                this.songsApi.getAllSongs(),
            ]);

            this.state.set({
                repertoire,
                allSongs: songsResponse.items,
                isLoading: false,
                isUpdatingHeader: false,
                error: null,
                addingSongId: null,
                removingSongId: null,
            });
        } catch (error) {
            console.error('RepertoireEditStateService: load error', error);
            this.state.update((current) => ({
                ...current,
                isLoading: false,
                error: 'Nie udało się załadować danych repertuaru.',
            }));
            throw error;
        }
    }

    /**
     * Aktualizuje nazwę repertuaru
     */
    public async updateName(name: string): Promise<void> {
        const repertoire = this.state().repertoire;
        if (!repertoire) {
            throw new Error('Brak załadowanego repertuaru');
        }

        this.state.update((current) => ({
            ...current,
            isUpdatingHeader: true,
        }));

        try {
            const updated = await this.repertoiresApi.updateRepertoire(
                repertoire.id,
                { name }
            );

            this.state.update((current) => ({
                ...current,
                repertoire: updated,
                isUpdatingHeader: false,
            }));
        } catch (error) {
            console.error('RepertoireEditStateService: updateName error', error);
            this.state.update((current) => ({
                ...current,
                isUpdatingHeader: false,
            }));
            throw error;
        }
    }

    /**
     * Aktualizuje opis repertuaru
     */
    public async updateDescription(description: string): Promise<void> {
        const repertoire = this.state().repertoire;
        if (!repertoire) {
            throw new Error('Brak załadowanego repertuaru');
        }

        this.state.update((current) => ({
            ...current,
            isUpdatingHeader: true,
        }));

        try {
            const updated = await this.repertoiresApi.updateRepertoire(
                repertoire.id,
                { description }
            );

            this.state.update((current) => ({
                ...current,
                repertoire: updated,
                isUpdatingHeader: false,
            }));
        } catch (error) {
            console.error('RepertoireEditStateService: updateDescription error', error);
            this.state.update((current) => ({
                ...current,
                isUpdatingHeader: false,
            }));
            throw error;
        }
    }

    /**
     * Dodaje piosenkę do repertuaru
     */
    public async addSong(songId: string): Promise<void> {
        const repertoire = this.state().repertoire;
        if (!repertoire) {
            throw new Error('Brak załadowanego repertuaru');
        }

        this.state.update((current) => ({
            ...current,
            addingSongId: songId,
        }));

        try {
            const response = await this.repertoiresApi.addSongs(repertoire.id, {
                songIds: [songId],
            });

            // Dodaj nowe piosenki do repertuaru w stanie
            const newSongs = response.added.map((added: RepertoireAddSongsResponseDto['added'][number]) => {
                const song = this.state().allSongs.find(
                    (s) => s.id === added.songId
                );
                if (!song) {
                    throw new Error(`Piosenka ${added.songId} nie została znaleziona`);
                }

                return {
                    repertoireSongId: added.repertoireSongId,
                    songId: added.songId,
                    title: song.title,
                    position: added.position,
                    content: null,
                } as RepertoireSongViewModel;
            });

            this.state.update((current) => ({
                ...current,
                repertoire: {
                    ...current.repertoire!,
                    songs: [...(current.repertoire!.songs ?? []), ...newSongs],
                },
                addingSongId: null,
            }));
        } catch (error) {
            console.error('RepertoireEditStateService: addSong error', error);
            this.state.update((current) => ({
                ...current,
                addingSongId: null,
            }));
            throw error;
        }
    }

    /**
     * Usuwa piosenkę z repertuaru
     */
    public async removeSong(repertoireSongId: string): Promise<void> {
        const repertoire = this.state().repertoire;
        if (!repertoire) {
            throw new Error('Brak załadowanego repertuaru');
        }

        this.state.update((current) => ({
            ...current,
            removingSongId: repertoireSongId,
        }));

        try {
            await this.repertoiresApi.removeSong(repertoire.id, repertoireSongId);

            // Usuń piosenkę ze stanu
            this.state.update((current) => ({
                ...current,
                repertoire: {
                    ...current.repertoire!,
                    songs: current.repertoire!.songs?.filter(
                        (s) => s.repertoireSongId !== repertoireSongId
                    ),
                },
                removingSongId: null,
            }));
        } catch (error) {
            console.error('RepertoireEditStateService: removeSong error', error);
            this.state.update((current) => ({
                ...current,
                removingSongId: null,
            }));
            throw error;
        }
    }

    /**
     * Zmienia kolejność piosenek w repertuarze
     */
    public async reorderSongs(newOrder: string[]): Promise<void> {
        const repertoire = this.state().repertoire;
        if (!repertoire) {
            throw new Error('Brak załadowanego repertuaru');
        }

        // Zapisz poprzednią kolejność na wypadek błędu
        const previousSongs = repertoire.songs ? [...repertoire.songs] : [];

        // Optymistycznie zaktualizuj UI
        const reorderedSongs = newOrder
            .map((repertoireSongId) =>
                previousSongs.find((s) => s.repertoireSongId === repertoireSongId)
            )
            .filter((s): s is RepertoireSongViewModel => s !== undefined)
            .map((song, index) => ({
                ...song,
                position: index,
            }));

        this.state.update((current) => ({
            ...current,
            repertoire: {
                ...current.repertoire!,
                songs: reorderedSongs,
            },
        }));

        try {
            await this.repertoiresApi.reorderSongs(repertoire.id, {
                order: newOrder,
            });
        } catch (error) {
            console.error('RepertoireEditStateService: reorderSongs error', error);
            // Przywróć poprzednią kolejność w przypadku błędu
            this.state.update((current) => ({
                ...current,
                repertoire: {
                    ...current.repertoire!,
                    songs: previousSongs,
                },
            }));
            throw error;
        }
    }
}

