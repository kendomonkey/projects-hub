const express = require('express');
const httpProxy = require('http-proxy');
const fs = require('fs');
const path = require('path');

const app = express();
const proxy = httpProxy.createProxyServer({});

// Load projects config
const projectsConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'projects.json'), 'utf-8'));
const projects = new Map();

projectsConfig.projects.forEach(project => {
  projects.set(project.id, project);
});

// Dashboard
app.get('/', (req, res) => {
  const projectsList = Array.from(projects.values())
    .map(p => `
      <li>
        <a href="/${p.id}/">
          <strong>${p.name}</strong><br>
          <small>${p.description}</small>
        </a>
      </li>
    `)
    .join('');

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Projects Hub</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
        }
        h1 { color: #333; }
        ul { list-style: none; padding: 0; }
        li {
          margin: 15px 0;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: #f9f9f9;
        }
        li a {
          text-decoration: none;
          color: inherit;
          display: block;
        }
        li:hover {
          background: #f0f0f0;
          border-color: #667eea;
        }
        small { color: #666; }
      </style>
    </head>
    <body>
      <h1>📦 Projects</h1>
      <ul>
        ${projectsList}
      </ul>
    </body>
    </html>
  `);
});

// Project router
app.use('/:projectId/*', (req, res) => {
  const projectId = req.params.projectId;
  const project = projects.get(projectId);

  if (!project || !project.enabled) {
    return res.status(404).send('Project not found');
  }

  const target = `http://localhost:${project.port}`;
  
  proxy.web(req, res, { target }, (err) => {
    console.error(`Proxy error for ${projectId}:`, err.message);
    res.status(503).send('Project unavailable');
  });
});

const PORT = 3010;
app.listen(PORT, () => {
  console.log(`Projects hub running on port ${PORT}`);
  console.log(`Projects: ${Array.from(projects.keys()).join(', ')}`);
});
