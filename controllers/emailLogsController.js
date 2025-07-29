const EmailLogs = require("../models/emailLogs");
const Email = require("../models/emails");
const logEvent = require('../helper/logEvent');

// GET delivery statistics
exports.getDeliveryStats = async (req, res) => {
  try {
    const stats = await EmailLogs.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve delivery stats" });
  }
};

// GET device statistics
exports.getDeviceStats = async (req, res) => {
  try {
    const stats = await EmailLogs.aggregate([
      {
        $group: {
          _id: "$deviceType",
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve device stats" });
  }
};

// GET geographic statistics
exports.getGeoStats = async (req, res) => {
  try {
    const stats = await EmailLogs.aggregate([
      {
        $group: {
          _id: "$country",
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve geo stats" });
  }
};

// GET email performance metrics
exports.getEmailPerformance = async (req, res) => {
  try {
    const { organizationId, startDate, endDate } = req.query;
    
    const matchStage = {};
    if (organizationId) matchStage.organization = organizationId;
    if (startDate || endDate) {
      matchStage.sentAt = {};
      if (startDate) matchStage.sentAt.$gte = new Date(startDate);
      if (endDate) matchStage.sentAt.$lte = new Date(endDate);
    }
    
    const performance = await Email.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalEmails: { $sum: 1 },
          deliveredEmails: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
          bouncedEmails: { $sum: { $cond: [{ $eq: ["$status", "bounced"] }, 1, 0] } },
          openedEmails: { $sum: { $cond: [{ $eq: ["$opened", true] }, 1, 0] } },
          clickedEmails: { $sum: { $cond: [{ $eq: ["$clicked", true] }, 1, 0] } }
        }
      }
    ]);
    
    const result = performance[0] || {
      totalEmails: 0,
      deliveredEmails: 0,
      bouncedEmails: 0,
      openedEmails: 0,
      clickedEmails: 0
    };
    
    // Calculate rates
    result.deliveryRate = result.totalEmails > 0 ? (result.deliveredEmails / result.totalEmails * 100).toFixed(2) : 0;
    result.bounceRate = result.totalEmails > 0 ? (result.bouncedEmails / result.totalEmails * 100).toFixed(2) : 0;
    result.openRate = result.deliveredEmails > 0 ? (result.openedEmails / result.deliveredEmails * 100).toFixed(2) : 0;
    result.clickRate = result.openedEmails > 0 ? (result.clickedEmails / result.openedEmails * 100).toFixed(2) : 0;
    
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve email performance" });
  }
};

// GET email engagement metrics
exports.getEmailEngagement = async (req, res) => {
  try {
    const { organizationId, timeRange = '30d' } = req.query;
    
    const now = new Date();
    let startDate;
    
    switch(timeRange) {
      case '7d':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30d':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case '90d':
        startDate = new Date(now.setDate(now.getDate() - 90));
        break;
      default:
        startDate = new Date(0);
    }
    
    const matchStage = { sentAt: { $gte: startDate } };
    if (organizationId) matchStage.organization = organizationId;
    
    const engagement = await Email.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$sentAt" }
          },
          emailsSent: { $sum: 1 },
          emailsOpened: { $sum: { $cond: [{ $eq: ["$opened", true] }, 1, 0] } },
          emailsClicked: { $sum: { $cond: [{ $eq: ["$clicked", true] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.status(200).json({ success: true, data: engagement });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve email engagement" });
  }
};

// GET real-time email tracking
exports.getRealTimeTracking = async (req, res) => {
  try {
    const { organizationId } = req.query;
    
    const matchStage = {};
    if (organizationId) matchStage.organization = organizationId;
    
    // Get emails sent in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    matchStage.sentAt = { $gte: oneHourAgo };
    
    const realTimeStats = await Email.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSent: { $sum: 1 },
          delivered: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
          opened: { $sum: { $cond: [{ $eq: ["$opened", true] }, 1, 0] } },
          clicked: { $sum: { $cond: [{ $eq: ["$clicked", true] }, 1, 0] } },
          bounced: { $sum: { $cond: [{ $eq: ["$status", "bounced"] }, 1, 0] } }
        }
      }
    ]);
    
    const result = realTimeStats[0] || {
      totalSent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0
    };
    
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve real-time tracking" });
  }
}; 