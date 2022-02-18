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

  plugins: ['prettier', 'react', '@typescript-eslint'],
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
    'react/jsx-indent': ['warn', 2],
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error'],
    'jsx-a11y/no-static-element-interactions': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'react/react-in-jsx-scope': 'off',
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'import/no-named-as-default': 0,
    '@typescript-eslint/no-explicit-any': 1,
    strict: 'error',
    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: 'directive', next: '*' },
    ],
    'react/prop-types': 'off', // https://github.com/yannickcr/eslint-plugin-react/issues/1631
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        ts: 'never',
        tsx: 'never',
        js: 'never',
        jsx: 'never',
      },
    ],
    'react/jsx-filename-extension': 'off',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
};
