# REST API Plan

## 1. Resources
- `Profile` → table `profiles`; stores organizer display data linked 1:1 with Supabase `auth.users`.
- `Song` → table `songs`; organizer-owned chord sheets with publishing metadata and text content.
- `Repertoire` → table `repertoires`; organizer-owned collections of songs with publishing metadata and descriptions.
- `RepertoireSong` → table `repertoire_songs`; junction records storing the ordered membership of songs within repertoires.
- `PublicSong` → published view of a `Song` exposed through `public_id` with chord-stripped content.
- `PublicRepertoire` → published view of a `Repertoire`, exposing ordered `PublicSong` summaries.
- `ShareMeta` → virtual resource returning shareable URLs and QR payloads for songs and repertoires.

## 2. Endpoints

### 2.1 Profile

#### GET /me/profile
- **Method:** GET
- **Path:** `/me/profile`
- **Description:** Return the authenticated organizer profile.
- **Query Parameters:** none
- **Request JSON:** _none_
- **Response JSON:**
```json
{
  "id": "c2b20c72-9a4a-4e1e-8d4f-52d0c2cf72cf",
  "email": "organizer@example.com",
  "displayName": "Basia",
  "createdAt": "2025-10-15T08:20:51Z",
  "updatedAt": "2025-10-15T08:22:03Z"
}
```
- **Success:** `200 OK`
- **Errors:** `401 Unauthorized` (missing/invalid token), `404 Not Found` (profile not initialized).

#### PUT /me/profile
- **Method:** PUT
- **Path:** `/me/profile`
- **Description:** Create or update `display_name` for the current organizer.
- **Query Parameters:** none
- **Request JSON:**
```json
{
  "displayName": "Basia"
}
```
- **Response JSON:** same as `GET /me/profile`.
- **Success:** `200 OK`, `201 Created` (first time profile created).
- **Errors:** `400 Bad Request` (missing/invalid field), `401 Unauthorized`.

#### POST /me/profile
- **Method:** POST
- **Path:** `/auth/register`
- **Description:** Register a new organizer. Creates an inactive user in Supabase Auth, which triggers a confirmation email. The account is not active until the email link is clicked. Also creates a corresponding profile entry.
- **Query Parameters:** none
- **Request JSON:**
```json
{
  "email": "organizer@example.com",
  "password": "supersecretpassword",
  "displayName": "Basia"
}
```
- **Response JSON:** same as `GET /me/profile`.
- **Success:** `201 Created`
- **Errors:** `400 Bad Request` (invalid payload, e.g. weak password), `409 Conflict` (email already exists).

#### POST /auth/resend-confirmation
- **Method:** POST
- **Path:** `/auth/resend-confirmation`
- **Description:** Resends the confirmation email to a user with an unconfirmed account. This endpoint calls the underlying Supabase functionality to issue a new confirmation link.
- **Query Parameters:** none
- **Request JSON:**
```json
{
  "email": "organizer@example.com"
}
```
- **Response JSON:**
```json
{
  "message": "If an account with this email exists and is not yet confirmed, a new confirmation link has been sent."
}
```
- **Success:** `200 OK` (A generic success message is returned to prevent user enumeration).
- **Errors:** `400 Bad Request` (invalid email format).

### 2.2 Songs (Authenticated Organizer)

> **Note on ChordPro Conversion:** The feature allowing users to import songs from "chords-above-text" format is implemented entirely on the client-side. The conversion logic resides within the frontend application, which then sends the fully-formed ChordPro content via the standard `POST /songs` or `PATCH /songs/{id}` endpoints. No dedicated API endpoints are required for this functionality.

> **Note on Chord Transposition:** The feature allowing users to transpose chords in real-time is implemented entirely on the client-side. The API always returns the song content as it is stored in the database. The frontend application is responsible for applying the transposition logic before rendering the song to the user. This approach ensures instant UI feedback without requiring additional server round-trips.

> **Note on Editor Preview Modes:** The feature allowing the user to switch between ChordPro and "Biesiada" (chords-above-text) preview modes in the song editor is implemented entirely on the client-side. The frontend application reuses its existing ChordPro generation logic and rendering components to provide this functionality. This does not require any changes to the API.

