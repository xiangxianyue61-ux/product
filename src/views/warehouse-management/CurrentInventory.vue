<template>
    <div class="bg-[#f0f2f5]">
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

        <a-card class="mb-4" :bordered="false">
            <a-space>
                <a-button type="primary" @click="openCreate">新增</a-button>
                <a-button @click="openEditBySelection" :disabled="selectedRowKeys.length !== 1">编辑</a-button>
                <a-button danger @click="deleteBySelection" :disabled="selectedRowKeys.length === 0">删除</a-button>
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
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'action'">
                        <a-space>
                            <a @click="openDetail(record)">详情</a>
                            <a @click="openEdit(record)">编辑</a>
                            <a-popconfirm title="确定要删除这条记录吗？" @confirm="deleteOne(record)">
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
        <a-modal :open="detailOpen" title="库存详情" @cancel="detailOpen = false" :footer="null">
            <a-descriptions bordered size="small" :column="2">
                <a-descriptions-item label="物料编号">{{ currentRow?.materialCode }}</a-descriptions-item>
                <a-descriptions-item label="物料名称">{{ currentRow?.materialName }}</a-descriptions-item>
                <a-descriptions-item label="规格型号">{{ currentRow?.spec }}</a-descriptions-item>
                <a-descriptions-item label="在库数量">{{ currentRow?.quantity }}</a-descriptions-item>
                <a-descriptions-item label="单位">{{ currentRow?.unit }}</a-descriptions-item>
                <a-descriptions-item label="入库批次号">{{ currentRow?.batchNo }}</a-descriptions-item>
                <a-descriptions-item label="仓库">{{ currentRow?.warehouse }}</a-descriptions-item>
                <a-descriptions-item label="库区">{{ currentRow?.area }}</a-descriptions-item>
                <a-descriptions-item label="库位">{{ currentRow?.location }}</a-descriptions-item>
                <a-descriptions-item label="生产工单">{{ currentRow?.workOrder }}</a-descriptions-item>
                <a-descriptions-item label="入库日期">{{ currentRow?.inboundDate }}</a-descriptions-item>
                <a-descriptions-item label="库存有效期">{{ currentRow?.expiryDate }}</a-descriptions-item>
            </a-descriptions>
        </a-modal>

        <!-- 新增/编辑弹窗 -->
        <a-modal
            :open="editOpen"
            :title="editMode === 'create' ? '新增库存' : '编辑库存'"
            @ok="handleSubmit"
            @cancel="editOpen = false"
        >
            <a-form :model="editForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                <a-form-item label="物料编号" required>
                    <a-input v-model:value="editForm.materialCode" />
                </a-form-item>
                <a-form-item label="物料名称" required>
                    <a-input v-model:value="editForm.materialName" />
                </a-form-item>
                <a-form-item label="规格型号" required>
                    <a-input v-model:value="editForm.spec" />
                </a-form-item>
                <a-form-item label="在库数量" required>
                    <a-input-number v-model:value="editForm.quantity" :min="0" style="width: 100%" />
                </a-form-item>
                <a-form-item label="单位" required>
                    <a-input v-model:value="editForm.unit" />
                </a-form-item>
                <a-form-item label="入库批次号">
                    <a-input v-model:value="editForm.batchNo" />
                </a-form-item>
                <a-form-item label="仓库">
                    <a-input v-model:value="editForm.warehouse" />
                </a-form-item>
                <a-form-item label="库区">
                    <a-input v-model:value="editForm.area" />
                </a-form-item>
                <a-form-item label="库位">
                    <a-input v-model:value="editForm.location" />
                </a-form-item>
                <a-form-item label="生产工单">
                    <a-input v-model:value="editForm.workOrder" />
                </a-form-item>
                <a-form-item label="入库日期">
                    <a-input v-model:value="editForm.inboundDate" placeholder="YYYY.MM.DD" />
                </a-form-item>
                <a-form-item label="库存有效期">
                    <a-input v-model:value="editForm.expiryDate" placeholder="YYYY.MM.DD" />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import { apiFetch, type ListResult } from '../../utils/apiClient';

type Row = {
    id: number;
    materialCode: string;
    materialName: string;
    spec: string;
    quantity: number;
    unit: string;
    batchNo: string;
    warehouse: string;
    area: string;
    location: string;
    workOrder: string;
    inboundDate: string;
    expiryDate: string;
};

