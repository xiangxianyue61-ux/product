<template>
    <div class="bg-[#f0f2f5]">
        <!-- 搜索筛选区域 -->
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline" class="search-form">
                <a-form-item label="工单编号">
                    <a-input v-model:value="searchForm.workOrderNumber" placeholder="请输入内容" style="width: 200px" />
                </a-form-item>
                <a-form-item label="工单名称">
                    <a-input v-model:value="searchForm.workOrderName" placeholder="请输入内容" style="width: 200px" />
                </a-form-item>
                <a-form-item>
                    <a-space>
                        <a-button type="primary" @click="handleSearch">
                            <template #icon>
                                <SearchOutlined />
                            </template>
                            查询
                        </a-button>
                        <a-button @click="handleReset">
                            <template #icon>
                                <ReloadOutlined />
                            </template>
                            重置
                        </a-button>
                    </a-space>
                </a-form-item>
            </a-form>
        </a-card>

        <!-- 操作按钮区域 -->
        <a-card class="mb-4" :bordered="false">
            <a-space>
                <a-button type="primary" @click="handleAdd">
                    <template #icon>
                        <PlusOutlined />
                    </template>
                    新增
                </a-button>
                <a-button @click="handleEdit" :disabled="selectedRowKeys.length !== 1">
                    <template #icon>
                        <EditOutlined />
                    </template>
                    编辑
                </a-button>
                <a-button danger @click="handleDelete" :disabled="selectedRowKeys.length === 0">
                    <template #icon>
                        <DeleteOutlined />
                    </template>
                    删除
                </a-button>
                <a-button @click="handlePrint">
                    <template #icon>
                        <PrinterOutlined />
                    </template>
                    打印
                </a-button>
                <ImportExportBar
                    :import-headers="IMPORT_HEADERS"
                    :import-header-keys="[...IMPORT_HEADER_KEYS]"
                    template-filename="生产工单导入模板"
                    template-example-row="SCGD00000001,外贸1生产工单,普通,CP000001,笔记本电脑,200,50,台,PC/001001,2025.01.01,2025"
                    export-filename-prefix="生产工单"
                    :export-headers="IMPORT_HEADERS"
                    :get-export-data="getExportData"
                    :get-export-row-values="(row: unknown) => getExportRowValues(row as WorkOrder)"
                    :on-import-submit="submitWorkOrderImport"
                />
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
                :loading="loading"
                row-key="id"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'action'">
                        <a-space>
                            <a @click="handleViewDetail(record)">详情</a>
                            <a @click="handlePause(record)">暂停</a>
                            <a-popconfirm title="确定要关单吗？" @confirm="handleCloseOrder(record)">
                                <a style="color: #ff4d4f">关单</a>
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
                    <a-input-number
                        v-model:value="jumpPage"
                        :min="1"
                        :max="Math.ceil(pagination.total / pagination.pageSize)"
                        style="width: 80px"
                    />
                    <span>页</span>
                    <a-button type="primary" size="small" @click="handleJumpToPage">确定</a-button>
                </a-space>
            </div>
        </a-card>

        <!-- 详情弹窗 -->
        <a-modal :open="detailOpen" title="工单详情" @cancel="detailOpen = false" :footer="null">
            <a-descriptions bordered size="small" :column="2">
                <a-descriptions-item label="工单编号">{{ currentRow?.workOrderNumber }}</a-descriptions-item>
                <a-descriptions-item label="工单名称">{{ currentRow?.workOrderName }}</a-descriptions-item>
                <a-descriptions-item label="紧急程度">{{ currentRow?.urgencyLevel }}</a-descriptions-item>
                <a-descriptions-item label="产品编号">{{ currentRow?.productNumber }}</a-descriptions-item>
                <a-descriptions-item label="产品名称">{{ currentRow?.productName }}</a-descriptions-item>
                <a-descriptions-item label="生产数量">{{ currentRow?.productionQuantity }}</a-descriptions-item>
                <a-descriptions-item label="已生产数量">{{ currentRow?.producedQuantity }}</a-descriptions-item>
                <a-descriptions-item label="单位">{{ currentRow?.unit }}</a-descriptions-item>
                <a-descriptions-item label="批次号">{{ currentRow?.batchNumber }}</a-descriptions-item>
                <a-descriptions-item label="计划开工日期">{{ currentRow?.plannedStartDate }}</a-descriptions-item>
                <a-descriptions-item label="计划年">{{ currentRow?.plannedYear }}</a-descriptions-item>
            </a-descriptions>
        </a-modal>

        <!-- 新增/编辑弹窗 -->
        <a-modal
            :open="editOpen"
            :title="editMode === 'create' ? '新增工单' : '编辑工单'"
            @ok="handleSubmit"
            @cancel="handleCancelEdit"
        >
            <a-form :model="editForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                <a-form-item label="工单编号" required>
                    <a-input v-model:value="editForm.workOrderNumber" placeholder="例如 SCGD0000001" />
                </a-form-item>
                <a-form-item label="工单名称" required>
                    <a-input v-model:value="editForm.workOrderName" placeholder="请输入工单名称" />
                </a-form-item>
                <a-form-item label="紧急程度" required>
                    <a-select v-model:value="editForm.urgencyLevel" placeholder="请选择">
                        <a-select-option value="普通">普通</a-select-option>
                        <a-select-option value="紧急">紧急</a-select-option>
                        <a-select-option value="非常紧急">非常紧急</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="产品编号" required>
                    <a-input v-model:value="editForm.productNumber" />
                </a-form-item>
                <a-form-item label="产品名称" required>
                    <a-input v-model:value="editForm.productName" />
                </a-form-item>
                <a-form-item label="生产数量" required>
                    <a-input-number v-model:value="editForm.productionQuantity" :min="0" style="width: 100%" />
                </a-form-item>
                <a-form-item label="已生产数量" required>
                    <a-input-number v-model:value="editForm.producedQuantity" :min="0" style="width: 100%" />
                </a-form-item>
                <a-form-item label="单位" required>
                    <a-input v-model:value="editForm.unit" />
                </a-form-item>
                <a-form-item label="批次号">
                    <a-input v-model:value="editForm.batchNumber" />
                </a-form-item>
                <a-form-item label="计划开工日期">
                    <a-input v-model:value="editForm.plannedStartDate" placeholder="YYYY.MM.DD" />
                </a-form-item>
                <a-form-item label="计划年">
                    <a-input v-model:value="editForm.plannedYear" />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import {
    SearchOutlined,
    ReloadOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    PrinterOutlined,
} from '@ant-design/icons-vue';
import { apiFetch, type ListResult } from '../../utils/apiClient';
import ImportExportBar from '../../components/ImportExportBar.vue';