> **Note on Repeats Handling:** The feature allowing users to define repeating sections using simplified syntax (e.g., `x2`) which translates to the ChordPro `{c: xN}` directive is implemented entirely on the client-side. The API is not aware of this syntax and treats the song `content` as an opaque string, requiring no changes to backend endpoints.

> **Uwaga dotycząca dostosowywania wielkości czcionki:** Funkcjonalność pozwalająca użytkownikom na zmianę wielkości czcionki w widokach Biesiada i publicznym jest zaimplementowana w całości po stronie klienta. Preferencje użytkownika są przechowywane w `localStorage` przeglądarki. Takie podejście zapewnia natychmiastową odpowiedź interfejsu i nie wymaga żadnych zmian w API.

#### POST /songs
- **Method:** POST
- **Path:** `/songs`
- **Description:** Create a new song owned by the organizer.
- **Query Parameters:** none
- **Request JSON:**
```json
{
  "title": "Knockin' on Heaven's Door",
  "content": "[G]Mama, take this badge off of me...",
  "published": false
}
```
- **Response JSON:**
```json
{
  "id": "58b8a0d0-5bf4-4d8a-82de-a2ad8c37b8a5",
  "publicId": "6e42f88a-2d46-4c27-8371-98dd621b6af2",
  "title": "Knockin' on Heaven's Door",
  "content": "[G]Mama, take this badge off of me...",
  "publishedAt": null,
  "createdAt": "2025-10-15T08:20:51Z",
  "updatedAt": "2025-10-15T08:20:51Z"
}
```
- **Success:** `201 Created`
- **Errors:** `400 Bad Request` (invalid payload), `401 Unauthorized`, `409 Conflict` (title already used by organizer).

#### GET /songs
- **Method:** GET
- **Path:** `/songs`
- **Description:** List organizer songs with pagination, search and filtering.
- **Query Parameters:**
  - `page` (default 1)
  - `pageSize` (default 20, max 100)
  - `search` (substring matched with trigram index against `title`)
  - `published` (`true|false|null`)
  - `sort` (`title|createdAt|updatedAt|publishedAt`, prefix with `-` for descending)
- **Request JSON:** _none_
- **Response JSON:**
```json
{
  "items": [
    {
      "id": "58b8a0d0-5bf4-4d8a-82de-a2ad8c37b8a5",
      "publicId": "6e42f88a-2d46-4c27-8371-98dd621b6af2",
      "title": "Knockin' on Heaven's Door",
      "publishedAt": null,
      "createdAt": "2025-10-15T08:20:51Z",
      "updatedAt": "2025-10-15T08:22:03Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 42
}
```
- **Headers:** `X-Total-Count`
- **Success:** `200 OK`
- **Errors:** `401 Unauthorized`.

#### GET /songs/{id}
- **Method:** GET
- **Path:** `/songs/{id}`
- **Description:** Fetch full song with chords for editing/Biesiada organizer view.
- **Query Parameters:** `includeUsage` (`true` adds repertoires using the song)
- **Response JSON:** song resource plus optional `repertoires` array.
- **Success:** `200 OK`
- **Errors:** `401 Unauthorized`, `403 Forbidden` (not owner), `404 Not Found`.

