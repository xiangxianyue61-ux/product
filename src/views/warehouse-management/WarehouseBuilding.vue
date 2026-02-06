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
                            <a-popconfirm title="确定要删除这条记录吗？" @confirm="() => noop()">
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

const pad = (n: number, len = 12) => String(n).padStart(len, '0');
const owners = ['李红', '王敏', '刘超', '张伟', '陈晨', '赵磊'];
const cities = [
    { province: '江苏省', city: '常州市', district: '新北区', road: '黄河西路' },
    { province: '浙江省', city: '杭州市', district: '余杭区', road: '文一西路' },
    { province: '广东省', city: '深圳市', district: '南山区', road: '科技南一路' },
    { province: '上海市', city: '上海市', district: '浦东新区', road: '张江高科路' },
    { province: '四川省', city: '成都市', district: '高新区', road: '天府大道' },
];
const remarks = ['无', '冷链仓', '危险品仓', '保税仓', '恒温仓', '大件仓'];

// 模拟数据（56条，每条不同）
const mock: Row[] = Array.from({ length: 56 }, (_, idx) => {
    const i = idx + 1;
    const c = cities[idx % cities.length]!;
    const area = 1200 + ((idx * 137) % 98000);
    const houseNo = 100 + ((idx * 7) % 900);
    return {
        id: i,
        code: `CKBH${pad(i, 10)}`,
        name: `${['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][idx % 10] ?? i}仓库`,
        location: `${c.province}${c.city}${c.district}${c.road}${houseNo}号`,
        area,
        owner: owners[(idx * 3) % owners.length]!,
        remark: remarks[(idx * 5) % remarks.length]!,
    };
});

const loadData = () => {
    const keywordCode = searchForm.code.trim();
    const keywordName = searchForm.name.trim();

    const filtered = mock.filter(item => {
        const okCode = !keywordCode || item.code.includes(keywordCode);
        const okName = !keywordName || item.name.includes(keywordName);
        return okCode && okName;
    });

    pagination.total = filtered.length;
    const maxPage = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));
    if (pagination.current > maxPage) pagination.current = maxPage;

    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    tableData.value = filtered.slice(start, end);
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

const noop = () => message.info('演示页面：此功能暂未接入后端');

onMounted(() => loadData());
</script>
