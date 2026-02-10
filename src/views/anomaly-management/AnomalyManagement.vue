<template>
    <div class="bg-[#f0f2f5]">
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline">
                <a-form-item label="异常编号">
                    <a-input v-model:value="searchForm.code" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item label="生产工单">
                    <a-input v-model:value="searchForm.workOrder" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item label="异常分类">
                    <a-input v-model:value="searchForm.category" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item label="异常等级">
                    <a-input v-model:value="searchForm.level" placeholder="请输入内容" style="width: 220px" />
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

        <a-card :bordered="false">
            <a-table
                :columns="columns"
                :data-source="tableData"
                :pagination="false"
                :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
                row-key="id"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'result'">
                        <a-tag :color="getResultColor(record.result)">{{ record.result }}</a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <a-space>
                            <a @click="openDetail(record)">详情</a>
                            <span>|</span>
                            <a @click="openEdit(record)">编辑</a>
                            <span>|</span>
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
        <a-modal :open="detailOpen" title="异常详情" @cancel="detailOpen = false" :footer="null">
            <a-descriptions bordered size="small" :column="2">
                <a-descriptions-item label="异常编号">{{ currentRow?.code }}</a-descriptions-item>
                <a-descriptions-item label="生产工单">{{ currentRow?.workOrder }}</a-descriptions-item>
                <a-descriptions-item label="异常工序">{{ currentRow?.process }}</a-descriptions-item>
                <a-descriptions-item label="异常等级">{{ currentRow?.level }}</a-descriptions-item>
                <a-descriptions-item label="异常分类">{{ currentRow?.category }}</a-descriptions-item>
                <a-descriptions-item label="处理结果">{{ currentRow?.result }}</a-descriptions-item>
                <a-descriptions-item label="责任部门">{{ currentRow?.dutyDept }}</a-descriptions-item>
                <a-descriptions-item label="责任人">{{ currentRow?.dutyPerson }}</a-descriptions-item>
                <a-descriptions-item label="异常描述" :span="2">{{ currentRow?.description }}</a-descriptions-item>
                <a-descriptions-item label="创建人">{{ currentRow?.creator }}</a-descriptions-item>
                <a-descriptions-item label="创建时间">{{ currentRow?.createTime }}</a-descriptions-item>
            </a-descriptions>
        </a-modal>

        <!-- 新增/编辑弹窗 -->
        <a-modal
            :open="editOpen"
            :title="editMode === 'create' ? '新增异常' : '编辑异常'"
            @ok="handleSubmit"
            @cancel="editOpen = false"
        >
            <a-form :model="editForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                <a-form-item label="异常编号" required>
                    <a-input v-model:value="editForm.code" />
                </a-form-item>
                <a-form-item label="生产工单" required>
                    <a-input v-model:value="editForm.workOrder" />
                </a-form-item>
                <a-form-item label="异常工序" required>
                    <a-input v-model:value="editForm.process" />
                </a-form-item>
                <a-form-item label="异常等级" required>
                    <a-input v-model:value="editForm.level" />
                </a-form-item>
                <a-form-item label="异常分类" required>
                    <a-input v-model:value="editForm.category" />
                </a-form-item>
                <a-form-item label="处理结果" required>
                    <a-select v-model:value="editForm.result" placeholder="请选择">
                        <a-select-option value="未处理">未处理</a-select-option>
                        <a-select-option value="已恢复正常">已恢复正常</a-select-option>
                        <a-select-option value="暂时挂起">暂时挂起</a-select-option>
                        <a-select-option value="未找到原因">未找到原因</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="责任部门">
                    <a-input v-model:value="editForm.dutyDept" />
                </a-form-item>
                <a-form-item label="责任人">
                    <a-input v-model:value="editForm.dutyPerson" />
                </a-form-item>
                <a-form-item label="异常描述">
                    <a-textarea v-model:value="editForm.description" />
                </a-form-item>
                <a-form-item label="创建人">
                    <a-input v-model:value="editForm.creator" />
                </a-form-item>
                <a-form-item label="创建时间">
                    <a-input v-model:value="editForm.createTime" placeholder="YYYY.MM.DD HH:mm:ss" />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import { apiFetch, type ListResult } from '../../utils/apiClient';

const route = useRoute();

type Row = {
    id: number;
    code: string;
    workOrder: string;
    process: string;
    category: string;
    level: string;
    result: string;
    dutyDept: string;
    dutyPerson: string;
    description: string;
    creator: string;
    createTime: string;
};