#### PATCH /songs/{id}
- **Method:** PATCH
- **Path:** `/songs/{id}`
- **Description:** Partially update song title/content.
- **Request JSON:**
```json
{
  "title": "Heaven's Door",
  "content": "[D]Mama..."
}
```
- **Response JSON:** updated song resource.
- **Success:** `200 OK`
- **Errors:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict` (duplicate title).

#### DELETE /songs/{id}
- **Method:** DELETE
- **Path:** `/songs/{id}`
- **Description:** Permanently remove a song and cascade from repertoires.
- **Request JSON:** _none_
- **Response JSON:**
```json
{
  "id": "58b8a0d0-5bf4-4d8a-82de-a2ad8c37b8a5",
  "deleted": true
}
```
- **Success:** `200 OK`
- **Errors:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

#### POST /songs/{id}/publish
- **Method:** POST
- **Path:** `/songs/{id}/publish`
- **Description:** Mark song as published (sets `published_at = now()`).
- **Request JSON:** _none_
- **Response JSON:** song resource with `publishedAt` populated.
- **Success:** `200 OK`
- **Errors:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

#### POST /songs/{id}/unpublish
- **Method:** POST
- **Path:** `/songs/{id}/unpublish`
- **Description:** Revoke publication (`published_at = null`).
- **Success/Error codes:** same as publish.

#### GET /share/songs/{id}
- **Method:** GET
- **Path:** `/share/songs/{id}`
- **Description:** Return sharing metadata for organizer use (link + QR payload).
- **Response JSON:**
```json
{
  "id": "58b8a0d0-5bf4-4d8a-82de-a2ad8c37b8a5",
  "publicId": "6e42f88a-2d46-4c27-8371-98dd621b6af2",
  "publicUrl": "https://app.strummerbox.com/public/songs/6e42f88a-2d46-4c27-8371-98dd621b6af2",
  "qrPayload": "https://app.strummerbox.com/public/songs/6e42f88a-2d46-4c27-8371-98dd621b6af2"
}
```
- **Success:** `200 OK`
- **Errors:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

### 2.3 Repertoires (Authenticated Organizer)

#### POST /repertoires
- **Method:** POST
- **Path:** `/repertoires`
- **Description:** Create new repertoire with optional initial songs.
- **Request JSON:**
```json
{
  "name": "Ognisko 2025",
  "description": "Wieczorne granie",
  "songIds": ["58b8a0d0-5bf4-4d8a-82de-a2ad8c37b8a5", "a1320a1b-4e2b-44b0-a1f6-8e37b406df1d"]
}
```
- **Response JSON:** repertoire resource including ordered songs (positions auto-assigned).
- **Success:** `201 Created`
- **Errors:** `400 Bad Request`, `401 Unauthorized`, `409 Conflict` (duplicate name).

#### GET /repertoires
- **Method:** GET
- **Path:** `/repertoires`
- **Description:** List organizer repertoires.
- **Query Parameters:**
  - `page`, `pageSize`
  - `search` (trigram against `name`)
  - `published` (`true|false|null`)
  - `sort` (`name|createdAt|updatedAt|publishedAt`, prefix `-` for desc)
  - `includeCounts` (`true` adds `songCount`)
- **Response JSON:** paginated list similar to `GET /songs` with optional counts.
- **Success:** `200 OK`
- **Errors:** `401 Unauthorized`.

#### GET /repertoires/{id}
- **Method:** GET
- **Path:** `/repertoires/{id}`
- **Description:** Fetch repertoire with ordered songs (with chords) for editing/organizer Biesiada.
- **Query Parameters:** `includeSongContent` (`true` returns full song `content`, default `false` for management view).
- **Response JSON:**
```json
{
  "id": "5f7a8f35-1cde-4f62-991e-0e020df3ac42",
  "publicId": "8729a118-3b9b-4ce4-b268-36c9d6a6a46c",
  "name": "Ognisko 2025",
  "description": "Wieczorne granie",
  "publishedAt": null,
  "createdAt": "2025-10-15T08:30:11Z",
  "updatedAt": "2025-10-15T08:45:27Z",
  "songs": [
    {
      "repertoireSongId": "24a1a901-5ff8-4f79-a8bd-9d9b1b2c9919",
      "songId": "58b8a0d0-5bf4-4d8a-82de-a2ad8c37b8a5",
      "title": "Knockin' on Heaven's Door",
      "position": 1,
      "content": null
    }
  ]
}
```
- **Success:** `200 OK`
- **Errors:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

#### PATCH /repertoires/{id}
- **Method:** PATCH
- **Path:** `/repertoires/{id}`
- **Description:** Update repertoire metadata (name, description).
- **Request JSON:**
```json
{
  "name": "Ognisko 2025 (aktualizacja)",
  "description": "Nowa lista utworów"
}
```
- **Response JSON:** updated repertoire resource.
- **Success:** `200 OK`
- **Errors:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict` (duplicate name).

#### DELETE /repertoires/{id}
- **Method:** DELETE
- **Path:** `/repertoires/{id}`
- **Description:** Permanently remove a repertoire. Associated entries in `repertoire_songs` are removed via database cascade, but the songs themselves are unaffected.
- **Request JSON:** _none_
- **Response JSON:**
```json
{
  "id": "5f7a8f35-1cde-4f62-991e-0e020df3ac42",
  "deleted": true
}
```
- **Success:** `200 OK`
- **Errors:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

