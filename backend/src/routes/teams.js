const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const TeamService = require('../services/teamService');
const ChannelService = require('../services/channelService');
const logger = require('../utils/logger');

// 1. Get invitations for current user (Must be placed BEFORE parameterized routes)
router.get('/invitations', authMiddleware, async (req, res) => {
  try {
    const list = await TeamService.getInvitationsForUser(req.user.id);
    res.json(list);
  } catch (error) {
    logger.error('Get user invitations error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Respond to team invitation
router.post('/invitations/:invitationId', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const result = await TeamService.respondToInvitation(req.params.invitationId, status, req.user.id);
    res.json(result);
  } catch (error) {
    logger.error('Respond to invitation error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// 2. Discover public teams
router.get('/discover', authMiddleware, async (req, res) => {
  try {
    const { search = '' } = req.query;
    const list = await TeamService.getPublicTeams(req.user.id, search);
    res.json(list);
  } catch (error) {
    logger.error('Discover public teams error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// 3. Get all teams for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const teams = await TeamService.getTeamsForUser(req.user.id);
    res.json(teams);
  } catch (error) {
    logger.error('Get teams error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// 4. Create team
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, isPrivate, avatarUrl } = req.body;
    const team = await TeamService.createTeam(name, description, req.user.id, isPrivate || false, avatarUrl);
    res.status(201).json(team);
  } catch (error) {
    logger.error('Create team error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// 5. Get team details (includes member list)
router.get('/:teamId', authMiddleware, async (req, res) => {
  try {
    const team = await TeamService.getTeamDetails(req.params.teamId);
    res.json(team);
  } catch (error) {
    logger.error('Get team details error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// 6. Update team settings
router.put('/:teamId/settings', authMiddleware, async (req, res) => {
  try {
    const { name, description, isPrivate, avatarUrl } = req.body;
    const team = await TeamService.updateTeamSettings(
      req.params.teamId,
      req.user.id,
      name,
      description,
      isPrivate,
      avatarUrl
    );
    res.json(team);
  } catch (error) {
    logger.error('Update team settings error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// 7. Remove / Kick member
router.delete('/:teamId/members/:memberUserId', authMiddleware, async (req, res) => {
  try {
    const result = await TeamService.removeMember(req.params.teamId, req.params.memberUserId, req.user.id);
    res.json(result);
  } catch (error) {
    logger.error('Remove member error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// 8. Join request handling
router.post('/:teamId/join-request', authMiddleware, async (req, res) => {
  try {
    const result = await TeamService.sendJoinRequest(req.params.teamId, req.user.id);
    res.json(result);
  } catch (error) {
    logger.error('Send join request error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

router.get('/:teamId/join-requests', authMiddleware, async (req, res) => {
  try {
    const requests = await TeamService.getJoinRequests(req.params.teamId, req.user.id);
    res.json(requests);
  } catch (error) {
    logger.error('Get join requests error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

router.post('/:teamId/join-requests/:requestId', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const result = await TeamService.respondToJoinRequest(
      req.params.teamId,
      req.params.requestId,
      status,
      req.user.id
    );
    res.json(result);
  } catch (error) {
    logger.error('Respond to join request error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// 9. Invitations
router.post('/:teamId/invite', authMiddleware, async (req, res) => {
  try {
    const { inviteeId } = req.body;
    const result = await TeamService.sendInvitation(req.params.teamId, req.user.id, inviteeId);
    res.json(result);
  } catch (error) {
    logger.error('Send invitation error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

router.get('/:teamId/friends-to-invite', authMiddleware, async (req, res) => {
  try {
    const list = await TeamService.getFriendsToInvite(req.params.teamId, req.user.id);
    res.json(list);
  } catch (error) {
    logger.error('Get friends to invite error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// 10. Channels API
router.get('/:teamId/channels', authMiddleware, async (req, res) => {
  try {
    const channels = await ChannelService.getChannelsForTeam(req.params.teamId);
    res.json(channels);
  } catch (error) {
    logger.error('Get channels error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

router.post('/:teamId/channels', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    const channel = await ChannelService.createChannel(req.params.teamId, name, description);
    res.status(201).json(channel);
  } catch (error) {
    logger.error('Create channel error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

router.put('/:teamId/channels/:channelId', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const channel = await ChannelService.renameChannel(req.params.channelId, name);
    res.json(channel);
  } catch (error) {
    logger.error('Rename channel error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:teamId/channels/:channelId', authMiddleware, async (req, res) => {
  try {
    const result = await ChannelService.deleteChannel(req.params.channelId);
    res.json(result);
  } catch (error) {
    logger.error('Delete channel error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
