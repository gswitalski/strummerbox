import { Routes } from '@angular/router';

export const songCreateRoutes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./song-create-page/song-create-page.component').then(
                (m) => m.SongCreatePageComponent
            ),
    },
];