#### POST /repertoires/{id}/songs
- **Method:** POST
- **Path:** `/repertoires/{id}/songs`
- **Description:** Append songs to repertoire; new entries are appended to the end.
- **Request JSON:**
```json
{
  "songIds": ["a1320a1b-4e2b-44b0-a1f6-8e37b406df1d", "b300b6eb-9acf-4f42-8d53-9377637a77b6"]
}
```
- **Response JSON:**
```json
{
  "added": [
    {
      "repertoireSongId": "f13c2cb8-4923-4c12-b9d9-fbf5eec4ed60",
      "songId": "a1320a1b-4e2b-44b0-a1f6-8e37b406df1d",
      "position": 3
    }
  ],
  "repertoireId": "5f7a8f35-1cde-4f62-991e-0e020df3ac42"
}
```
- **Success:** `201 Created`
- **Errors:** `400 Bad Request` (invalid song IDs), `401 Unauthorized`, `403 Forbidden`, `404 Not Found` (repertoire or song not owned by organizer).

#### POST /repertoires/{id}/songs/reorder
- **Method:** POST
- **Path:** `/repertoires/{id}/songs/reorder`
- **Description:** Replace the order of songs using an ordered array of `repertoireSongId` values.
- **Request JSON:**
```json
{
  "order": [
    "24a1a901-5ff8-4f79-a8bd-9d9b1b2c9919",
    "f13c2cb8-4923-4c12-b9d9-fbf5eec4ed60"
  ]
}
```
- **Response JSON:**
```json
{
  "repertoireId": "5f7a8f35-1cde-4f62-991e-0e020df3ac42",
  "songs": [
    {
      "repertoireSongId": "24a1a901-5ff8-4f79-a8bd-9d9b1b2c9919",
      "position": 1
    },
    {
      "repertoireSongId": "f13c2cb8-4923-4c12-b9d9-fbf5eec4ed60",
      "position": 2
    }
  ]
}
```
- **Success:** `200 OK`
- **Errors:** `400 Bad Request` (order missing entries or duplicates), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

#### DELETE /repertoires/{id}/songs/{repertoireSongId}
- **Method:** DELETE
- **Path:** `/repertoires/{id}/songs/{repertoireSongId}`
- **Description:** Remove a song from the repertoire; positions are compacted automatically.
- **Response JSON:**
```json
{
  "repertoireId": "5f7a8f35-1cde-4f62-991e-0e020df3ac42",
  "removed": "f13c2cb8-4923-4c12-b9d9-fbf5eec4ed60",
  "positionsRebuilt": true
}
```
- **Success:** `200 OK`
- **Errors:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

#### POST /repertoires/{id}/publish
- **Method:** POST
- **Path:** `/repertoires/{id}/publish`
- **Description:** Publish the repertoire (`published_at = now()`), making it accessible via public link.
- **Success/Error codes:** same pattern as `POST /songs/{id}/publish`.

#### POST /repertoires/{id}/unpublish
- **Method:** POST
- **Path:** `/repertoires/{id}/unpublish`
- **Description:** Unpublish the repertoire.
- **Success/Error codes:** same pattern as `POST /songs/{id}/unpublish`.

#### GET /share/repertoires/{id}
- **Method:** GET
- **Path:** `/share/repertoires/{id}`
- **Description:** Return share metadata (public URL, QR payload) for an organizer to distribute.
- **Response JSON:**
```json
{
  "id": "5f7a8f35-1cde-4f62-991e-0e020df3ac42",
  "publicId": "8729a118-3b9b-4ce4-b268-36c9d6a6a46c",
  "publicUrl": "https://app.strummerbox.com/public/repertoires/8729a118-3b9b-4ce4-b268-36c9d6a6a46c",
  "qrPayload": "https://app.strummerbox.com/public/repertoires/8729a118-3b9b-4ce4-b268-36c9d6a6a46c"
}
```
- **Success:** `200 OK`
- **Errors:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

### 2.5 Public Content (Anonymous access)

