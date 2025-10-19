# Deployment Checklist

Use this checklist to ensure your Boned application is properly configured and ready to deploy.

## ✅ AWS Setup

### RDS PostgreSQL Database
- [ ] RDS instance created and running
- [ ] Database name is `boned`
- [ ] Security group allows inbound on port 5432
- [ ] Public accessibility enabled (for development)
- [ ] Endpoint copied to `.env` file
- [ ] Can connect via `psql` command
- [ ] SSL enabled for production
- [ ] Automated backups configured
- [ ] Multi-AZ enabled (production only)

### S3 Bucket
- [ ] Bucket created (e.g., `boned-images`)
- [ ] Bucket is in same region as RDS
- [ ] Public access unblocked
- [ ] Bucket policy allows public-read on objects
- [ ] CORS policy configured with allowed origins
- [ ] Bucket name added to `.env` file
- [ ] Test upload successful
- [ ] Test image accessible via URL

### IAM User
- [ ] IAM user created (e.g., `boned-app`)
- [ ] Programmatic access enabled
- [ ] `AmazonS3FullAccess` policy attached
- [ ] Access key ID copied to `.env`
- [ ] Secret access key copied to `.env`
- [ ] Keys never committed to Git

## ✅ Backend Configuration

### Environment Variables
- [ ] `.env` file created from `.env.example`
- [ ] `AWS_REGION` set correctly
- [ ] `AWS_ACCESS_KEY_ID` set
- [ ] `AWS_SECRET_ACCESS_KEY` set
- [ ] `AWS_S3_BUCKET_NAME` set
- [ ] `DB_HOST` set with RDS endpoint
- [ ] `DB_PORT` set to 5432
- [ ] `DB_NAME` set to `boned`
- [ ] `DB_USER` set (usually `postgres`)
- [ ] `DB_PASSWORD` set
- [ ] `PORT` set (default: 3001)
- [ ] `.env` file in `.gitignore`

### Dependencies
- [ ] `npm install` run successfully
- [ ] No vulnerability warnings (or addressed)
- [ ] All required packages installed:
  - [ ] `express`
  - [ ] `pg` (PostgreSQL client)
  - [ ] `aws-sdk`
  - [ ] `multer`
  - [ ] `uuid`
  - [ ] `puppeteer`
  - [ ] `axios`
  - [ ] `cheerio`
  - [ ] `dotenv`
  - [ ] `cors`
  - [ ] `body-parser`

### Server Startup
- [ ] Server starts without errors
- [ ] Database connection successful
- [ ] Tables created automatically
- [ ] Menu fetched from Sodexo
- [ ] Menu items populated in database
- [ ] Server listening on correct port
- [ ] API endpoints accessible

## ✅ Frontend Configuration

### Dependencies
- [ ] `npm install` run successfully
- [ ] No build errors
- [ ] All React packages installed
- [ ] Service worker registered

### API Connection
- [ ] `api.js` points to correct backend URL
- [ ] CORS working between frontend and backend
- [ ] Can fetch menu items
- [ ] Can create reviews
- [ ] Can upload photos
- [ ] Photos display correctly

### Build
- [ ] `npm run build` runs successfully
- [ ] Build folder created
- [ ] Static assets generated
- [ ] Service worker included in build

## ✅ Testing

### Database Tests
- [ ] Can connect to database via `psql`
- [ ] `menu_items` table exists
- [ ] `reviews` table exists
- [ ] Indices created properly
- [ ] Foreign key constraints working
- [ ] Sample menu items in database
- [ ] Can insert test review
- [ ] Can query reviews by menu_item_id

### API Tests
- [ ] `GET /api/menu` returns menu items
- [ ] `GET /api/menu/:id` returns single item
- [ ] `POST /api/menu/refresh` fetches new menu
- [ ] `POST /api/reviews` creates review without photos
- [ ] `POST /api/reviews` creates review with photos
- [ ] `GET /api/reviews/menu/:id` returns reviews
- [ ] `DELETE /api/reviews/:id` deletes review
- [ ] `PUT /api/reviews/:id/helpful` increments count

### S3 Tests
- [ ] Photos upload to S3 successfully
- [ ] Photos stored in `reviews/` prefix
- [ ] Photo URLs are publicly accessible
- [ ] Photos display in browser
- [ ] Deleted reviews clean up S3 images
- [ ] Multiple photos per review work

