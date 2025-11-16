# StrummerBox

![Test & Build](https://github.com/YOUR_USERNAME/strummerbox/actions/workflows/ci.yml/badge.svg)

## Table of Contents
1. [Project Description](#project-description)
2. [Tech Stack](#tech-stack)
3. [Getting Started Locally](#getting-started-locally)
4. [Supabase Production Setup](#supabase-production-setup)
5. [Available Scripts](#available-scripts)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Project Scope](#project-scope)
8. [Project Status](#project-status)
9. [License](#license)

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
-   **Firebase Hosting**: For fast and secure web hosting with a global CDN.

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

## Supabase Production Setup

To deploy the application to a production environment, you need to set up a Supabase project in the cloud and configure it properly.

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in or create an account
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: strummerbox (or your preferred name)
   - **Database Password**: Generate a strong password (save it securely!)
   - **Region**: Choose the closest to your users
   - **Pricing Plan**: Select based on your needs (Free tier available)
4. Wait for the project to be provisioned (usually 1-2 minutes)

### 2. Configure Authentication

#### Email Settings

Navigate to **Dashboard → Authentication → Email Templates**

1. **Enable Email Confirmation:**
   - Go to **Settings → Auth → Email Auth**
   - Ensure **"Confirm email"** is enabled
   - Set **"Confirmation URL"** to your frontend URL: `https://your-domain.com`

2. **Configure SMTP Provider (Recommended for Production):**
   
   Go to **Settings → Auth → SMTP Settings**
   
   **Option A: Use Supabase's built-in service (Limited)**
   - Free tier: 4 emails/hour
   - Pro tier: Higher limits
   - No configuration needed (default)
   
   **Option B: Configure your own SMTP (Recommended)**
   
   Choose one of the following providers:
   
   **Using Resend (Recommended):**
   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 465 (SSL) or 587 (TLS)
   SMTP User: resend
   SMTP Password: Your Resend API Key
   Sender Email: noreply@your-domain.com
   Sender Name: StrummerBox
   ```
   
   **Using SendGrid:**
   ```
   SMTP Host: smtp.sendgrid.net
   SMTP Port: 465 (SSL) or 587 (TLS)
   SMTP User: apikey
   SMTP Password: Your SendGrid API Key
   Sender Email: noreply@your-domain.com
   Sender Name: StrummerBox
   ```
   
   **Using Gmail (Development only):**
   ```
   SMTP Host: smtp.gmail.com
   SMTP Port: 465 (SSL) or 587 (TLS)
   SMTP User: your-email@gmail.com
   SMTP Password: App-specific password
   Sender Email: your-email@gmail.com
   Sender Name: StrummerBox
   ```

3. **Customize Email Templates:**
   
   Navigate to **Authentication → Email Templates**
   
   Edit the following templates:
   - **Confirm signup**: Email sent when user registers
   - **Magic Link**: Email sent for passwordless login
   - **Change Email Address**: Email sent when user changes email
   
   Example template for **Confirm signup**:
   ```html
   <h2>Witaj w StrummerBox!</h2>
   <p>Dziękujemy za rejestrację.</p>
   <p>Kliknij poniższy link, aby aktywować swoje konto:</p>
   <p><a href="{{ .ConfirmationURL }}">Potwierdź adres email</a></p>
   <p>Link jest ważny przez 24 godziny.</p>
   <p>Jeśli to nie Ty rejestrowałeś konto, zignoruj ten email.</p>
   ```

#### URL Configuration

Navigate to **Settings → Auth → URL Configuration**

Set the following URLs:
- **Site URL**: `https://your-domain.com` (your frontend application URL)
- **Redirect URLs**: Add all URLs where users can be redirected after authentication:
  ```
  https://your-domain.com/**
  http://localhost:4200/** (for development)
  ```

### 3. Database Setup

#### Run Migrations

Link your local project to the cloud project:

```sh
# Login to Supabase
supabase login

# Link to your cloud project
supabase link --project-ref your-project-ref

# Push your local database schema to production
supabase db push
```

To find your `project-ref`:
- Go to **Dashboard → Settings → General**
- Look for **Reference ID**

#### Set up Row Level Security (RLS)

Ensure all RLS policies are in place:

```sh
# Check RLS status
supabase db pull

# Review policies in supabase/migrations/
```

### 4. Deploy Edge Functions

Deploy all Edge Functions to production:

```sh
# Deploy all functions at once
supabase functions deploy

# Or deploy specific functions
supabase functions deploy auth
supabase functions deploy songs
supabase functions deploy repertoires
supabase functions deploy share
supabase functions deploy public
supabase functions deploy me
```

#### Set Environment Variables for Functions

Set required environment variables:

```sh
# Set APP_PUBLIC_URL for generating public links
supabase secrets set APP_PUBLIC_URL=https://your-domain.com
```

To view all secrets:
```sh
supabase secrets list
```

### 5. Configure Frontend Environment

Update your frontend environment configuration (`src/environments/environment.prod.ts`):

```typescript
export const environment = {
  production: true,
  supabaseUrl: 'https://your-project-ref.supabase.co',
  supabaseAnonKey: 'your-anon-public-key',
  functionsUrl: 'https://your-project-ref.supabase.co/functions/v1'
};
```

To get your keys:
- Go to **Dashboard → Settings → API**
- Copy **Project URL** and **anon/public key**

### 6. Configure CORS (if needed)

If you encounter CORS issues, configure allowed origins:

Navigate to **Dashboard → Settings → API → CORS**

Add your frontend domain:
```
https://your-domain.com
```

### 7. Rate Limiting

Configure rate limiting to protect your endpoints:

Navigate to **Dashboard → Settings → Auth → Rate Limits**

Recommended settings:
- **Email signups**: 10 per hour per IP
- **Password signins**: 30 per hour per IP
- **Email OTP signins**: 10 per hour per IP

### 8. Monitoring and Logs

Monitor your application:

- **Dashboard → Logs**: View all logs (Auth, Database, Functions)
- **Dashboard → Reports**: Usage statistics and performance metrics
- **Dashboard → Database → Backups**: Configure automatic backups

### 9. Deploy Frontend

Build and deploy your Angular application:

```sh
# Build for production
npm run build

# Deploy to Firebase Hosting (or your preferred hosting)
firebase deploy
```

### 10. Post-Deployment Checklist

- [ ] Email verification works (test registration flow)
- [ ] SMTP is configured and emails are delivered
- [ ] All Edge Functions are deployed and accessible
- [ ] Database migrations are applied
- [ ] RLS policies are active and working
- [ ] Environment variables are set correctly
- [ ] CORS is configured properly
- [ ] Rate limiting is enabled
- [ ] Frontend connects to production Supabase
- [ ] Public links and QR codes work correctly
- [ ] Test both organizer and partygoer workflows

### Useful Commands

```sh
# View function logs
supabase functions logs auth

# Check database status
supabase db diff

# Pull production schema
supabase db pull

# List all deployed functions
supabase functions list
```

### Troubleshooting

**Emails not sending:**
- Check SMTP configuration in Dashboard → Settings → Auth
- Verify sender email is verified with your SMTP provider
- Check function logs: `supabase functions logs auth`
- Test SMTP credentials independently

**CORS errors:**
- Add your domain to allowed origins in Dashboard → Settings → API
- Ensure `supabaseUrl` in frontend matches your project URL
- Check browser console for exact error message

**Authentication issues:**
- Verify Site URL in Dashboard → Settings → Auth
- Check redirect URLs include your domain
- Ensure JWT secret hasn't been regenerated

**Function deployment fails:**
- Check Deno version compatibility
- Verify all dependencies are accessible via URLs
- Review function logs for specific errors

For more help, consult [Supabase Documentation](https://supabase.com/docs) or [StrummerBox Documentation](./docs).

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
