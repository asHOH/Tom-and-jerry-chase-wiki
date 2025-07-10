import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

"""import jestDom from 'eslint-plugin-jest-dom';
import testingLibrary from 'eslint-plugin-testing-library';

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['templates/**/*', '.next/**/*', 'out/**/*', 'coverage/**/*'],
  },
  {
    files: [
      'src/**/__tests__/**/*.{js,jsx,ts,tsx}',
      'src/**/*.(test|spec).{js,jsx,ts,tsx}',
    ],
    ...testingLibrary.configs.react,
    ...jestDom.configs['flat/recommended'],
  },
  {
    files: ['*.cjs'],""
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
