<template>
    <div class="bg-[#f0f2f5]">
        <!-- 搜索筛选区域 -->
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline" class="search-form">
                <a-form-item label="路线编号">
                    <a-input v-model:value="searchForm.routeCode" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item label="路线名称">
                    <a-input v-model:value="searchForm.routeName" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item>
                    <a-space>
                        <a-button type="primary" @click="handleSearch">
                            <template #icon><SearchOutlined /></template>
                            查询
                        </a-button>
                        <a-button @click="handleReset">
                            <template #icon><ReloadOutlined /></template>
                            重置
                        </a-button>
                    </a-space>
                </a-form-item>
            </a-form>
        </a-card>

        <!-- 操作按钮区域 -->
        <a-card class="mb-4" :bordered="false">
            <a-space>
                <a-button type="primary" @click="openCreate">
                    <template #icon><PlusOutlined /></template>
                    新增
                </a-button>
                <a-button @click="openEditBySelection" :disabled="selectedRowKeys.length !== 1">编辑</a-button>
                <a-button danger @click="deleteBySelection" :disabled="selectedRowKeys.length === 0">删除</a-button>
                <a-button @click="noop">打印</a-button>
                <a-button @click="noop">导入</a-button>
                <a-button @click="noop">导出</a-button>
            </a-space>
        </a-card>

        <!-- 数据表格 -->
        <a-card :bordered="false">
            <a-table
                :columns="columns"
                :data-source="tableData"
                :pagination="false"
                :row-selection="{
                    selectedRowKeys: selectedRowKeys,
                    onChange: onSelectChange,
                }"
                row-key="id"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'action'">
                        <a-space>
                            <a @click="openDetail(record)">详情</a>
                            <span>|</span>
                            <a @click="openEdit(record)">编辑</a>
                            <span>|</span>
                            <a-popconfirm title="确定要删除这条工艺路线吗？" @confirm="deleteOne(record)">
                                <a style="color: #ff4d4f">删除</a>
                            </a-popconfirm>
                        </a-space>
                    </template>
                </template>
            </a-table>

            <!-- 分页 -->
            <div class="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <a-pagination
                    v-model:current="pagination.current"
                    v-model:page-size="pagination.pageSize"
                    :total="pagination.total"
                    :show-size-changer="true"
                    :show-total="total => `共${total}条`"
                    :page-size-options="['15', '30', '50', '100']"
                    @change="handlePageChange"
                    @showSizeChange="handlePageSizeChange"
                >
                    <template #buildOptionText="props">
                        <span>{{ props.value }}条/页</span>
                    </template>
                </a-pagination>
                <a-space class="flex items-center gap-2">
                    <span>跳至</span>
                    <a-input-number v-model:value="jumpPage" :min="1" :max="maxPage" style="width: 80px" />
                    <span>页</span>
                    <a-button type="primary" size="small" @click="handleJumpToPage">确定</a-button>
                </a-space>
            </div>
        </a-card>

        <!-- 详情弹窗 -->
        <a-modal :open="detailOpen" title="工艺路线详情" @cancel="detailOpen = false" :footer="null">
            <a-descriptions bordered size="small" :column="1">
                <a-descriptions-item label="路线编号">{{ currentRow?.routeCode }}</a-descriptions-item>
                <a-descriptions-item label="路线名称">{{ currentRow?.routeName }}</a-descriptions-item>
                <a-descriptions-item label="工艺路线">{{ currentRow?.routeDescription }}</a-descriptions-item>
                <a-descriptions-item label="创建时间">{{ currentRow?.createTime }}</a-descriptions-item>
            </a-descriptions>
        </a-modal>

        <!-- 新增/编辑弹窗 -->
        <a-modal
            :open="editOpen"
            :title="editMode === 'create' ? '新增工艺路线' : '编辑工艺路线'"
            @ok="handleSubmit"
            @cancel="editOpen = false"
        >
            <a-form :model="editForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                <a-form-item label="路线编号" required>
                    <a-input v-model:value="editForm.routeCode" />
                </a-form-item>
                <a-form-item label="路线名称" required>
                    <a-input v-model:value="editForm.routeName" />
                </a-form-item>
                <a-form-item label="工艺路线" required>
                    <a-textarea v-model:value="editForm.routeDescription" :rows="4" />
                </a-form-item>
                <a-form-item label="创建时间">
                    <a-input v-model:value="editForm.createTime" placeholder="YYYY.MM.DD HH:mm:ss" />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import { apiFetch, type ListResult } from '../../utils/apiClient';

type ProcessRoute = {
    id: number;
    routeCode: string;
    routeName: string;
    routeDescription: string;
    createTime: string;
};

// 搜索表单
const searchForm = reactive({
    routeCode: '',
    routeName: '',
});

