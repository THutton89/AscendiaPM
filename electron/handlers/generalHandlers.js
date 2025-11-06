// handlers/generalHandlers.js
const { getDatabase, saveDatabase, dbInitializationPromise } = require('../database');

async function handleDbQuery(sql, params) {
  const db = await getDatabase();
  if (!db || !db.exec) {
    throw new Error('Database not properly initialized');
  }
  if (!sql || typeof sql !== 'string') {
    throw new Error('Invalid SQL query: must be a non-empty string');
  }

  let validatedParams = [];
  let processedSql = sql;

  // Handle named parameters (@param) by converting to positional parameters (?)
  if (params && Array.isArray(params) && params.length > 0) {
    const paramObj = params[0];
    if (typeof paramObj === 'object' && paramObj !== null) {
      // Convert named parameters to positional
      const paramNames = [];
      processedSql = sql.replace(/@(\w+)/g, (match, name) => {
        paramNames.push(name);
        return '?';
      });

      // Extract values in the order they appear in the SQL
      validatedParams = paramNames.map(name => {
        const value = paramObj[name];
        return value === undefined || value === null ? null : value;
      });
    } else {
      // Regular positional parameters
      validatedParams = params.map(p => {
        if (p === undefined || p === null) {
          return null;
        }
        return p;
      });
    }
  }

  try {
    const isSelect = processedSql.trim().toUpperCase().startsWith('SELECT');

    if (isSelect) {
      // For SELECT queries, use db.exec
      const result = db.exec(processedSql, validatedParams);
      if (result.length === 0) {
        return [];
      }
      const { columns, values } = result[0];
      const results = values.map(row => {
        const obj = {};
        columns.forEach((col, i) => {
          obj[col] = row[i];
        });
        return obj;
      });
      return results;
    } else {
      // For INSERT/UPDATE/DELETE, use db.run
      const result = db.run(processedSql, validatedParams);
      await saveDatabase();

      // For INSERT operations, return the insert ID if available
      if (processedSql.trim().toUpperCase().startsWith('INSERT')) {
        return [{ insertId: result.insertId }];
      }

      return [];
    }
  } catch (err) {
    console.error('Database query failed:', { sql: processedSql, params: validatedParams, error: err.message });
    throw err;
  }
}

module.exports = {
  handleDbQuery
};