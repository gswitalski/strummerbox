import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { ProfileService } from '../services/profile.service';

export const authGuard: CanActivateFn = async (_route, state): Promise<boolean | UrlTree> => {
    const profileService = inject(ProfileService);
    const router = inject(Router);

    try {
        await profileService.loadProfile();
    } catch (error) {
        console.error('AuthGuard: profile load failed', error);
    }

    const profile = profileService.profile();

    if (profile) {
        return true;
    }

    return router.createUrlTree(['/login'], {
        queryParams: state.url && state.url !== '/login' ? { redirect: state.url } : undefined,
    });
};