const route = useRoute();
interface WorkOrder {
    id: number;
    workOrderNumber: string;
    workOrderName: string;
    urgencyLevel: string;
    productNumber: string;
    productName: string;
    productionQuantity: number;
    producedQuantity: number;
    unit: string;
    batchNumber: string;
    plannedStartDate: string;
    plannedYear: string;
}

// 搜索表单
const searchForm = reactive({
    workOrderNumber: '',
    workOrderName: '',
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
        title: '工单编号',
        dataIndex: 'workOrderNumber',
        key: 'workOrderNumber',
        width: 150,
    },
    {
        title: '工单名称',
        dataIndex: 'workOrderName',
        key: 'workOrderName',
        width: 200,
    },
    {
        title: '紧急程度',
        dataIndex: 'urgencyLevel',
        key: 'urgencyLevel',
        width: 100,
    },
    {
        title: '产品编号',
        dataIndex: 'productNumber',
        key: 'productNumber',
        width: 150,
    },
    {
        title: '产品名称',
        dataIndex: 'productName',
        key: 'productName',
        width: 200,
    },
    {
        title: '生产数量',
        dataIndex: 'productionQuantity',
        key: 'productionQuantity',
        width: 100,
    },
    {
        title: '已生产数量',
        dataIndex: 'producedQuantity',
        key: 'producedQuantity',
        width: 120,
    },
    {
        title: '单位',
        dataIndex: 'unit',
        key: 'unit',
        width: 80,
    },
    {
        title: '批次号',
        dataIndex: 'batchNumber',
        key: 'batchNumber',
        width: 150,
    },
    {
        title: '计划开工日期',
        dataIndex: 'plannedStartDate',
        key: 'plannedStartDate',
        width: 120,
    },
    {
        title: '计划年',
        dataIndex: 'plannedYear',
        key: 'plannedYear',
        width: 100,
    },
    {
        title: '操作',
        key: 'action',
        width: 180,
        fixed: 'right',
    },
];

