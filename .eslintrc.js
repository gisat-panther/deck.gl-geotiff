module.exports = {
    env: {
        browser: true,
        es2021: true
    },

    extends: [
        'standard',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module'
    },
    plugins: ['react', '@typescript-eslint'],
    rules: {

        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'no-empty': 'off',
        'max-len': [1, { code: 100, comments: 999, ignoreStrings: true, ignoreUrls: true }],
        'linebreak-style': 'off',
        'no-plusplus': 'off',
        indent: ['error', 4],
        'no-use-before-define': 'off',
        '@typescript-eslint/no-use-before-define': ['error'],
        'jsx-a11y/no-static-element-interactions': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
        'react/react-in-jsx-scope': 'off',
        'no-unused-vars': 'warn',
        'no-console': 'off',
        'import/no-named-as-default': 0,
        strict: 'error',
        'padding-line-between-statements': [
            'error',
            { blankLine: 'always', prev: 'directive', next: '*' }
        ],
        'react/prop-types': 'off'
    }
}
