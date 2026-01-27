<template>
    <div class="bg-[#f0f2f5]">
        <!-- 搜索筛选区域 -->
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline" class="search-form">
                <a-form-item label="工序编号">
                    <a-input v-model:value="searchForm.processCode" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item label="工序名称">
                    <a-input v-model:value="searchForm.processName" placeholder="请输入内容" style="width: 220px" />
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
                <a-button type="primary" @click="noop">
                    <template #icon><PlusOutlined /></template>
                    新增
                </a-button>
                <a-button @click="noop" :disabled="selectedRowKeys.length !== 1">编辑</a-button>
                <a-button danger @click="noop" :disabled="selectedRowKeys.length === 0">删除</a-button>
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
                <template #bodyCell="{ column }">
                    <template v-if="column.key === 'enabled'">
                        <span style="color: #52c41a">启用</span>
                    </template>
                    <template v-else-if="column.key === 'action'">
                        <a-space>
                            <a @click="noop">详情</a>
                            <span>|</span>
                            <a @click="noop">编辑</a>
                            <span>|</span>
                            <a style="color: #ff4d4f" @click="noop">删除</a>
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
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue';

type ProcessingProcess = {
    id: number;
    processCode: string;
    processName: string;
    workshopName: string;
    enabled: string;
    remark: string;
    createTime: string;
};

// 搜索表单
const searchForm = reactive({
    processCode: '',
    processName: '',
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
        title: '加工工序编号',
        dataIndex: 'processCode',
        key: 'processCode',
        width: 180,
    },
    {
        title: '加工工序名称',
        dataIndex: 'processName',
        key: 'processName',
        width: 200,
    },
    {
        title: '所属工序车间',
        dataIndex: 'workshopName',
        key: 'workshopName',
        width: 200,
    },
    {
        title: '是否启用',
        key: 'enabled',
        width: 120,
    },
    {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 200,
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
const tableData = ref<ProcessingProcess[]>([]);

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
const maxPage = computed(() => Math.max(1, Math.ceil(pagination.total / pagination.pageSize)));

// 模拟数据
const mockData: ProcessingProcess[] = Array.from({ length: 56 }, (_, i) => ({
    id: i + 1,
    processCode: 'DWBH000001',
    processName: '第一道工序',
    workshopName: `第${['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五'][i % 15]}生产车间`,
    enabled: 'enabled',
    remark: '无',
    createTime: '2025.04.24 14:00:00',
}));

// 加载数据
const loadData = () => {
    let filteredData = [...mockData];

    // 前端筛选
    if (searchForm.processCode) {
        filteredData = filteredData.filter(item =>
            item.processCode.toLowerCase().includes(searchForm.processCode.toLowerCase())
        );
    }
    if (searchForm.processName) {
        filteredData = filteredData.filter(item => item.processName.includes(searchForm.processName));
    }

    // 更新总数
    pagination.total = filteredData.length;

    // 分页
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    tableData.value = filteredData.slice(start, end);
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
    searchForm.processCode = '';
    searchForm.processName = '';
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

const noop = () => message.info('演示页面：此功能暂未接入后端');

onMounted(() => {
    loadData();
});
</script>
