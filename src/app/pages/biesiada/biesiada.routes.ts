import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

/**
 * Routes for Biesiada mode
 * All routes are protected by authGuard
 */
export const biesiadaRoutes: Routes = [
    {
        path: 'repertoires',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./repertoires/biesiada-repertoire-list-page.component').then(
                (m) => m.BiesiadaRepertoireListPageComponent
            ),
    },
    {
        path: 'repertoires/:repertoireId/songs/:songId',
        canActivate: [authGuard],
        loadComponent: () =>
            import('../biesiada-song/biesiada-song.view').then(
                (m) => m.BiesiadaSongViewComponent
            ),
    },
    {
        path: 'repertoires/:id',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./repertoires/songs/biesiada-repertoire-song-list-page.component').then(
                (m) => m.BiesiadaRepertoireSongListPageComponent
            ),
    },
];

