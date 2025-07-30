# Vercel Deployment Guide

## Prerequisites

Before deploying to Vercel, ensure you have:

1. **PostgreSQL Database**: Set up a PostgreSQL database (recommended: Supabase, Neon, or Railway)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Vercel CLI**: Install with `npm i -g vercel`

## Environment Variables

Set these environment variables in your Vercel dashboard:

### Required Variables
- `NODE_ENV=production`
- `ENABLE_POSTGRES=true`
- `VERCEL=true`
- `JWT_SECRET=your-secure-jwt-secret-key`
- `DB_HOST=your-postgres-host`
- `DB_PORT=5432`
- `DB_NAME=your-database-name`
- `DB_USER=your-database-user`
- `DB_PASSWORD=your-database-password`
- `DB_SSL=true` (for most cloud PostgreSQL providers)

### Optional Variables
- `PORT=3000` (will be set automatically by Vercel)

## Deployment Steps

### 1. Database Setup
Choose one of these PostgreSQL providers:

#### Option A: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy the connection string from Settings > Database
4. Extract the variables for Vercel

#### Option B: Neon
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Extract the variables for Vercel

### 2. Deploy to Vercel

#### Method 1: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables interactively
vercel env add NODE_ENV production
vercel env add ENABLE_POSTGRES true
vercel env add DB_HOST your-host
# ... add all required variables
```

#### Method 2: Using Vercel Dashboard
1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your repository
5. Configure environment variables in the project settings
6. Deploy

### 3. Troubleshooting

#### Common Issues and Solutions

**500 Internal Server Error**
- Check all environment variables are set correctly
- Ensure PostgreSQL database is accessible
- Check Vercel function logs for detailed error messages

**Database Connection Issues**
- Verify PostgreSQL connection string is correct
- Ensure SSL is enabled for cloud databases
- Check if database allows connections from Vercel IPs

**Build Failures**
- Ensure client dependencies are installed: `cd client && npm install`
- Check for any build errors in client: `cd client && npm run build`

#### Checking Logs
```bash
# View real-time logs
vercel logs --follow

# View specific deployment logs
vercel logs [deployment-url]
```

### 4. Post-Deployment

After successful deployment:

1. **Test the API**: Visit `https://your-app.vercel.app/api`
2. **Create Admin User**: Use the registration endpoint to create your first admin user
3. **Verify Database**: Check that tables were created automatically
4. **Set Up Monitoring**: Consider adding error tracking (e.g., Sentry)

## Local Development vs Production

### Local Development
```bash
# Uses SQLite by default
npm run dev
```

### Production (Vercel)
```bash
# Uses PostgreSQL
# Environment variables must be set in Vercel dashboard
```

## Security Notes

- Never commit sensitive environment variables to Git
- Use strong JWT secrets (minimum 32 characters)
- Enable SSL for database connections
- Consider using Vercel's built-in environment variable encryption

## Support

If you encounter issues:
1. Check Vercel function logs
2. Verify all environment variables
3. Test database connectivity
4. Ensure client builds successfully locally first

For additional help, refer to the [Vercel Documentation](https://vercel.com/docs).