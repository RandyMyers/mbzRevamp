const Meeting = require('../models/Meeting');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Admin Meetings
 *     description: Manage meetings (Jitsi / in-person)
 */

/**
 * @swagger
 * /api/admin/meetings:
 *   get:
 *     summary: List meetings
 *     tags: [Admin Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
exports.listMeetings = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.organizationId) q.organizationId = req.query.organizationId;
    const items = await Meeting.find(q).populate('organizer participants', 'fullName email').sort({ startTime: -1 });
    res.status(200).json({ success: true, meetings: items });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/meetings:
 *   post:
 *     summary: Create a meeting
 *     tags: [Admin Meetings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, startTime, endTime, organizer]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               startTime: { type: string, format: date-time }
 *               endTime: { type: string, format: date-time }
 *               locationType: { type: string }
 *               meetingLink: { type: string }
 *               organizer: { type: string }
 *               participants: { type: array, items: { type: string } }
 *               organizationId: { type: string }
 *     responses:
 *       201: { description: Created }
 */
exports.createMeeting = async (req, res, next) => {
  try {
    const { title, startTime, endTime, organizer } = req.body;
    if (!title || !startTime || !endTime || !organizer) throw new BadRequestError('title, startTime, endTime, organizer required');
    const body = { ...req.body };
    // Auto-generate Jitsi link if locationType is jitsi and no link provided
    if ((body.locationType || 'jitsi') === 'jitsi' && !body.meetingLink) {
      const slug = `${title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const unique = Math.random().toString(36).slice(2, 8);
      body.meetingLink = `https://meet.jit.si/mbz-${slug}-${unique}`;
    }
    const doc = await Meeting.create(body);
    res.status(201).json({ success: true, meeting: doc });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/meetings/{id}:
 *   patch:
 *     summary: Update a meeting
 *     tags: [Admin Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: Updated }
 */
exports.updateMeeting = async (req, res, next) => {
  try {
    const doc = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) throw new NotFoundError('meeting not found');
    res.status(200).json({ success: true, meeting: doc });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/meetings/series/{seriesId}:
 *   get:
 *     summary: Get meetings in a recurrence series
 *     tags: [Admin Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
exports.getMeetingSeries = async (req, res, next) => {
  try {
    const items = await Meeting.find({ seriesId: req.params.seriesId }).sort({ startTime: 1 });
    res.status(200).json({ success: true, meetings: items });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/meetings/{id}:
 *   delete:
 *     summary: Delete a meeting
 *     tags: [Admin Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
exports.deleteMeeting = async (req, res, next) => {
  try {
    const doc = await Meeting.findByIdAndDelete(req.params.id);
    if (!doc) throw new NotFoundError('meeting not found');
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};




