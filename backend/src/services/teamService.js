const { pool, query } = require('../config/database');

const accessError = (message = 'You are not a member of this team') => {
  const error = new Error(message);
  error.status = 403;
  return error;
};

class TeamService {
  static async getMembership(teamId, userId) {
    const result = await query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, userId]
    );
    return result.rows[0] || null;
  }

  static async assertMember(teamId, userId) {
    const membership = await this.getMembership(teamId, userId);
    if (!membership) throw accessError();
    return membership;
  }

  static async assertManager(teamId, userId) {
    const membership = await this.assertMember(teamId, userId);
    if (!['owner', 'admin'].includes(membership.role)) {
      throw accessError('Only team owners and admins can perform this action');
    }
    return membership;
  }

  static async getTeamsForUser(userId) {
    const result = await query(
      `SELECT t.id, t.name, t.description, t.avatar_url, t.created_at, tm.role
       FROM teams t
       INNER JOIN team_members tm ON tm.team_id = t.id
       WHERE tm.user_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  static async getTeamForUser(teamId, userId) {
    await this.assertMember(teamId, userId);

    const teamResult = await query(
      `SELECT id, name, description, avatar_url, created_by, created_at
       FROM teams WHERE id = $1`,
      [teamId]
    );
    const team = teamResult.rows[0];
    if (!team) {
      const error = new Error('Team not found');
      error.status = 404;
      throw error;
    }

    const members = await query(
      `SELECT u.id, u.username, u.avatar_url, u.status, tm.role, tm.joined_at
       FROM team_members tm
       INNER JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = $1
       ORDER BY tm.joined_at ASC`,
      [teamId]
    );
    return { ...team, members: members.rows };
  }

  static async createTeam(userId, name, description) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const team = await client.query(
        `INSERT INTO teams (name, description, created_by)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [name.trim(), description?.trim() || null, userId]
      );
      await client.query(
        'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
        [team.rows[0].id, userId, 'owner']
      );
      await client.query('COMMIT');
      return this.getTeamForUser(team.rows[0].id, userId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async addMember(teamId, actorId, userId) {
    await this.assertManager(teamId, actorId);
    const result = await query(
      `INSERT INTO team_members (team_id, user_id, role)
       VALUES ($1, $2, 'member')
       ON CONFLICT (team_id, user_id) DO NOTHING
       RETURNING user_id`,
      [teamId, userId]
    );
    if (result.rowCount === 0) {
      const error = new Error('User is already a team member');
      error.status = 409;
      throw error;
    }
    return this.getTeamForUser(teamId, actorId);
  }

  static async removeMember(teamId, actorId, userId) {
    await this.assertManager(teamId, actorId);
    const team = await query('SELECT created_by FROM teams WHERE id = $1', [teamId]);
    if (team.rows[0]?.created_by === userId) {
      throw accessError('The team owner cannot be removed');
    }
    const result = await query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, userId]
    );
    if (result.rowCount === 0) {
      const error = new Error('Team member not found');
      error.status = 404;
      throw error;
    }
    return { success: true };
  }

  static async deleteTeam(teamId, actorId) {
    const result = await query(
      'DELETE FROM teams WHERE id = $1 AND created_by = $2',
      [teamId, actorId]
    );
    if (result.rowCount === 0) throw accessError('Only the team owner can delete this team');
    return { success: true };
  }
}

module.exports = TeamService;
