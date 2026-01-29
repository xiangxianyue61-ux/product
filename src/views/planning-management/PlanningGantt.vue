<template>
    <div class="bg-[#f0f2f5]">
        <a-card :bordered="false">
            <div class="flex items-center justify-between mb-3">
                <div>
                    <div class="text-base font-semibold">计划甘特图</div>
                    <div class="text-xs text-gray-500 mt-1">范围：{{ toDot(rangeStart) }} - {{ toDot(rangeEnd) }}</div>
                </div>
                <a-space>
                    <a-button size="small" @click="shiftRange(-7)">上一周</a-button>
                    <a-button size="small" @click="resetRange">本月</a-button>
                    <a-button size="small" @click="shiftRange(7)">下一周</a-button>
                </a-space>
            </div>

            <div class="gantt-wrap">
                <div class="gantt-head">
                    <div class="gantt-left-head">
                        <div class="gantt-cell w-plan">计划编号</div>
                        <div class="gantt-cell w-prodNo">产品编号</div>
                        <div class="gantt-cell w-prodName">产品名称</div>
                        <div class="gantt-cell w-date">开始时间</div>
                        <div class="gantt-cell w-date">完成时间</div>
                    </div>
                    <div class="gantt-right-head">
                        <div class="gantt-month-row">
                            <div
                                v-for="m in months"
                                :key="m.key"
                                class="gantt-month"
                                :style="{ width: `${m.days * dayWidth}px` }"
                            >
                                {{ m.label }}
                            </div>
                        </div>
                        <div class="gantt-day-row">
                            <div v-for="d in days" :key="d.key" class="gantt-day" :style="{ width: `${dayWidth}px` }">
                                {{ d.label }}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="gantt-body">
                    <div v-for="row in rows" :key="row.id" class="gantt-row">
                        <div class="gantt-left">
                            <div class="gantt-cell w-plan">{{ row.planNumber }}</div>
                            <div class="gantt-cell w-prodNo">{{ row.productNumber }}</div>
                            <div class="gantt-cell w-prodName">{{ row.productName }}</div>
                            <div class="gantt-cell w-date">{{ row.start }}</div>
                            <div class="gantt-cell w-date">{{ row.end }}</div>
                        </div>
                        <div class="gantt-right">
                            <div class="gantt-grid">
                                <div
                                    v-for="d in days"
                                    :key="d.key"
                                    class="gantt-grid-col"
                                    :style="{ width: `${dayWidth}px` }"
                                />
                                <div
                                    class="gantt-bar"
                                    :style="barStyle(row)"
                                    :title="`${row.start} → ${row.end}`"
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </a-card>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

type GanttRow = {
    id: number;
    planNumber: string;
    productNumber: string;
    productName: string;
    start: string; // YYYY.MM.DD
    end: string; // YYYY.MM.DD
    color: string;
};

const dayWidth = 22;

