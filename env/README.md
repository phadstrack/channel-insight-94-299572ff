# Environment Configuration

This folder contains environment variable templates and examples.

## Files

- **`.env.arc3.example`** — Full template with all ARC3 configuration options
- **`.env.example`** — Quick start template with essential vars

## Setup

1. Copy `.env.example` to `.env` in the project root:
   ```bash
   cp env/.env.example ../.env
   ```

2. Fill in your Supabase credentials and API keys

3. For full ARC3 features, see `.env.arc3.example` for all available options

## Security

- `.env` is git-ignored (contains secrets)
- Never commit actual credentials
- Use `.env.example` / `.env.arc3.example` as templates only
