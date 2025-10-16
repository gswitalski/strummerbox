# StrummerBox Database Types

This package contains TypeScript type definitions automatically generated from the Supabase PostgreSQL schema.

## Purpose

The `database.types.ts` file provides:
- Type-safe access to database tables
- Auto-generated types for Row, Insert, Update operations
- Type definitions for database functions and views
- Enum types from the database schema

## Generation

These types are automatically generated using the Supabase CLI:

```bash
# Generate types from local Supabase instance
supabase gen types typescript --local > packages/database/database.types.ts

# Generate types from remote Supabase project
supabase gen types typescript --project-id [project-id] > packages/database/database.types.ts
```

## Type Structure

### Database Type
The main `Database` type contains all schemas:
- `public` - Main application schema with tables, views, functions
- `graphql_public` - GraphQL-related schema

### Table Types
For each table, you get three operation types:

```typescript
// Read operations - matches database columns exactly
type ProfileRow = Tables<'profiles'>;

// Insert operations - some fields may be optional (e.g., auto-generated IDs)
type ProfileInsert = TablesInsert<'profiles'>;

// Update operations - all fields are optional
type ProfileUpdate = TablesUpdate<'profiles'>;
```

### Available Tables
- `profiles` - Organizer profiles linked to auth.users
- `songs` - Song library with ChordPro content
- `repertoires` - Collections of songs
- `repertoire_songs` - Junction table for song ordering

## Usage

### With Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './packages/database/database.types';

const supabase = createClient<Database>(url, key);

// Type-safe queries
const { data, error } = await supabase
  .from('songs')
  .select('*')
  .single();

// data is typed as Tables<'songs'>
```

### Creating DTOs

```typescript
import type { Tables, TablesInsert } from './packages/database/database.types';

type SongRow = Tables<'songs'>;

// Derive DTO from database type
export type SongDto = {
  id: SongRow['id'];
  title: SongRow['title'];
  content: SongRow['content'];
  // ... other fields
};
```

## Maintenance

### When to Regenerate

Regenerate types whenever:
- ✅ Database schema changes (new tables, columns, or types)
- ✅ After running new migrations
- ✅ Before deploying to production (to sync with remote schema)

### Workflow

1. Make database changes via migration:
   ```bash
   supabase migration new your_migration_name
   # Edit the migration file
   supabase db reset
   ```

2. Regenerate types:
   ```bash
   supabase gen types typescript --local > packages/database/database.types.ts
   ```

3. Update DTOs in `packages/contracts/types.ts` if needed

4. Test that all API contracts still work with updated types

## Related Documentation

- [Database Plan](../../docs/results/008%20DB%20Plan.md) - Database schema design
- [API Contracts](../contracts/README.md) - DTOs derived from these types
- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)

