# Template Seeding Guide

This guide explains how to seed the initial website templates into your database.

## 📋 Overview

The template seeding system includes:
- **12 pre-configured templates** (ecommerce and business)
- **5 premium templates** ($29-$49)
- **7 free templates**
- Preview URLs for all templates
- Detailed features and descriptions

## 🚀 How to Seed Templates

### Prerequisites
1. MongoDB must be running and accessible
2. `.env` file must contain valid `MONGO_URI`
3. At least one admin or super-admin user must exist in the database

### Run the Seed Script

```bash
npm run seed:templates
```

Or directly:

```bash
node scripts/seedTemplates.js
```

## 📊 Template Details

### Free Templates (7)
1. **GreenVista** - Fashion/Home ($0)
2. **Glamazon** - Beauty/Fashion ($0)
3. **Groceem** - Grocery ($0)
4. **Idyllic Fashion** - Fashion ($0)
5. **Supermarket** - Grocery ($0)
6. **Gadget Store** - Electronics ($0)
7. **Super Mart Store** - Multi-category ($0)

### Premium Templates (5)
1. **RichStore** - Fashion/Electronics ($29)
2. **GoldStar** - Luxury Fashion ($39)
3. **Botiga** - Business ($49)
4. **Modern Fashion Store** - Fashion ($35)
5. **Mattress Shop Pro** - Furniture ($45)

## 📁 File Structure

```
server/
├── scripts/
│   ├── templateSeedData.js       # Template data definitions
│   ├── seedTemplates.js          # Seed script
│   └── TEMPLATE_SEEDING_README.md # This file
└── models/
    └── template.js               # Template model
```

## ⚙️ What the Script Does

1. **Connects to MongoDB** using your `.env` configuration
2. **Finds a system user** (looks for super-admin or admin)
3. **Checks for existing templates** (warns if duplicates may occur)
4. **Inserts all 12 templates** with complete metadata
5. **Provides detailed feedback** on success/failure
6. **Closes the connection** cleanly

## 📝 Template Data Fields

Each template includes:
- `userId` - Auto-assigned from admin user
- `name` - Template name
- `description` - Detailed description
- `category` - ecommerce or business
- `previewUrl` - Live demo URL
- `features` - Array of feature descriptions
- `price` - 0 for free, or dollar amount for premium
- `createdAt` - Auto-generated timestamp

## ⚠️ Important Notes

### Template Images
**Templates are seeded WITHOUT images.** The `image` field is empty. To add images:

1. Use the template update API endpoint
2. Upload actual template screenshots
3. Images will be stored in Cloudinary

### User Requirements
The script requires at least one user with role:
- `super-admin` (preferred), or
- `admin`

If no such user exists, the script will fail with an error message.

### Duplicate Prevention
The script **does NOT** clear existing templates. If you run it multiple times, you'll get duplicate entries.

To start fresh:
```javascript
// In MongoDB or via API
db.templates.deleteMany({});
```

## 🔧 Troubleshooting

### Error: "Cannot proceed without a valid user"
**Solution:** Create an admin user first:
```javascript
// Create a super-admin user via your user registration API
// Or manually in MongoDB
```

### Error: "MongoDB connection error"
**Solution:** Check your `.env` file:
```
MONGO_URI=mongodb://localhost:27017/your-database
```

### Templates already exist
**Solution:** This is a warning, not an error. The script will still add new templates. To avoid duplicates, delete existing templates first.

## 📚 Next Steps

After seeding:
1. ✅ Verify templates via API: `GET /api/website/templates/all`
2. 📸 Upload template images via: `PATCH /api/website/templates/update/:id`
3. 🎨 Customize template details as needed
4. 🚀 Templates are ready for website creation!

## 💡 Template Usage

Users can select these templates when creating a website:
```javascript
POST /api/websites/create
{
  "templateId": "template_id_here",
  // ... other website fields
}
```

## 🛠️ Maintenance

### Adding New Templates
1. Edit `scripts/templateSeedData.js`
2. Add new template object to the array
3. Run `npm run seed:templates`

### Updating Existing Templates
Use the API endpoint:
```
PATCH /api/website/templates/update/:id
```

### Deleting Templates
Use the API endpoint:
```
DELETE /api/website/templates/delete/:id
```

---

**Created:** 2025
**Last Updated:** January 2025

