// database.js
const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js/dist/sql-wasm.js');

let db;

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
      locateFile: file => require.resolve('sql.js/dist/sql-wasm.wasm')
    });

    const dbPath = path.join(app.getPath('appData'), '.project-manager.db');

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
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        start_date TEXT,
        end_date TEXT,
        color TEXT DEFAULT '#2196F3',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        title TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        assigned_user_id INTEGER NOT NULL,
        project_id INTEGER,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS meetings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        task_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        mentions TEXT, -- JSON array of mentioned user IDs
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
        category TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT,
        user_id INTEGER,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(category, key, user_id)
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        user_id INTEGER,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_used_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS embeddings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content_type TEXT NOT NULL, -- 'task', 'project', 'comment', 'document', etc.
        content_id INTEGER NOT NULL, -- ID of the content item
        content_text TEXT NOT NULL, -- Original text that was embedded
        embedding TEXT NOT NULL, -- JSON array of float values
        model_name TEXT NOT NULL, -- Model used for embedding
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
        const userIdColumnExists = columns[0].values.some(row => row[1] === 'user_id');
        if (!userIdColumnExists) {
          // Drop and recreate the table with correct schema
          db.run("DROP TABLE IF EXISTS api_keys;");
          db.run(`
            CREATE TABLE api_keys (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              key TEXT NOT NULL UNIQUE,
              name TEXT NOT NULL,
              user_id INTEGER,
              active INTEGER NOT NULL DEFAULT 1,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              last_used_at TEXT,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
          `);
          console.log('Recreated api_keys table with user_id column');
        }
      }
    } catch (error) {
      console.log('Error migrating api_keys table:', error.message);
    }

    // Check and migrate projects table
    try {
      const columns = db.exec("PRAGMA table_info(projects);");
      if (columns.length > 0 && columns[0].values) {
        const userIdColumnExists = columns[0].values.some(row => row[1] === 'user_id');
        if (!userIdColumnExists) {
          // Drop and recreate the table with correct schema
          db.run("DROP TABLE IF EXISTS projects;");
          db.run(`
            CREATE TABLE projects (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              name TEXT NOT NULL,
              description TEXT,
              status TEXT NOT NULL DEFAULT 'active',
              start_date TEXT,
              end_date TEXT,
              color TEXT DEFAULT '#2196F3',
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
          `);
          console.log('Recreated projects table with user_id column');
        }
      }
    } catch (error) {
      console.log('Error migrating projects table:', error.message);
    }

    // Check and migrate meetings table
    try {
      const columns = db.exec("PRAGMA table_info(meetings);");
      if (columns.length > 0 && columns[0].values) {
        const statusColumnExists = columns[0].values.some(row => row[1] === 'status');
        if (!statusColumnExists) {
          // Add status column to existing meetings table
          db.run("ALTER TABLE meetings ADD COLUMN status TEXT NOT NULL DEFAULT 'scheduled';");
          console.log('Added status column to meetings table');
        }
      }
    } catch (error) {
      console.log('Error migrating meetings table:', error.message);
    }

    // --- End of schema ---

    console.log('Database tables initialized successfully');
    clearTimeout(timeout);
    return db; // Return the initialized database
  } catch (err) {
    clearTimeout(timeout);
    console.error('Database initialization failed:', err);
    throw err; // Re-throw to reject the promise
  }
}

// This promise is created *immediately* and memoized.
// All calls to getDatabase() will wait on this *single* promise.
const dbInitializationPromise = initializeDatabaseInternal();

/**
 * Gets the initialized database instance.
 * This is now an ASYNC function.
 * @returns {Promise<sqlite3.Database>} The database instance.
 */
async function getDatabase() {
  // Await the single, module-level promise
  await dbInitializationPromise;
  if (!db) {
    // This should theoretically never happen
    throw new Error('Database not initialized after promise.');
  }
  return db; // `db` is now guaranteed to be set
}

/**
 * Saves the in-memory database to the file system.
 * This is now also an ASYNC function.
 */
async function saveDatabase() {
  try {
    const dbInstance = await getDatabase(); // Make sure it's initialized
    const data = dbInstance.export();
    const dbPath = path.join(app.getPath('appData'), '.project-manager.db');
    fs.writeFileSync(dbPath, data);
    console.log('Database saved successfully.');
  } catch (err) {
    console.error('Failed to save database:', err);
  }
};

module.exports = {
  getDatabase,    // Now async
  saveDatabase,   // Now async
  dbInitializationPromise // Export the promise for main.js to wait on
};