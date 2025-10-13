# StrummerBox

## Table of Contents
1. [Project Description](#project-description)
2. [Tech Stack](#tech-stack)
3. [Getting Started Locally](#getting-started-locally)
4. [Available Scripts](#available-scripts)
5. [Project Scope](#project-scope)
6. [Project Status](#project-status)
7. [License](#license)

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
3. **Set up environment variables:**
   - Create a `.env` file in the root of the project if required for services like Supabase, and add the necessary configuration keys.

4.  **Run the application:**
    ```sh
    npm start
    ```
The application will be available at `http://localhost:4200/`.

## Available Scripts

In the project directory, you can run the following scripts:

-   `npm start`: Runs the app in development mode with live reload.
-   `npm run build`: Builds the app for production to the `dist/` folder.
-   `npm test`: Runs the unit tests via Karma.
-   `npm run watch`: Builds the app in watch mode for development.

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
