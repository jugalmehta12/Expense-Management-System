const { override } = require('customize-cra');

module.exports = override(
  // Ignore source map warnings for problematic modules
  (config) => {
    config.ignoreWarnings = [
      {
        module: /node_modules\/@formatjs\/fast-memoize/,
      },
      /Failed to parse source map/,
    ];
    
    // Suppress source map loader warnings
    const rules = config.module.rules.find(rule => Array.isArray(rule.oneOf));
    if (rules) {
      const sourceMapRule = rules.oneOf.find(rule => 
        rule.use && rule.use.some && rule.use.some(use => 
          use.loader && use.loader.includes('source-map-loader')
        )
      );
      if (sourceMapRule) {
        sourceMapRule.exclude = [
          /node_modules\/@formatjs\/fast-memoize/,
          sourceMapRule.exclude
        ].filter(Boolean);
      }
    }
    
    return config;
  }
);