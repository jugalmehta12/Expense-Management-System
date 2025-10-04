module.exports = {
  extends: ['react-app'],
  rules: {
    // Disable console warnings in development
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    // Relax unused variable rules
    'no-unused-vars': ['warn', { 
      'varsIgnorePattern': '^_',
      'argsIgnorePattern': '^_',
      'ignoreRestSiblings': true
    }],
    // Relax React hooks dependency warnings
    'react-hooks/exhaustive-deps': 'warn',
    // Disable import order warnings
    'import/order': 'off',
    // Allow unused imports (common in development)
    '@typescript-eslint/no-unused-vars': 'off'
  },
  env: {
    browser: true,
    es6: true,
    node: true
  },
  overrides: [
    {
      files: ['src/**/*.js', 'src/**/*.jsx'],
      rules: {
        // Completely disable console warnings for src files
        'no-console': 'off'
      }
    }
  ]
};