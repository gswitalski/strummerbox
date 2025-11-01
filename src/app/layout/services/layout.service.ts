import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Injectable, Signal, WritableSignal, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map } from 'rxjs';
import { NavLink } from '../models/nav-link.model';

@Injectable({
    providedIn: 'root',
})
export class LayoutService {
    private readonly breakpointObserver = inject(BreakpointObserver);

    private readonly isMobileState: WritableSignal<boolean> = signal(false);
    private readonly isSidenavOpenState: WritableSignal<boolean> = signal(true);
    private readonly managementLinksState: Signal<NavLink[]> = signal<NavLink[]>([
        {
            path: '/management/dashboard',
            icon: 'dashboard',
            label: 'Dashboard',
        },
        {
            path: '/management/songs',
            icon: 'library_music',
            label: 'Piosenki',
        },
        {
            path: '/management/repertoires',
            icon: 'queue_music',
            label: 'Repertuary',
        },
    ]);
    private readonly biesiadaLinksState: Signal<NavLink[]> = signal<NavLink[]>([
        {
            path: '/biesiada/repertoires',
            icon: 'celebration',
            label: 'Repertuary',
        },
    ]);

    public readonly isMobile: Signal<boolean> = this.isMobileState.asReadonly();
    public readonly isSidenavOpen: Signal<boolean> = this.isSidenavOpenState.asReadonly();
    public readonly sidenavMode: Signal<'side' | 'over'> = computed(() =>
        this.isMobile() ? 'over' : 'side'
    );
    public readonly managementLinks: Signal<NavLink[]> = this.managementLinksState;
    public readonly biesiadaLinks: Signal<NavLink[]> = this.biesiadaLinksState;

    constructor() {
        const isHandsetSignal = toSignal(
            this.breakpointObserver
                .observe([Breakpoints.HandsetPortrait, Breakpoints.Handset])
                .pipe(
                    map((result) => result.matches),
                    distinctUntilChanged()
                ),
            { initialValue: false }
        );

        effect(() => {
            this.isMobileState.set(isHandsetSignal() ?? false);
        });

        effect(() => {
            if (this.isMobileState()) {
                this.isSidenavOpenState.set(false);
                return;
            }

            this.isSidenavOpenState.set(true);
        });
    }

    public toggleSidenav(): void {
        this.isSidenavOpenState.set(!this.isSidenavOpenState());
    }

    public openSidenav(): void {
        if (this.isSidenavOpenState()) {
            return;
        }

        this.isSidenavOpenState.set(true);
    }

    public closeSidenav(): void {
        if (!this.isSidenavOpenState()) {
            return;
        }

        this.isSidenavOpenState.set(false);
    }

    public setSidenavOpen(isOpen: boolean): void {
        this.isSidenavOpenState.set(isOpen);
    }
}

