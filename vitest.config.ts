/// <reference types="vitest" />

import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
    plugins: [angular()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['src/test-setup.ts'],
        include: ['src/**/*.{test,spec}.ts'],
        exclude: ['node_modules', 'dist', '.angular'],
        pool: 'forks', // Użyj forków zamiast wątków dla lepszej izolacji
        poolOptions: {
            forks: {
                singleFork: true, // Jeden fork - lepsze dla Angular TestBed
            },
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'src/test-setup.ts',
                '**/*.spec.ts',
                '**/*.test.ts',
                'src/environments/**',
                'src/main.ts',
            ],
        },
        reporters: ['default', 'html'],
    },
    define: {
        'import.meta.vitest': undefined,
    },
});

