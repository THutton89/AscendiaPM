// handlers/gitHandlers.js
const axios = require('axios');
const { getDatabase, saveDatabase } = require('../database');

async function handleGetGitHubRepos(accessToken) {
  try {
    if (!accessToken) {
      throw new Error('GitHub access token required');
    }

    // Get user's repositories
    const reposResponse = await axios.get('https://api.github.com/user/repos', {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      params: {
        sort: 'updated',
        per_page: 100
      }
    });

    return {
      success: true,
      repos: reposResponse.data.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        html_url: repo.html_url,
        description: repo.description,
        private: repo.private,
        default_branch: repo.default_branch
      }))
    };
  } catch (error) {
    console.error('Get GitHub repos error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function handleCreateGitHubCommit(accessToken, { repo, branch, message, content, path }) {
  try {
    if (!accessToken) {
      throw new Error('GitHub access token required');
    }

    // Get the current commit SHA for the branch
    const refResponse = await axios.get(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const latestCommitSha = refResponse.data.object.sha;

    // Get the commit object
    const commitResponse = await axios.get(`https://api.github.com/repos/${repo}/git/commits/${latestCommitSha}`, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const treeSha = commitResponse.data.tree.sha;

    // Create a blob with the content
    const blobResponse = await axios.post(`https://api.github.com/repos/${repo}/git/blobs`, {
      content: Buffer.from(content).toString('base64'),
      encoding: 'base64'
    }, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const blobSha = blobResponse.data.sha;

    // Create a new tree
    const treeResponse = await axios.post(`https://api.github.com/repos/${repo}/git/trees`, {
      base_tree: treeSha,
      tree: [{
        path: path,
        mode: '100644',
        type: 'blob',
        sha: blobSha
      }]
    }, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const newTreeSha = treeResponse.data.sha;

    // Create a new commit
    const newCommitResponse = await axios.post(`https://api.github.com/repos/${repo}/git/commits`, {
      message: message,
      tree: newTreeSha,
      parents: [latestCommitSha]
    }, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const newCommitSha = newCommitResponse.data.sha;

    // Update the reference
    await axios.patch(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, {
      sha: newCommitSha
    }, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    return {
      success: true,
      commit: {
        sha: newCommitSha,
        message: message,
        url: `https://github.com/${repo}/commit/${newCommitSha}`
      }
    };
  } catch (error) {
    console.error('Create GitHub commit error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function handleGetGitHubRepoContents(accessToken, { repo, path = '', branch = 'main' }) {
  try {
    if (!accessToken) {
      throw new Error('GitHub access token required');
    }

    const contentsResponse = await axios.get(`https://api.github.com/repos/${repo}/contents/${path}`, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      params: {
        ref: branch
      }
    });

    // If it's a file, return the content
    if (contentsResponse.data.type === 'file') {
      return {
        success: true,
        type: 'file',
        content: Buffer.from(contentsResponse.data.content, 'base64').toString('utf-8'),
        path: contentsResponse.data.path,
        sha: contentsResponse.data.sha
      };
    }

    // If it's a directory, return the list of files
    return {
      success: true,
      type: 'directory',
      contents: contentsResponse.data.map(item => ({
        name: item.name,
        path: item.path,
        type: item.type,
        sha: item.sha,
        url: item.html_url
      }))
    };
  } catch (error) {
    console.error('Get GitHub repo contents error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function handlePullGitHubRepo(accessToken, { repo, branch = 'main' }) {
  try {
    if (!accessToken) {
      throw new Error('GitHub access token required');
    }

    // Get the latest commit from the branch
    const refResponse = await axios.get(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const latestCommitSha = refResponse.data.object.sha;

    // Get the commit object
    const commitResponse = await axios.get(`https://api.github.com/repos/${repo}/git/commits/${latestCommitSha}`, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const treeSha = commitResponse.data.tree.sha;

    // Get the tree contents recursively
    const treeResponse = await axios.get(`https://api.github.com/repos/${repo}/git/trees/${treeSha}`, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      params: {
        recursive: 1
      }
    });

    // Get contents of all files
    const files = [];
    for (const item of treeResponse.data.tree) {
      if (item.type === 'blob') {
        try {
          const fileResponse = await axios.get(`https://api.github.com/repos/${repo}/git/blobs/${item.sha}`, {
            headers: {
              'Authorization': `token ${accessToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });

          files.push({
            path: item.path,
            content: Buffer.from(fileResponse.data.content, 'base64').toString('utf-8'),
            sha: item.sha
          });
        } catch (fileError) {
          console.warn(`Could not fetch content for ${item.path}:`, fileError.message);
        }
      }
    }

    return {
      success: true,
      repo: repo,
      branch: branch,
      commit: latestCommitSha,
      files: files
    };
  } catch (error) {
    console.error('Pull GitHub repo error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  handleGetGitHubRepos,
  handleCreateGitHubCommit,
  handleGetGitHubRepoContents,
  handlePullGitHubRepo
};