# Breakin Clays API

A production-ready Node.js Express API for the Breakin Clays application.

## Prerequisites

- **Node.js**: Version 12.0.0 or higher
- **MongoDB**: Version 4.0 or higher
- **Yarn** (recommended) or **npm**

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Database**: MongoDB with Mongoose ODM
- **Validation**: Request data validation using Joi
- **Documentation**: Auto-generated API documentation with Swagger
- **Security**: Helmet, CORS, rate limiting, and XSS protection
- **Logging**: Winston logging with Morgan for HTTP requests
- **Email**: AWS SES integration for transactional emails
- **File Upload**: AWS S3 integration for file storage
- **PDF Generation**: Puppeteer for PDF report generation

## Quick Start

1. Install dependencies:

```bash
npm install
# or
yarn install
```

2. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Run in production:

```bash
npm start
# or
yarn start
```

## Environment Variables

Create a `.env` file with the following variables:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URL=mongodb://127.0.0.1:27017/breakin-clays

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=30

# Email Configuration (SMTP)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USERNAME=your-smtp-username
SMTP_PASSWORD=your-smtp-password
EMAIL_FROM=your-email@domain.com

# AWS Configuration
AWS_SES_ACCESS_KEY=your-aws-access-key
AWS_SES_SECRET_KEY=your-aws-secret-key
AWS_SES_EMAIL_FROM=your-ses-email@domain.com
AWS_S3_BUCKET=your-s3-bucket-name
AWS_S3_REGION=your-s3-region

# Firebase Configuration (if using Firebase)
FIREBASE_PROJECT_ID=your-firebase-project-id
```

## API Documentation

Once the server is running, visit `http://localhost:3000/v1/docs` to view the interactive API documentation.

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middlewares/    # Custom middleware
├── models/         # Database models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
├── validations/    # Request validation schemas
├── template/       # Email templates
└── app.js          # Express app setup
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server with PM2
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run prettier` - Check code formatting
- `npm run prettier:fix` - Fix code formatting

## Docker Support

Run with Docker:

```bash
# Development
npm run docker:dev

# Production
npm run docker:prod
```

## Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Configure all required environment variables
3. Use PM2 for process management: `npm start`
4. Set up reverse proxy (nginx) for SSL termination
5. Configure MongoDB with proper authentication
6. Set up monitoring and logging

## Support

For technical support or questions, please refer to the API documentation or contact the development team.
