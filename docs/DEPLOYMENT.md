# Deployment Guide

This guide covers deploying the GitHub Contracts application to various platforms.

## Prerequisites

- Node.js 18+
- npm or yarn
- Git repository

## Environment Variables

Create a `.env` file with the following variables:

```env
# Supabase Configuration (Optional)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Application Configuration
VITE_APP_NAME=GitHub Contracts
VITE_APP_VERSION=2.0.0
```

## Build Process

1. Install dependencies:
```bash
npm install
```

2. Build for production:
```bash
npm run build
```

3. Preview the build locally:
```bash
npm run preview
```

## Deployment Options

### Netlify

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts
4. Add environment variables in Vercel dashboard

### Traditional Web Server

1. Build the application: `npm run build`
2. Upload the `dist` folder to your web server
3. Configure your web server to serve the `index.html` file for all routes

### Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

Build and run:

```bash
docker build -t github-contracts .
docker run -p 80:80 github-contracts
```

## Database Setup (Optional)

If using Supabase for data persistence:

1. Create a Supabase project
2. Run the SQL migrations in `/supabase/migrations`
3. Configure Row Level Security (RLS)
4. Add environment variables

## Performance Optimization

### Build Optimization

- Enable gzip compression on your server
- Set proper cache headers for static assets
- Use a CDN for global distribution

### Application Optimization

- Lazy load components where appropriate
- Optimize images and assets
- Monitor bundle size with `npm run build -- --analyze`

## Monitoring

### Error Tracking

Consider integrating error tracking services:
- Sentry
- LogRocket
- Bugsnag

### Analytics

Add analytics to track usage:
- Google Analytics
- Mixpanel
- Amplitude

## Security Considerations

- Always use HTTPS in production
- Set proper CORS headers
- Validate all user inputs
- Keep dependencies updated
- Use environment variables for sensitive data

## Backup Strategy

If using Supabase:
- Enable automatic backups
- Export data regularly
- Test restore procedures

## Scaling

For high-traffic deployments:
- Use a CDN (CloudFlare, AWS CloudFront)
- Implement caching strategies
- Consider server-side rendering (SSR)
- Monitor performance metrics

## Troubleshooting

### Common Issues

1. **Build fails**: Check Node.js version and dependencies
2. **Routing issues**: Ensure server is configured for SPA routing
3. **Environment variables**: Verify all required variables are set
4. **Database connection**: Check Supabase configuration

### Debug Mode

Enable debug mode by setting:
```env
VITE_DEBUG=true
```

This will show additional logging in the browser console.

## Support

For deployment issues:
1. Check the troubleshooting section
2. Review server logs
3. Create an issue in the GitHub repository
4. Contact the development team