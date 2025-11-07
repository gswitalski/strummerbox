# StrummerBox

![Test & Build](https://github.com/YOUR_USERNAME/strummerbox/actions/workflows/ci.yml/badge.svg)

## Table of Contents
1. [Project Description](#project-description)
2. [Tech Stack](#tech-stack)
3. [Getting Started Locally](#getting-started-locally)
4. [Available Scripts](#available-scripts)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Project Scope](#project-scope)
7. [Project Status](#project-status)
8. [License](#license)

## Project Description

StrummerBox is a web application designed for amateur guitarists and organizers of social gatherings. Its primary goal is to replace cumbersome paper songbooks with a simple and flexible digital tool. The application allows users to create a private library of songs with chords, arrange them into repertoires for specific occasions, and instantly share them with event participants using QR codes and links.

The application offers two main interfaces:
-   **Management Mode:** A comprehensive interface for the "Organizer" (a registered user) to manage songs and repertoires. It is optimized for desktop use but is fully responsive.
-   **Party Mode:** A simplified, read-only view for "Partygoers" (anonymous users) to view song lyrics. It is optimized for mobile devices to ensure readability during a gathering.

## Tech Stack

### Frontend
-   **Angular 19**: A robust framework for building component-based, single-page applications.
-   **TypeScript**: Provides static typing to enhance code quality and maintainability.
-   **Sass**: A CSS preprocessor for writing more maintainable and reusable styles.
-   **Angular Material**: A library of high-quality, accessible UI components.

### Backend
-   **Supabase**: An open-source Firebase alternative providing a complete backend solution.
    -   **PostgreSQL Database**: For data storage.
    -   **BaaS (Backend-as-a-Service)**: SDK for backend functionalities.
    -   **Authentication**: Built-in user authentication system.

### Testing
-   **Vitest**: Lightning-fast unit testing framework for frontend with HMR support and native TypeScript compatibility.
-   **Playwright**: Modern end-to-end testing framework with multi-browser support, auto-waiting, and built-in visual regression testing.
-   **Deno Test**: Built-in test runner for Supabase Edge Functions with native TypeScript support and zero configuration.

### CI/CD & Hosting
-   **GitHub Actions**: For automating CI/CD pipelines to build and test the application.
-   **DigitalOcean**: For flexible and scalable application hosting.

## Getting Started Locally

To set up and run the project locally, follow these steps:

### Prerequisites
-   Node.js (LTS version recommended)
-   npm (comes with Node.js)
-   Angular CLI (`npm install -g @angular/cli`)

### Installation
1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/strummerbox.git
    cd strummerbox
    ```
2.  **Install dependencies:**
    ```sh
    npm install
    ```
3. **Set up Supabase locally:**
   ```sh
   # Install Supabase CLI (if not already installed)
   npm install -g supabase
   
   # Start Supabase local development stack
   supabase start
   ```

4. **Set up environment variables:**
   Create a `.env` file in the root of the project with the following variables:
   ```env
   # Application public URL (for generating shareable links)
   APP_PUBLIC_URL=http://localhost:4200
   ```

5.  **Run the application:**
    ```sh
    npm start
    ```
The application will be available at `http://localhost:4200/`.

### Testing Edge Functions

To test Supabase Edge Functions locally:

```sh
# Serve a specific function
supabase functions serve share --env-file .env

# Or use the provided test scripts:
# PowerShell (Windows):
.\scripts\test-share-endpoint.ps1 -Token "your-jwt-token" -SongId "song-uuid"

# Bash (Linux/macOS):
./scripts/test-share-endpoint.sh "your-jwt-token" "song-uuid"
```

## Available Scripts

In the project directory, you can run the following scripts:

### Development

-   `npm start`: Runs the app in development mode with live reload.
-   `npm run build`: Builds the app for production to the `dist/` folder.
-   `npm run watch`: Builds the app in watch mode for development.

### Testing

#### Unit Tests (Vitest)

-   `npm run test`: Runs unit tests in watch mode.
-   `npm run test:ui`: Opens interactive UI for running and debugging tests.
-   `npm run test:run`: Runs all tests once (CI mode).
-   `npm run test:coverage`: Generates code coverage report.

#### E2E Tests (Playwright)

-   `npm run test:e2e`: Runs E2E tests in all browsers.
-   `npm run test:e2e:ui`: Opens Playwright UI for interactive testing.
-   `npm run test:e2e:debug`: Runs tests in debug mode with Playwright Inspector.
-   `npm run test:e2e:chromium`: Runs tests only in Chromium.
-   `npm run test:e2e:firefox`: Runs tests only in Firefox.
-   `npm run test:e2e:webkit`: Runs tests only in WebKit (Safari).
-   `npm run test:e2e:mobile`: Runs tests on mobile devices (Pixel 5, iPhone 12).
-   `npm run test:e2e:report`: Shows HTML report from last test run.

For detailed testing documentation, see [Testing Quick Start](./docs/testing-quick-start.md).

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment. The pipeline consists of two jobs:

1. **Unit Tests** - Runs all unit tests using Vitest
2. **Build** - Creates a production build (only if tests pass)

Pipeline automatically:

-   ✅ Runs unit tests (Vitest) on every push to `main`
-   ✅ Builds the production version of the application (only if tests succeed)
-   ✅ Verifies build integrity
-   ✅ Stores build artifacts for 7 days

### Manual Trigger

You can manually trigger the pipeline from the GitHub Actions tab:
1. Go to "Actions" tab in the repository
2. Select "CI/CD Pipeline" workflow
3. Click "Run workflow"

### Pipeline Status

View the pipeline status and history in the [Actions tab](https://github.com/YOUR_USERNAME/strummerbox/actions).

For detailed CI/CD documentation, see [GitHub Actions CI Setup](./docs/results/github-actions-ci-setup.md).

## Project Scope

### In Scope (MVP)
-   **User Management**: Registration and login for Organizers.
-   **Song Management**: Full CRUD (Create, Read, Update, Delete) operations for songs in a private library.
-   **Repertoire Management**: Full CRUD operations for repertoires (collections of songs).
-   **ChordPro Editor**: A side-by-side editor for writing songs in ChordPro format with a live preview.
-   **Sharing**: Generation of persistent public links and QR codes for songs and repertoires.
-   **Dual Modes**: Separate "Management" and "Party" modes for different user experiences.
-   **Mobile Optimization**: Fully responsive views for participants.

### Out of Scope (MVP)
-   Chord transposition (changing the key of a song).
-   Scanning/OCR functionality to add songs from physical songbooks.
-   Password reset mechanism.
-   Ability to add reference links (e.g., YouTube videos) to songs.
-   A public library to browse songs from other users.

## Project Status
The project is currently **in development**. It is being created as a graded university project.

The success of the MVP will be determined by the flawless execution of two key user scenarios:
1.  **Organizer's Workflow**: An organizer can successfully log in, add songs, create a repertoire, and generate a shareable link.
2.  **Participant's Workflow**: During a simulated event, an organizer can share a repertoire via QR code, and participants can seamlessly access and navigate the song lyrics on their mobile devices.

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.