#### GET /public/songs/{publicId}
- **Method:** GET
- **Path:** `/public/songs/{publicId}`
- **Description:** Return published song text with chords for anonymous viewers. **Note:** The `content` field will now always return the full ChordPro content. The client is responsible for rendering it with or without chords.
- **Response JSON:**
```json
{
  "title": "Knockin' on Heaven's Door",
  "content": "[G]Mama, take this badge [D]off of me...",
  "repertoireNavigation": null
}
```
- **Success:** `200 OK`
- **Errors:** `404 Not Found` (song not published or does not exist), `410 Gone` (song deleted after link issued).

#### GET /public/repertoires/{publicId}
- **Method:** GET
- **Path:** `/public/repertoires/{publicId}`
- **Description:** Return published repertoire metadata and ordered list of songs (titles only) for anonymous viewers.
- **Response JSON:**
```json
{
  "name": "Ognisko 2025",
  "description": "Wieczorne granie",
  "songs": [
    {
      "title": "Knockin' on Heaven's Door",
      "publicSongUrl": "https://app.strummerbox.com/public/repertoires/8729a118-3b9b-4ce4-b268-36c9d6a6a46c/songs/6e42f88a-2d46-4c27-8371-98dd621b6af2"
    }
  ]
}
```
- **Success:** `200 OK`
- **Errors:** `404 Not Found`, `410 Gone`.

#### GET /public/repertoires/{publicId}/songs/{songPublicId}
- **Method:** GET
- **Path:** `/public/repertoires/{publicId}/songs/{songPublicId}`
- **Description:** Return a repertoire song view for anonymous users with navigation hints, including titles of adjacent songs. **Note:** The `content` field will now always return the full ChordPro content. The client is responsible for rendering it with or without chords.
- **Response JSON:**
```json
{
  "title": "Knockin' on Heaven's Door",
  "content": "[G]Mama, take this badge [D]off of me...",
  "order": {
    "position": 2,
    "total": 12,
    "previous": {
      "url": "https://app.strummerbox.com/public/repertoires/8729a118-.../songs/prev-id",
      "title": "Hej Sokoły"
    },
    "next": {
      "url": "https://app.strummerbox.com/public/repertoires/8729a118-.../songs/next-id",
      "title": "Wonderwall"
    }
  }
}
```
- **Success:** `200 OK`
- **Errors:** `404 Not Found`, `410 Gone`.

### 2.6 Biesiada Mode Helpers (Organizer, authenticated)

#### GET /me/biesiada/repertoires
- **Method:** GET
- **Path:** `/me/biesiada/repertoires`
- **Description:** Lightweight listing of organizer repertoires optimized for mobile Biesiada mode.
- **Query Parameters:** `includePublished` (`true|false`, default `false` to show all owned repertoires).
- **Response JSON:**
```json
{
  "items": [
    {
      "id": "5f7a8f35-1cde-4f62-991e-0e020df3ac42",
      "name": "Ognisko 2025",
      "songCount": 12,
      "publishedAt": "2025-10-15T08:35:44Z"
    }
  ]
}
```
- **Success:** `200 OK`
- **Errors:** `401 Unauthorized`.

#### GET /me/biesiada/repertoires/{id}/songs
- **Method:** GET
- **Path:** `/me/biesiada/repertoires/{id}/songs`
- **Description:** Return an ordered list of song summaries (ID, title) for a repertoire, designed for the Biesiada mode song selection screen. It also includes sharing metadata for the entire repertoire.
- **Response JSON:**
```json
{
  "repertoireId": "5f7a8f35-1cde-4f62-991e-0e020df3ac42",
  "repertoireName": "Ognisko 2025",
  "share": {
    "publicUrl": "https://app.strummerbox.com/public/repertoires/8729a118-3b9b-4ce4-b268-36c9d6a6a46c",
    "qrPayload": "https://app.strummerbox.com/public/repertoires/8729a118-3b9b-4ce4-b268-36c9d6a6a46c"
  },
  "songs": [
    {
      "songId": "58b8a0d0-5bf4-4d8a-82de-a2ad8c37b8a5",
      "title": "Knockin' on Heaven's Door",
      "position": 1
    },
    {
      "songId": "a1320a1b-4e2b-44b0-a1f6-8e37b406df1d",
      "title": "Hej Sokoły",
      "position": 2
    }
  ]
}
```
- **Success:** `200 OK`
- **Errors:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

