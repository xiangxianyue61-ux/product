import axios from 'axios';

// 创建 axios 实例
const instance = axios.create({
    // 从环境变量获取 API 基础 URL
    baseURL: import.meta.env.VITE_API_BASE_URL,
    // 允许跨域携带凭证（如 cookie）
    withCredentials: true,
    // 请求超时时间（毫秒）
    timeout: 10000,
});

export default instance;
