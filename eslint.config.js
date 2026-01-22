// 导入必要依赖
import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import vueParser from 'vue-eslint-parser';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';

export default [
  // 1. 忽略文件（替代 .eslintignore）
  {
    ignores: [
      'node_modules/',
      'dist/',
      'dist-ssr/',
      '*.local.js',
      'vite.config.ts',
      '*.md',
      '*.svg',
      'public/',
      'eslint.config.js',
      '.prettierrc.cjs'
    ]
  },

  // 2. 全局基础配置
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      },
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    plugins: {
      prettier
    },
    rules: {
      'prettier/prettier': 'error',
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
    }
  },

  // 3. TypeScript 文件配置
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  },

  // 4. Vue 文件配置（核心：移除废弃规则）
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      vue: vue
    },
    rules: {
      ...vue.configs['flat/essential'].rules,
      'vue/multi-word-component-names': 'off', // 新手友好：关闭组件名多单词限制
      'vue/no-unused-vars': 'warn' // 替代废弃的 script-setup-uses-vars
    }
  },

  // 5. JS 文件配置
  {
    files: ['**/*.js', '**/*.jsx'],
    rules: {
      ...js.configs.recommended.rules
    }
  }
];