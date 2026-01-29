<template>
    <div class="bg-[#f0f2f5]">
        <!-- 搜索筛选区域 -->
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline">
                <a-form-item label="物料编号">
                    <a-input v-model:value="searchForm.code" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item label="物料名称">
                    <a-input v-model:value="searchForm.name" placeholder="请输入内容" style="width: 220px" />
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
                :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
                row-key="id"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'status'">
                        <a-tag color="success">启用</a-tag>
                    </template>
                    <template v-else-if="column.key === 'action'">
                        <a-space>
                            <a @click="openDetail(record)">详情</a>
                            <span>|</span>
                            <a @click="openEdit(record)">编辑</a>
                            <span>|</span>
                            <a-popconfirm title="确定要删除这条物料吗？" @confirm="deleteOne(record)">
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
                />
                <a-space class="flex items-center gap-2">
                    <span>跳至</span>
                    <a-input-number v-model:value="jumpPage" :min="1" :max="maxPage" style="width: 80px" />
                    <span>页</span>
                    <a-button type="primary" size="small" @click="handleJumpToPage">确定</a-button>
                </a-space>
            </div>
        </a-card>

        <!-- 详情弹窗 -->
        <a-modal :open="detailOpen" title="物料详情" @cancel="detailOpen = false" :footer="null">
            <a-descriptions bordered size="small" :column="2">
                <a-descriptions-item label="物料编号">{{ currentRow?.code }}</a-descriptions-item>
                <a-descriptions-item label="物料名称">{{ currentRow?.name }}</a-descriptions-item>
                <a-descriptions-item label="制造方式">{{ currentRow?.method }}</a-descriptions-item>
                <a-descriptions-item label="规格">{{ currentRow?.spec }}</a-descriptions-item>
                <a-descriptions-item label="单位">{{ currentRow?.unit }}</a-descriptions-item>
                <a-descriptions-item label="状态">{{ currentRow?.status }}</a-descriptions-item>
                <a-descriptions-item label="创建时间" :span="2">{{ currentRow?.createTime }}</a-descriptions-item>
            </a-descriptions>
        </a-modal>

        <!-- 新增/编辑弹窗 -->
        <a-modal
            :open="editOpen"
            :title="editMode === 'create' ? '新增物料' : '编辑物料'"
            @ok="handleSubmit"
            @cancel="editOpen = false"
        >
            <a-form :model="editForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                <a-form-item label="物料编号" required>
                    <a-input v-model:value="editForm.code" />
                </a-form-item>
                <a-form-item label="物料名称" required>
                    <a-input v-model:value="editForm.name" />
                </a-form-item>
                <a-form-item label="制造方式" required>
                    <a-select v-model:value="editForm.method">
                        <a-select-option value="自制件">自制件</a-select-option>
                        <a-select-option value="采购件">采购件</a-select-option>
                        <a-select-option value="外协件">外协件</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="规格">
                    <a-input v-model:value="editForm.spec" />
                </a-form-item>
                <a-form-item label="单位">
                    <a-input v-model:value="editForm.unit" />
                </a-form-item>
                <a-form-item label="状态">
                    <a-select v-model:value="editForm.status">
                        <a-select-option value="enabled">启用</a-select-option>
                        <a-select-option value="disabled">停用</a-select-option>
                    </a-select>
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
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons-vue';
import { apiFetch, type ListResult } from '../../utils/apiClient';

type Row = {
    id: number;
    code: string;
    name: string;
    method: string;
    spec: string;
    unit: string;
    status: string;
    createTime: string;
};

const searchForm = reactive({ code: '', name: '' });
const selectedRowKeys = ref<number[]>([]);

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
    { title: '物料编号', dataIndex: 'code', key: 'code', width: 160 },
    { title: '物料名称', dataIndex: 'name', key: 'name', width: 180 },
    { title: '制造方式', dataIndex: 'method', key: 'method', width: 120 },
    { title: '规格', dataIndex: 'spec', key: 'spec', width: 140 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
    { title: '操作', key: 'action', width: 180, fixed: 'right' },
];

const tableData = ref<Row[]>([]);
const loadData = async () => {
    try {
        const params = new URLSearchParams();
        params.set('page', String(pagination.current));
        params.set('pageSize', String(pagination.pageSize));
        if (searchForm.code.trim()) params.set('code', searchForm.code.trim());
        if (searchForm.name.trim()) params.set('name', searchForm.name.trim());

        const res = await apiFetch<ListResult<Row>>(`/api/technicalMaterials/list?${params.toString()}`);
        tableData.value = res.data ?? [];
        pagination.total = res.total ?? 0;
    } catch (e) {
        tableData.value = [];
        pagination.total = 0;
        message.error(`获取物料数据失败：${(e as Error).message || '未知错误'}`);
    }
};

const onSelectChange = (keys: number[]) => {
    selectedRowKeys.value = keys;
};

const handleSearch = () => {
    pagination.current = 1;
    loadData();
    message.success('查询成功');
};

const handleReset = () => {
    searchForm.code = '';
    searchForm.name = '';
    pagination.current = 1;
    loadData();
};

const handlePageChange = (page: number) => {
    pagination.current = page;
    loadData();
};

const handlePageSizeChange = (_current: number, size: number) => {
    pagination.current = 1;
    pagination.pageSize = size;
    loadData();
};

const handleJumpToPage = () => {
    if (jumpPage.value >= 1 && jumpPage.value <= maxPage.value) {
        pagination.current = jumpPage.value;
        loadData();
    } else {
        message.warning('请输入有效的页码');
    }
};

// CRUD
const detailOpen = ref(false);
const editOpen = ref(false);
const editMode = ref<'create' | 'edit'>('create');
const currentRow = ref<Row | null>(null);
const editForm = reactive<Row>({
    id: 0,
    code: '',
    name: '',
    method: '自制件',
    spec: '',
    unit: '',
    status: 'enabled',
    createTime: '',
});

const openDetail = (record: Row) => {
    currentRow.value = record;
    detailOpen.value = true;
};

const openCreate = () => {
    editMode.value = 'create';
    Object.assign(editForm, {
        id: 0,
        code: '',
        name: '',
        method: '自制件',
        spec: '',
        unit: '',
        status: 'enabled',
        createTime: '',
    });
    editOpen.value = true;
};

const openEdit = (record: Row) => {
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
            await apiFetch('/api/technicalMaterials', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            message.success('新增成功');
        } else {
            await apiFetch(`/api/technicalMaterials/${editForm.id}`, {
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

const deleteOne = async (record: Row) => {
    try {
        await apiFetch(`/api/technicalMaterials/${record.id}`, { method: 'DELETE' });
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
            selectedRowKeys.value.map(id => apiFetch(`/api/technicalMaterials/${id}`, { method: 'DELETE' }))
        );
    } catch (e) {
        message.error(`删除失败：${(e as Error).message || '未知错误'}`);
        return;
    }
    message.success(`已删除 ${selectedRowKeys.value.length} 条记录`);
    selectedRowKeys.value = [];
    await loadData();
};

const noop = () => message.info('演示页面：此功能暂未接入后端');

onMounted(() => loadData());
</script>
