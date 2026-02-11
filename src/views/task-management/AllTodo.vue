<template>
    <div class="bg-[#f0f2f5]">
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline">
                <a-form-item label="任务编号">
                    <a-input v-model:value="searchForm.code" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item label="流程名称">
                    <a-input v-model:value="searchForm.flowName" placeholder="请输入内容" style="width: 220px" />
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
                <a-button @click="handleEdit" :disabled="selectedRowKeys.length !== 1">编辑</a-button>
                <a-button danger @click="handleDelete" :disabled="selectedRowKeys.length === 0">删除</a-button>
                <a-button @click="handlePrint">打印</a-button>
                <ImportExportBar
                    :import-headers="IMPORT_HEADERS"
                    :import-header-keys="[...IMPORT_HEADER_KEYS]"
                    template-filename="全部待办导入模板"
                    template-example-row="BLBH000000001,2025营销任务,处理人,营销待办,2025.04.24 14:00:00,2025.04.26 18:00:00,李民浩,未处理,"
                    export-filename-prefix="全部待办"
                    :export-headers="IMPORT_HEADERS"
                    :get-export-data="getExportData"
                    :get-export-row-values="(row: unknown) => getExportRowValues(row as Row)"
                    :on-import-submit="submitAllTodoImport"
                />
            </a-space>
        </a-card>

        <a-card :bordered="false">
            <a-table
                :columns="columns"
                :data-source="tableData"
                :pagination="false"
                row-key="id"
                :scroll="{ x: 1400 }"
                :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
                :loading="loading"
                :locale="{ emptyText: '暂无待办任务，可通过「导入」下载模板、填写后选择文件导入' }"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'status'">
                        <span class="text-red-500 font-medium">{{ record.status }}</span>
                    </template>
                    <template v-else-if="column.key === 'binding'">
                        <a class="text-blue-500" @click="noop">{{ record.binding }}</a>
                    </template>
                    <template v-else-if="column.key === 'action'">
                        <a-space>
                            <a class="text-blue-500" @click="handleViewDetail(record)">详情</a>
                            <a class="text-blue-500" @click="handleEditRow(record)">编辑</a>
                            <a-popconfirm title="确定要删除这条记录吗？" @confirm="handleDeleteRow(record)">
                                <a style="color: #ff4d4f">删除</a>
                            </a-popconfirm>
                        </a-space>
                    </template>
                </template>
            </a-table>

            <div class="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <a-pagination
                    v-model:current="pagination.current"
                    v-model:page-size="pagination.pageSize"
                    :total="pagination.total"
                    :show-size-changer="true"
                    :show-total="(total: number) => `共${total}条`"
                    :page-size-options="['15', '30', '50', '100']"
                    @change="handlePageChange"
                    @showSizeChange="handlePageSizeChange"
                />
            </div>
        </a-card>

        <!-- 新增/编辑弹窗 -->
        <a-modal
            v-model:open="formModalVisible"
            :title="editingId === undefined ? '新增待办任务' : '编辑待办任务'"
            width="720px"
            @ok="submitForm"
            @cancel="closeFormModal"
        >
            <a-form ref="formRef" :model="formState" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                <a-form-item label="任务编号" name="code" :rules="[{ required: true, message: '请输入任务编号' }]">
                    <a-input v-model:value="formState.code" placeholder="请输入任务编号" />
                </a-form-item>
                <a-form-item label="任务名称" name="name" :rules="[{ required: true, message: '请输入任务名称' }]">
                    <a-input v-model:value="formState.name" placeholder="请输入任务名称" />
                </a-form-item>
                <a-form-item label="任务节点" name="node">
                    <a-input v-model:value="formState.node" placeholder="如 处理人" />
                </a-form-item>
                <a-form-item label="待办类型" name="todoType">
                    <a-input v-model:value="formState.todoType" placeholder="如 营销待办" />
                </a-form-item>
                <a-form-item label="发起时间" name="startTime">
                    <a-input v-model:value="formState.startTime" placeholder="如 2025.04.24 14:00:00" />
                </a-form-item>
                <a-form-item label="最晚处理时间" name="deadline">
                    <a-input v-model:value="formState.deadline" placeholder="如 2025.04.26 18:00:00" />
                </a-form-item>
                <a-form-item label="发起人" name="sponsor">
                    <a-input v-model:value="formState.sponsor" placeholder="请输入发起人" />
                </a-form-item>
                <a-form-item label="处理状态" name="status">
                    <a-select v-model:value="formState.status" placeholder="请选择处理状态" allow-clear>
                        <a-select-option value="未处理">未处理</a-select-option>
                        <a-select-option value="已处理">已处理</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="绑定" name="binding">
                    <a-input v-model:value="formState.binding" placeholder="如 工艺流转卡" />
                </a-form-item>
            </a-form>
        </a-modal>

        <!-- 详情弹窗 -->
        <a-modal
            v-model:open="detailModalVisible"
            title="待办任务详情"
            width="900px"
            :footer="null"
            @cancel="detailModalVisible = false"
        >
            <a-descriptions bordered :column="2" size="small">
                <a-descriptions-item label="任务编号">{{ detailRecord?.code || '-' }}</a-descriptions-item>
                <a-descriptions-item label="任务名称">{{ detailRecord?.name || '-' }}</a-descriptions-item>
                <a-descriptions-item label="任务节点">{{ detailRecord?.node || '-' }}</a-descriptions-item>
                <a-descriptions-item label="待办类型">{{ detailRecord?.todoType || '-' }}</a-descriptions-item>
                <a-descriptions-item label="发起时间">{{ detailRecord?.startTime || '-' }}</a-descriptions-item>
                <a-descriptions-item label="最晚处理时间">{{ detailRecord?.deadline || '-' }}</a-descriptions-item>
                <a-descriptions-item label="发起人">{{ detailRecord?.sponsor || '-' }}</a-descriptions-item>
                <a-descriptions-item label="处理状态">{{ detailRecord?.status || '-' }}</a-descriptions-item>
                <a-descriptions-item label="绑定">{{ detailRecord?.binding || '-' }}</a-descriptions-item>
            </a-descriptions>
            <div class="mt-4 flex justify-end gap-2">
                <a-button @click="detailModalVisible = false">关闭</a-button>
                <a-button type="primary" @click="detailEdit">编辑</a-button>
            </div>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { apiFetch, type ApiResult, type ListResult } from '../../utils/apiClient';