#### GET /me/biesiada/repertoires/{id}/songs/{songId}
- **Method:** GET
- **Path:** `/me/biesiada/repertoires/{id}/songs/{songId}`
- **Description:** Return specific song with chords and navigation metadata for organizer-led session.
- **Response JSON:**
```json
{
  "repertoireId": "5f7a8f35-1cde-4f62-991e-0e020df3ac42",
  "repertoireName": "Ognisko 2025",
  "songId": "58b8a0d0-5bf4-4d8a-82de-a2ad8c37b8a5",
  "title": "Knockin' on Heaven's Door",
  "content": "[G]Mama...",
  "order": {
    "position": 2,
    "total": 12,
    "previous": {
      "songId": "prev-song-id",
      "title": "Hej Sokoły"
    },
    "next": {
      "songId": "next-song-id",
      "title": "Wonderwall"
    }
  },
  "share": {
    "publicUrl": "https://app.strummerbox.com/public/repertoires/8729a118-3b9b-4ce4-b268-36c9d6a6a46c",
    "qrPayload": "https://app.strummerbox.com/public/repertoires/8729a118-3b9b-4ce4-b268-36c9d6a6a46c"
  }
}
```
- **Success:** `200 OK`
- **Errors:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

### 2.7 Utilities

#### GET /metadata/public-links
- **Method:** GET
- **Path:** `/metadata/public-links`
- **Description:** Return base URLs used to compose share links and optional CDN hints (used by frontend to build QR codes offline).
- **Response JSON:**
```json
{
  "songBaseUrl": "https://app.strummerbox.com/public/songs/",
  "repertoireBaseUrl": "https://app.strummerbox.com/public/repertoires/",
  "qrCdn": "https://cdn.strummerbox.com/qr/"
}
```
- **Success:** `200 OK`
- **Errors:** none (public endpoint).

## 3. Authentication and Authorization

- Supabase Auth JWT (access_token) sent via `Authorization: Bearer <token>` on protected endpoints.
- Organizer-only endpoints (`/me/**`, `/songs/**`, `/repertoires/**`, `/share/**`) enforce Supabase Row Level Security policies mirroring ownership checks from schema (`organizer_id = auth.uid()`).
- Anonymous endpoints (`/public/**`, `/metadata/public-links`) allow access without authentication but rely on `published_at` to guard visibility.
- Optional short-lived signed links (15 minutes) can be issued for public QR usage by adding `?signature=...`; verify on server using Supabase Edge function.
- Rate limiting via API gateway (e.g., Supabase Edge Functions + PostgREST) at 60 req/min per IP for authenticated routes, 120 req/min for anonymous routes.

## 4. Validation and Business Logic

### 4.1 Profiles
- `displayName` required, trimmed length 1–120 characters (reflects `CHECK (char_length(display_name) BETWEEN 1 AND 120)` from schema).
- Ensure profile row auto-updates `updated_at` via trigger.

### 4.2 Songs
- `title` trimmed length 1–180 characters, unique per organizer (enforce before insert/update).
- `content` must be non-empty; backend validates bracket balance if frontend fails (ChordPro integrity per PRD).
- Publish/unpublish endpoints toggle `published_at`; publishing requires `content` and `title` pass validations.
- Before delete, compute `repertoireCount`; warn user via `409 Conflict` if `force` flag not provided while song belongs to any repertoire.
- On list endpoints, leverage trigram indexes for `search` and indexes for `organizer_id` to keep queries performant.

### 4.3 Repertoires
- `name` trimmed length 1–160 characters, unique per organizer.
- `description` optional, trimmed to max 500 characters (application-level constraint).
- When adding songs ensure referenced songs belong to organizer; reject duplicates (`UNIQUE (repertoire_id, song_id)`).
- Reorder endpoint recalculates `position` sequentially starting at 1 to satisfy `CHECK (position > 0)` and `UNIQUE (repertoire_id, position)`.
- Publish/unpublish toggles `published_at`; publishing requires repertoire has at least one song.

### 4.4 Public Access
- `GET /public/**` returns `404` if `published_at` null, `410` if resource soft-deleted; sanitized `content` with chords stripped for songs.
- Navigation metadata computed using ordered `
