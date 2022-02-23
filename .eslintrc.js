module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'standard',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': [
      'warn',
      { endOfLine: 'auto' },
      { usePrettierrc: true },
    ],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-empty': 'off',
    'max-len': [1, { code: 80, comments: 999 }],
    'linebreak-style': 'off',
    'no-plusplus': 'off',
    'prettier/tabWidth': 'off',
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    'import/no-named-as-default': 0,
    '@typescript-eslint/no-explicit-any': 1,
    strict: 'error',
    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: 'directive', next: '*' },
    ],
  },
};