import ImportExportBar from '../../components/ImportExportBar.vue';

type Row = {
    id: number | string;
    code: string;
    name: string;
    node: string;
    todoType: string;
    startTime: string;
    deadline: string;
    sponsor: string;
    status: string;
    binding: string;
};

const searchForm = reactive({ code: '', flowName: '' });
const selectedRowKeys = ref<(number | string)[]>([]);
const pagination = reactive({ current: 1, pageSize: 15, total: 0 });
const tableData = ref<Row[]>([]);
const loading = ref(false);

const columns = [
    {
        title: '#',
        key: 'index',
        width: 60,
        customRender: ({ index }: { index: number }) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    { title: '任务编号', dataIndex: 'code', key: 'code', width: 160 },
    { title: '任务名称', dataIndex: 'name', key: 'name', width: 180 },
    { title: '任务节点', dataIndex: 'node', key: 'node', width: 140 },
    { title: '待办类型', dataIndex: 'todoType', key: 'todoType', width: 120 },
    { title: '发起时间', dataIndex: 'startTime', key: 'startTime', width: 180 },
    { title: '最晚处理时间', dataIndex: 'deadline', key: 'deadline', width: 180 },
    { title: '发起人', dataIndex: 'sponsor', key: 'sponsor', width: 120 },
    { title: '处理状态', key: 'status', width: 120 },
    { title: '绑定', key: 'binding', width: 140 },
    { title: '操作', key: 'action', width: 120, fixed: 'right' },
];

// ---------- 列表加载 ----------
const loadData = async () => {
    loading.value = true;
    try {
        const params = new URLSearchParams();
        params.set('page', String(pagination.current));
        params.set('pageSize', String(pagination.pageSize));
        if (searchForm.code.trim()) params.set('code', searchForm.code.trim());
        // “流程名称”实际按 name 模糊查询
        if (searchForm.flowName.trim()) params.set('name', searchForm.flowName.trim());
        const res = await apiFetch<ListResult<Row>>(`/api/tasks/list?${params.toString()}`);
        tableData.value = (res.data ?? []).map((r: Row & { _id?: unknown }, i: number) => ({
            ...r,
            id: r.id !== undefined && r.id !== null ? r.id : r._id != null ? String(r._id) : `_${i}`,
        }));
        pagination.total = res.total ?? 0;
    } catch {
        tableData.value = [];
        pagination.total = 0;
        message.error('加载列表失败，请检查网络或登录状态');
    } finally {
        loading.value = false;
    }
};

const onSelectChange = (keys: (number | string)[]) => {
    selectedRowKeys.value = keys;
};

// 查询/重置/分页
const handleSearch = () => {
    pagination.current = 1;
    loadData();
    message.success('查询成功');
};
const handleReset = () => {
    searchForm.code = '';
    searchForm.flowName = '';
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

// ---------- 新增/编辑 ----------
const formModalVisible = ref(false);
const formRef = ref();
const editingId = ref<number | string | undefined>(undefined);
const formState = reactive({
    code: '',
    name: '',
    node: '',
    todoType: '',
    startTime: '',
    deadline: '',
    sponsor: '',
    status: '未处理',
    binding: '',
});

function getNextId(): number {
    if (tableData.value.length === 0) return 1;
    const ids = tableData.value.map(r => (typeof r.id === 'number' ? r.id : 0));
    return Math.max(...ids, 0) + 1;
}

function resetForm() {
    formState.code = '';
    formState.name = '';
    formState.node = '';
    formState.todoType = '';
    formState.startTime = '';
    formState.deadline = '';
    formState.sponsor = '';
    formState.status = '未处理';
    formState.binding = '';
    editingId.value = undefined;
}

function openFormModal(record?: Row) {
    resetForm();
    if (record) {
        editingId.value = record.id;
        formState.code = record.code ?? '';
        formState.name = record.name ?? '';
        formState.node = record.node ?? '';
        formState.todoType = record.todoType ?? '';
        formState.startTime = record.startTime ?? '';
        formState.deadline = record.deadline ?? '';
        formState.sponsor = record.sponsor ?? '';
        formState.status = record.status ?? '未处理';
        formState.binding = record.binding ?? '';
    }
    formModalVisible.value = true;
}

function closeFormModal() {
    formModalVisible.value = false;
    resetForm();
}

async function submitForm() {
    try {
        await formRef.value?.validate();
    } catch {
        return;
    }
    const id = editingId.value;
    const payload = {
        code: formState.code,
        name: formState.name,
        node: formState.node,
        todoType: formState.todoType,
        startTime: formState.startTime,
        deadline: formState.deadline,
        sponsor: formState.sponsor,
        status: formState.status || '未处理',
        binding: formState.binding,
    };
    try {
        if (id === undefined) {
            const nextId = getNextId();
            await apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify({ ...payload, id: nextId }) });
            message.success('新增成功');
            // 新增任务成功后，刷新系统通知列表，保证铃铛里能立刻看到“任务创建”通知
            window.dispatchEvent(new CustomEvent('notification-list-refresh'));
        } else {
            await apiFetch(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
            message.success('编辑成功');
        }
        closeFormModal();
        await loadData();
    } catch {
        message.error(id === undefined ? '新增失败' : '编辑失败');
    }
}

const handleAdd = () => openFormModal();
const handleEdit = () => {
    if (selectedRowKeys.value.length !== 1) return;
    const record = tableData.value.find(r => r.id === selectedRowKeys.value[0]);
    if (record) openFormModal(record);
};
const handleEditRow = (record: Row) => openFormModal(record);

// ---------- 详情 ----------
const detailModalVisible = ref(false);
const detailRecord = ref<Row | null>(null);

const handleViewDetail = async (record: Row) => {
    try {
        const res = await apiFetch<ApiResult<Row>>(`/api/tasks/${record.id}`);
        detailRecord.value = res.data;
    } catch {
        detailRecord.value = record;
    }
    detailModalVisible.value = true;
};

const detailEdit = () => {
    if (!detailRecord.value) return;
    detailModalVisible.value = false;
    openFormModal(detailRecord.value);
};

// ---------- 删除 ----------
const handleDelete = async () => {
    if (selectedRowKeys.value.length === 0) {
        message.warning('请选择要删除的记录');
        return;
    }
    let ok = 0;
    let err = 0;
    for (const id of selectedRowKeys.value) {
        try {
            await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
            ok++;
        } catch {
            err++;
        }
    }
    selectedRowKeys.value = [];
    await loadData();
    if (err === 0) message.success(`已删除 ${ok} 条记录`);
    else message.warning(`删除完成：成功 ${ok} 条，失败 ${err} 条`);
};

const handleDeleteRow = async (record: Row) => {
    try {
        await apiFetch(`/api/tasks/${record.id}`, { method: 'DELETE' });
        message.success('删除成功');
        await loadData();
    } catch {
        message.error('删除失败');
    }
};

const handlePrint = () => message.info('打印功能');
const noop = () => message.info('功能待扩展');

const IMPORT_HEADERS = [
    '任务编号',
    '任务名称',
    '任务节点',
    '待办类型',
    '发起时间',
    '最晚处理时间',
    '发起人',
    '处理状态',
    '绑定',
];
const IMPORT_HEADER_KEYS = [
    'code',
    'name',
    'node',
    'todoType',
    'startTime',
    'deadline',
    'sponsor',
    'status',
    'binding',
] as const;

const getExportData = () => tableData.value;
const getExportRowValues = (r: Row): (string | number)[] => [
    r.code,
    r.name,
    r.node,
    r.todoType,
    r.startTime,
    r.deadline,
    r.sponsor,
    r.status,
    r.binding,
];

const submitAllTodoImport = async (rows: Record<string, string>[]) => {
    let ok = 0;
    let err = 0;
    const maxId = tableData.value.length
        ? Math.max(...tableData.value.map(r => (typeof r.id === 'number' ? r.id : 0)), 0)
        : 0;
    let nextId = maxId + 1;
    for (const row of rows) {
        const payload = {
            id: nextId++,
            code: row.code || '',
            name: row.name || '',
            node: row.node || '',
            todoType: row.todoType || '',
            startTime: row.startTime || '',
            deadline: row.deadline || '',
            sponsor: row.sponsor || '',
            status: row.status || '未处理',
            binding: row.binding || '',
        };
        try {
            await apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(payload) });
            ok++;
        } catch {
            err++;
        }
    }
    await loadData();
    if (err === 0) message.success(`成功导入 ${ok} 条`);
    else message.warning(`导入完成：成功 ${ok} 条，失败 ${err} 条`);
};

onMounted(() => loadData());
</script>
