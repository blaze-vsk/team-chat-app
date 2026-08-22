const { query } = require('../config/database');
const logger = require('../utils/logger');
const ChannelService = require('./channelService');
const NotificationService = require('./notificationService');

class TeamService {
  static async createTeam(name, description, creatorId, isPrivate = false, avatarUrl = null) {
    try {
      const result = await query(
        `INSERT INTO teams (name, description, created_by, is_private, avatar_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name, description, creatorId, isPrivate, avatarUrl]
      );
      const team = result.rows[0];

      // Add creator as member (admin/creator)
      await query(
        `INSERT INTO team_members (team_id, user_id, role)
         VALUES ($1, $2, $3)`,
        [team.id, creatorId, 'owner']
      );

      // Create a default general channel
      await ChannelService.createChannel(team.id, 'general', 'Default general chat room');

      logger.info(`Team ${name} created by user ${creatorId} with default general channel`);
      return team;
    } catch (error) {
      logger.error('Create team service error:', error.message);
      throw error;
    }
  }

  static async getTeamsForUser(userId) {
    try {
      const result = await query(
        `SELECT t.*, tm.role 
         FROM teams t
         INNER JOIN team_members tm ON t.id = tm.team_id
         WHERE tm.user_id = $1`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Get teams service error:', error.message);
      throw error;
    }
  }

  static async getTeamDetails(teamId) {
    try {
      const teamResult = await query('SELECT * FROM teams WHERE id = $1', [teamId]);
      if (teamResult.rows.length === 0) {
        throw new Error('Team not found');
      }

      const team = teamResult.rows[0];

      // Fetch members
      const membersResult = await query(
        `SELECT u.id, u.username, u.display_name, u.avatar_url, u.status, tm.role, tm.joined_at
         FROM users u
         INNER JOIN team_members tm ON u.id = tm.user_id
         WHERE tm.team_id = $1`,
        [teamId]
      );

      team.members = membersResult.rows;
      return team;
    } catch (error) {
      logger.error('Get team details service error:', error.message);
      throw error;
    }
  }

  static async getPublicTeams(userId, searchTerm = '') {
    try {
      const result = await query(
        `SELECT t.*, 
                (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as members_count,
                EXISTS(SELECT 1 FROM team_members WHERE team_id = t.id AND user_id = $1) as is_member,
                (SELECT status FROM team_join_requests WHERE team_id = t.id AND user_id = $1 LIMIT 1) as join_request_status
         FROM teams t
         WHERE t.is_private = false 
           AND (t.name ILIKE $2 OR t.description ILIKE $2)
         ORDER BY t.created_at DESC`,
        [userId, `%${searchTerm}%`]
      );
      return result.rows;
    } catch (error) {
      logger.error('Get public teams error:', error.message);
      throw error;
    }
  }

  static async updateTeamSettings(teamId, userId, name, description, isPrivate, avatarUrl) {
    try {
      // Authorize: Only owner or admin can update settings
      const authResult = await query(
        'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
        [teamId, userId]
      );
      if (authResult.rows.length === 0 || !['owner', 'admin'].includes(authResult.rows[0].role)) {
        throw new Error('Unauthorized to update settings');
      }

      const result = await query(
        `UPDATE teams
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             is_private = COALESCE($3, is_private),
             avatar_url = COALESCE($4, avatar_url),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [name, description, isPrivate, avatarUrl, teamId]
      );

      logger.info(`Team ${teamId} settings updated by user ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Update team settings error:', error.message);
      throw error;
    }
  }

  static async addMember(teamId, userId, role = 'member') {
    try {
      const result = await query(
        `INSERT INTO team_members (team_id, user_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (team_id, user_id) DO UPDATE SET role = EXCLUDED.role
         RETURNING *`,
        [teamId, userId, role]
      );
      logger.info(`User ${userId} added to team ${teamId} as ${role}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Add team member service error:', error.message);
      throw error;
    }
  }

  static async removeMember(teamId, userId, actingUserId) {
    try {
      // Authorization
      const checkActor = await query(
        'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
        [teamId, actingUserId]
      );
      if (checkActor.rows.length === 0) {
        throw new Error('Unauthorized');
      }

      const actorRole = checkActor.rows[0].role;
      if (actingUserId !== userId && !['owner', 'admin'].includes(actorRole)) {
        throw new Error('Only owners and admins can remove other members');
      }

      await query(
        `DELETE FROM team_members
         WHERE team_id = $1 AND user_id = $2`,
        [teamId, userId]
      );

      logger.info(`User ${userId} removed from team ${teamId}`);
      return { success: true };
    } catch (error) {
      logger.error('Remove team member service error:', error.message);
      throw error;
    }
  }

  // Join Requests
  static async sendJoinRequest(teamId, userId) {
    try {
      const checkTeam = await query('SELECT is_private FROM teams WHERE id = $1', [teamId]);
      if (checkTeam.rows.length === 0) throw new Error('Team not found');

      if (!checkTeam.rows[0].is_private) {
        // Public team, join directly!
        await this.addMember(teamId, userId, 'member');
        return { status: 'joined', message: 'Joined team successfully' };
      }

      // Private team: create request
      await query(
        `INSERT INTO team_join_requests (team_id, user_id, status)
         VALUES ($1, $2, 'pending')
         ON CONFLICT (team_id, user_id) DO NOTHING`,
        [teamId, userId]
      );

      // Notify owner/admin
      const admins = await query('SELECT user_id FROM team_members WHERE team_id = $1 AND role IN (\'owner\', \'admin\')', [teamId]);
      for (const admin of admins.rows) {
        await NotificationService.createNotification(admin.user_id, userId, teamId, 'team_join_request', 'requested to join the team');
      }

      return { status: 'pending', message: 'Join request sent to team owner/admin' };
    } catch (error) {
      logger.error('Send join request error:', error.message);
      throw error;
    }
  }

  static async getJoinRequests(teamId, userId) {
    try {
      // Verify authorization (only owner/admin)
      const auth = await query('SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2', [teamId, userId]);
      if (auth.rows.length === 0 || !['owner', 'admin'].includes(auth.rows[0].role)) {
        throw new Error('Unauthorized');
      }

      const result = await query(
        `SELECT tjr.*, u.username, u.display_name, u.avatar_url, u.status
         FROM team_join_requests tjr
         INNER JOIN users u ON tjr.user_id = u.id
         WHERE tjr.team_id = $1 AND tjr.status = 'pending'`,
        [teamId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Get join requests error:', error.message);
      throw error;
    }
  }

  static async respondToJoinRequest(teamId, requestId, status, actingUserId) {
    try {
      // Verify authorization
      const auth = await query('SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2', [teamId, actingUserId]);
      if (auth.rows.length === 0 || !['owner', 'admin'].includes(auth.rows[0].role)) {
        throw new Error('Unauthorized');
      }

      const requestResult = await query('SELECT user_id FROM team_join_requests WHERE id = $1', [requestId]);
      if (requestResult.rows.length === 0) throw new Error('Request not found');

      const targetUserId = requestResult.rows[0].user_id;

      if (status === 'accepted') {
        await query('UPDATE team_join_requests SET status = \'accepted\' WHERE id = $1', [requestId]);
        await this.addMember(teamId, targetUserId, 'member');
        await NotificationService.createNotification(targetUserId, actingUserId, teamId, 'team_request_accepted', 'approved your request to join the team');
      } else {
        await query('DELETE FROM team_join_requests WHERE id = $1', [requestId]);
      }

      return { success: true };
    } catch (error) {
      logger.error('Respond to join request error:', error.message);
      throw error;
    }
  }

  // Invitations
  static async sendInvitation(teamId, inviterId, inviteeId) {
    try {
      // Verify inviter is owner/admin
      const auth = await query('SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2', [teamId, inviterId]);
      if (auth.rows.length === 0 || !['owner', 'admin'].includes(auth.rows[0].role)) {
        throw new Error('Only owners and admins can invite members');
      }

      await query(
        `INSERT INTO team_invitations (team_id, inviter_id, invitee_id, status)
         VALUES ($1, $2, $3, 'pending')
         ON CONFLICT (team_id, invitee_id) DO NOTHING`,
        [teamId, inviterId, inviteeId]
      );

      await NotificationService.createNotification(inviteeId, inviterId, teamId, 'team_invitation', 'invited you to join a team');

      return { success: true };
    } catch (error) {
      logger.error('Send invitation error:', error.message);
      throw error;
    }
  }

  static async getInvitationsForUser(userId) {
    try {
      const result = await query(
        `SELECT ti.*, t.name as team_name, t.description as team_description, t.avatar_url as team_avatar_url, u.username as inviter_username
         FROM team_invitations ti
         INNER JOIN teams t ON ti.team_id = t.id
         INNER JOIN users u ON ti.inviter_id = u.id
         WHERE ti.invitee_id = $1 AND ti.status = 'pending'`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Get invitations error:', error.message);
      throw error;
    }
  }

  static async respondToInvitation(invitationId, status, userId) {
    try {
      const inviteResult = await query('SELECT * FROM team_invitations WHERE id = $1 AND invitee_id = $2', [invitationId, userId]);
      if (inviteResult.rows.length === 0) throw new Error('Invitation not found');

      const invitation = inviteResult.rows[0];

      if (status === 'accepted') {
        await query('UPDATE team_invitations SET status = \'accepted\' WHERE id = $1', [invitationId]);
        await this.addMember(invitation.team_id, userId, 'member');
      } else {
        await query('DELETE FROM team_invitations WHERE id = $1', [invitationId]);
      }

      return { success: true };
    } catch (error) {
      logger.error('Respond to invitation error:', error.message);
      throw error;
    }
  }

  static async getFriendsToInvite(teamId, userId) {
    try {
      // Return friends of the user who are NOT currently members of this team
      const friendsResult = await query(
        `SELECT u.id, u.username, u.display_name, u.avatar_url, u.status
         FROM friends f
         INNER JOIN users u ON (f.user_id1 = u.id AND f.user_id2 = $1) OR (f.user_id2 = u.id AND f.user_id1 = $1)
         WHERE u.id != $1
           AND u.id NOT IN (SELECT user_id FROM team_members WHERE team_id = $2)`,
        [userId, teamId]
      );
      return friendsResult.rows;
    } catch (error) {
      logger.error('Get friends to invite error:', error.message);
      throw error;
    }
  }
}

module.exports = TeamService;
