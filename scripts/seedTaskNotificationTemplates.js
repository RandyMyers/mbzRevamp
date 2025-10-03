const mongoose = require('mongoose');
const NotificationTemplate = require('../models/notificationTemplates');
const notificationTemplates = require('./notificationTemplatesData');

// System user ID for createdBy field (you may need to adjust this)
const SYSTEM_USER_ID = new mongoose.Types.ObjectId('000000000000000000000000');

const seedTaskNotificationTemplates = async () => {
  try {
    console.log('🌱 Seeding task notification templates...');
    
    // Filter only task management templates
    const taskTemplates = notificationTemplates.filter(template => 
      template.templateCategory === 'task_management'
    );
    
    let createdCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;
    
    for (const template of taskTemplates) {
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
        // Update existing template with new fields if needed
        const needsUpdate = 
          existingTemplate.templateCategory !== template.templateCategory ||
          existingTemplate.triggerEvent !== template.triggerEvent ||
          existingTemplate.priority !== template.priority;
          
        if (needsUpdate) {
          await NotificationTemplate.findByIdAndUpdate(
            existingTemplate._id,
            {
              templateCategory: template.templateCategory,
              triggerEvent: template.triggerEvent,
              priority: template.priority,
              tags: template.tags,
              variables: template.variables
            },
            { new: true }
          );
          console.log(`🔄 Updated template: ${template.templateName}`);
          updatedCount++;
        } else {
          console.log(`⏭️ Template already exists: ${template.templateName}`);
          skippedCount++;
        }
      }
    }
    
    console.log(`🎉 Task notification templates seeding completed!`);
    console.log(`📊 Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}, Total: ${taskTemplates.length}`);
    
    return {
      success: true,
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
      total: taskTemplates.length
    };
  } catch (error) {
    console.error('❌ Error seeding task notification templates:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
  const connectDB = require('../helper/connectDB');
  
  connectDB()
    .then(() => seedTaskNotificationTemplates())
    .then((result) => {
      console.log('Seeding result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = {
  seedTaskNotificationTemplates
};
