<script setup lang="ts">
import { ref } from 'vue';
import { post } from '../http/request';
import { useRouter } from 'vue-router';
const router = useRouter();
// 1. 定义表单响应式数据
const formData = ref({
    username: '', // 账号
    password: '', // 密码
    remember: true, // 三天免登录（默认勾选）
});

// 2. 密码显示/隐藏切换
const showPassword = ref(false);
const togglePassword = () => {
    showPassword.value = !showPassword.value;
};

// 3. 表单提交方法
const handleLogin = () => {
    // 基础表单校验
    if (!formData.value.username.trim()) {
        alert('请输入账号！');
        return;
    }
    if (!formData.value.password.trim()) {
        alert('请输入密码！');
        return;
    }

    // 提交登录请求
    post('/xx/login', formData.value)
        .then((res: any) => {
            if (res.data.success) {
                if (res.data.token) {
                    localStorage.setItem('access_token', res.data.token);
                }
                router.push('/home');
            } else {
                alert(res.data.msg || '登录失败');
            }
        })
        .catch((err: any) => {
            console.error('登录请求失败:', err);
            alert('登录请求失败，请稍后重试');
        });

    // 重置表单（可选）
    formData.value.username = '';
    formData.value.password = '';
};
</script>

<template>
    <div class="login-page w-screen h-screen relative overflow-hidden flex items-center justify-center">
        <!-- 背景层 -->
        <div class="absolute inset-0 bg-[#165DFF]/90">
            <!-- 可替换为真实背景图：bg-[url('你的背景图地址')] bg-cover bg-center -->
        </div>

        <!-- 登录内容容器 -->
        <div class="relative z-10 text-center text-white">
            <!-- 系统标题 -->
            <h1 class="text-[32px] font-semibold mb-2 tracking-wider">制造执行管理系统</h1>
            <p class="text-[14px] opacity-90 mb-10">Manufacturing operations Management</p>

            <!-- 登录表单 -->
            <div class="w-[380px] p-8 bg-white rounded-lg shadow-md text-gray-800 mx-auto">
                <!-- 账号输入框 -->
                <div class="mb-5 text-left">
                    <label class="block text-[14px] mb-2">账号</label>
                    <input
                        v-model="formData.username"
                        type="text"
                        placeholder="请输入账号"
                        class="w-full h-[40px] px-4 border border-gray-200 rounded-md text-[14px] outline-none transition-colors focus:border-[#165DFF]"
                    />
                </div>

                <!-- 密码输入框 -->
                <div class="mb-5 text-left">
                    <label class="block text-[14px] mb-2">密码</label>
                    <div class="relative">
                        <input
                            v-model="formData.password"
                            :type="showPassword ? 'text' : 'password'"
                            placeholder="请输入密码"
                            class="w-full h-[40px] px-4 border border-gray-200 rounded-md text-[14px] outline-none transition-colors focus:border-[#165DFF]"
                        />
                        <!-- 密码显示/隐藏图标 -->
                        <span
                            @click="togglePassword"
                            class="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-[16px]"
                        >
                            {{ showPassword ? '🙈' : '👁️' }}
                        </span>
                    </div>
                </div>

                <!-- 记住密码复选框 -->
                <div class="mb-6 flex items-center text-[14px]">
                    <input v-model="formData.remember" type="checkbox" id="remember" class="mr-2 accent-[#165DFF]" />
                    <label for="remember">三天免登录</label>
                </div>

                <!-- 登录按钮 -->
                <button
                    @click="handleLogin"
                    class="w-full h-[44px] bg-[#165DFF] text-white rounded-md text-[16px] font-medium cursor-pointer transition-colors hover:bg-[#0d47a1]"
                >
                    登录
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 仅保留必要的全局样式，其余由Tailwind实现 */
.login-page {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