// 表格列定义
const columns = [
    {
        title: '#',
        key: 'index',
        width: 60,
        customRender: ({ index }: { index: number }) => {
            return (pagination.current - 1) * pagination.pageSize + index + 1;
        },
    },
    {
        title: '工艺路线编号',
        dataIndex: 'routeCode',
        key: 'routeCode',
        width: 180,
    },
    {
        title: '工艺路线名称',
        dataIndex: 'routeName',
        key: 'routeName',
        width: 200,
    },
    {
        title: '工艺路线',
        dataIndex: 'routeDescription',
        key: 'routeDescription',
        minWidth: 400,
    },
    {
        title: '创建时间',
        dataIndex: 'createTime',
        key: 'createTime',
        width: 180,
    },
    {
        title: '操作',
        key: 'action',
        width: 180,
        fixed: 'right',
    },
];

// 表格数据
const tableData = ref<ProcessRoute[]>([]);

// 选中的行
const selectedRowKeys = ref<number[]>([]);

// 分页配置
const pagination = reactive({
    current: 1,
    pageSize: 15,
    total: 0,
});

// 跳转页码
const jumpPage = ref<number>(1);
const maxPage = computed(() => Math.max(1, Math.ceil(pagination.total / pagination.pageSize)));

// 加载数据（从 MongoDB: create.ProcessRoute，经 hd /api/technicalProcessRoutes/list）
const loadData = async () => {
    try {
        const params = new URLSearchParams();
        params.set('page', String(pagination.current));
        params.set('pageSize', String(pagination.pageSize));
        if (searchForm.routeCode) params.set('routeCode', searchForm.routeCode);
        if (searchForm.routeName) params.set('routeName', searchForm.routeName);

        const res = await apiFetch<ListResult<ProcessRoute>>(`/api/technicalProcessRoutes/list?${params.toString()}`);
        tableData.value = res.data ?? [];
        pagination.total = res.total ?? 0;
    } catch (e) {
        tableData.value = [];
        pagination.total = 0;
        message.error(`获取工艺路线数据失败：${(e as Error).message || '未知错误'}`);
    }
};

// 选择变化
const onSelectChange = (keys: number[]) => {
    selectedRowKeys.value = keys;
};

// 查询
const handleSearch = () => {
    pagination.current = 1;
    loadData();
    message.success('查询成功');
};

// 重置
const handleReset = () => {
    searchForm.routeCode = '';
    searchForm.routeName = '';
    pagination.current = 1;
    loadData();
};

// 分页变化
const handlePageChange = (page: number) => {
    pagination.current = page;
    loadData();
};

// 每页条数变化
const handlePageSizeChange = (_current: number, size: number) => {
    pagination.current = 1;
    pagination.pageSize = size;
    loadData();
};

// 跳转页面
const handleJumpToPage = () => {
    if (jumpPage.value >= 1 && jumpPage.value <= maxPage.value) {
        pagination.current = jumpPage.value;
        loadData();
    } else {
        message.warning('请输入有效的页码');
    }
};

// CRUD 弹窗状态
const detailOpen = ref(false);
const editOpen = ref(false);
const editMode = ref<'create' | 'edit'>('create');
const currentRow = ref<ProcessRoute | null>(null);
const editForm = reactive<ProcessRoute>({
    id: 0,
    routeCode: '',
    routeName: '',
    routeDescription: '',
    createTime: '',
});

const openDetail = (record: ProcessRoute) => {
    currentRow.value = record;
    detailOpen.value = true;
};

const openCreate = () => {
    editMode.value = 'create';
    Object.assign(editForm, {
        id: 0,
        routeCode: '',
        routeName: '',
        routeDescription: '',
        createTime: '',
    });
    editOpen.value = true;
};

const openEdit = (record: ProcessRoute) => {
    editMode.value = 'edit';
    Object.assign(editForm, record);
    editOpen.value = true;
};

const openEditBySelection = () => {
    if (selectedRowKeys.value.length !== 1) return;
    const id = selectedRowKeys.value[0];
    const row = tableData.value.find(item => item.id === id);
    if (row) openEdit(row);
};

const handleSubmit = async () => {
    try {
        const payload = { ...editForm };
        if (editMode.value === 'create') {
            await apiFetch('/api/technicalProcessRoutes', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            message.success('新增成功');
        } else {
            await apiFetch(`/api/technicalProcessRoutes/${editForm.id}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
            message.success('编辑成功');
        }
        editOpen.value = false;
        await loadData();
    } catch (e) {
        message.error(`保存失败：${(e as Error).message || '未知错误'}`);
    }
};

const deleteOne = async (record: ProcessRoute) => {
    try {
        await apiFetch(`/api/technicalProcessRoutes/${record.id}`, { method: 'DELETE' });
        message.success('删除成功');
        await loadData();
    } catch (e) {
        message.error(`删除失败：${(e as Error).message || '未知错误'}`);
    }
};

const deleteBySelection = async () => {
    if (selectedRowKeys.value.length === 0) return;
    try {
        await Promise.all(
            selectedRowKeys.value.map(id => apiFetch(`/api/technicalProcessRoutes/${id}`, { method: 'DELETE' }))
        );
        message.success(`已删除 ${selectedRowKeys.value.length} 条记录`);
        selectedRowKeys.value = [];
        await loadData();
    } catch (e) {
        message.error(`删除失败：${(e as Error).message || '未知错误'}`);
    }
};

const noop = () => message.info('演示页面：此功能暂未接入后端');

onMounted(() => {
    loadData();
});
</script>
