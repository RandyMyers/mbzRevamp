const NotificationTemplate = require('../models/notificationTemplates');
const mongoose = require('mongoose');
const notificationTemplates = require('./notificationTemplatesData');

// System user ID for createdBy field (you may need to adjust this)
const SYSTEM_USER_ID = new mongoose.Types.ObjectId('000000000000000000000000');

const seedNotificationTemplates = async () => {
  try {
    console.log('🌱 Seeding notification templates...');
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const template of notificationTemplates) {
      const existingTemplate = await NotificationTemplate.findOne({ 
        templateName: template.templateName 
      });
      
      if (!existingTemplate) {
        await NotificationTemplate.create({
          ...template,
          createdBy: SYSTEM_USER_ID
        });
        console.log(`✅ Created template: ${template.templateName}`);
        createdCount++;
      } else {
        console.log(`⏭️ Template already exists: ${template.templateName}`);
        skippedCount++;
      }
    }
    
    console.log(`🎉 Notification templates seeding completed!`);
    console.log(`📊 Created: ${createdCount}, Skipped: ${skippedCount}, Total: ${notificationTemplates.length}`);
    
    return {
      success: true,
      created: createdCount,
      skipped: skippedCount,
      total: notificationTemplates.length
    };
  } catch (error) {
    console.error('❌ Error seeding notification templates:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  seedNotificationTemplates,
  notificationTemplates
};