const { query } = require('../config/database');

const initDatabase = async () => {
  try {
    // 1. Create users table (if not exists)
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(500),
        status VARCHAR(20) DEFAULT 'offline',
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add extra user columns if they don't exist
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(100)`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status_message VARCHAR(255)`);

    // 2. Create teams table (if not exists)
    await query(`
      CREATE TABLE IF NOT EXISTS teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        avatar_url VARCHAR(500),
        is_private BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false`);
    await query(`ALTER TABLE teams ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500)`);

    // 3. Create channels table
    await query(`
      CREATE TABLE IF NOT EXISTS channels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, name)
      )
    `);

    // 4. Create conversations table
    await query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Create conversation_members table
    await query(`
      CREATE TABLE IF NOT EXISTS conversation_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(conversation_id, user_id)
      )
    `);

    // 6. Create team_members table
    await query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, user_id)
      )
    `);

    // 7. Create messages table
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text',
        is_edited BOOLEAN DEFAULT false,
        edited_at TIMESTAMP,
        reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Alter messages to add nullable channels and conversations if they were missing
    await query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES channels(id) ON DELETE CASCADE`);
    await query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE`);
    await query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL`);
    await query(`ALTER TABLE messages ALTER COLUMN team_id DROP NOT NULL`);

    // 8. Create files/attachments table
    await query(`
      CREATE TABLE IF NOT EXISTS message_attachments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_size INTEGER NOT NULL,
        file_type VARCHAR(100),
        file_url VARCHAR(500) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 9. Create notifications table
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        related_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        content TEXT,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 10. Create friend_requests table
    await query(`
      CREATE TABLE IF NOT EXISTS friend_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(sender_id, receiver_id)
      )
    `);

    // 11. Create friends table
    await query(`
      CREATE TABLE IF NOT EXISTS friends (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id1 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_id2 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id1, user_id2)
      )
    `);

    // 12. Create team_join_requests table
    await query(`
      CREATE TABLE IF NOT EXISTS team_join_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, user_id)
      )
    `);

    // 13. Create team_invitations table
    await query(`
      CREATE TABLE IF NOT EXISTS team_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invitee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, invitee_id)
      )
    `);

    // 14. Create message_reactions table
    await query(`
      CREATE TABLE IF NOT EXISTS message_reactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reaction VARCHAR(50) NOT NULL,
        UNIQUE(message_id, user_id, reaction)
      )
    `);

    // 15. Create message_read_status table
    await query(`
      CREATE TABLE IF NOT EXISTS message_read_status (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(message_id, user_id)
      )
    `);

    // Create Indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_channels_team_id ON channels(team_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_messages_team_id ON messages(team_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_friends_user_id1 ON friends(user_id1)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_friends_user_id2 ON friends(user_id2)`);

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    throw error;
  }
};

if (require.main === module) {
  initDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = initDatabase;
