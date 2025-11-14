// services/gitService.js
const fs = require('fs');
const path = require('path');
const git = require('isomorphic-git');

async function initGitRepo() {
  const repoPath = path.join(__dirname, '../data/focal-repos', 'default');
  
  if (!fs.existsSync(repoPath)) {
    fs.mkdirSync(repoPath, { recursive: true });
    await git.init({ fs, dir: repoPath });
    
    fs.writeFileSync(path.join(repoPath, '.gitignore'),
      'node_modules/\n' +
      'dist/\n' +
      '.DS_Store\n' +
      '*.log\n'
    );
    
    await git.setConfig({
      fs,
      dir: repoPath,
      path: 'user.name',
      value: 'Focal User'
    });
    await git.setConfig({
      fs,
      dir: repoPath,
      path: 'user.email',
      value: 'user@focal.local'
    });
  }
  return repoPath;
}

async function storeGitObject(repoPath, type, content) {
  const oid = await git.writeObject({
    fs,
    dir: repoPath,
    type,
    object: Buffer.from(content)
  });
  return oid;
}

async function readGitObject(repoPath, oid) {
  const { object } = await git.readObject({
    fs,
    dir: repoPath,
    oid
  });
  return object.toString();
}

// Bug Functions
async function storeBug(repoPath, bug) {
  const oid = await storeGitObject(repoPath, 'blob', JSON.stringify(bug));
  return oid;
}

async function getBug(repoPath, oid) {
  const content = await readGitObject(repoPath, oid);
  return JSON.parse(content);
}

async function updateBug(repoPath, oid, updates) {
  const bug = await getBug(repoPath, oid);
  const updatedBug = { ...bug, ...updates };
  return await storeBug(repoPath, updatedBug);
}

async function listBugs(repoPath) {
  const refs = await git.listRefs({ fs, dir: repoPath });
  const bugRefs = refs.filter(ref => ref.ref.startsWith('refs/bugs/'));
  return Promise.all(bugRefs.map(async ref => ({
    oid: ref.oid,
    ...await getBug(repoPath, ref.oid)
  })));
}

// Project Functions
async function storeProject(repoPath, project) {
  const oid = await storeGitObject(repoPath, 'blob', JSON.stringify(project));
  await git.commit({
    fs,
    dir: repoPath,
    author: { name: 'Focal User', email: 'user@focal.local' },
    message: `Project ${project.name} updated`
  });
  return oid;
}

async function getProject(repoPath, oid) {
  const content = await readGitObject(repoPath, oid);
  return JSON.parse(content);
}

// Task Functions
async function storeTask(repoPath, task) {
  const oid = await storeGitObject(repoPath, 'blob', JSON.stringify(task));
  await git.commit({
    fs,
    dir: repoPath,
    author: { name: 'Focal User', email: 'user@focal.local' },
    message: `Task ${task.title} updated`
  });
  return oid;
}

async function getTask(repoPath, oid) {
  const content = await readGitObject(repoPath, oid);
  return JSON.parse(content);
}

// User Functions
async function storeUser(repoPath, user) {
  const oid = await storeGitObject(repoPath, 'blob', JSON.stringify(user));
  await git.commit({
    fs,
    dir: repoPath,
    author: { name: 'Focal User', email: 'user@focal.local' },
    message: `User ${user.name} updated`
  });
  return oid;
}

async function getUser(repoPath, oid) {
  const content = await readGitObject(repoPath, oid);
  return JSON.parse(content);
}

module.exports = {
  initGitRepo,
  storeGitObject,
  readGitObject,
  storeBug,
  getBug,
  updateBug,
  listBugs,
  storeProject,
  getProject,
  storeTask,
  getTask,
  storeUser,
  getUser,
};