// 表格数据
const tableData = ref<WorkOrder[]>([]);
const loading = ref(false);

// 选中的行
const selectedRowKeys = ref<number[]>([]);

// 分页配置
const pagination = reactive({
    current: 1,
    pageSize: 15,
    total: 56,
});

// 跳转页码
const jumpPage = ref<number>(1);

const loadData = async () => {
    loading.value = true;
    try {
        const params = new URLSearchParams();
        params.set('page', String(pagination.current));
        params.set('pageSize', String(pagination.pageSize));
        if (searchForm.workOrderNumber.trim()) params.set('workOrderNumber', searchForm.workOrderNumber.trim());
        if (searchForm.workOrderName.trim()) params.set('workOrderName', searchForm.workOrderName.trim());

        const res = await apiFetch<ListResult<WorkOrder>>(`/api/productionWorkOrders/list?${params.toString()}`);
        tableData.value = res.data ?? [];
        pagination.total = res.total ?? 0;
    } catch (e) {
        tableData.value = [];
        pagination.total = 0;
        message.error(`获取工单数据失败：${(e as Error).message || '未知错误'}`);
    } finally {
        loading.value = false;
    }
};

// 详情/编辑
const detailOpen = ref(false);
const editOpen = ref(false);
const editMode = ref<'create' | 'edit'>('create');
const currentRow = ref<WorkOrder | null>(null);
const editForm = reactive<WorkOrder>({
    id: 0,
    workOrderNumber: '',
    workOrderName: '',
    urgencyLevel: '普通',
    productNumber: '',
    productName: '',
    productionQuantity: 0,
    producedQuantity: 0,
    unit: '个',
    batchNumber: '',
    plannedStartDate: '',
    plannedYear: '',
});

const openDetail = async (record: WorkOrder) => {
    currentRow.value = record;
    detailOpen.value = true;
};

const openCreate = () => {
    editMode.value = 'create';
    Object.assign(editForm, {
        id: 0,
        workOrderNumber: '',
        workOrderName: '',
        urgencyLevel: '普通',
        productNumber: '',
        productName: '',
        productionQuantity: 0,
        producedQuantity: 0,
        unit: '个',
        batchNumber: '',
        plannedStartDate: '',
        plannedYear: '',
    });
    editOpen.value = true;
};

const openEdit = (record: WorkOrder) => {
    editMode.value = 'edit';
    Object.assign(editForm, record);
    editOpen.value = true;
};

const handleCancelEdit = () => {
    editOpen.value = false;
};

