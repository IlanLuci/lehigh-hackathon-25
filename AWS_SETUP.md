# AWS Integration Setup Guide

This guide explains how to set up AWS services for the Boned application.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured (optional but recommended)

## 1. AWS RDS PostgreSQL Database Setup

### Create RDS Instance

1. **Go to AWS RDS Console**
   - Navigate to: https://console.aws.amazon.com/rds/

2. **Create Database**
   - Click "Create database"
   - Choose "PostgreSQL" as the engine
   - Select appropriate version (14.x or later recommended)
   - Choose template: "Free tier" for development, "Production" for deployment

3. **Configure Settings**
   - DB instance identifier: `boned-db`
   - Master username: `postgres` (or your preference)
   - Master password: Choose a strong password
   - DB instance class: `db.t3.micro` (free tier) or larger
   - Storage: 20 GB minimum
   - Enable storage autoscaling if needed

4. **Connectivity**
   - **IMPORTANT**: Set "Public access" to "Yes" (for development)
   - Create a new VPC security group or use existing
   - Make note of the VPC security group ID (boned-vpc)

5. **Additional Configuration**
   - Initial database name: `boned`
   - Enable automated backups (recommended)
   - Set backup retention period

6. **Create Database**
   - Click "Create database"
   - Wait 5-10 minutes for the instance to become available

7. **Configure Security Group**
   - Go to EC2 > Security Groups
   - Find the security group for your RDS instance
   - Edit inbound rules
   - Add rule: Type: PostgreSQL, Protocol: TCP, Port: 5432, Source: Your IP or 0.0.0.0/0 (for development only!)
   - **PRODUCTION WARNING**: Never use 0.0.0.0/0 in production. Use specific IP ranges or security groups.

8. **Get Connection Details**
   - Go back to RDS > Databases
   - Click on your database instance
   - Copy the "Endpoint" (will look like: `boned-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com`)
   - Update `.env` file with:
     ```
     DB_HOST=your-endpoint-here.rds.amazonaws.com
     DB_PORT=5432
     DB_NAME=boned
     DB_USER=postgres
     DB_PASSWORD=your-password-here
     ```

## 2. AWS S3 Bucket Setup

### Create S3 Bucket

1. **Go to AWS S3 Console**
   - Navigate to: https://s3.console.aws.amazon.com/s3/

2. **Create Bucket**
   - Click "Create bucket"
   - Bucket name: `boned-images` (must be globally unique, so add suffix if needed)
   - AWS Region: Choose same region as your RDS database (e.g., `us-east-1`)
   - **IMPORTANT**: Uncheck "Block all public access"
   - Acknowledge the warning about public access
   - Leave versioning disabled (optional to enable)
   - Click "Create bucket"

3. **Configure Bucket Policy for Public Read**
   - Click on your newly created bucket
   - Go to "Permissions" tab
   - Scroll to "Bucket policy"
   - Click "Edit" and paste:
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         {
           "Sid": "PublicReadGetObject",
           "Effect": "Allow",
           "Principal": "*",
           "Action": "s3:GetObject",
           "Resource": "arn:aws:s3:::boned-images/*"
         }
       ]
     }
     ```
   - Replace `boned-images` with your actual bucket name if different
   - Click "Save changes"

4. **Configure CORS (for web uploads)**
   - Still in "Permissions" tab
   - Scroll to "Cross-origin resource sharing (CORS)"
   - Click "Edit" and paste:
     ```json
     [
       {
         "AllowedHeaders": ["*"],
         "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
         "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
         "ExposeHeaders": ["ETag"]
       }
     ]
     ```
   - Update `AllowedOrigins` with your actual domain when deploying
   - Click "Save changes"

## 3. AWS IAM User and Credentials

### Create IAM User with Programmatic Access

1. **Go to AWS IAM Console**
   - Navigate to: https://console.aws.amazon.com/iam/

2. **Create User**
   - Click "Users" in sidebar
   - Click "Add users"
   - User name: `boned-app`
   - Access type: Check "Programmatic access"
   - Click "Next: Permissions"

3. **Attach Permissions**
   - Choose "Attach existing policies directly"
   - Search and select:
     - `AmazonS3FullAccess` (for S3 operations)
   - Click "Next: Tags" (optional)
   - Click "Next: Review"
   - Click "Create user"

4. **Save Credentials**
   - **IMPORTANT**: Copy the "Access key ID" and "Secret access key"
   - You won't be able to see the secret key again!
   - Update `.env` file with:
     ```
     AWS_ACCESS_KEY_ID=your-access-key-id-here
     AWS_SECRET_ACCESS_KEY=your-secret-access-key-here
     AWS_REGION=us-east-1
     AWS_S3_BUCKET_NAME=boned-images
     ```

## 4. Test Database Connection

You can test the database connection using `psql` command-line tool:

```bash
psql -h your-endpoint.rds.amazonaws.com -U postgres -d boned -p 5432
```

Enter your password when prompted. If successful, you should see the PostgreSQL prompt.

## 5. Install Backend Dependencies

Make sure all required packages are installed:

```bash
cd backend
npm install
```

This will install:
- `@aws-sdk/client-s3` - AWS SDK for JavaScript v3 S3 client
- `@aws-sdk/s3-request-presigner` - For presigned URL use-cases (optional)
- `pg` - PostgreSQL client
- `multer` - File upload handling
- `uuid` - Generate unique filenames

## 6. Initialize Database Schema

The database schema will be automatically initialized when you start the server for the first time:

```bash
cd backend
npm start
```

The server will:
1. Connect to the PostgreSQL database
2. Create tables (`menu_items` and `reviews`) if they don't exist
3. Create necessary indices
4. Fetch the current Rathbone menu and populate the database

## 7. Verify Setup

### Check Database Tables

Connect to your database and verify tables were created:

```sql
-- List all tables
\dt