const searchForm = reactive({ code: '', workOrder: '', category: '', level: '' });
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
    { title: '异常编号', dataIndex: 'code', key: 'code', width: 160 },
    { title: '生产工单', dataIndex: 'workOrder', key: 'workOrder', width: 150 },
    { title: '异常工序', dataIndex: 'process', key: 'process', width: 120 },
    { title: '异常等级', dataIndex: 'level', key: 'level', width: 120 },
    { title: '异常分类', dataIndex: 'category', key: 'category', width: 120 },
    { title: '处理结果', dataIndex: 'result', key: 'result', width: 120 },
    { title: '责任部门', dataIndex: 'dutyDept', key: 'dutyDept', width: 120 },
    { title: '责任人', dataIndex: 'dutyPerson', key: 'dutyPerson', width: 100 },
    { title: '异常描述', dataIndex: 'description', key: 'description', minWidth: 260 },
    { title: '创建人', dataIndex: 'creator', key: 'creator', width: 100 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
    { title: '操作', key: 'action', width: 180, fixed: 'right' },
];

const tableData = ref<Row[]>([]);

// 表格数据来自数据库 Abnormal 集合（GET /api/abnormalList/list）
const loadData = async () => {
    loading.value = true;
    try {
        const params = new URLSearchParams();
        params.set('page', String(pagination.current));
        params.set('pageSize', String(pagination.pageSize));
        if (searchForm.code.trim()) params.set('code', searchForm.code.trim());
        if (searchForm.workOrder.trim()) params.set('workOrder', searchForm.workOrder.trim());
        if (searchForm.category.trim()) params.set('category', searchForm.category.trim());
        if (searchForm.level.trim()) params.set('level', searchForm.level.trim());

        const res = await apiFetch<ListResult<Row>>(`/api/abnormalList/list?${params.toString()}`);
        tableData.value = res.data ?? [];
        pagination.total = res.total ?? 0;
    } catch (e) {
        tableData.value = [];
        pagination.total = 0;
        message.error(`获取异常数据失败：${(e as Error).message || '未知错误'}`);
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
    searchForm.workOrder = '';
    searchForm.category = '';
    searchForm.level = '';
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

const getResultColor = (result: string) => {
    if (result === '未处理') return 'blue';
    if (result === '已恢复正常') return 'green';
    if (result === '暂时挂起') return 'orange';
    if (result === '未找到原因') return 'red';
    return 'default';
};

// CRUD
const detailOpen = ref(false);
const editOpen = ref(false);
const editMode = ref<'create' | 'edit'>('create');
const currentRow = ref<Row | null>(null);
const editForm = reactive<Row>({
    id: 0,
    code: '',
    workOrder: '',
    process: '',
    category: '',
    level: '',
    result: '未处理',
    dutyDept: '',
    dutyPerson: '',
    description: '',
    creator: '',
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
        workOrder: '',
        process: '',
        category: '',
        level: '',
        result: '未处理',
        dutyDept: '',
        dutyPerson: '',
        description: '',
        creator: '',
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
    const row = tableData.value.find(r => r.id === id);
    if (row) openEdit(row);
};

const handleSubmit = async () => {
    try {
        const payload = { ...editForm };
        if (editMode.value === 'create') {
            await apiFetch(`/api/abnormalList`, { method: 'POST', body: JSON.stringify(payload) });
            message.success('新增成功');
        } else {
            await apiFetch(`/api/abnormalList/${editForm.id}`, { method: 'PUT', body: JSON.stringify(payload) });
            message.success('编辑成功');
        }
        editOpen.value = false;
        await loadData();
        // 立即刷新铃铛里的系统通知列表，无需整页刷新即可看到新异常通知
        window.dispatchEvent(new CustomEvent('notification-list-refresh'));
    } catch (e) {
        message.error(`保存失败：${(e as Error).message || '未知错误'}`);
    }
};

const deleteOne = async (record: Row) => {
    try {
        await apiFetch(`/api/abnormalList/${record.id}`, { method: 'DELETE' });
        message.success('删除成功');
        await loadData();
    } catch (e) {
        message.error(`删除失败：${(e as Error).message || '未知错误'}`);
    }
};

const deleteBySelection = async () => {
    if (selectedRowKeys.value.length === 0) return;
    try {
        await Promise.all(selectedRowKeys.value.map(id => apiFetch(`/api/abnormalList/${id}`, { method: 'DELETE' })));
        message.success(`已删除 ${selectedRowKeys.value.length} 条记录`);
        selectedRowKeys.value = [];
        await loadData();
    } catch (e) {
        message.error(`删除失败：${(e as Error).message || '未知错误'}`);
    }
};

const noop = () => message.info('演示页面：此功能暂未接入后端');

// 收到 WebSocket 异常通知时自动刷新列表，无需手动刷新
const onListInvalidate = (e: Event) => {
    const detail = (e as CustomEvent<{ type: string }>).detail;
    if (detail?.type === 'abnormal') loadData();
};

onMounted(() => {
    // 如果从系统通知携带异常编号跳转而来，自动填充搜索条件
    const q = route.query;
    if (typeof q.code === 'string' && q.code) {
        searchForm.code = q.code;
    }
    loadData();
    window.addEventListener('list-invalidate', onListInvalidate);
});

onBeforeUnmount(() => {
    window.removeEventListener('list-invalidate', onListInvalidate);
});
</script>
