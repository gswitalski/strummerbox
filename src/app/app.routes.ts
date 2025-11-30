import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () =>
            import('./pages/login/login.component').then(
                (m) => m.LoginComponent
            ),
    },
    {
        path: 'register',
        loadComponent: () =>
            import('./pages/register/register-page.component').then(
                (m) => m.RegisterPageComponent
            ),
    },
    {
        path: 'auth/awaiting-confirmation',
        loadComponent: () =>
            import('./pages/auth/awaiting-confirmation-page.component').then(
                (m) => m.AwaitingConfirmationPageComponent
            ),
    },
    {
        path: 'auth/confirm-email',
        loadComponent: () =>
            import('./pages/auth/email-confirmation-page.component').then(
                (m) => m.EmailConfirmationPageComponent
            ),
    },
    {
        path: 'management',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./layout/default-layout/default-layout.component').then(
                (m) => m.DefaultLayoutComponent
            ),
        children: [
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./pages/dashboard/dashboard.component').then(
                        (m) => m.DashboardComponent
                    ),
            },
            {
                path: 'songs',
                loadComponent: () =>
                    import('./pages/song-list/song-list-page/song-list-page.component').then(
                        (m) => m.SongListPageComponent
                    ),
            },
            {
                path: 'songs/new',
                loadComponent: () =>
                    import('./pages/song-create/song-create-page/song-create-page.component').then(
                        (m) => m.SongCreatePageComponent
                    ),
            },
            {
                path: 'songs/:id/edit',
                loadComponent: () =>
                    import('./pages/song-edit/song-edit-page/song-edit-page.component').then(
                        (m) => m.SongEditPageComponent
                    ),
            },
            {
                path: 'songs/:id/preview',
                loadComponent: () =>
                    import('./pages/song-preview/song-preview-page.component').then(
                        (m) => m.SongPreviewPageComponent
                    ),
            },
            {
                path: 'repertoires',
                loadComponent: () =>
                    import('./pages/repertoire-list/repertoire-list-page/repertoire-list-page.component').then(
                        (m) => m.RepertoireListPageComponent
                    ),
            },
            {
                path: 'repertoires/:id/edit',
                loadComponent: () =>
                    import('./pages/repertoire-edit/repertoire-edit-page/repertoire-edit-page.component').then(
                        (m) => m.RepertoireEditPageComponent
                    ),
            },
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'dashboard',
            },
        ],
    },
    {
        path: 'public/songs',
        loadChildren: () =>
            import('./pages/public-song/public-song.routes').then(
                (m) => m.publicSongRoutes
            ),
    },
    {
        path: 'public/repertoires',
        loadChildren: () =>
            import('./pages/public-repertoire/public-repertoire.routes').then(
                (m) => m.publicRepertoireRoutes
            ),
    },
    {
        path: 'biesiada',
        loadChildren: () =>
            import('./pages/biesiada/biesiada.routes').then(
                (m) => m.biesiadaRoutes
            ),
    },
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'management',
    },
    {
        path: '**',
        loadComponent: () =>
            import('./pages/not-found/not-found.component').then(
                (m) => m.NotFoundComponent
            ),
    },
];
