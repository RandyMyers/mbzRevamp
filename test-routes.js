const express = require('express');
const app = express();

const adminRoutes = require('./routes/adminRoutes.js');
console.log('Loaded adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes.js');
console.log('Loaded notificationRoutes');
const notificationTemplateRoutes = require('./routes/notificationTemplateRoutes.js');
console.log('Loaded notificationTemplateRoutes');
const notificationSettingsRoutes = require('./routes/notificationSettingsRoutes.js');
console.log('Loaded notificationSettingsRoutes');

app.use('/api/admin', adminRoutes);
console.log('Mounted adminRoutes');
app.use('/api/notifications', notificationRoutes);
console.log('Mounted notificationRoutes');
app.use('/api/notification-templates', notificationTemplateRoutes);
console.log('Mounted notificationTemplateRoutes');
app.use('/api/notification-settings', notificationSettingsRoutes);
console.log('Mounted notificationSettingsRoutes');

console.log('All routes mounted successfully!');
