<template>
    <div class="p-6 bg-white rounded-lg shadow min-h-[500px]">
        <h2 class="text-2xl font-bold mb-6 border-b pb-4">{{ isFirstLogin ? '首次登录设置' : '个人中心' }}</h2>

        <div v-if="loading" class="text-center py-10">
            <a-spin size="large" />
        </div>

        <div v-else-if="isFirstLogin" class="max-w-md mx-auto">
            <a-alert message="为了您的账户安全，首次登录请完善以下信息" type="warning" show-icon class="mb-6" />

            <a-form :model="setupForm" layout="vertical" @finish="handleSetup">
                <a-form-item label="真实姓名" name="realName" :rules="[{ required: true, message: '请输入真实姓名' }]">
                    <a-input v-model="setupForm.realName" placeholder="请输入真实姓名" />
                </a-form-item>

                <a-form-item
                    label="手机号码"
                    name="phone"
                    :rules="[
                        { required: true, message: '请输入手机号码' },
                        { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' },
                    ]"
                >
                    <a-input v-model="setupForm.phone" placeholder="请输入手机号码" />
                </a-form-item>

                <a-form-item
                    label="新密码"
                    name="password"
                    :rules="[
                        { required: true, message: '请输入新密码' },
                        { min: 6, message: '密码至少6位' },
                    ]"
                >
                    <a-input-password v-model="setupForm.password" placeholder="请输入新密码" />
                </a-form-item>

                <a-form-item
                    label="确认密码"
                    name="confirmPassword"
                    :rules="[{ required: true, message: '请确认新密码' }, { validator: validatePass2 }]"
                >
                    <a-input-password v-model="setupForm.confirmPassword" placeholder="请再次输入新密码" />
                </a-form-item>

                <a-button type="primary" html-type="submit" block :loading="submitting" size="large">
                    提交并进入系统
                </a-button>
            </a-form>
        </div>

        <div v-else class="max-w-2xl">
            <a-descriptions title="基本信息" bordered :column="1">
                <a-descriptions-item label="用户ID">{{ userInfo.id }}</a-descriptions-item>
                <a-descriptions-item label="账号">{{ userInfo.username }}</a-descriptions-item>
                <a-descriptions-item label="真实姓名">{{ userInfo.realName || '未设置' }}</a-descriptions-item>
                <a-descriptions-item label="手机号码">{{ userInfo.phone || '未设置' }}</a-descriptions-item>
                <a-descriptions-item label="角色">
                    {{ userInfo.role?.displayName || userInfo.role?.name || userInfo.role || '未设置' }}
                </a-descriptions-item>
                <a-descriptions-item label="注册时间">{{ formatDate(userInfo.createdAt) }}</a-descriptions-item>
                <a-descriptions-item label="最后更新">{{ formatDate(userInfo.updatedAt) }}</a-descriptions-item>
                <a-descriptions-item label="状态">
                    <a-tag color="green" v-if="userInfo.status === 'active'">正常</a-tag>
                    <a-tag color="red" v-else>禁用</a-tag>
                </a-descriptions-item>
            </a-descriptions>

            <div class="mt-6 text-center">
                <a-button type="primary" @click="router.push('/home')">返回首页</a-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { updateProfile } from '../../api/modules/auth';
import { getSystemProfile } from './api/index';

import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

interface UserInfo {
    id: string;
    username: string;
    realName?: string;
    phone?: string;
    role?: any;
    status: string;
    isFirstLogin?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

import { useStore } from 'vuex';

const router = useRouter();
const store = useStore();
const loading = ref(true);
const submitting = ref(false);
const isFirstLogin = ref(false);
const userInfo = ref<UserInfo>({
    id: '',
    username: '',
    status: 'active',
});

const setupForm = reactive({
    realName: '',
    phone: '',
    password: '',
    confirmPassword: '',
});

const validatePass2 = async (_rule: unknown, value: string) => {
    if (value !== setupForm.password) {
        return Promise.reject('两次输入的密码不一致');
    }
    return Promise.resolve();
};

const fetchUserInfo = async () => {
    try {
        const res = await getSystemProfile();
        console.log(res.data, '123');
        if (res.data.success) {
            userInfo.value = res.data.user;
            isFirstLogin.value = !!res.data.user.isFirstLogin;
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        message.error('获取用户信息失败');
    } finally {
        loading.value = false;
    }
};

const handleSetup = async () => {
    submitting.value = true;
    try {
        const res = await updateProfile({
            realName: setupForm.realName,
            phone: setupForm.phone,
            password: setupForm.password,
        });

        if (res.data.success) {
            message.success('设置成功');
            isFirstLogin.value = false;
            // Update store
            store.commit('updateFirstLogin', false);
            // Refresh user info
            fetchUserInfo();
        } else {
            message.error(res.data.message || '设置失败');
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        message.error('请求失败');
    } finally {
        submitting.value = false;
    }
};
//类型断言确保date存在
const formatDate = (date: string | undefined) => {
    return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-';
};

onMounted(() => {
    fetchUserInfo();
});
</script>
