import { Signal } from '@angular/core';

/**
 * Definiuje strukturę danych przekazywanych do UnconfirmedAccountDialogComponent.
 */
export interface UnconfirmedAccountDialogData {
    email: string;
}

/**
 * Wewnętrzny model widoku (ViewModel) dla komponentu dialogu.
 * Wykorzystuje sygnały do zarządzania stanem.
 */
export interface UnconfirmedAccountDialogVM {
    isResending: Signal<boolean>;
}

