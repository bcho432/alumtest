const path = require('path');

module.exports = (path, options) => {
  // Call the default resolver
  return options.defaultResolver(path, {
    ...options,
    // Add packageFilter to handle module resolution
    packageFilter: (pkg) => {
      // Handle module resolution for @/config/firebase
      if (pkg.name === '@/config/firebase') {
        return {
          ...pkg,
          main: path.resolve(__dirname, 'src/config/firebase.ts'),
        };
      }
      return pkg;
    },
  });
}; 