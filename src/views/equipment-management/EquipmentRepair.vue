<template>
    <div class="bg-[#f0f2f5]">
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline">
                <a-form-item label="维修单号">
                    <a-input v-model:value="searchForm.code" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item label="设备名称">
                    <a-input v-model:value="searchForm.equipmentName" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item label="状态">
                    <a-select v-model:value="searchForm.status" placeholder="全部" style="width: 150px" allow-clear>
                        <a-select-option value="pending">待审批</a-select-option>
                        <a-select-option value="approved">已通过</a-select-option>
                        <a-select-option value="rejected">已拒绝</a-select-option>
                        <a-select-option value="repairing">维修中</a-select-option>
                        <a-select-option value="completed">已完成</a-select-option>
                    </a-select>
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
                <a-button
                    @click="handleEdit(tableData.find(r => r._id === selectedRowKeys[0])!)"
                    :disabled="selectedRowKeys.length !== 1"
                >
                    编辑
                </a-button>
                <a-button
                    danger
                    @click="handleDelete(tableData.find(r => r._id === selectedRowKeys[0])!)"
                    :disabled="selectedRowKeys.length === 0"
                >
                    删除
                </a-button>
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
                :loading="loading"
                :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
                row-key="_id"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'repairType'">
                        {{ getRepairTypeText(record.repairType) }}
                    </template>
                    <template v-else-if="column.key === 'priority'">
                        <a-tag
                            :color="
                                record.priority === 'urgent' ? 'red' : record.priority === 'high' ? 'orange' : 'default'
                            "
                        >
                            {{ getPriorityText(record.priority) }}
                        </a-tag>
                    </template>
                    <template v-else-if="column.key === 'status'">
                        <a-tag :color="statusMap[record.status]?.color || 'default'">
                            {{ statusMap[record.status]?.text || record.status }}
                        </a-tag>
                    </template>
                    <template v-else-if="column.key === 'estimatedCost'">
                        {{ record.estimatedCost ? `¥${record.estimatedCost}` : '-' }}
                    </template>
                    <template v-else-if="column.key === 'creator'">
                        {{ record.createdBy?.realName || record.createdBy?.username || '-' }}
                    </template>
                    <template v-else-if="column.key === 'createTime'">
                        {{ formatDate(record.createdAt || '') }}
                    </template>
                    <template v-else-if="column.key === 'action'">
                        <a-space>
                            <a @click="handleEdit(record)" v-if="record.status === 'pending'">编辑</a>
                            <a
                                style="color: #ff4d4f"
                                @click="handleDelete(record)"
                                v-if="['pending', 'rejected'].includes(record.status)"
                            >
                                删除
                            </a>
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

        <!-- 新增/编辑弹窗 -->
        <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleModalOk" width="600px">
            <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                <a-form-item label="设备编号" required>
                    <a-input v-model:value="formData.equipmentCode" placeholder="请输入设备编号" />
                </a-form-item>
                <a-form-item label="设备名称" required>
                    <a-input v-model:value="formData.equipmentName" placeholder="请输入设备名称" />
                </a-form-item>
                <a-form-item label="故障描述" required>
                    <a-textarea v-model:value="formData.faultDescription" placeholder="请描述设备故障情况" :rows="3" />
                </a-form-item>
                <a-form-item label="维修类型">
                    <a-select v-model:value="formData.repairType">
                        <a-select-option value="routine">常规维修</a-select-option>
                        <a-select-option value="emergency">紧急维修</a-select-option>
                        <a-select-option value="preventive">预防性维修</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="优先级">
                    <a-select v-model:value="formData.priority">
                        <a-select-option value="low">低</a-select-option>
                        <a-select-option value="medium">中</a-select-option>
                        <a-select-option value="high">高</a-select-option>
                        <a-select-option value="urgent">紧急</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="预估费用">
                    <a-input-number
                        v-model:value="formData.estimatedCost"
                        :min="0"
                        :precision="2"
                        style="width: 100%"
                        placeholder="请输入预估费用"
                    />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, reactive, ref } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { getRepairList, createRepair, updateRepair, deleteRepair, type EquipmentRepair } from './api/index';
import dayjs from 'dayjs';

const searchForm = reactive({ code: '', equipmentName: '', status: '' });
const selectedRowKeys = ref<string[]>([]);
const pagination = reactive({ current: 1, pageSize: 15, total: 0 });
const jumpPage = ref(1);
const maxPage = computed(() => Math.max(1, Math.ceil(pagination.total / pagination.pageSize)));
const loading = ref(false);
const modalVisible = ref(false);
const modalTitle = ref('新增维修申请');
const currentId = ref<string | null>(null);

const formData = reactive({
    equipmentCode: '',
    equipmentName: '',
    faultDescription: '',
    repairType: 'routine' as 'routine' | 'emergency' | 'preventive',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    estimatedCost: undefined as number | undefined,
});

const statusMap: Record<string, { text: string; color: string }> = {
    pending: { text: '待审批', color: 'orange' },
    approved: { text: '已通过', color: 'green' },
    rejected: { text: '已拒绝', color: 'red' },
    repairing: { text: '维修中', color: 'blue' },
    completed: { text: '已完成', color: 'green' },
    cancelled: { text: '已取消', color: 'gray' },
};

