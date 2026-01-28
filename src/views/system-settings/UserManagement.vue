<template>
    <div class="bg-[#f0f2f5]">
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline">
                <a-form-item label="用户账号">
                    <a-input v-model="searchForm.username" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item label="真实姓名">
                    <a-input v-model="searchForm.realName" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item>
                    <a-space>
                        <a-button type="primary" @click="handleSearch">查询</a-button>
                        <a-button @click="handleReset">重置</a-button>
                    </a-space>
                </a-form-item>
            </a-form>
        </a-card>

        <a-card class="mb-4" :bordered="false">
            <a-space>
                <a-button type="primary" @click="handleAdd">新增</a-button>
                <a-button @click="noop" :disabled="selectedRowKeys.length !== 1">编辑</a-button>
                <a-button danger @click="noop" :disabled="selectedRowKeys.length === 0">删除</a-button>
                <a-button @click="noop">打印</a-button>
                <a-button @click="noop">导入</a-button>
                <a-button @click="noop">导出</a-button>
            </a-space>
        </a-card>

        <a-card :bordered="false">
            <a-table
                :columns="columns"
                :data-source="tableData"
                :pagination="false"
                :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
                row-key="_id"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'role'">
                        {{ record.role?.displayName || record.role?.name || '-' }}
                    </template>
                    <template v-if="column.key === 'action'">
                        <a-space>
                            <a @click="noop">详情</a>
                            <a @click="noop">编辑</a>
                            <a style="color: #ff4d4f" @click="noop">删除</a>
                        </a-space>
                    </template>
                </template>
            </a-table>

            <div class="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <a-pagination
                    :current="pagination.current"
                    :pageSize="pagination.pageSize"
                    :total="pagination.total"
                    :show-size-changer="true"
                    :show-total="total => `共${total}条`"
                    :page-size-options="['15', '30', '50', '100']"
                    @change="handlePageChange"
                    @showSizeChange="handlePageSizeChange"
                />
                <a-space class="flex items-center gap-2">
                    <span>跳至</span>
                    <a-input-number v-model="jumpPage" :min="1" :max="maxPage" style="width: 80px" />
                    <span>页</span>
                    <a-button type="primary" size="small" @click="handleJumpToPage">确定</a-button>
                </a-space>
            </div>
        </a-card>

        <!-- 新增用户弹窗 -->
        <a-modal v-model="addModalVisible" title="新增" @ok="handleAddSubmit" @cancel="handleAddCancel">
            <a-form :model="addForm" :label-col="{ span: 5 }" :wrapper-col="{ span: 16 }">
                <a-form-item label="用户名称" required>
                    <a-input v-model="addForm.realName" placeholder="请输入真实姓名" />
                </a-form-item>
                <a-form-item label="用户名" required>
                    <a-input v-model="addForm.username" placeholder="请输入登录账号" />
                </a-form-item>
                <a-form-item label="密码" required>
                    <a-input-password v-model="addForm.password" placeholder="请输入密码" />
                </a-form-item>
                <a-form-item label="确认密码" required>
                    <a-input-password v-model="addForm.confirmPassword" placeholder="请再次输入密码" />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { getEmployeeList, addEmployeeList } from './api/index';

type Row = {
    _id: string;
    username: string;
    realName: string;
    phone: string;
    status: string;
    lastLogin: string;
    createdAt: string;
    role?: {
        name: string;
        displayName: string;
    };
};

const searchForm = reactive({ username: '', realName: '' });
const selectedRowKeys = ref<string[]>([]);

const pagination = reactive({ current: 1, pageSize: 15, total: 0 });
const jumpPage = ref(1);
const maxPage = computed(() => Math.max(1, Math.ceil(pagination.total / pagination.pageSize)));

const columns = [
    {
        title: '#',
        key: 'index',
        width: 60,
        customRender: ({ index }: { index: number }) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    { title: '用户账号', dataIndex: 'username', key: 'username', width: 150 },
    { title: '真实姓名', dataIndex: 'realName', key: 'realName', width: 150 },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 150 },
    { title: '角色', dataIndex: 'role', key: 'role', width: 150 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
    { title: '最后登录', dataIndex: 'lastLogin', key: 'lastLogin', width: 180 },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
    { title: '操作', key: 'action', width: 180, fixed: 'right' },
];

const tableData = ref<Row[]>([]);

const getEmployeeListData = async () => {
    const res = await getEmployeeList({
        page: pagination.current,
        limit: pagination.pageSize,
        username: searchForm.username,
    });
    if (res.data.success) {
        tableData.value = res.data.data;
        pagination.total = res.data.total;
    }
};

const onSelectChange = (keys: string[]) => {
    selectedRowKeys.value = keys;
};

const handleSearch = () => {
    pagination.current = 1;
    getEmployeeListData();
    message.success('查询成功');
};

const handleReset = () => {
    searchForm.username = '';
    searchForm.realName = '';
    pagination.current = 1;
    getEmployeeListData();
};

const handlePageChange = (page: number) => {
    pagination.current = page;
    getEmployeeListData();
};

const handlePageSizeChange = (_current: number, size: number) => {
    pagination.current = 1;
    pagination.pageSize = size;
    getEmployeeListData();
};

const handleJumpToPage = () => {
    if (jumpPage.value >= 1 && jumpPage.value <= maxPage.value) {
        pagination.current = jumpPage.value;
        getEmployeeListData();
    } else {
        message.warning('请输入有效的页码');
    }
};

const noop = () => message.info('演示页面：此功能暂未接入后端');

// 新增逻辑
const addModalVisible = ref(false);
const addForm = reactive({
    realName: '',
    username: '',
    password: '',
    confirmPassword: '',
});

const handleAdd = () => {
    addForm.realName = '';
    addForm.username = '';
    addForm.password = '';
    addForm.confirmPassword = '';
    addModalVisible.value = true;
};

const handleAddCancel = () => {
    addModalVisible.value = false;
};

const handleAddSubmit = async () => {
    if (!addForm.realName || !addForm.username || !addForm.password || !addForm.confirmPassword) {
        message.warning('请填写必填项');
        return;
    }
    if (addForm.password !== addForm.confirmPassword) {
        message.warning('两次输入的密码不一致');
        return;
    }
    try {
        const res = await addEmployeeList({
            realName: addForm.realName,
            username: addForm.username,
            password: addForm.password,
        });
        if (res.data.success) {
            message.success('添加成功');
            addModalVisible.value = false;
            getEmployeeListData();
        } else {
            message.error(res.data.message || '添加失败');
        }
    } catch (error) {
        // 错误已由拦截器处理
    }
};

onMounted(() => getEmployeeListData());
</script>
