// eslint.config.js
import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import vueParser from 'vue-eslint-parser';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';

export default [
    // 1. 忽略文件
    {
        ignores: [
            'node_modules/',
            'dist/',
            'dist-ssr/',
            '**/*.local.js',
            'vite.config.ts',
            '**/*.md',
            '**/*.svg',
            'public/',
            'eslint.config.js',
            '.prettierrc.cjs',
        ],
    },

    // 2. 全局基础配置
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021,
            },
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
        plugins: {
            prettier,
        },
        rules: {
            'prettier/prettier': 'error',
            'no-console': 'warn', // 开发环境也提示
            'no-debugger': 'warn',
        },
    },

    // 3. TypeScript 文件
    {
        files: ['src/**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': typescript,
        },
        rules: {
            ...typescript.configs.recommended.rules,
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',
        },
    },

    // 4. Vue 文件
    {
        files: ['src/**/*.vue'],
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tsParser,
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        plugins: {
            vue,
            '@typescript-eslint': typescript, // ⚠️ 关键：让 TS 规则在 Vue 文件生效
        },
        rules: {
            ...vue.configs['flat/essential'].rules,
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',
            'vue/no-unused-vars': 'warn',
            'vue/multi-word-component-names': 'off',
            'vue/no-v-model-argument': 'off',
        },
    },

    // 5. JS 文件
    {
        files: ['src/**/*.{js,jsx}'],
        rules: {
            ...js.configs.recommended.rules,
        },
    },
];
