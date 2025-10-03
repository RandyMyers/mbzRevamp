const moment = require('moment-timezone');

/**
 * Timezone Service for Call Scheduler
 * Handles timezone conversions for participants in different locations
 */

// Common timezone mappings for user-friendly display
const TIMEZONE_MAPPINGS = {
  'Africa/Johannesburg': 'South Africa Standard Time (SAST)',
  'Australia/Sydney': 'Australian Eastern Time (AEST/AEDT)',
  'Australia/Melbourne': 'Australian Eastern Time (AEST/AEDT)',
  'Australia/Brisbane': 'Australian Eastern Time (AEST)',
  'Australia/Perth': 'Australian Western Time (AWST)',
  'America/New_York': 'Eastern Time (EST/EDT)',
  'America/Chicago': 'Central Time (CST/CDT)',
  'America/Denver': 'Mountain Time (MST/MDT)',
  'America/Los_Angeles': 'Pacific Time (PST/PDT)',
  'Europe/London': 'Greenwich Mean Time (GMT/BST)',
  'Europe/Paris': 'Central European Time (CET/CEST)',
  'Asia/Tokyo': 'Japan Standard Time (JST)',
  'Asia/Shanghai': 'China Standard Time (CST)',
  'Asia/Kolkata': 'India Standard Time (IST)',
  'UTC': 'Coordinated Universal Time (UTC)'
};

/**
 * Get user-friendly timezone name
 */
exports.getTimezoneDisplayName = (timezone) => {
  return TIMEZONE_MAPPINGS[timezone] || timezone;
};

/**
 * Get all available timezones grouped by region
 */
exports.getAvailableTimezones = () => {
  const timezones = moment.tz.names();
  const grouped = {};
  
  timezones.forEach(tz => {
    const parts = tz.split('/');
    if (parts.length >= 2) {
      const region = parts[0];
      if (!grouped[region]) {
        grouped[region] = [];
      }
      grouped[region].push({
        value: tz,
        display: tz.replace(/_/g, ' ')
      });
    }
  });
  
  return grouped;
};

/**
 * Convert meeting time to participant's timezone
 */
exports.convertToParticipantTimezone = (meetingTime, participantTimezone, meetingTimezone = 'UTC') => {
  try {
    const momentTime = moment.tz(meetingTime, meetingTimezone);
    const convertedTime = momentTime.tz(participantTimezone);
    
    return {
      time: convertedTime.format(),
      display: convertedTime.format('YYYY-MM-DD HH:mm:ss'),
      timezone: participantTimezone,
      offset: convertedTime.format('Z'),
      isDST: convertedTime.isDST()
    };
  } catch (error) {
    console.error('Timezone conversion error:', error);
    return null;
  }
};

/**
 * Get meeting times for all participants
 */
exports.getMeetingTimesForAllParticipants = (meetingTime, participants, meetingTimezone = 'UTC') => {
  const results = [];
  
  participants.forEach(participant => {
    const timezone = participant.timezone || participant.userTimezone || 'UTC';
    const converted = this.convertToParticipantTimezone(meetingTime, timezone, meetingTimezone);
    
    if (converted) {
      results.push({
        participant: {
          id: participant._id || participant.id,
          name: participant.name || participant.fullName,
          email: participant.email,
          timezone: timezone
        },
        meetingTime: converted,
        timezoneDisplayName: this.getTimezoneDisplayName(timezone)
      });
    }
  });
  
  return results;
};

/**
 * Find the best meeting time considering all participants
 */
exports.findOptimalMeetingTime = (participants, duration = 60) => {
  // This is a simplified version - in reality, you'd want to consider:
  // - Working hours for each participant
  // - Business days
  // - Holidays
  // - Existing meetings
  
  const now = moment();
  const suggestions = [];
  
  // Suggest next 3 business days at 9 AM UTC
  for (let i = 1; i <= 3; i++) {
    const day = now.clone().add(i, 'days');
    
    // Skip weekends
    if (day.day() === 0 || day.day() === 6) continue;
    
    const meetingTime = day.hour(9).minute(0).second(0);
    const participantTimes = this.getMeetingTimesForAllParticipants(
      meetingTime.toISOString(), 
      participants, 
      'UTC'
    );
    
    suggestions.push({
      utcTime: meetingTime.toISOString(),
      participantTimes: participantTimes
    });
  }
  
  return suggestions;
};

/**
 * Validate if a timezone is valid
 */
exports.isValidTimezone = (timezone) => {
  return moment.tz.names().includes(timezone);
};

/**
 * Get current time in a specific timezone
 */
exports.getCurrentTimeInTimezone = (timezone) => {
  return moment.tz(timezone).format('YYYY-MM-DD HH:mm:ss Z');
};

/**
 * Parse recurring meeting dates
 */
exports.generateRecurringDates = (startDate, recurrencePattern, recurrenceInterval = 1, endDate = null, daysOfWeek = []) => {
  const dates = [];
  let currentDate = moment.tz(startDate, 'UTC');
  const maxIterations = 100; // Prevent infinite loops
  let iterations = 0;
  
  while (iterations < maxIterations) {
    dates.push(currentDate.toISOString());
    iterations++;
    
    switch (recurrencePattern) {
      case 'daily':
        currentDate = currentDate.add(recurrenceInterval, 'days');
        break;
      case 'weekly':
        currentDate = currentDate.add(recurrenceInterval, 'weeks');
        break;
      case 'biweekly':
        currentDate = currentDate.add(2 * recurrenceInterval, 'weeks');
        break;
      case 'monthly':
        currentDate = currentDate.add(recurrenceInterval, 'months');
        break;
      case 'custom':
        // For custom, use daysOfWeek array
        if (daysOfWeek.length > 0) {
          // Find next occurrence of any day in daysOfWeek
          let found = false;
          for (let i = 1; i <= 7; i++) {
            const nextDay = currentDate.clone().add(i, 'days');
            if (daysOfWeek.includes(nextDay.day())) {
              currentDate = nextDay;
              found = true;
              break;
            }
          }
          if (!found) {
            // If no day found in next 7 days, go to next week
            currentDate = currentDate.add(1, 'week').startOf('week');
          }
        } else {
          currentDate = currentDate.add(1, 'week');
        }
        break;
      default:
        return dates; // Unknown pattern, return what we have
    }
    
    // Check if we've reached the end date
    if (endDate && currentDate.isAfter(moment.tz(endDate, 'UTC'))) {
      break;
    }
  }
  
  return dates;
};

module.exports = exports;
