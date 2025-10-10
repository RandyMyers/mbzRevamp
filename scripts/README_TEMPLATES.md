# Template Seeding Guide

This guide explains how to seed the initial website templates into your database.

## 📋 Overview

The seed script will insert **12 website templates** into your MongoDB database:

- **7 Free Templates** (price: $0)
- **5 Premium Templates** (prices: $29, $35, $39, $45, $49)
- **11 E-commerce Templates**
- **1 Business Template**

## 🚀 How to Run

### Method 1: Using npm script (Recommended)

```bash
npm run seed:templates
```

### Method 2: Using node directly

```bash
node scripts/seedTemplates.js
```

## 📊 Templates Included

| # | Name | Category | Price | Preview URL |
|---|------|----------|-------|-------------|
| 1 | GreenVista | ecommerce | Free | https://gracethemesdemo.com/greenvista/ |
| 2 | Glamazon | ecommerce | Free | https://gracethemesdemo.com/glamazon/ |
| 3 | Groceem | ecommerce | Free | https://www.gracethemesdemo.com/groceem/ |
| 4 | RichStore | ecommerce | $29 | https://www.gracethemesdemo.com/richstore/ |
| 5 | GoldStar | ecommerce | $39 | https://gracethemesdemo.com/goldstar/ |
| 6 | Idyllic Fashion | ecommerce | Free | https://demo.themefreesia.com/idyllic-fashion/ |
| 7 | Supermarket | ecommerce | Free | https://demo.themefreesia.com/supermarket/ |
| 8 | Gadget Store | ecommerce | Free | https://preview.wpradiant.net/ecommerce-gadget-store/ |
| 9 | Botiga | business | $49 | https://demo.athemes.com/themes/?theme=Botiga |
| 10 | Super Mart Store | ecommerce | Free | https://demo.misbahwp.com/super-mart-store/ |
| 11 | Modern Fashion Store | ecommerce | $35 | https://page.themespride.com/modern-fashion-store/ |
| 12 | Mattress Shop Pro | ecommerce | $45 | https://demos.buywptemplates.com/mattress-shop-pro/ |

## ⚙️ What Gets Seeded

Each template includes:
- ✅ Name
- ✅ Description
- ✅ Category (ecommerce/business)
- ✅ Preview URL (live demo link)
- ✅ Features array
- ✅ Price (0 for free templates)
- ✅ System User ID (placeholder: `000000000000000000000001`)

## 📝 What's NOT Included

The following fields are left empty and can be updated later via Super Admin:
- ❌ Template images (image.url, image.publicId)
- ❌ isPremium field (not in model)

## ⚠️ Important Notes

1. **Existing Templates Check**: The script will exit if templates already exist in the database to prevent duplicates.

2. **System User ID**: Templates use a placeholder user ID (`000000000000000000000001`). You can update this later when you have a proper system/admin user.

3. **No Image URLs**: Template images are not included. Add them later through:
   - Super Admin panel
   - Direct database update
   - API endpoint: `PATCH /api/website/templates/update/:id`

## 🔧 Post-Seeding Tasks

After seeding, you should:

1. **Upload Template Images**: 
   - Use Cloudinary or your preferred image hosting
   - Update via API: `PATCH /api/website/templates/update/:id`

2. **Update System User ID** (Optional):
   - Create a dedicated system user
   - Update all templates with the correct userId

3. **Test Template Retrieval**:
   ```bash
   GET /api/website/templates/all
   GET /api/website/templates/all?category=ecommerce
   GET /api/website/templates/all?isPremium=false
   ```

## 🗑️ Clearing Templates

If you need to remove all templates and re-seed:

```javascript
// In MongoDB shell or Compass
db.templates.deleteMany({})
```

Then run the seed script again.

## 📞 API Endpoints for Templates

After seeding, these endpoints will work:

- `GET /api/website/templates/all` - Get all templates
- `GET /api/website/templates/all?category=ecommerce` - Filter by category
- `GET /api/website/templates/get/:id` - Get single template
- `PATCH /api/website/templates/update/:id` - Update template (requires auth)
- `DELETE /api/website/templates/delete/:id` - Delete template (requires auth)

## 🐛 Troubleshooting

**Error: "MongoDB connection error"**
- Check your `.env` file has `MONGODB_URI` set correctly
- Ensure MongoDB is running

**Error: "Found X existing templates"**
- Templates already exist in database
- Clear existing templates or modify the script to skip the check

**Error: "Template validation failed"**
- Check that all required fields are present
- Verify the Template model schema matches the seed data

## 💡 Tips

- Run this script **once** during initial setup
- Keep the preview URLs updated if demos change
- Consider adding more templates as your platform grows
- Use template analytics to see which are most popular

---

**Created**: October 2025  
**Last Updated**: October 2025  
**Maintained By**: MBZ Tech Platform Team

