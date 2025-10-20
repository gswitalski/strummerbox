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
                path: '',
                pathMatch: 'full',
                redirectTo: 'dashboard',
            },
        ],
    },
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'management',
    },
    {
        path: '**',
        redirectTo: 'login',
    },
];