const handleSubmit = async () => {
    try {
        const payload = { ...editForm };
        if (editMode.value === 'create') {
            await apiFetch(`/api/productionWorkOrders`, { method: 'POST', body: JSON.stringify(payload) });
            message.success('新增成功');
            pagination.current = 1; // 新增后回到第一页，便于看到最新数据
            // 立即刷新铃铛里的系统通知列表，无需整页刷新即可看到新工单通知
            window.dispatchEvent(new CustomEvent('notification-list-refresh'));
        } else {
            await apiFetch(`/api/productionWorkOrders/${editForm.id}`, {
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

// 搜索
const handleSearch = () => {
    pagination.current = 1;
    selectedRowKeys.value = [];
    loadData();
    message.success('查询成功');
};

// 重置
const handleReset = () => {
    searchForm.workOrderNumber = '';
    searchForm.workOrderName = '';
    pagination.current = 1;
    selectedRowKeys.value = [];
    loadData();
};

// 新增
const handleAdd = () => {
    openCreate();
};

// 编辑
const handleEdit = () => {
    if (selectedRowKeys.value.length !== 1) return;
    const id = selectedRowKeys.value[0];
    const row = tableData.value.find(r => r.id === id);
    if (row) openEdit(row);
};

// 删除
const handleDelete = async () => {
    if (selectedRowKeys.value.length === 0) return message.warning('请选择要删除的记录');
    try {
        await Promise.all(
            selectedRowKeys.value.map(id => apiFetch(`/api/productionWorkOrders/${id}`, { method: 'DELETE' }))
        );
        message.success(`已删除 ${selectedRowKeys.value.length} 条记录`);
        selectedRowKeys.value = [];
        await loadData();
    } catch (e) {
        message.error(`删除失败：${(e as Error).message || '未知错误'}`);
    }
};

// 查看详情
const handleViewDetail = (record: WorkOrder) => {
    openDetail(record);
};

// 暂停
const handlePause = (_record: WorkOrder) => {
    message.success('工单已暂停');
};

// 关单
const handleCloseOrder = (_record: WorkOrder) => {
    message.success('工单已关闭');
    loadData();
};

// 打印
const handlePrint = () => {
    message.info('打印功能');
};

const IMPORT_HEADERS = [
    '工单编号',
    '工单名称',
    '紧急程度',
    '产品编号',
    '产品名称',
    '生产数量',
    '已生产数量',
    '单位',
    '批次号',
    '计划开工日期',
    '计划年',
];
const IMPORT_HEADER_KEYS = [
    'workOrderNumber',
    'workOrderName',
    'urgencyLevel',
    'productNumber',
    'productName',
    'productionQuantity',
    'producedQuantity',
    'unit',
    'batchNumber',
    'plannedStartDate',
    'plannedYear',
] as const;

const getExportData = () => tableData.value;
const getExportRowValues = (r: WorkOrder): (string | number)[] => [
    r.workOrderNumber,
    r.workOrderName,
    r.urgencyLevel,
    r.productNumber,
    r.productName,
    r.productionQuantity,
    r.producedQuantity,
    r.unit,
    r.batchNumber,
    r.plannedStartDate,
    r.plannedYear,
];

const submitWorkOrderImport = async (rows: Record<string, string>[]) => {
    let ok = 0;
    let err = 0;
    const maxId = tableData.value.length ? Math.max(...tableData.value.map(r => r.id || 0), 0) : 0;
    let nextId = maxId + 1;
    for (const row of rows) {
        const payload: WorkOrder = {
            id: nextId++,
            workOrderNumber: row.workOrderNumber || '',
            workOrderName: row.workOrderName || '',
            urgencyLevel: row.urgencyLevel || '普通',
            productNumber: row.productNumber || '',
            productName: row.productName || '',
            productionQuantity: Number(row.productionQuantity) || 0,
            producedQuantity: Number(row.producedQuantity) || 0,
            unit: row.unit || '',
            batchNumber: row.batchNumber || '',
            plannedStartDate: row.plannedStartDate || '',
            plannedYear: row.plannedYear || '',
        };
        try {
            await apiFetch('/api/productionWorkOrders', {
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

// 选择变化
const onSelectChange = (keys: number[]) => {
    selectedRowKeys.value = keys;
};

// 页码变化
const handlePageChange = (page: number) => {
    pagination.current = page;
    selectedRowKeys.value = [];
    loadData();
};

// 每页条数变化
const handlePageSizeChange = (_current: number, size: number) => {
    pagination.current = 1;
    pagination.pageSize = size;
    selectedRowKeys.value = [];
    loadData();
};

// 跳转到指定页
const handleJumpToPage = () => {
    if (jumpPage.value >= 1 && jumpPage.value <= Math.ceil(pagination.total / pagination.pageSize)) {
        pagination.current = jumpPage.value;
        selectedRowKeys.value = [];
        loadData();
    } else {
        message.warning('请输入有效的页码');
    }
};

// 收到 WebSocket 工单通知时自动刷新列表，无需手动刷新
const onListInvalidate = (e: Event) => {
    const detail = (e as CustomEvent<{ type: string }>).detail;
    if (detail?.type === 'work_order') loadData();
};

onMounted(() => {
    // 如果从系统通知携带工单编号跳转而来，自动填充搜索条件
    const q = route.query;
    if (typeof q.workOrderNumber === 'string' && q.workOrderNumber) {
        searchForm.workOrderNumber = q.workOrderNumber;
    }
    loadData();
    window.addEventListener('list-invalidate', onListInvalidate);
});

onBeforeUnmount(() => {
    window.removeEventListener('list-invalidate', onListInvalidate);
});
</script>

<style scoped></style>