### UI Tests
- [ ] Homepage loads menu items
- [ ] Items grouped by station
- [ ] Entrees appear first in each station
- [ ] Stations sorted by best ratings
- [ ] Dessert (Bliss) appears at bottom
- [ ] Can click menu item to see details
- [ ] Can submit review with name
- [ ] Can submit review as Anonymous
- [ ] Can select star rating
- [ ] Can add comment
- [ ] Can upload 1-5 photos
- [ ] Photo preview works
- [ ] Can remove photos before submit
- [ ] Submit button disabled without rating
- [ ] Success message after submission
- [ ] New review appears in list
- [ ] Review photos display correctly
- [ ] Ratings update on menu cards
- [ ] "Helpful" button works
- [ ] Username persists in localStorage

## ✅ Security

### Credentials
- [ ] No credentials in source code
- [ ] `.env` file not committed to Git
- [ ] `.env` file in `.gitignore`
- [ ] Strong database password used
- [ ] AWS keys never exposed in frontend
- [ ] IAM user has minimal permissions

### Database
- [ ] SQL queries use parameterized statements
- [ ] No string concatenation in queries
- [ ] Connection pool configured
- [ ] SSL enabled for production
- [ ] Database backups enabled

### File Uploads
- [ ] File type validation (images only)
- [ ] File size limit enforced (5MB)
- [ ] Max files per request limited (5)
- [ ] UUID filenames prevent collisions
- [ ] No path traversal vulnerabilities

### S3
- [ ] Bucket policy restricts write access
- [ ] Public-read only, not public-write
- [ ] CORS policy limits origins
- [ ] IAM user cannot delete bucket

## ✅ Performance

### Database
- [ ] Connection pooling enabled
- [ ] Max connections set appropriately
- [ ] Indices on frequently queried columns
- [ ] Efficient JOIN queries
- [ ] No N+1 query problems

### S3
- [ ] Images served directly from S3
- [ ] No unnecessary backend proxy
- [ ] Public URLs used in frontend
- [ ] Consider CloudFront CDN for production

### Frontend
- [ ] Images lazy-loaded
- [ ] API calls optimized
- [ ] No unnecessary re-renders
- [ ] Build optimized for production

## ✅ Monitoring

### AWS
- [ ] CloudWatch logs enabled
- [ ] RDS performance insights enabled
- [ ] S3 access logging enabled (optional)
- [ ] Billing alerts configured
- [ ] Cost Explorer reviewed

### Application
- [ ] Server logs reviewed
- [ ] Error handling implemented
- [ ] Console errors checked
- [ ] Network requests monitored

## ✅ Documentation

### Code
- [ ] README.md updated with AWS info
- [ ] API endpoints documented
- [ ] Environment variables documented
- [ ] Setup instructions clear

### AWS
- [ ] AWS_SETUP.md reviewed
- [ ] AWS_INTEGRATION.md reviewed
- [ ] QUICKSTART.md reviewed
- [ ] All credentials documented privately

## ✅ Production Readiness

### Security (Production Only)
- [ ] RDS security group restricted to app IP/VPC
- [ ] Public accessibility disabled on RDS
- [ ] VPC configured for private subnet
- [ ] Environment variables in hosting platform
- [ ] SSL certificate for HTTPS
- [ ] CORS limited to production domain
- [ ] Rate limiting implemented

### Scaling
- [ ] Database instance size appropriate
- [ ] Connection pool size tuned
- [ ] S3 lifecycle policies configured
- [ ] CDN configured for images
- [ ] Load balancer configured (if needed)

### Maintenance
- [ ] Backup schedule verified
- [ ] Backup restoration tested
- [ ] Update plan documented
- [ ] Monitoring alerts configured
- [ ] On-call plan established

## 🚀 Deployment Steps

### 1. Pre-Deployment
- [ ] All above items checked
- [ ] Code committed to Git
- [ ] `.env` file prepared for production
- [ ] Database backed up

### 2. Deploy Backend
- [ ] Environment variables set on hosting platform
- [ ] Dependencies installed
- [ ] Database connection tested
- [ ] Server started successfully
- [ ] Health check endpoint working

### 3. Deploy Frontend
- [ ] Build created (`npm run build`)
- [ ] Static files uploaded
- [ ] API URL updated for production
- [ ] CORS working with production domain
- [ ] Service worker registered

### 4. Post-Deployment
- [ ] Test all features in production
- [ ] Monitor error logs
- [ ] Check database queries
- [ ] Verify S3 uploads work
- [ ] Test image display
- [ ] Monitor costs for first few days

### 5. Launch
- [ ] Announce to users
- [ ] Monitor for issues
- [ ] Be ready to rollback if needed
- [ ] Collect user feedback

## 📊 Success Metrics

After deployment, verify:
- [ ] Menu loads within 2 seconds
- [ ] Reviews submit successfully
- [ ] Photos upload and display
- [ ] No 500 errors in logs
- [ ] Database queries under 100ms
- [ ] S3 costs under budget
- [ ] User engagement positive

---

**Once all items are checked, you're ready to launch Boned! 🦴**
