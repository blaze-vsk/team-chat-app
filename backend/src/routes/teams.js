const express = require('express');
const authMiddleware = require('../middleware/auth');
const TeamService = require('../services/teamService');
const { createTeamValidator } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();
router.use(authMiddleware);

const sendError = (res, error) => {
  logger.error('Team request failed', { message: error.message });
  return res.status(error.status || 400).json({ error: error.message });
};

router.get('/', async (req, res) => {
  try {
    res.json(await TeamService.getTeamsForUser(req.user.id));
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/', createTeamValidator, async (req, res) => {
  try {
    const team = await TeamService.createTeam(req.user.id, req.body.name, req.body.description);
    res.status(201).json(team);
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/:teamId', async (req, res) => {
  try {
    res.json(await TeamService.getTeamForUser(req.params.teamId, req.user.id));
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/:teamId/members', async (req, res) => {
  try {
    if (!req.body.userId) return res.status(400).json({ error: 'userId is required' });
    res.status(201).json(
      await TeamService.addMember(req.params.teamId, req.user.id, req.body.userId)
    );
  } catch (error) {
    sendError(res, error);
  }
});

router.delete('/:teamId/members/:userId', async (req, res) => {
  try {
    res.json(await TeamService.removeMember(req.params.teamId, req.user.id, req.params.userId));
  } catch (error) {
    sendError(res, error);
  }
});

router.delete('/:teamId', async (req, res) => {
  try {
    res.json(await TeamService.deleteTeam(req.params.teamId, req.user.id));
  } catch (error) {
    sendError(res, error);
  }
});

module.exports = router;
