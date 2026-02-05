<template>
    <div class="bg-[#f0f2f5]">
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline">
                <a-form-item label="菜单编号">
                    <a-input v-model="searchForm.code" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item label="菜单名称">
                    <a-input v-model="searchForm.name" placeholder="请输入内容" style="width: 220px" />
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
                <a-button @click="handleSimulateAdd">模拟添加数据</a-button>
            </a-space>
        </a-card>

        <a-card :bordered="false">
            <a-table
                :columns="columns"
                :data-source="tableData"
                :pagination="false"
                :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
                row-key="id"
            >
                <template #bodyCell="{ column }">
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
                    :page-size="pagination.pageSize"
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

        <!-- 新增菜单弹窗 -->
        <a-modal :open="addModalVisible" title="新增" width="800px" @ok="handleAddSubmit" @cancel="handleAddCancel">
            <a-form :model="addForm" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
                <a-row :gutter="24">
                    <a-col :span="24">
                        <a-form-item label="菜单类型">
                            <a-radio-group v-model="addForm.menuType">
                                <a-radio value="1">一级菜单</a-radio>
                                <a-radio value="2">二级菜单</a-radio>
                                <a-radio value="3">三级菜单</a-radio>
                            </a-radio-group>
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="12">
                        <a-form-item label="菜单名称" required>
                            <a-input v-model="addForm.title" placeholder="请输入内容" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="路由名称" required>
                            <a-input v-model="addForm.name" placeholder="请输入路由Name(如 SystemSettings)" />
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="12">
                        <a-form-item label="菜单路径">
                            <a-input v-model="addForm.path" placeholder="请输入路径" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="前端组件">
                            <a-input v-model="addForm.component" placeholder="请输入组件路径" />
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="12">
                        <a-form-item label="菜单图标">
                            <a-input v-model="addForm.icon" placeholder="请输入图标名称" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="排序">
                            <a-input-number v-model="addForm.sort" placeholder="请输入数字" style="width: 100%" />
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="24">
                        <a-form-item label="其他选项">
                            <a-space size="large">
                                <span class="flex items-center">
                                    <span class="mr-2">是否路由菜单</span>
                                    <a-switch v-model="addForm.isRoute" />
                                </span>
                                <span class="flex items-center">
                                    <span class="mr-2">隐藏路由</span>
                                    <a-switch v-model="addForm.hidden" />
                                </span>
                                <span class="flex items-center">
                                    <span class="mr-2">是否缓存路由</span>
                                    <a-switch v-model="addForm.keepAlive" />
                                </span>
                            </a-space>
                        </a-form-item>
                    </a-col>
                </a-row>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { addMenuList, getMenuList } from './api/index';

type Row = {
    id: number;
    code: string;
    name: string;
    path: string;
    icon: string;
    sort: number;
    creator: string;
    createTime: string;
};

const searchForm = reactive({ code: '', name: '' });
const selectedRowKeys = ref<number[]>([]);

const pagination = reactive({ current: 1, pageSize: 15, total: 56 });
const jumpPage = ref(1);
const maxPage = computed(() => Math.max(1, Math.ceil(pagination.total / pagination.pageSize)));

const columns = [
    {
        title: '#',
        key: 'index',
        width: 60,
        customRender: ({ index }: { index: number }) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    { title: '菜单编号', dataIndex: 'code', key: 'code', width: 180 },
    { title: '菜单名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: '路由路径', dataIndex: 'path', key: 'path', width: 200 },
    { title: '图标', dataIndex: 'icon', key: 'icon', width: 120 },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
    { title: '创建人', dataIndex: 'creator', key: 'creator', width: 120 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
    { title: '操作', key: 'action', width: 180, fixed: 'right' },
];

const tableData = ref<Row[]>([]);

const mock: Row[] = Array.from({ length: 56 }, (_, i) => ({
    id: i + 1,
    code: `CDBH${String(i + 1).padStart(10, '0')}`,
    name: `菜单${i + 1}`,
    path: `/menu-${i + 1}`,
    icon: 'MenuOutlined',
    sort: i + 1,
    creator: '李民浩',
    createTime: '2025.04.24 14:00:00',
}));

const getMenuListData = async () => {
    const res = await getMenuList({
        page: pagination.current,
        limit: pagination.pageSize,
        code: searchForm.code,
        name: searchForm.name,
    });
    if (res.data.success) {
        tableData.value = res.data.data;
        pagination.total = res.data.total;
    }
};

const onSelectChange = (keys: number[]) => {
    selectedRowKeys.value = keys;
};

const handleSearch = () => {
    pagination.current = 1;
    getMenuListData();
    message.success('查询成功');
};

const handleReset = () => {
    searchForm.code = '';
    searchForm.name = '';
    pagination.current = 1;
    getMenuListData();
};

const handlePageChange = (page: number) => {
    pagination.current = page;
    getMenuListData();
};

const handlePageSizeChange = (_current: number, size: number) => {
    pagination.current = 1;
    pagination.pageSize = size;
    getMenuListData();
};

const handleJumpToPage = () => {
    if (jumpPage.value >= 1 && jumpPage.value <= maxPage.value) {
        pagination.current = jumpPage.value;
        getMenuListData();
    } else {
        message.warning('请输入有效的页码');
    }
};

const noop = () => message.info('演示页面：此功能暂未接入后端');

// 新增逻辑
const addModalVisible = ref(false);
const addForm = reactive({
    menuType: '1',
    title: '', // 菜单名称
    name: '', // 路由名称
    path: '', // 菜单路径
    component: '', // 前端组件
    icon: '', // 菜单图标
    sort: 0, // 排序
    isRoute: true,
    hidden: false,
    keepAlive: true,
});

const handleAdd = () => {
    Object.assign(addForm, {
        menuType: '1',
        title: '',
        name: '',
        path: '',
        component: '',
        icon: '',
        sort: 0,
        isRoute: true,
        hidden: false,
        keepAlive: true,
    });
    addModalVisible.value = true;
};

const handleAddCancel = () => {
    addModalVisible.value = false;
};

const handleAddSubmit = async () => {
    if (!addForm.title || !addForm.name) {
        message.warning('请填写必填项');
        return;
    }
    // 映射前端字段到后端模型
    const submitData = {
        ...addForm,
        type: addForm.menuType === '3' ? 'button' : 'menu', // 简单映射
    };
    try {
        const res = await addMenuList(submitData);
        if (res.data.success) {
            message.success('添加成功');
            addModalVisible.value = false;
            getMenuListData();
        } else {
            message.error(res.data.message || '添加失败');
        }
    } catch (error) {
        // 错误已由拦截器处理
    }
};

// 模拟添加数据
const handleSimulateAdd = async () => {
    const randomId = Math.floor(Math.random() * 10000);
    const mockData = {
        name: `Menu_${randomId}`,
        title: `测试菜单${randomId}`,
        path: `/test-menu-${randomId}`,
        component: '/views/Test.vue',
        icon: 'AppstoreOutlined',
        sort: randomId % 100,
        type: 'menu',
        permission: `sys:test:${randomId}`,
    };
    try {
        const res = await addMenuList(mockData);
        if (res.data.success) {
            message.success(`模拟添加成功：${mockData.title}`);
            getMenuListData();
        } else {
            message.error(res.data.message || '模拟添加失败');
        }
    } catch (error) {
        // 错误已由拦截器处理
    }
};

onMounted(() => getMenuListData());
</script>
