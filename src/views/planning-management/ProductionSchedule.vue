<template>
    <div class="bg-[#f0f2f5]">
        <a-card class="mb-4" :bordered="false">
            <a-space class="mb-3">
                <a-button type="link" @click="goBack">返回</a-button>
                <span class="text-base font-semibold">生产计划排程</span>
            </a-space>

            <a-divider class="!my-3" />

            <div class="font-semibold mb-3">基本信息</div>
            <div class="bg-[#f7fbff] rounded-md px-4 py-3">
                <a-row :gutter="[16, 10]">
                    <a-col :span="6">
                        计划编号：
                        <b>{{ plan.planNumber }}</b>
                    </a-col>
                    <a-col :span="6">
                        产品编号：
                        <b>{{ plan.productNumber }}</b>
                    </a-col>
                    <a-col :span="6">
                        产品名称：
                        <b>{{ plan.productName }}</b>
                    </a-col>
                    <a-col :span="6">
                        紧急程度：
                        <b>{{ plan.urgencyLevel }}</b>
                    </a-col>

                    <a-col :span="6">
                        交货日期：
                        <b>{{ plan.deliveryDate }}</b>
                    </a-col>
                    <a-col :span="6">
                        生产数量：
                        <b>{{ plan.productionQuantity }}</b>
                    </a-col>
                    <a-col :span="6">
                        单位：
                        <b>{{ plan.unit }}</b>
                    </a-col>
                    <a-col :span="6">
                        创建时间：
                        <b>{{ plan.createTime }}</b>
                    </a-col>

                    <a-col :span="6">
                        创建人：
                        <b>{{ plan.creator }}</b>
                    </a-col>
                </a-row>
            </div>
        </a-card>

        <a-card class="mb-4" :bordered="false">
            <div class="font-semibold mb-3">生产排程</div>
            <a-form :model="scheduleForm" layout="inline" class="schedule-form">
                <a-form-item label="排产数量" required>
                    <a-input-number v-model:value="scheduleForm.scheduleQty" :min="1" style="width: 220px" />
                </a-form-item>
                <a-form-item label="生产车间" required>
                    <a-select v-model:value="scheduleForm.workshop" placeholder="请选择" style="width: 220px">
                        <a-select-option v-for="w in workshops" :key="w" :value="w">{{ w }}</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="生产产线" required>
                    <a-select v-model:value="scheduleForm.line" placeholder="请选择" style="width: 220px">
                        <a-select-option v-for="l in lines" :key="l" :value="l">{{ l }}</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="工艺路线" required>
                    <a-select v-model:value="scheduleForm.route" placeholder="请选择" style="width: 220px">
                        <a-select-option v-for="r in routes" :key="r" :value="r">{{ r }}</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="开始日期" required>
                    <a-date-picker v-model:value="scheduleForm.startDate" style="width: 220px" />
                </a-form-item>
            </a-form>
        </a-card>

        <a-card :bordered="false">
            <div class="font-semibold mb-3">齐套分析</div>
            <a-table :columns="columns" :data-source="materialRows" :pagination="false" size="middle" row-key="id">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'satisfied'">
                        <span :style="{ color: record.satisfied ? '#52c41a' : '#ff4d4f', fontWeight: 600 }">
                            {{ record.satisfied ? '满足' : '不满足' }}
                        </span>
                    </template>
                    <template v-else-if="column.key === 'action'">
                        <a-space>
                            <a @click="message.info('领料')">领料</a>
                            <a @click="message.info('领料')">领料</a>
                            <a @click="message.info('申购')">申购</a>
                        </a-space>
                    </template>
                </template>
            </a-table>

            <div class="mt-6 flex items-center justify-center gap-4">
                <a-button @click="goBack" style="width: 120px">返回</a-button>
                <a-button type="primary" @click="handleConfirm" style="width: 120px">确定</a-button>
            </div>
        </a-card>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';

type PlanDetail = {
    id: number;
    planNumber: string;
    productNumber: string;
    productName: string;
    urgencyLevel: string;
    deliveryDate: string;
    productionQuantity: number;
    unit: string;
    creator: string;
    createTime: string;
};

const route = useRoute();
const router = useRouter();

const id = computed(() => Number(route.params.id));

