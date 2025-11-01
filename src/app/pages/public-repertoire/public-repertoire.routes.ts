import { Routes } from '@angular/router';

/**
 * Routing dla publicznych widoków repertuarów.
 * Ścieżki:
 * - /public/repertoires/:publicId - lista piosenek w repertuarze
 * - /public/repertoires/:repertoirePublicId/songs/:songPublicId - konkretna piosenka w repertuarze
 * Bez autoryzacji, bez layoutu.
 */
export const publicRepertoireRoutes: Routes = [
    {
        path: ':repertoirePublicId/songs/:songPublicId',
        loadComponent: () =>
            import('../public-repertoire-song/public-repertoire-song.view').then(
                (m) => m.PublicRepertoireSongViewComponent
            ),
    },
    {
        path: ':publicId',
        loadComponent: () =>
            import('./public-repertoire.view').then(
                (m) => m.PublicRepertoireViewComponent
            ),
    },
];

