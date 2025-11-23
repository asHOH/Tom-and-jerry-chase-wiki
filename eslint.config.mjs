import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import jestDom from 'eslint-plugin-jest-dom';
// import sonarjs from 'eslint-plugin-sonarjs';
import storybook from 'eslint-plugin-storybook';
import testingLibrary from 'eslint-plugin-testing-library';
import unusedImports from 'eslint-plugin-unused-imports';

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  // sonarjs.configs.recommended,
  prettier,
  {
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    ignores: [
      'templates/**',
      '.next/**',
      'out/**',
      'coverage/**',
      'node_modules/**',
      'build/**',
      '**/next-env.d.ts',
      'public/**',
      'scripts/temp/**',
      '.tmp/**',
    ],
  },
  {
    files: ['src/**/__tests__/**/*.{js,jsx,ts,tsx}', 'src/**/*.(test|spec).{js,jsx,ts,tsx}'],
    plugins: { 'testing-library': testingLibrary, 'jest-dom': jestDom },
    rules: {
      ...testingLibrary.configs.react.rules,
      ...jestDom.configs['flat/recommended'].rules,
    },
  },
  {
    files: ['*.stories.@(ts|tsx|js|jsx|mjs|cjs)'],
    plugins: { storybook },
    rules: storybook.configs.recommended.rules,
  },
  {
    files: ['*.cjs'],
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
      },
      sourceType: 'script',
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'import/no-commonjs': 'off',
    },
  },
];

export default eslintConfig;
