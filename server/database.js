// database.js
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

let db;
let dbInitializationPromise;

/**
 * This function runs ONCE when the module is loaded.
 * It sets up a promise that resolves with the db instance.
 */
async function initializeDatabaseInternal() {
  const timeout = setTimeout(() => {
    throw new Error('Database initialization timed out');
  }, 10000);

  try {
    const SQL = await initSqlJs({
      locateFile: file => `./node_modules/sql.js/dist/${file}`
    });

    const dbPath = path.join(__dirname, 'data', '.project-manager.db');

    // Ensure data directory exists
    if (!fs.existsSync(path.dirname(dbPath))) {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    }

    let buffer = null;
    if (fs.existsSync(dbPath)) {
      buffer = fs.readFileSync(dbPath);
    }

    db = new SQL.Database(buffer); // Set the module-level 'db' variable

    // --- Run all schema migrations ---

    await db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        organization_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        start_date TEXT,
        end_date TEXT,
        color TEXT DEFAULT '#2196F3',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS organizations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        owner_id INTEGER,
        settings TEXT,
        work_hours_start TEXT DEFAULT '07:00',
        work_hours_end TEXT DEFAULT '17:00',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        organization_id INTEGER,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'user',
        password TEXT,
        google_id TEXT UNIQUE,
        google_access_token TEXT,
        google_refresh_token TEXT,
        avatar_url TEXT,
        auth_provider TEXT DEFAULT 'local',
        notification_settings TEXT,
        max_daily_hours REAL DEFAULT 8.0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        organization_id INTEGER NOT NULL,
        project_id INTEGER,
        sprint_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'todo',
        priority TEXT NOT NULL DEFAULT 'medium',
        due_date TEXT,
        estimated_hours REAL,
        actual_hours REAL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS task_assignments (
        task_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (task_id, user_id),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS time_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        hours_spent REAL NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS agent_config (
        agent_type TEXT PRIMARY KEY,
        model_name TEXT NOT NULL
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        organization_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        assigned_user_id INTEGER NOT NULL,
        project_id INTEGER,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS meetings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        organization_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        organizer_id INTEGER NOT NULL,
        location TEXT,
        meeting_link TEXT,
        status TEXT NOT NULL DEFAULT 'scheduled',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS meeting_participants (
        meeting_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending', -- pending, accepted, declined
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (meeting_id, user_id),
        FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        organization_id INTEGER NOT NULL,
        task_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        mentions TEXT, -- JSON array of mentioned user IDs
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS meeting_recordings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meeting_id INTEGER NOT NULL,
        recording_url TEXT,
        transcript TEXT,
        duration INTEGER,
        status TEXT NOT NULL DEFAULT 'recording',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS lmstudio_config (
        rowid INTEGER PRIMARY KEY,
        base_url TEXT NOT NULL,
        model TEXT NOT NULL
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        organization_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT,
        user_id INTEGER,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(organization_id, category, key, user_id),
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        organization_id INTEGER NOT NULL,
        key TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        user_id INTEGER,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_used_at TEXT,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS embeddings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        organization_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content_type TEXT NOT NULL, -- 'task', 'project', 'comment', 'document', etc.
        content_id INTEGER NOT NULL, -- ID of the content item
        content_text TEXT NOT NULL, -- Original text that was embedded
        embedding TEXT NOT NULL, -- JSON array of float values
        model_name TEXT NOT NULL, -- Model used for embedding
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS embedding_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        base_url TEXT NOT NULL DEFAULT 'http://127.0.0.1:5003',
        model_name TEXT NOT NULL DEFAULT 'Qwen/Qwen3-Embedding-4B',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default embedding config if not exists
    const configCheck = db.exec('SELECT id FROM embedding_config LIMIT 1');
    if (configCheck.length === 0 || configCheck[0].values.length === 0) {
      db.run(`
        INSERT INTO embedding_config (base_url, model_name)
        VALUES ('http://127.0.0.1:5003', 'Qwen/Qwen3-Embedding-4B')
      `);
    }

    // Migration: Add organization_id columns to existing tables and create default organization
    try {
      // Check if users table has organization_id column
      const userColumns = db.exec("PRAGMA table_info(users);");
      const hasOrgId = userColumns[0].values.some(row => row[1] === 'organization_id');

      if (!hasOrgId) {
        console.log('Adding organization_id column to users table...');
        db.run("ALTER TABLE users ADD COLUMN organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;");
      }

      // Check if projects table has organization_id column
      const projectColumns = db.exec("PRAGMA table_info(projects);");
      const projectHasOrgId = projectColumns[0].values.some(row => row[1] === 'organization_id');

      if (!projectHasOrgId) {
        console.log('Adding organization_id column to projects table...');
        db.run("ALTER TABLE projects ADD COLUMN organization_id INTEGER NOT NULL DEFAULT 1 REFERENCES organizations(id) ON DELETE CASCADE;");
      }

      // Check if tasks table has organization_id column
      const taskColumns = db.exec("PRAGMA table_info(tasks);");
      const taskHasOrgId = taskColumns[0].values.some(row => row[1] === 'organization_id');

      if (!taskHasOrgId) {
        console.log('Adding organization_id column to tasks table...');
        db.run("ALTER TABLE tasks ADD COLUMN organization_id INTEGER NOT NULL DEFAULT 1 REFERENCES organizations(id) ON DELETE CASCADE;");
      }

      // Check if appointments table has organization_id column
      const appointmentColumns = db.exec("PRAGMA table_info(appointments);");
      const appointmentHasOrgId = appointmentColumns[0].values.some(row => row[1] === 'organization_id');

      if (!appointmentHasOrgId) {
        console.log('Adding organization_id column to appointments table...');
        db.run("ALTER TABLE appointments ADD COLUMN organization_id INTEGER NOT NULL DEFAULT 1 REFERENCES organizations(id) ON DELETE CASCADE;");
      }

      // Check if meetings table has organization_id column
      const meetingColumns = db.exec("PRAGMA table_info(meetings);");
      const meetingHasOrgId = meetingColumns[0].values.some(row => row[1] === 'organization_id');

      if (!meetingHasOrgId) {
        console.log('Adding organization_id column to meetings table...');
        db.run("ALTER TABLE meetings ADD COLUMN organization_id INTEGER NOT NULL DEFAULT 1 REFERENCES organizations(id) ON DELETE CASCADE;");
      }

      // Check if comments table has organization_id column
      const commentColumns = db.exec("PRAGMA table_info(comments);");
      const commentHasOrgId = commentColumns[0].values.some(row => row[1] === 'organization_id');

      if (!commentHasOrgId) {
        console.log('Adding organization_id column to comments table...');
        db.run("ALTER TABLE comments ADD COLUMN organization_id INTEGER NOT NULL DEFAULT 1 REFERENCES organizations(id) ON DELETE CASCADE;");
      }

      // Check if app_settings table has organization_id column
      const settingsColumns = db.exec("PRAGMA table_info(app_settings);");
      const settingsHasOrgId = settingsColumns[0].values.some(row => row[1] === 'organization_id');

      if (!settingsHasOrgId) {
        console.log('Adding organization_id column to app_settings table...');
        db.run("ALTER TABLE app_settings ADD COLUMN organization_id INTEGER NOT NULL DEFAULT 1 REFERENCES organizations(id) ON DELETE CASCADE;");
      }

      // Check if api_keys table has organization_id column
      const apiKeyColumns = db.exec("PRAGMA table_info(api_keys);");
      const apiKeyHasOrgId = apiKeyColumns[0].values.some(row => row[1] === 'organization_id');

      if (!apiKeyHasOrgId) {
        console.log('Adding organization_id column to api_keys table...');
        db.run("ALTER TABLE api_keys ADD COLUMN organization_id INTEGER NOT NULL DEFAULT 1 REFERENCES organizations(id) ON DELETE CASCADE;");
      }

      // Check if embeddings table has organization_id column
      const embeddingColumns = db.exec("PRAGMA table_info(embeddings);");
      const embeddingHasOrgId = embeddingColumns[0].values.some(row => row[1] === 'organization_id');

      if (!embeddingHasOrgId) {
        console.log('Adding organization_id column to embeddings table...');
        db.run("ALTER TABLE embeddings ADD COLUMN organization_id INTEGER NOT NULL DEFAULT 1 REFERENCES organizations(id) ON DELETE CASCADE;");
      }

      // Check if organizations table has work hours columns
      const orgColumns = db.exec("PRAGMA table_info(organizations);");
      const hasWorkHoursStart = orgColumns[0].values.some(row => row[1] === 'work_hours_start');
      const hasWorkHoursEnd = orgColumns[0].values.some(row => row[1] === 'work_hours_end');

      if (!hasWorkHoursStart) {
        console.log('Adding work_hours_start column to organizations table...');
        db.run("ALTER TABLE organizations ADD COLUMN work_hours_start TEXT DEFAULT '07:00';");
      }

      if (!hasWorkHoursEnd) {
        console.log('Adding work_hours_end column to organizations table...');
        db.run("ALTER TABLE organizations ADD COLUMN work_hours_end TEXT DEFAULT '17:00';");
      }

      // Create default organization if it doesn't exist
      const orgCheck = db.exec('SELECT id FROM organizations LIMIT 1');
      if (orgCheck.length === 0 || orgCheck[0].values.length === 0) {
        console.log('Creating default organization...');
        // Create default organization
        db.run(`
          INSERT INTO organizations (name, description, owner_id, settings)
          VALUES ('Default Organization', 'Default organization for existing users', 1, '{}')
        `);

        const orgIdResult = db.exec('SELECT last_insert_rowid() as id');
        const defaultOrgId = orgIdResult[0].values[0][0];

        // Assign all existing users to the default organization
        db.run('UPDATE users SET organization_id = ? WHERE organization_id IS NULL OR organization_id = 0', [defaultOrgId]);

        // Ensure the owner of the default organization is assigned to it
        db.run('UPDATE users SET organization_id = ? WHERE id = (SELECT owner_id FROM organizations WHERE id = ?)', [defaultOrgId, defaultOrgId]);

        // Ensure organization owners are assigned to their organizations
        const ownerUpdates = db.exec(`
          SELECT o.id as org_id, o.owner_id as user_id
          FROM organizations o
          JOIN users u ON u.id = o.owner_id
          WHERE u.organization_id IS NULL OR u.organization_id = 0
        `);

        if (ownerUpdates.length > 0 && ownerUpdates[0].values) {
          ownerUpdates[0].values.forEach(row => {
            db.run('UPDATE users SET organization_id = ? WHERE id = ?', [row[0], row[1]]);
          });
        }

        // Also ensure any user that owns an organization is assigned to it
        db.run(`
          UPDATE users
          SET organization_id = (
            SELECT id FROM organizations WHERE owner_id = users.id LIMIT 1
          )
          WHERE organization_id IS NULL AND id IN (
            SELECT owner_id FROM organizations
          )
        `);

        // Assign all existing data to the default organization
        db.run('UPDATE projects SET organization_id = ? WHERE organization_id IS NULL OR organization_id = 0', [defaultOrgId]);
        db.run('UPDATE tasks SET organization_id = ? WHERE organization_id IS NULL OR organization_id = 0', [defaultOrgId]);
        db.run('UPDATE appointments SET organization_id = ? WHERE organization_id IS NULL OR organization_id = 0', [defaultOrgId]);
        db.run('UPDATE meetings SET organization_id = ? WHERE organization_id IS NULL OR organization_id = 0', [defaultOrgId]);
        db.run('UPDATE comments SET organization_id = ? WHERE organization_id IS NULL OR organization_id = 0', [defaultOrgId]);
        db.run('UPDATE app_settings SET organization_id = ? WHERE organization_id IS NULL OR organization_id = 0', [defaultOrgId]);
        db.run('UPDATE api_keys SET organization_id = ? WHERE organization_id IS NULL OR organization_id = 0', [defaultOrgId]);
        db.run('UPDATE embeddings SET organization_id = ? WHERE organization_id IS NULL OR organization_id = 0', [defaultOrgId]);

        console.log('Migration completed: Default organization created and data assigned');
      }

      // Always run organization membership assignment (not just on first creation)
      console.log('Running organization membership assignment...');

      // Check current state
      const userCount = db.exec('SELECT COUNT(*) as count FROM users');
      const orgCount = db.exec('SELECT COUNT(*) as count FROM organizations');
      const assignedUsers = db.exec('SELECT COUNT(*) as count FROM users WHERE organization_id IS NOT NULL AND organization_id != 0');

      console.log(`Users: ${userCount[0]?.values[0][0] || 0}, Organizations: ${orgCount[0]?.values[0][0] || 0}, Assigned users: ${assignedUsers[0]?.values[0][0] || 0}`);

      // First, ensure all organization owners are assigned to their organizations
      const allOwners = db.exec(`
        SELECT DISTINCT o.owner_id as user_id, o.id as org_id
        FROM organizations o
        WHERE o.owner_id IS NOT NULL
      `);

      if (allOwners.length > 0 && allOwners[0].values) {
        console.log(`Ensuring ${allOwners[0].values.length} organization owners are assigned...`);
        allOwners[0].values.forEach(row => {
          const userId = row[0];
          const orgId = row[1];
          console.log(`Assigning user ${userId} to organization ${orgId}`);
          db.run('UPDATE users SET organization_id = ? WHERE id = ? AND (organization_id IS NULL OR organization_id = 0)', [orgId, userId]);
        });
      }

      // Then assign any remaining users without organizations to the default organization
      const defaultOrgCheck = db.exec('SELECT id FROM organizations WHERE name = "Default Organization" LIMIT 1');
      if (defaultOrgCheck.length > 0 && defaultOrgCheck[0].values.length > 0) {
        const defaultOrgId = defaultOrgCheck[0].values[0][0];
        const unassignedUsers = db.exec('SELECT id FROM users WHERE organization_id IS NULL OR organization_id = 0');
        if (unassignedUsers.length > 0 && unassignedUsers[0].values) {
          console.log(`Assigning ${unassignedUsers[0].values.length} users to default organization ${defaultOrgId}...`);
          unassignedUsers[0].values.forEach(row => {
            const userId = row[0];
            console.log(`Assigning user ${userId} to default organization ${defaultOrgId}`);
            db.run('UPDATE users SET organization_id = ? WHERE id = ?', [defaultOrgId, userId]);
          });
        }
      }

      // Final check
      const finalAssigned = db.exec('SELECT COUNT(*) as count FROM users WHERE organization_id IS NOT NULL AND organization_id != 0');
      console.log(`Final assigned users: ${finalAssigned[0]?.values[0][0] || 0}`);
      console.log('Organization membership assignment completed');
    } catch (migrationError) {
      console.log('Migration may have already been completed or tables are new:', migrationError.message);
    }

    // Add password column to users table if it doesn't exist
    try {
      const columns = db.exec("PRAGMA table_info(users);");
      if (columns.length > 0 && columns[0].values) {
        const passwordColumnExists = columns[0].values.some(row => row[1] === 'password');
        if (!passwordColumnExists) {
          db.run("ALTER TABLE users ADD COLUMN password TEXT;");
        }
      }
    } catch (error) {
      console.log('Users table not found or error checking columns:', error.message);
    }

    // Check and migrate api_keys table
    try {
      const columns = db.exec("PRAGMA table_info(api_keys);");
      if (columns.length > 0 && columns[0].values) {
        const nameColumnExists = columns[0].values.some(row => row[1] === 'name');
        if (!nameColumnExists) {
          db.run("ALTER TABLE api_keys ADD COLUMN name TEXT NOT NULL DEFAULT 'default-key';");
        }
      }
    } catch (error) {
      console.log('api_keys table not found or error checking columns:', error.message);
    }

    // Add GitHub OAuth columns to users table
    try {
      const userColumns = db.exec("PRAGMA table_info(users);");
      if (userColumns.length > 0 && userColumns[0].values) {
        const githubIdExists = userColumns[0].values.some(row => row[1] === 'github_id');
        if (!githubIdExists) {
          console.log('Adding github_id column to users table...');
          db.run("ALTER TABLE users ADD COLUMN github_id TEXT;");
        }
      }
    } catch (error) {
      console.log('Error adding GitHub columns to users table:', error.message);
    }

    clearTimeout(timeout);
    console.log('Database initialized successfully');
    return db;
  } catch (err) {
    clearTimeout(timeout);
    console.error('Database initialization failed:', err);
    throw err;
  }
}

function getDatabase() {
  if (!dbInitializationPromise) {
    dbInitializationPromise = initializeDatabaseInternal();
  }
  return dbInitializationPromise;
}

async function saveDatabase() {
  const dbInstance = await getDatabase();
  const data = dbInstance.export();
  const buffer = Buffer.from(data);
  const dbPath = path.join(__dirname, 'data', '.project-manager.db');
  fs.writeFileSync(dbPath, buffer);
}

module.exports = {
  getDatabase,
  saveDatabase,
  dbInitializationPromise: getDatabase()
};