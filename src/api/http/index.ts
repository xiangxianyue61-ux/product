import instance from './instance';
import { setupResponseInterceptor } from './interceptors/response';
import { setupRequestInterceptor } from './interceptors/request';

setupResponseInterceptor(instance);
setupRequestInterceptor(instance);
export default instance;
