const express = require('express');
const path = require('path');
const compression = require('compression');
const app = express();

// Enable gzip compression for all responses
app.use(compression());

// Serve static files from the dist directory with caching
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1y', // Cache static assets for 1 year
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Cache HTML files for shorter duration
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
    // Cache JS/CSS files aggressively
    if (path.match(/\.(js|css)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Handle client-side routing - return index.html for all non-API routes
// Use app.use() instead of app.get() for catch-all to avoid path-to-regexp issues
app.use((req, res, next) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  // Serve index.html for all other routes (SPA routing)
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3063;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 E-LONDA Frontend running on port ${PORT}`);
  console.log(`📁 Serving files from: ${path.join(__dirname, 'dist')}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
});