-- Check menu_items structure
\d menu_items

-- Check reviews structure
\d reviews

-- Check if menu loaded
SELECT COUNT(*) FROM menu_items;
```

### Check S3 Bucket

After submitting a review with photos:
1. Go to S3 Console
2. Click on your bucket
3. Navigate to the `reviews/` folder
4. You should see uploaded images with UUID filenames

## 8. Cost Optimization

### RDS
- Use `db.t3.micro` or `db.t4g.micro` for development (free tier eligible)
- Stop the database when not in use (can save ~$10/month)
- Enable autoscaling storage to avoid over-provisioning

### S3
- First 5 GB of storage is free
- First 20,000 GET requests free per month
- First 2,000 PUT requests free per month
- Images are typically small, so costs should be minimal

### Cost Monitoring
- Set up billing alerts in AWS Console
- Navigate to: Billing > Billing preferences
- Enable "Receive Billing Alerts"
- Set up CloudWatch alarm for your budget threshold

## 9. Production Considerations

Before deploying to production:

1. **Security**
   - Use environment variables for all credentials
   - Never commit `.env` file to Git
   - Restrict RDS security group to only your application's IP/VPC
   - Enable SSL for database connections
   - Consider using AWS Secrets Manager for credentials

2. **Database**
   - Enable automated backups with appropriate retention
   - Enable Multi-AZ for high availability
   - Use connection pooling (already configured in code)
   - Monitor slow queries and add indices as needed

3. **S3**
   - Consider enabling versioning for backup
   - Set up lifecycle policies to archive old images
   - Enable CloudFront CDN for better performance
   - Update CORS policy with production domain

4. **Application**
   - Use process manager like PM2 for Node.js
   - Set up proper logging
   - Configure CORS to allow only your frontend domain
   - Implement rate limiting for API endpoints

## Troubleshooting

### Cannot connect to RDS
- Check security group allows inbound traffic on port 5432
- Verify endpoint is correct in `.env`
- Ensure database is in "Available" state
- Check that public accessibility is enabled (for development)

### S3 upload fails
- Verify IAM user has S3 permissions
- Check AWS credentials in `.env`
- Ensure bucket name is correct
- Verify bucket policy allows public read

### Images not displaying
- Check bucket policy allows public access
- Verify CORS configuration
- Check browser console for errors
- Ensure image URLs are being saved correctly in database

### Database schema not created
- Check database credentials in `.env`
- Verify PostgreSQL client (`pg`) is installed
- Check server logs for error messages
- Ensure database name exists on RDS instance

## Support Resources

- AWS RDS Documentation: https://docs.aws.amazon.com/rds/
- AWS S3 Documentation: https://docs.aws.amazon.com/s3/
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Node.js AWS SDK: https://docs.aws.amazon.com/sdk-for-javascript/
