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

        <a-card :bordered="false">
            <a-table
                :columns="columns"
                :data-source="tableData"
                :pagination="false"
                :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
                row-key="id"
            ></a-table>

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
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue';

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
];

const allData = ref<Row[]>([]);
const tableData = ref<Row[]>([]);

const warehouses = ['一仓库', '二仓库', '三仓库'];
const areas = ['第一库区', '第二库区', '第三库区', '第四库区', '第五库区', '第六库区', '第七库区'];
const locations = [
    'AAAA库位',
    'BBBB库位',
    'CCCC库位',
    'DDDD库位',
    'EEEE库位',
    'FFFF库位',
    'GGGG库位',
    'HHHH库位',
    'IIII库位',
    'JJJJ库位',
    'KKKK库位',
    'LLLL库位',
    'MMMM库位',
];
const materialNames = ['笔记本电脑', '台式机', '屏幕', '主板', '键盘'];

const mock: Row[] = Array.from({ length: 56 }, (_, i) => ({
    id: i + 1,
    materialCode: `CPWLBH${String((i % 5) + 1).padStart(7, '0')}`,
    materialName: materialNames[i % 5],
    spec: `规格${(i % 5) + 1}`,
    quantity: 200,
    unit: '个',
    batchNo: 'PCH0000001',
    warehouse: warehouses[i % 3],
    area: areas[i % 7],
    location: locations[i % 13],
    workOrder: 'SCGD0000001',
    inboundDate: '2025.01.01',
    expiryDate: '2025.12.30',
}));

const filterData = () => {
    let list = [...mock];
    if (searchForm.code.trim()) {
        const q = searchForm.code.trim().toLowerCase();
        list = list.filter(r => r.materialCode.toLowerCase().includes(q));
    }
    if (searchForm.name.trim()) {
        const q = searchForm.name.trim();
        list = list.filter(r => r.materialName.includes(q));
    }
    return list;
};

const loadData = () => {
    const filtered = filterData();
    pagination.total = filtered.length;
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    allData.value = filtered;
    tableData.value = filtered.slice(start, end);
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

onMounted(() => loadData());
</script>
