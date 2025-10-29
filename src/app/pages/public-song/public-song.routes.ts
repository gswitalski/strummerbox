import { Routes } from '@angular/router';

/**
 * Routing dla publicznych widoków piosenek.
 * Ścieżka: /public/songs/:publicId
 * Bez autoryzacji, bez layoutu.
 */
export const publicSongRoutes: Routes = [
    {
        path: ':publicId',
        loadComponent: () =>
            import('./public-song.view').then(
                (m) => m.PublicSongViewComponent
            ),
    },
];

