# Environment Variables Configuration

This document describes all environment variables required for StrummerBox application development and deployment.

## Quick Start

Create a `.env` file in the root of the project:

```bash
# Copy and customize these values
APP_PUBLIC_URL=http://localhost:4200
```

## Variables Reference

### APP_PUBLIC_URL

**Required:** Yes  
**Used by:** Supabase Edge Functions  
**Purpose:** Base URL of the application used for generating public shareable links and QR code payloads

**Examples:**

| Environment | Value |
|-------------|-------|
| Local Development | `http://localhost:4200` |
| Staging | `https://staging.strummerbox.com` |
| Production | `https://app.strummerbox.com` |

**Configuration per environment:**

#### Local Development

Create `.env` file in project root:

```env
APP_PUBLIC_URL=http://localhost:4200
```

Then start Edge Functions with:

```bash
supabase functions serve share --env-file .env
```

#### Supabase Cloud (Staging/Production)

Set secrets using Supabase CLI:

```bash
# For staging
supabase secrets set APP_PUBLIC_URL=https://staging.strummerbox.com --project-ref your-staging-ref

# For production
supabase secrets set APP_PUBLIC_URL=https://app.strummerbox.com --project-ref your-production-ref
```

Or via Supabase Dashboard:
1. Go to Project Settings → Edge Functions → Secrets
2. Add new secret: `APP_PUBLIC_URL`
3. Set the appropriate value

## Validation

### Check if variables are set correctly

**Local:**
```bash
# The function will log an error if APP_PUBLIC_URL is missing
supabase functions serve share --env-file .env
```

**Cloud:**
```bash
# List all secrets
supabase secrets list --project-ref your-project-ref
```

### Test endpoints that use these variables

```bash
# Test share endpoint (requires APP_PUBLIC_URL)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:54321/functions/v1/share/songs/SONG_UUID
```

Expected response should include URLs starting with your configured `APP_PUBLIC_URL`:

```json
{
  "data": {
    "publicUrl": "http://localhost:4200/public/songs/...",
    "qrPayload": "http://localhost:4200/public/songs/..."
  }
}
```

## Troubleshooting

### Error: "Brak konfiguracji adresu publicznego aplikacji"

**Problem:** `APP_PUBLIC_URL` is not set or not loaded correctly

**Solutions:**

1. **Local Development:**
   - Verify `.env` file exists in project root
   - Check if you're using `--env-file .env` flag when serving functions
   - Restart the Supabase functions server

2. **Cloud Deployment:**
   - Verify secret is set: `supabase secrets list`
   - Re-deploy the function: `supabase functions deploy share`
   - Check project ref is correct

### Links generated with wrong domain

**Problem:** URLs point to wrong domain (e.g., localhost in production)

**Solution:**
- Verify the environment-specific `APP_PUBLIC_URL` is set correctly
- In cloud, make sure you're setting secrets for the correct project ref

## Security Notes

- ✅ This variable is **safe to expose** in client-side code (it's a public URL)
- ✅ No sensitive data should be stored in `APP_PUBLIC_URL`
- ⚠️ Make sure the URL uses HTTPS in production environments
- ⚠️ Do not commit the `.env` file to version control (it's in `.gitignore`)

## Future Variables

As the project grows, additional environment variables may be needed:

- `QR_CDN_URL` - Custom QR code generation service URL
- `ANALYTICS_KEY` - Analytics service API key
- `RATE_LIMIT_MAX` - Maximum requests per minute
- `CACHE_TTL` - Public content cache duration

These will be documented here as they are implemented.

