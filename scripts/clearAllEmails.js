const mongoose = require('mongoose');
const Inbox = require('../models/inbox');
const Email = require('../models/emails');
const Draft = require('../models/draft');
const Archived = require('../models/archived');
const Trash = require('../models/trash');
const EmailLogs = require('../models/emailLogs');

async function clearAllEmails() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL || 'mongodb+srv://Shop:0GY73Ol6FSHR6Re3@cluster0.tsz9xe5.mongodb.net/MBZCRM?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');

    console.log('🗑️ Starting to clear all emails from database...');

    // Get counts before deletion
    const inboxCount = await Inbox.countDocuments();
    const emailCount = await Email.countDocuments();
    const draftCount = await Draft.countDocuments();
    const archivedCount = await Archived.countDocuments();
    const trashCount = await Trash.countDocuments();
    const emailLogsCount = await EmailLogs.countDocuments();

    console.log('📊 Current email counts:');
    console.log(`   Inbox: ${inboxCount}`);
    console.log(`   Email: ${emailCount}`);
    console.log(`   Draft: ${draftCount}`);
    console.log(`   Archived: ${archivedCount}`);
    console.log(`   Trash: ${trashCount}`);
    console.log(`   Email Logs: ${emailLogsCount}`);
    console.log(`   Total: ${inboxCount + emailCount + draftCount + archivedCount + trashCount + emailLogsCount}`);

    // Delete all emails from all collections
    console.log('\n🗑️ Deleting emails...');
    
    const inboxResult = await Inbox.deleteMany({});
    console.log(`   ✅ Deleted ${inboxResult.deletedCount} inbox emails`);

    const emailResult = await Email.deleteMany({});
    console.log(`   ✅ Deleted ${emailResult.deletedCount} general emails`);

    const draftResult = await Draft.deleteMany({});
    console.log(`   ✅ Deleted ${draftResult.deletedCount} draft emails`);

    const archivedResult = await Archived.deleteMany({});
    console.log(`   ✅ Deleted ${archivedResult.deletedCount} archived emails`);

    const trashResult = await Trash.deleteMany({});
    console.log(`   ✅ Deleted ${trashResult.deletedCount} trash emails`);

    const emailLogsResult = await EmailLogs.deleteMany({});
    console.log(`   ✅ Deleted ${emailLogsResult.deletedCount} email logs`);

    const totalDeleted = inboxResult.deletedCount + emailResult.deletedCount + 
                        draftResult.deletedCount + archivedResult.deletedCount + 
                        trashResult.deletedCount + emailLogsResult.deletedCount;

    console.log(`\n🎉 Successfully deleted ${totalDeleted} total email records!`);
    console.log('📧 Database is now clean and ready for new email sync logic.');

  } catch (error) {
    console.error('❌ Error clearing emails:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script if called directly
if (require.main === module) {
  clearAllEmails();
}

module.exports = { clearAllEmails };