const searchForm = reactive({ code: '', name: '' });
const selectedRowKeys = ref<number[]>([]);
const loading = ref(false);

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
    { title: '产品物料编号', dataIndex: 'materialCode', key: 'materialCode', width: 140 },
    { title: '产品物料名称', dataIndex: 'materialName', key: 'materialName', width: 120 },
    { title: '规格型号', dataIndex: 'spec', key: 'spec', width: 100 },
    { title: '在库数量', dataIndex: 'quantity', key: 'quantity', width: 100 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 70 },
    { title: '入库批次号', dataIndex: 'batchNo', key: 'batchNo', width: 120 },
    { title: '仓库', dataIndex: 'warehouse', key: 'warehouse', width: 90 },
    { title: '库区', dataIndex: 'area', key: 'area', width: 90 },
    { title: '库位', dataIndex: 'location', key: 'location', width: 100 },
    { title: '生产工单', dataIndex: 'workOrder', key: 'workOrder', width: 120 },
    { title: '入库日期', dataIndex: 'inboundDate', key: 'inboundDate', width: 110 },
    { title: '库存有效期', dataIndex: 'expiryDate', key: 'expiryDate', width: 110 },
    { title: '操作', key: 'action', width: 180, fixed: 'right' as const },
];

const tableData = ref<Row[]>([]);
const loadData = async () => {
    loading.value = true;
    try {
        const params = new URLSearchParams();
        params.set('page', String(pagination.current));
        params.set('pageSize', String(pagination.pageSize));
        if (searchForm.code.trim()) params.set('materialCode', searchForm.code.trim());
        if (searchForm.name.trim()) params.set('materialName', searchForm.name.trim());

        const res = await apiFetch<ListResult<Row>>(`/api/warehouseCurrentInventory/list?${params.toString()}`);
        tableData.value = res.data ?? [];
        pagination.total = res.total ?? 0;
    } catch (e) {
        tableData.value = [];
        pagination.total = 0;
        message.error(`获取库存现有量失败：${(e as Error).message || '未知错误'}`);
    } finally {
        loading.value = false;
    }
};

const onSelectChange = (keys: number[]) => {
    selectedRowKeys.value = keys;
};

const handleSearch = () => {
    pagination.current = 1;
    selectedRowKeys.value = [];
    loadData();
    message.success('查询成功');
};

const handleReset = () => {
    searchForm.code = '';
    searchForm.name = '';
    pagination.current = 1;
    selectedRowKeys.value = [];
    loadData();
};

const handlePageChange = (page: number) => {
    pagination.current = page;
    selectedRowKeys.value = [];
    loadData();
};

const handlePageSizeChange = (_current: number, size: number) => {
    pagination.current = 1;
    pagination.pageSize = size;
    selectedRowKeys.value = [];
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

onMounted(() => loadData());

// CRUD
const detailOpen = ref(false);
const editOpen = ref(false);
const editMode = ref<'create' | 'edit'>('create');
const currentRow = ref<Row | null>(null);
const editForm = reactive<Row>({
    id: 0,
    materialCode: '',
    materialName: '',
    spec: '',
    quantity: 0,
    unit: '个',
    batchNo: '',
    warehouse: '',
    area: '',
    location: '',
    workOrder: '',
    inboundDate: '',
    expiryDate: '',
});

const openDetail = (record: Row) => {
    currentRow.value = record;
    detailOpen.value = true;
};

const openCreate = () => {
    editMode.value = 'create';
    Object.assign(editForm, {
        id: 0,
        materialCode: '',
        materialName: '',
        spec: '',
        quantity: 0,
        unit: '个',
        batchNo: '',
        warehouse: '',
        area: '',
        location: '',
        workOrder: '',
        inboundDate: '',
        expiryDate: '',
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
    const row = tableData.value.find(r => r.id === id);
    if (row) openEdit(row);
};

const handleSubmit = async () => {
    try {
        const payload = { ...editForm };
        if (editMode.value === 'create') {
            await apiFetch(`/api/warehouseCurrentInventory`, { method: 'POST', body: JSON.stringify(payload) });
            message.success('新增成功');
        } else {
            await apiFetch(`/api/warehouseCurrentInventory/${editForm.id}`, {
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
        await apiFetch(`/api/warehouseCurrentInventory/${record.id}`, { method: 'DELETE' });
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
            selectedRowKeys.value.map(id => apiFetch(`/api/warehouseCurrentInventory/${id}`, { method: 'DELETE' }))
        );
        message.success(`已删除 ${selectedRowKeys.value.length} 条记录`);
        selectedRowKeys.value = [];
        await loadData();
    } catch (e) {
        message.error(`删除失败：${(e as Error).message || '未知错误'}`);
    }
};
</script>
