// eslint.config.js
import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import vueParser from 'vue-eslint-parser';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';

export default [
    // 1. 忽略文件配置
    // 定义哪些文件和目录应该被 ESLint 忽略，不进行 lint 检查
    {
        ignores: [
            'node_modules/', // 忽略依赖包目录
            'dist/', // 忽略打包输出目录
            'dist-ssr/', // 忽略 SSR 打包输出目录
            '**/*.local.js', // 忽略本地临时 JS 文件
            'vite.config.ts', // 忽略 Vite 配置文件
            '**/*.md', // 忽略 Markdown 文档
            '**/*.svg', // 忽略 SVG 图片
            'public/', // 忽略静态资源目录
            'eslint.config.js', // 忽略 ESLint 配置文件自身
            '.prettierrc.cjs', // 忽略 Prettier 配置文件
        ],
    },

    // 2. 全局基础配置
    // 适用于所有文件的通用配置，包括全局变量、插件和基础规则
    {
        languageOptions: {
            globals: {
                ...globals.browser, // 浏览器全局变量 (window, document 等)
                ...globals.node, // Node.js 全局变量 (process, require 等)
                ...globals.es2021, // ES2021 全局变量
            },
            ecmaVersion: 'latest', // 使用最新的 ECMAScript 版本
            sourceType: 'module', // 使用 ES Modules 模块系统
        },
        plugins: {
            prettier, // 启用 Prettier 插件，用于代码格式化集成
        },
        rules: {
            // Prettier 规则集成：将 Prettier 的格式化问题视为 ESLint 错误
            'prettier/prettier': [
                'error',
                {
                    endOfLine: 'auto', // 自动处理行尾换行符 (LF/CRLF)
                },
            ],
            // 禁用 console：在代码中保留 console.log 会报警告 (warn)，通常用于生产环境清理
            'no-console': 'warn',
            // 禁用 debugger：在代码中保留 debugger 会报警告 (warn)，防止调试代码上线
            'no-debugger': 'warn',
        },
    },

    // 3. TypeScript 文件配置
    // 专门针对 .ts 和 .tsx 文件的配置
    {
        files: ['src/**/*.{ts,tsx}', '*.ts'],
        languageOptions: {
            parser: tsParser, // 使用 TypeScript 解析器
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': typescript, // 启用 TypeScript 插件
        },
        rules: {
            // 继承 TypeScript 推荐规则集
            ...typescript.configs.recommended.rules,

            // TS 未使用变量检查：警告级别
            // argsIgnorePattern: '^_' 表示忽略以下划线开头的参数，方便占位
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

            // TS 显式 any 类型检查：警告级别
            // 建议尽量避免使用 any，但在迁移或复杂场景下允许使用（报警告）
            '@typescript-eslint/no-explicit-any': 'warn',
        },
    },

    // 4. Vue 文件配置
    // 专门针对 .vue 文件的配置，同时包含 Template 和 Script 部分的检查
    {
        files: ['src/**/*.vue'],
        languageOptions: {
            parser: vueParser, // 使用 Vue 解析器解析 .vue 文件
            parserOptions: {
                parser: tsParser, // <script> 标签内容使用 TS 解析器
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        plugins: {
            vue, // 启用 Vue 插件
            '@typescript-eslint': typescript, // ⚠️ 关键：让 TS 规则在 Vue 文件 <script lang="ts"> 中生效
        },
        rules: {
            // 继承 Vue 3 Essential (基础) 规则集，包含最核心的 Vue 最佳实践
            ...vue.configs['flat/essential'].rules,

            // 复用 TS 规则：在 Vue 文件中也检查未使用的 TS 变量
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

            // 复用 TS 规则：在 Vue 文件中也检查显式 any 使用
            '@typescript-eslint/no-explicit-any': 'warn',

            // Vue 模板中未使用变量检查：警告级别
            'vue/no-unused-vars': 'warn',

            // 关闭组件名称多单词强制要求
            // 默认要求组件名如 "MyComponent" (多单词)，关闭后允许 "Login" (单单词)
            'vue/multi-word-component-names': 'off',

            // 关闭 v-model 参数检查
            // 某些 UI 库或特定场景下 v-model 参数可能报误报，故关闭
            'vue/no-v-model-argument': 'off',
        },
    },

    // 5. JS 文件配置
    // 针对普通 .js, .jsx 文件的配置
    {
        files: ['src/**/*.{js,jsx}'],
        rules: {
            // 继承 ESLint 推荐的 JS 规则集
            ...js.configs.recommended.rules,
        },
    },
];
