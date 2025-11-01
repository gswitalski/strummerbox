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
    // TODO: Add route for repertoire song list view
    // {
    //     path: 'repertoires/:id',
    //     canActivate: [authGuard],
    //     loadComponent: () => import('./repertoire-songs/...').then(...)
    // },
];