const columns = [
    {
        title: '#',
        key: 'index',
        width: 60,
        customRender: ({ index }: { index: number }) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    { title: '维修单号', dataIndex: 'code', key: 'code', width: 180 },
    { title: '设备名称', dataIndex: 'equipmentName', key: 'equipmentName', width: 200 },
    { title: '故障描述', dataIndex: 'faultDescription', key: 'faultDescription', width: 200 },
    { title: '维修类型', key: 'repairType', width: 120 },
    { title: '优先级', key: 'priority', width: 100 },
    { title: '状态', key: 'status', width: 120 },
    { title: '预估费用', key: 'estimatedCost', width: 120 },
    { title: '创建人', key: 'creator', width: 120 },
    { title: '创建时间', key: 'createTime', width: 180 },
    { title: '操作', key: 'action', width: 200, fixed: 'right' },
];

const tableData = ref<EquipmentRepair[]>([]);

const loadData = async () => {
    loading.value = true;
    try {
        const res = await getRepairList({
            page: pagination.current,
            limit: pagination.pageSize,
            code: searchForm.code || undefined,
            equipmentName: searchForm.equipmentName || undefined,
            status: searchForm.status || undefined,
        });
        if (res.data && res.data.success) {
            tableData.value = res.data.data;
            pagination.total = res.data.total;
        }
    } catch (e) {
        console.error('加载维修列表失败:', e);
        message.error('加载数据失败');
    } finally {
        loading.value = false;
    }
};

const onSelectChange = (keys: string[]) => {
    selectedRowKeys.value = keys;
};

const handleSearch = () => {
    pagination.current = 1;
    loadData();
};

const handleReset = () => {
    searchForm.code = '';
    searchForm.equipmentName = '';
    searchForm.status = '';
    pagination.current = 1;
    loadData();
};

const handleAdd = () => {
    currentId.value = null;
    modalTitle.value = '新增维修申请';
    Object.assign(formData, {
        equipmentCode: '',
        equipmentName: '',
        faultDescription: '',
        repairType: 'routine',
        priority: 'medium',
        estimatedCost: undefined,
    });
    modalVisible.value = true;
};

const handleEdit = (record: EquipmentRepair) => {
    if (record.status !== 'pending') {
        message.warning('只有待审批状态的记录才能编辑');
        return;
    }
    currentId.value = record._id || null;
    modalTitle.value = '编辑维修申请';
    Object.assign(formData, {
        equipmentCode: record.equipmentCode,
        equipmentName: record.equipmentName,
        faultDescription: record.faultDescription,
        repairType: record.repairType,
        priority: record.priority,
        estimatedCost: record.estimatedCost,
    });
    modalVisible.value = true;
};

const handleDelete = (record: EquipmentRepair) => {
    if (!['pending', 'rejected'].includes(record.status)) {
        message.warning('只有待审批或已拒绝状态的记录才能删除');
        return;
    }
    Modal.confirm({
        title: '确认删除',
        content: `确定要删除维修单 ${record.code} 吗？`,
        onOk: async () => {
            try {
                const res = await deleteRepair(record._id!);
                if (res.data && res.data.success) {
                    message.success('删除成功');
                    loadData();
                } else {
                    message.error(res.data?.message || '删除失败');
                }
            } catch (e: any) {
                message.error(e.response?.data?.message || '删除失败');
            }
        },
    });
};

const handleModalOk = async () => {
    if (!formData.equipmentCode || !formData.equipmentName || !formData.faultDescription) {
        message.warning('请填写完整信息');
        return;
    }

    try {
        if (currentId.value) {
            const res = await updateRepair(currentId.value, formData);
            if (res.data && res.data.success) {
                message.success('更新成功');
                modalVisible.value = false;
                loadData();
            } else {
                message.error(res.data?.message || '更新失败');
            }
        } else {
            const res = await createRepair(formData);
            if (res.data && res.data.success) {
                message.success('维修申请已提交，等待审批');
                modalVisible.value = false;
                loadData();
            } else {
                message.error(res.data?.message || '提交失败');
            }
        }
    } catch (e: any) {
        message.error(e.response?.data?.message || '操作失败');
    }
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

const formatDate = (date: string) => {
    return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-';
};

const getRepairTypeText = (type: string) => {
    const map: Record<string, string> = {
        routine: '常规维修',
        emergency: '紧急维修',
        preventive: '预防性维修',
    };
    return map[type] || type;
};

const getPriorityText = (priority: string) => {
    const map: Record<string, string> = {
        low: '低',
        medium: '中',
        high: '高',
        urgent: '紧急',
    };
    return map[priority] || priority;
};

const noop = () => {
    message.info('功能开发中');
};

// 监听全局 list-invalidate 事件，确保跨端审批后列表实时刷新
const handleListInvalidate = (e: Event) => {
    const detail = (e as CustomEvent).detail as { type?: string } | undefined;
    if (!detail || !detail.type) return;
    if (detail.type === 'equipment_repair') {
        loadData();
    }
};

onMounted(() => {
    window.addEventListener('list-invalidate', handleListInvalidate as EventListener);
    loadData();
});

onBeforeUnmount(() => {
    window.removeEventListener('list-invalidate', handleListInvalidate as EventListener);
});
</script>
