// import api from './api';

// /**
//  * 发送 GET 请求
//  * @param url 请求地址
//  * @param params 查询参数对象
//  * @returns Promise
//  */
// export const get = (url: string, params: any) => {
//     // axios的 get 方法，可携带 params 作为查询字符串
//     return api.get(url, { params });
// };

// export const post = (url: string, data: any) => {
//     const headers =
//         data instanceof FormData
//             ? {} // 让 axios 自动处理 multipart/form-data
//             : { 'Content-Type': 'application/json' };

//     return api.post(url, data, { headers });
// };

// export const put = (url: string, data: any) => {
//     // axios的 put 方法，data作为请求体参数
//     return api.put(url, data);
// };

// export const del = (url: string) => {
//     // axios的 delete 方法，仅需提供url
//     return api.delete(url);
// };

// export const patch = (url: string, data: any) => {
//     // axios的 patch 方法，data作为请求体参数
//     return api.patch(url, data);
// };

// export const request = (url: string, method: string, data: any) => {
//     // 直接传递参数给axios实例，适用于自定义请求
//     return api({
//         url,
//         method, // 请求方法
//         data, // 请求体数据
//         headers: {
//             'Content-Type': 'application/json', // 指定请求体格式为 JSON
//         },
//     });
// };
