const { query } = require('../config/database');
const logger = require('../utils/logger');

class ChannelService {
  static async createChannel(teamId, name, description) {
    try {
      const formattedName = name.trim().toLowerCase().replace(/\s+/g, '-');
      const result = await query(
        `INSERT INTO channels (team_id, name, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (team_id, name) DO UPDATE SET description = EXCLUDED.description
         RETURNING *`,
        [teamId, formattedName, description]
      );
      
      logger.info(`Channel ${formattedName} created in team ${teamId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Create channel error:', error.message);
      throw error;
    }
  }

  static async getChannelsForTeam(teamId) {
    try {
      const result = await query(
        'SELECT * FROM channels WHERE team_id = $1 ORDER BY name ASC',
        [teamId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Get channels error:', error.message);
      throw error;
    }
  }

  static async renameChannel(channelId, name) {
    try {
      const formattedName = name.trim().toLowerCase().replace(/\s+/g, '-');
      const result = await query(
        'UPDATE channels SET name = $1 WHERE id = $2 RETURNING *',
        [formattedName, channelId]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Rename channel error:', error.message);
      throw error;
    }
  }

  static async deleteChannel(channelId) {
    try {
      await query('DELETE FROM channels WHERE id = $1', [channelId]);
      return { success: true };
    } catch (error) {
      logger.error('Delete channel error:', error.message);
      throw error;
    }
  }
}

module.exports = ChannelService;
