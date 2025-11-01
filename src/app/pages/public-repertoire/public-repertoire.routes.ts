import { Routes } from '@angular/router';

/**
 * Routing dla publicznych widoków repertuarów.
 * Ścieżka: /public/repertoires/:publicId
 * Bez autoryzacji, bez layoutu.
 */
export const publicRepertoireRoutes: Routes = [
    {
        path: ':publicId',
        loadComponent: () =>
            import('./public-repertoire.view').then(
                (m) => m.PublicRepertoireViewComponent
            ),
    },
];

