const express = require('express');
const path = require('path');
const compression = require('compression'); // Middleware for response compression (gzip/deflate)
const app = express(); // Initialize the Express application

// --- Middleware Configuration ---

// Enable gzip compression for all responses
// This reduces the size of the response body, speeding up load times for users.
app.use(compression());

// Serve static files from the 'dist' directory with caching configuration
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1y', // Default: Cache static assets (like images, fonts) for 1 year
  etag: true, // Enable ETag generation
  lastModified: true, // Enable Last-Modified header
  setHeaders: (res, path) => {
    // Custom header logic based on file type

    // Cache HTML files for shorter duration, forcing revalidation (must-revalidate)
    // This ensures the main entry point is fresh without aggressive caching.
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
    
    // Cache JS/CSS files aggressively (immutable)
    // This is ideal for bundled assets with content hashes (like webpack output)
    // as their content never changes.
    if (path.match(/\.(js|css)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 31536000 seconds = 1 year
    }
  }
}));

// --- Client-Side Routing / SPA Fallback Handler ---

// Handle client-side routing (Single Page Application - SPA)
// app.use() acts as a catch-all for all routes that haven't been handled by 
// previous middleware (like static file serving).
app.use((req, res, next) => {
  // Check if the request path starts with '/api'
  if (req.path.startsWith('/api')) {
    // If it's an intended API route, return a 404 error
    // (Assuming API routes are handled elsewhere or this server only serves the frontend)
    return res.status(404).json({ error: 'API route not found' });
  }
  
  // Serve index.html for all other routes. 
  // This allows frontend routing frameworks (like React Router) to take over 
  // and handle paths like /about or /user/123.
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- Server Startup ---

const PORT = process.env.PORT || 3063; // Set port from environment variable or default to 3063

// Start the server and listen on the specified port and all network interfaces ('0.0.0.0')
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 E-LONDA Frontend running on port ${PORT}`);
  console.log(`📁 Serving files from: ${path.join(__dirname, 'dist')}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
});
