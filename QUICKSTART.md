# Quick Start Guide - AWS Integration

## 🚀 Getting Started

### Prerequisites
- AWS Account
- PostgreSQL RDS instance running
- S3 bucket created with public-read policy
- IAM user with S3 permissions

### Setup Steps

1. **Configure AWS Credentials**
   
   Edit `backend/.env` with your AWS details:
   ```env
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_S3_BUCKET_NAME=boned-images
   
   DB_HOST=your-rds-endpoint.rds.amazonaws.com
   DB_PORT=5432
   DB_NAME=boned
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

2. **Install Dependencies** (Already done!)
   ```bash
   cd backend
   npm install
   ```

3. **Start Backend Server**
   ```bash
   cd backend
   npm start
   ```
   
   The server will automatically:
   - ✅ Connect to PostgreSQL database
   - ✅ Create tables (menu_items, reviews)
   - ✅ Fetch and populate Rathbone menu
   - ✅ Listen on port 3001

4. **Start Frontend**
   ```bash
   cd frontend
   npm start
   ```
   
   Opens at http://localhost:3000

## 📝 What Changed?

### Backend
- **Database**: In-memory arrays → PostgreSQL on AWS RDS
- **Images**: Base64 strings → S3 URLs
- **File Uploads**: JSON → FormData with multer middleware
- **Models**: Created `.db.js` versions that use PostgreSQL

### Frontend
- **Review Form**: Sends FormData instead of JSON with base64
- **Images**: Display S3 URLs instead of base64 (no code change needed!)

## 🎯 How to Use

### Submitting a Review with Photos
1. Click on any menu item
2. Rate it (1-5 stars)
3. Add comment (optional)
4. Enter your name (optional, defaults to "Anonymous")
5. Upload photos (max 5, up to 5MB each)
6. Click "Submit Review"

Photos are automatically:
- Uploaded to S3 bucket
- Given unique UUID filenames
- Made publicly accessible
- URL saved in database

### Viewing Reviews
- Reviews display with S3-hosted images
- Photos load directly from S3 CDN
- Fast and scalable!

## 🔧 Testing

### Test Database Connection
```bash
psql -h your-endpoint.rds.amazonaws.com -U postgres -d boned -p 5432
```

### Check Tables
```sql
-- List tables
\dt

-- Check menu items
SELECT name, station, average_rating, total_reviews FROM menu_items LIMIT 10;

-- Check reviews
SELECT user_name, rating, comment FROM reviews ORDER BY created_at DESC LIMIT 5;
```

### Test Image Upload
1. Submit a review with a photo
2. Go to AWS S3 Console: https://s3.console.aws.amazon.com/s3/buckets/boned-images
3. Check `reviews/` folder for uploaded images
4. Click on image to get public URL
5. Paste URL in browser - should display image

### Refresh Menu
```bash
curl http://localhost:3001/api/menu/refresh
```

## 📊 API Endpoints

### Menu Items
- `GET /api/menu` - Get all menu items
- `GET /api/menu/:id` - Get single menu item
- `POST /api/menu/refresh` - Refresh menu from Sodexo

### Reviews
- `GET /api/reviews/menu/:menuItemId` - Get reviews for item
- `POST /api/reviews` - Create review (multipart/form-data)
- `DELETE /api/reviews/:id` - Delete review
- `PUT /api/reviews/:id/helpful` - Mark review helpful

## 🐛 Troubleshooting

### Server won't start
- Check `.env` file has all required variables
- Verify database credentials are correct
- Ensure RDS instance is running and accessible

### Can't upload images
- Verify AWS credentials in `.env`
- Check S3 bucket name is correct
- Ensure IAM user has S3 permissions
- Check bucket policy allows public-read

### Images don't display
- Verify bucket policy is set correctly
- Check CORS configuration on S3 bucket
- Look for errors in browser console

### Database connection fails
- Check RDS security group allows inbound on port 5432
- Verify endpoint is correct
- Ensure database is in "Available" state
- Check that public accessibility is enabled

## 📚 Documentation

- **`AWS_SETUP.md`** - Detailed AWS service setup instructions
- **`AWS_INTEGRATION.md`** - Complete implementation summary
- **`IMPLEMENTATION_SUMMARY.md`** - Original project notes
- **`MENU_INTEGRATION.md`** - Menu scraping documentation

## 💡 Development Tips

### Debugging
- Set `MENU_DEBUG=1` in `.env` for verbose menu scraping logs
- Check server console for database query errors
- Use browser DevTools Network tab to inspect API calls

### Database Migrations
The schema is automatically created on first run. If you need to reset:
```sql
DROP TABLE reviews;
DROP TABLE menu_items;
```
Then restart the server.

### Cost Monitoring
- RDS: Free tier `db.t3.micro` for 750 hours/month
- S3: First 5GB free, minimal costs for small images
- Set up billing alerts in AWS Console!

## 🎉 Success Indicators

You know everything is working when:
- ✅ Server starts without errors
- ✅ Menu items load on homepage
- ✅ You can submit reviews with photos
- ✅ Images display correctly
- ✅ Reviews persist after server restart
- ✅ Images appear in S3 bucket

## 🆘 Need Help?

1. Check server logs in terminal
2. Check browser console for errors
3. Review `AWS_SETUP.md` for AWS configuration
4. Verify `.env` file has all credentials
5. Test database connection with `psql`

## 🚀 Ready to Deploy?

Before production:
1. Restrict RDS security group (remove 0.0.0.0/0)
2. Update S3 CORS with production domain
3. Use environment variables on hosting platform
4. Enable SSL for database connections
5. Set up monitoring and alerts

---

**You're all set!** The app now uses AWS RDS for database and S3 for images. 🦴
