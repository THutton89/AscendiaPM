// handlers/bugHandlers.js
const { app } = require('electron');
const path = require('path');
const { initGitRepo, storeBug, getBug, updateBug, listBugs } = require('../services/gitService');

async function handleCreateBug(bug) {
  const repoPath = await initGitRepo();
  return await storeBug(repoPath, bug);
}

async function handleGetBug(oid) {
  const repoPath = await initGitRepo();
  return await getBug(repoPath, oid);
}

async function handleUpdateBug(oid, updates) {
  const repoPath = await initGitRepo();
  return await updateBug(repoPath, oid, updates);
}

async function handleListBugs() {
  const repoPath = await initGitRepo();
  return await listBugs(repoPath);
}

// These handlers are for the generic git store/read
async function handleGitStore(type, content) {
  const repoPath = path.join(app.getPath('documents'), 'focal-repos', 'default');
  return await storeGitObject(repoPath, type, JSON.stringify(content));
}

async function handleGitRead(oid) {
  const repoPath = path.join(app.getPath('documents'), 'focal-repos', 'default');
  const content = await readGitObject(repoPath, oid);
  return JSON.parse(content);
}

module.exports = {
  handleCreateBug,
  handleGetBug,
  handleUpdateBug,
  handleListBugs,
  handleGitStore,
  handleGitRead
};