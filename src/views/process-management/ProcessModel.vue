<template>
    <div class="bg-[#f0f2f5]">
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline">
                <a-form-item label="流程编号">
                    <a-input v-model:value="searchForm.code" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item label="流程名称">
                    <a-input v-model:value="searchForm.name" placeholder="请输入内容" style="width: 220px" />
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
                    template-filename="流程模型导入模板"
                    template-example-row="LCBH0111111,PLM_FLOW_CARD_APP:19:747be90f,PLM_FLOW_CARD,自定义业务,工艺流转卡,V1.0,激活,2025.01.05 15:32:28"
                    export-filename-prefix="流程模型"
                    :export-headers="IMPORT_HEADERS"
                    :get-export-data="getExportData"
                    :get-export-row-values="(row: unknown) => getExportRowValues(row as ProcessModelRow)"
                    :on-import-submit="submitProcessModelImport"
                />
            </a-space>
        </a-card>

        <a-card :bordered="false">
            <a-table
                :columns="columns"
                :data-source="tableData"
                :pagination="false"
                :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
                row-key="id"
                :scroll="{ x: 1400 }"
                :loading="loading"
                :locale="{ emptyText: '暂无流程模型，可通过「导入」下载模板、填写后选择文件导入' }"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'status'">
                        <span :class="record.status === '激活' ? 'text-green-600' : 'text-red-500'">
                            {{ record.status }}
                        </span>
                    </template>
                    <template v-else-if="column.key === 'action'">
                        <a-space>
                            <a @click="handleViewDetail(record)">详情</a>
                            <a @click="handleEditRow(record)">编辑</a>
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
                >
                    <template #buildOptionText="props">
                        <span>{{ props.value }}条/页</span>
                    </template>
                </a-pagination>
                <a-space class="flex items-center gap-2">
                    <span>跳至</span>
                    <a-input-number
                        v-model:value="jumpPage"
                        :min="1"
                        :max="Math.ceil(pagination.total / pagination.pageSize) || 1"
                        style="width: 80px"
                    />
                    <span>页</span>
                    <a-button type="primary" size="small" @click="handleJumpToPage">确定</a-button>
                </a-space>
            </div>
        </a-card>

        <!-- 新增/编辑弹窗 -->
        <a-modal
            v-model:open="formModalVisible"
            :title="editingId === undefined ? '新增流程模型' : '编辑流程模型'"
            width="640px"
            @ok="submitForm"
            @cancel="closeFormModal"
        >
            <a-form ref="formRef" :model="formState" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                <a-form-item label="流程编号" name="code" :rules="[{ required: true, message: '请输入流程编号' }]">
                    <a-input v-model:value="formState.code" placeholder="请输入流程编号" />
                </a-form-item>
                <a-form-item label="流程定义ID" name="flowId">
                    <a-input v-model:value="formState.flowId" placeholder="请输入流程定义ID" />
                </a-form-item>
                <a-form-item label="流程标识Key" name="key">
                    <a-input v-model:value="formState.key" placeholder="请输入流程标识Key" />
                </a-form-item>
                <a-form-item label="流程分类" name="category">
                    <a-input v-model:value="formState.category" placeholder="请输入流程分类" />
                </a-form-item>
                <a-form-item label="流程名称" name="name" :rules="[{ required: true, message: '请输入流程名称' }]">
                    <a-input v-model:value="formState.name" placeholder="请输入流程名称" />
                </a-form-item>
                <a-form-item label="流程版本" name="version">
                    <a-input v-model:value="formState.version" placeholder="如 V1.0" />
                </a-form-item>
                <a-form-item label="状态" name="status">
                    <a-select v-model:value="formState.status" placeholder="请选择状态" allow-clear>
                        <a-select-option value="激活">激活</a-select-option>
                        <a-select-option value="挂起">挂起</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="部署时间" name="deployTime">
                    <a-input v-model:value="formState.deployTime" placeholder="如 2025.01.05 15:32:28" />
                </a-form-item>
            </a-form>
        </a-modal>

        <!-- 导入预览确认弹窗 -->
        <!-- 详情弹窗（从数据库取最新） -->
        <a-modal
            v-model:open="detailModalVisible"
            title="流程模型详情"
            width="900px"
            :footer="null"
            @cancel="detailModalVisible = false"
        >
            <a-descriptions bordered :column="2" size="small">
                <a-descriptions-item label="流程编号">{{ detailRecord?.code || '-' }}</a-descriptions-item>
                <a-descriptions-item label="流程定义ID">{{ detailRecord?.flowId || '-' }}</a-descriptions-item>
                <a-descriptions-item label="流程标识Key">{{ detailRecord?.key || '-' }}</a-descriptions-item>
                <a-descriptions-item label="流程分类">{{ detailRecord?.category || '-' }}</a-descriptions-item>
                <a-descriptions-item label="流程名称">{{ detailRecord?.name || '-' }}</a-descriptions-item>
                <a-descriptions-item label="流程版本">{{ detailRecord?.version || '-' }}</a-descriptions-item>
                <a-descriptions-item label="状态">{{ detailRecord?.status || '-' }}</a-descriptions-item>
                <a-descriptions-item label="部署时间">{{ detailRecord?.deployTime || '-' }}</a-descriptions-item>
            </a-descriptions>
            <div class="mt-4 flex justify-end gap-2">
                <a-button @click="detailModalVisible = false">关闭</a-button>
                <a-button type="primary" @click="detailEdit">编辑</a-button>
            </div>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { apiFetch, type ApiResult, type ListResult } from '../../utils/apiClient';
