<template>
    <div class="bg-[#f0f2f5]">
        <a-card class="mb-4" :bordered="false">
            <a-form :model="searchForm" layout="inline">
                <a-form-item label="仓库编号">
                    <a-input v-model:value="searchForm.code" placeholder="请输入内容" style="width: 220px" />
                </a-form-item>
                <a-form-item label="仓库名称">
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
                <a-button type="primary" @click="noop">新增</a-button>
                <a-button @click="noop" :disabled="selectedRowKeys.length !== 1">编辑</a-button>
                <a-button danger @click="noop" :disabled="selectedRowKeys.length === 0">删除</a-button>
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
                :scroll="{ x: 1200 }"
            >
                <template #bodyCell="{ column }">
                    <template v-if="column.key === 'action'">
                        <a-space>
                            <a @click="noop">详情</a>
                            <a @click="noop">编辑</a>
                            <a style="color: #ff4d4f" @click="noop">删除</a>
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
            </div>
        </a-card>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';

type Row = {
    id: number;
    code: string;
    name: string;
    location: string;
    area: number;
    owner: string;
    remark: string;
};

const searchForm = reactive({ code: '', name: '' });
const selectedRowKeys = ref<number[]>([]);
const pagination = reactive({ current: 1, pageSize: 15, total: 56 });

const columns = [
    {
        title: '#',
        key: 'index',
        width: 60,
        customRender: ({ index }: { index: number }) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    { title: '仓库编号', dataIndex: 'code', key: 'code', width: 200 },
    { title: '仓库名称', dataIndex: 'name', key: 'name', width: 160 },
    { title: '位置', dataIndex: 'location', key: 'location', width: 360 },
    { title: '面积(m3)', dataIndex: 'area', key: 'area', width: 120 },
    { title: '负责人', dataIndex: 'owner', key: 'owner', width: 120 },
    { title: '备注', dataIndex: 'remark', key: 'remark' },
    { title: '操作', key: 'action', width: 180, fixed: 'right' },
];

const tableData = ref<Row[]>([]);
const mock: Row[] = [
    {
        id: 1,
        code: 'CKBH0000000001',
        name: '一仓库',
        location: '江苏省常州市新北区黄河西路999号',
        area: 68000,
        owner: '李红',
        remark: '无',
    },
    {
        id: 2,
        code: 'CKBH0000000001',
        name: '二仓库',
        location: '江苏省常州市新北区黄河西路999号',
        area: 68000,
        owner: '李红',
        remark: '无',
    },
    {
        id: 3,
        code: 'CKBH0000000001',
        name: '三仓库',
        location: '江苏省常州市新北区黄河西路999号',
        area: 68000,
        owner: '李红',
        remark: '无',
    },
    {
        id: 4,
        code: 'CKBH0000000001',
        name: '四仓库',
        location: '江苏省常州市新北区黄河西路999号',
        area: 68000,
        owner: '李红',
        remark: '无',
    },
    {
        id: 5,
        code: 'CKBH0000000001',
        name: '五仓库',
        location: '江苏省常州市新北区黄河西路999号',
        area: 68000,
        owner: '李红',
        remark: '无',
    },
    {
        id: 6,
        code: 'CKBH0000000001',
        name: '六仓库',
        location: '江苏省常州市新北区黄河西路999号',
        area: 68000,
        owner: '李红',
        remark: '无',
    },
    {
        id: 7,
        code: 'CKBH0000000001',
        name: '七仓库',
        location: '江苏省常州市新北区黄河西路999号',
        area: 68000,
        owner: '李红',
        remark: '无',
    },
    {
        id: 8,
        code: 'CKBH0000000001',
        name: '八仓库',
        location: '江苏省常州市新北区黄河西路999号',
        area: 68000,
        owner: '李红',
        remark: '无',
    },
];

const loadData = () => {
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    tableData.value = mock.slice(start, end);
};

const onSelectChange = (keys: number[]) => (selectedRowKeys.value = keys);
const handleSearch = () => ((pagination.current = 1), loadData(), message.success('查询成功'));
const handleReset = () => ((searchForm.code = ''), (searchForm.name = ''), (pagination.current = 1), loadData());
const handlePageChange = (page: number) => ((pagination.current = page), loadData());
const handlePageSizeChange = (_current: number, size: number) => (
    (pagination.current = 1),
    (pagination.pageSize = size),
    loadData()
);
const noop = () => message.info('演示页面：此功能暂未接入后端');

onMounted(() => loadData());
</script>
