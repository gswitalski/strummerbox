# StrummerBox API Contracts

This package contains TypeScript type definitions for all API Data Transfer Objects (DTOs) and Command Models used in the StrummerBox application.

## Purpose

The contracts package serves as a single source of truth for the structure of data exchanged between:
- Frontend (Angular application)
- Backend API (Supabase + Edge Functions)
- Public endpoints (anonymous access)

## Type Organization

All types are organized by API resource and follow this structure:

### Command Models
Commands represent input data for API operations (POST, PUT, PATCH requests):
- `*CreateCommand` - Data required to create a new resource
- `*UpdateCommand` / `*PatchCommand` - Data for updating an existing resource
- `*ReorderCommand`, `*AddSongsCommand` - Specialized commands for specific operations

### DTOs (Data Transfer Objects)
DTOs represent output data returned by API endpoints:
- `*Dto` - Complete resource with all fields
- `*SummaryDto` - Lightweight version for list views
- `*DetailDto` - Extended version with additional computed fields
- `*ResponseDto` - Wrapper for operation results
- `*ListResponseDto` - Paginated list responses

## Key Resources

### Profile
- `OrganizerProfileDto` - User profile information
- `OrganizerProfileUpsertCommand` - Update display name

### Songs
- `SongDto` - Complete song with chords
- `SongSummaryDto` - Song metadata without content
- `SongCreateCommand`, `SongPatchCommand` - Song mutations
- `SongShareMetaDto` - Sharing URLs and QR codes

### Repertoires
- `RepertoireDto` - Complete repertoire with songs
- `RepertoireSummaryDto` - Repertoire metadata
- `RepertoireCreateCommand`, `RepertoireUpdateCommand` - Repertoire mutations
- `RepertoireAddSongsCommand`, `RepertoireReorderCommand` - Song management

### Public Content
- `PublicSongDto` - Chord-stripped song for anonymous viewers
- `PublicRepertoireDto` - Public repertoire with navigation
- `PublicRepertoireSongDto` - Song in repertoire context

### Biesiada Mode
- `BiesiadaRepertoireSummaryDto` - Mobile-optimized repertoire list
- `BiesiadaRepertoireSongDetailDto` - Song with navigation and sharing

## Type Safety

All types are derived from Supabase-generated database types (`packages/database/database.types.ts`), ensuring:
- ✅ Type safety between database and API layer
- ✅ Automatic updates when database schema changes
- ✅ Prevention of type mismatches
- ✅ IDE autocomplete and type checking

## Usage

### In Angular Components/Services

```typescript
import { SongDto, SongCreateCommand } from '@contracts';

class SongService {
  async createSong(command: SongCreateCommand): Promise<SongDto> {
    // API call
  }
}
```

### In Supabase Edge Functions

```typescript
import { RepertoireDto } from '../../../packages/contracts';

export async function handler(req: Request): Promise<RepertoireDto> {
  // Function logic
}
```

## Maintenance

When API endpoints change:
1. Update the API plan documentation (`docs/results/api-plan.md`)
2. Regenerate/update database types if schema changed (`supabase gen types typescript`)
3. Update DTOs and Commands in `types.ts` to match API plan
4. Ensure all types reference database types where possible

## Related Documentation

- [API Plan](../../docs/results/009%20API%20Plan.md) - Complete API endpoint documentation
- [Database Plan](../../docs/results/008%20DB%20Plan.md) - Database schema overview
- [Database Types](../database/database.types.ts) - Generated Supabase types

