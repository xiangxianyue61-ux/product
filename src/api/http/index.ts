import instance from './instance';
import { setupResponseInterceptor } from './interceptors/response';
import { setupRequestInterceptor } from './interceptors/request';

// 安装响应拦截器
setupResponseInterceptor(instance);
// 安装请求拦截器
setupRequestInterceptor(instance);

export default instance;