const pad = (n: number, len = 6) => String(n).padStart(len, '0');
const toDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};
const toDateStrDot = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}.${m}.${day}`;
};

const products = [
    { productNumber: 'CPBH000001', productName: '笔记本电脑', unit: '台' },
    { productNumber: 'CHBH000022', productName: 'ALEI手机', unit: '个' },
    { productNumber: 'CPBH000013', productName: '工业平板', unit: '台' },
    { productNumber: 'CPBH000008', productName: '智能手表', unit: '个' },
];
const urgencyPool = ['普通', '紧急', '非常紧急'];

const plan = computed<PlanDetail>(() => {
    const i = Number.isFinite(id.value) && id.value > 0 ? id.value : 1;
    const p = products[(i - 1) % products.length]!;
    const base = new Date(2025, 0, 1);
    base.setDate(base.getDate() + (i - 1) * 4);
    const delivery = new Date(base);
    delivery.setDate(delivery.getDate() + 60 + ((i * 3) % 30));

    return {
        id: i,
        planNumber: `XSDD${pad(i, 7)}`,
        productNumber: p.productNumber,
        productName: p.productName,
        urgencyLevel: urgencyPool[(i * 7) % urgencyPool.length]!,
        deliveryDate: toDateStrDot(delivery),
        productionQuantity: 200 + ((i * 37) % 1200),
        unit: p.unit,
        creator: ['刘超', '王敏', '李强', '陈晨'][(i * 5) % 4]!,
        createTime: `${toDateStr(base)} 10:00`,
    };
});

const workshops = ['一车间', '二车间', '三车间', '质检车间'];
const lines = ['A产线', 'B产线', 'C产线'];
const routes = ['路线-01', '路线-02', '路线-03'];

const scheduleForm = reactive({
    scheduleQty: plan.value.productionQuantity,
    workshop: undefined as string | undefined,
    line: undefined as string | undefined,
    route: undefined as string | undefined,
    startDate: undefined as any,
});

type MaterialRow = {
    id: number;
    materialNumber: string;
    materialName: string;
    stockQty: number;
    useQty: number;
    unit: string;
    makeType: string;
    satisfied: boolean;
    warehouse: string;
};

const materialRows = ref<MaterialRow[]>(
    ['电池', '屏幕', '充电器', '包装盒', '螺丝', '说明书'].map((name, idx) => {
        const baseUse = Math.max(50, Math.floor(plan.value.productionQuantity / 2));
        const useQty = baseUse - idx * 30;
        const stockQty = baseUse + ((id.value + idx) % 4) * 120 - idx * 20;
        return {
            id: idx + 1,
            materialNumber: `CPWLBH${pad(1000 + idx + 1, 7)}`,
            materialName: name,
            stockQty,
            useQty,
            unit: '个',
            makeType: idx % 3 === 0 ? '自制件' : '外购件',
            satisfied: stockQty >= useQty,
            warehouse: idx % 2 === 0 ? '仓库一' : '仓库二',
        };
    })
);

const columns = [
    { title: '#', dataIndex: 'id', key: 'id', width: 60 },
    { title: '物料编号', dataIndex: 'materialNumber', key: 'materialNumber', width: 160 },
    { title: '物料名称', dataIndex: 'materialName', key: 'materialName', width: 140 },
    { title: '库存数量', dataIndex: 'stockQty', key: 'stockQty', width: 120 },
    { title: '本次用量', dataIndex: 'useQty', key: 'useQty', width: 120 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
    { title: '制造方式', dataIndex: 'makeType', key: 'makeType', width: 120 },
    { title: '是否满足', key: 'satisfied', width: 120 },
    { title: '存放仓库', dataIndex: 'warehouse', key: 'warehouse', width: 120 },
    { title: '操作', key: 'action', width: 160, fixed: 'right' as const },
];

const goBack = () => {
    router.back();
};

const handleConfirm = () => {
    if (!scheduleForm.scheduleQty) return message.warning('请填写排产数量');
    if (!scheduleForm.workshop) return message.warning('请选择生产车间');
    if (!scheduleForm.line) return message.warning('请选择生产产线');
    if (!scheduleForm.route) return message.warning('请选择工艺路线');
    if (!scheduleForm.startDate) return message.warning('请选择开始日期');
    message.success('排程已保存（模拟）');
};
</script>

<style scoped>
.schedule-form :deep(.ant-form-item) {
    margin-bottom: 14px;
}
</style>