const pad = (n: number, len = 2) => String(n).padStart(len, '0');
const toDot = (d: Date) => `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

const rangeStart = ref<Date>(startOfMonth(new Date(2025, 2, 1)));
const rangeDays = ref<number>(45);

const rangeEnd = computed(() => {
    const d = new Date(rangeStart.value);
    d.setDate(d.getDate() + rangeDays.value - 1);
    return d;
});

const days = computed(() => {
    const res: Array<{ key: string; label: string; date: Date }> = [];
    for (let i = 0; i < rangeDays.value; i++) {
        const d = new Date(rangeStart.value);
        d.setDate(d.getDate() + i);
        res.push({ key: toKey(d), label: pad(d.getDate()), date: d });
    }
    return res;
});

const months = computed(() => {
    const res: Array<{ key: string; label: string; days: number }> = [];
    const start = new Date(rangeStart.value);
    for (let i = 0; i < rangeDays.value; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
        const label = `${d.getFullYear()}年${pad(d.getMonth() + 1)}月`;
        const last = res[res.length - 1];
        if (!last || last.key !== key) {
            res.push({ key, label, days: 1 });
        } else {
            last.days += 1;
        }
    }
    return res;
});

const productPool = [
    { productNumber: 'CPBH000001', productName: '笔记本电脑' },
    { productNumber: 'CPBH000013', productName: '工业平板' },
    { productNumber: 'CHBH000022', productName: 'ALEI手机' },
    { productNumber: 'CPBH000008', productName: '智能手表' },
];
const colors = ['#18a085', '#ff4d4f', '#1677ff', '#722ed1', '#13c2c2', '#faad14'];

const rows = computed<GanttRow[]>(() =>
    Array.from({ length: 18 }, (_, idx) => {
        const i = idx + 1;
        const p = productPool[idx % productPool.length]!;
        const base = new Date(rangeStart.value);
        base.setDate(base.getDate() + (idx % 10) * 2);
        const end = new Date(base);
        end.setDate(end.getDate() + 18 + ((idx * 3) % 14));
        return {
            id: i,
            planNumber: `JHBH${String(10000000 + i)}`,
            productNumber: p.productNumber,
            productName: p.productName,
            start: toDot(base),
            end: toDot(end),
            color: colors[idx % colors.length]!,
        };
    })
);

const parseDot = (s: string) => {
    const [y, m, d] = s.split('.').map(n => Number(n));
    return new Date(y!, (m ?? 1) - 1, d ?? 1);
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const barStyle = (row: GanttRow) => {
    const start = parseDot(row.start);
    const end = parseDot(row.end);
    const total = rangeDays.value;

    const offsetDays = Math.floor((start.getTime() - rangeStart.value.getTime()) / 86400000);
    const spanDays = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;

    const left = clamp(offsetDays, 0, total) * dayWidth;
    const rightEdge = clamp(offsetDays + spanDays, 0, total) * dayWidth;
    const width = Math.max(2, rightEdge - left);

    return {
        left: `${left}px`,
        width: `${width}px`,
        background: row.color,
    };
};

const shiftRange = (days: number) => {
    const d = new Date(rangeStart.value);
    d.setDate(d.getDate() + days);
    rangeStart.value = d;
};

const resetRange = () => {
    rangeStart.value = startOfMonth(new Date(2025, 2, 1));
};
</script>

<style scoped>
.gantt-wrap {
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
}

.gantt-head {
    display: flex;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    background: #fafafa;
}

.gantt-left-head {
    display: flex;
    flex: 0 0 auto;
}

.gantt-right-head {
    flex: 1;
    overflow: hidden;
}

.gantt-month-row,
.gantt-day-row {
    display: flex;
    width: 100%;
}

.gantt-month {
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.85);
    border-left: 1px solid rgba(0, 0, 0, 0.06);
}

.gantt-day {
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.65);
    border-left: 1px solid rgba(0, 0, 0, 0.06);
}

.gantt-body {
    max-height: 720px;
    overflow: auto;
}

.gantt-row {
    display: flex;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.gantt-left {
    display: flex;
    flex: 0 0 auto;
    background: #fff;
}

.gantt-right {
    flex: 1;
    min-width: 0;
    background: #fff;
}

.gantt-cell {
    padding: 10px 10px;
    border-right: 1px solid rgba(0, 0, 0, 0.06);
    font-size: 12px;
    color: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    white-space: nowrap;
}

.w-plan {
    width: 150px;
}

.w-prodNo {
    width: 140px;
}

.w-prodName {
    width: 140px;
}

.w-date {
    width: 110px;
}

.gantt-grid {
    position: relative;
    height: 44px;
    display: flex;
    align-items: center;
}

.gantt-grid-col {
    height: 100%;
    border-left: 1px solid rgba(0, 0, 0, 0.04);
}

.gantt-bar {
    position: absolute;
    height: 10px;
    border-radius: 999px;
    opacity: 0.9;
}
</style>
