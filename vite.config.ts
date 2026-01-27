import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
// @ts-ignore
import eslint from 'vite-plugin-eslint'; // 引入 ESLint 插件

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        eslint({
            include: ['src/**/*.{js,jsx,ts,tsx,vue}'], // 校验的文件范围
            exclude: ['node_modules/**'], // 排除的文件
            cache: false, // 可选：关闭缓存（调试时用）
        }),
    ],
    server: {
        proxy: {
            '/xx': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
});