import ImportExportBar from '../../components/ImportExportBar.vue';

interface ProcessModelRow {
    id: number | string;
    code: string;
    flowId: string;
    key: string;
    category: string;
    name: string;
    version: string;
    status: string;
    deployTime: string;
}

const IMPORT_HEADERS = [
    '流程编号',
    '流程定义ID',
    '流程标识Key',
    '流程分类',
    '流程名称',
    '流程版本',
    '状态',
    '部署时间',
];
const IMPORT_HEADER_KEYS = ['code', 'flowId', 'key', 'category', 'name', 'version', 'status', 'deployTime'] as const;

const searchForm = reactive({ code: '', name: '' });
const selectedRowKeys = ref<(number | string)[]>([]);
const pagination = reactive({ current: 1, pageSize: 15, total: 0 });
const jumpPage = ref(1);
const tableData = ref<ProcessModelRow[]>([]);
const loading = ref(false);

const columns = [
    {
        title: '#',
        key: 'index',
        width: 60,
        customRender: ({ index }: { index: number }) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    { title: '流程编号', dataIndex: 'code', key: 'code', width: 140 },
    { title: '流程定义ID', dataIndex: 'flowId', key: 'flowId', width: 240 },
    { title: '流程标识Key', dataIndex: 'key', key: 'key', width: 160 },
    { title: '流程分类', dataIndex: 'category', key: 'category', width: 140 },
    { title: '流程名称', dataIndex: 'name', key: 'name', width: 160 },
    { title: '流程版本', dataIndex: 'version', key: 'version', width: 100 },
    { title: '状态', key: 'status', width: 100 },
    { title: '部署时间', dataIndex: 'deployTime', key: 'deployTime', width: 180 },
    { title: '操作', key: 'action', width: 180, fixed: 'right' },
];

const loadData = async () => {
    loading.value = true;
    try {
        const params = new URLSearchParams();
        params.set('page', String(pagination.current));
        params.set('pageSize', String(pagination.pageSize));
        if (searchForm.code.trim()) params.set('code', searchForm.code.trim());
        if (searchForm.name.trim()) params.set('name', searchForm.name.trim());
        const res = await apiFetch<ListResult<ProcessModelRow>>(`/api/processModels/list?${params.toString()}`);
        tableData.value = (res.data ?? []).map((r: ProcessModelRow & { _id?: unknown }, i: number) => ({
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
    const maxPage = Math.ceil(pagination.total / pagination.pageSize) || 1;
    if (jumpPage.value >= 1 && jumpPage.value <= maxPage) {
        pagination.current = jumpPage.value;
        loadData();
    } else {
        message.warning('请输入有效的页码');
    }
};
const onSelectChange = (keys: (number | string)[]) => {
    selectedRowKeys.value = keys;
};

// ---------- 新增/编辑 ----------
const formModalVisible = ref(false);
const formRef = ref();
const editingId = ref<number | string | undefined>(undefined);
const formState = reactive({
    code: '',
    flowId: '',
    key: '',
    category: '',
    name: '',
    version: '',
    status: '',
    deployTime: '',
});

function getNextId(): number {
    if (tableData.value.length === 0) return 1;
    const ids = tableData.value.map(r => (typeof r.id === 'number' ? r.id : 0));
    return Math.max(...ids, 0) + 1;
}

function resetForm() {
    formState.code = '';
    formState.flowId = '';
    formState.key = '';
    formState.category = '';
    formState.name = '';
    formState.version = '';
    formState.status = '激活';
    formState.deployTime = '';
    editingId.value = undefined;
}

function openFormModal(record?: ProcessModelRow) {
    resetForm();
    if (record) {
        editingId.value = record.id;
        formState.code = record.code ?? '';
        formState.flowId = record.flowId ?? '';
        formState.key = record.key ?? '';
        formState.category = record.category ?? '';
        formState.name = record.name ?? '';
        formState.version = record.version ?? '';
        formState.status = record.status ?? '激活';
        formState.deployTime = record.deployTime ?? '';
    } else {
        formState.status = '激活';
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
        flowId: formState.flowId,
        key: formState.key,
        category: formState.category,
        name: formState.name,
        version: formState.version,
        status: formState.status || '激活',
        deployTime: formState.deployTime,
    };
    try {
        if (id === undefined) {
            const nextId = getNextId();
            await apiFetch('/api/processModels', {
                method: 'POST',
                body: JSON.stringify({ ...payload, id: nextId }),
            });
            message.success('新增成功');
        } else {
            await apiFetch(`/api/processModels/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
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
const handleEditRow = (record: ProcessModelRow) => openFormModal(record);
const detailModalVisible = ref(false);
const detailRecord = ref<ProcessModelRow | null>(null);

const handleViewDetail = async (record: ProcessModelRow) => {
    try {
        const res = await apiFetch<ApiResult<ProcessModelRow>>(`/api/processModels/${record.id}`);
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

async function handleDelete() {
    if (selectedRowKeys.value.length === 0) {
        message.warning('请选择要删除的记录');
        return;
    }
    let ok = 0;
    let err = 0;
    for (const id of selectedRowKeys.value) {
        try {
            await apiFetch(`/api/processModels/${id}`, { method: 'DELETE' });
            ok++;
        } catch {
            err++;
        }
    }
    selectedRowKeys.value = [];
    await loadData();
    if (err === 0) message.success(`已删除 ${ok} 条记录`);
    else message.warning(`删除完成：成功 ${ok} 条，失败 ${err} 条`);
}

async function handleDeleteRow(record: ProcessModelRow) {
    try {
        await apiFetch(`/api/processModels/${record.id}`, { method: 'DELETE' });
        message.success('删除成功');
        await loadData();
    } catch {
        message.error('删除失败');
    }
}

const handlePrint = () => message.info('打印功能');

// ---------- 通用导入导出（由 ImportExportBar 调用） ----------
const getExportData = () => tableData.value;
const getExportRowValues = (r: ProcessModelRow): (string | number)[] => [
    r.code,
    r.flowId,
    r.key,
    r.category,
    r.name,
    r.version,
    r.status ?? '',
    r.deployTime ?? '',
];

const submitProcessModelImport = async (rows: Record<string, string>[]) => {
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
            flowId: row.flowId || '',
            key: row.key || '',
            category: row.category || '',
            name: row.name || '',
            version: row.version || '',
            status: row.status || '激活',
            deployTime: row.deployTime || '',
        };
        try {
            await apiFetch('/api/processModels', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
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
