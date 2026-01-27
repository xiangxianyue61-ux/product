<template>
    <div class="dashboard-wrapper">
        <!-- 顶部标题和时间 -->
        <div class="dashboard-header">
            <h1 class="dashboard-title">生产综合看板</h1>
            <div class="current-time">{{ currentTime }}</div>
        </div>

        <!-- 主要内容区域 -->
        <div class="dashboard-content">
            <!-- 左侧列 - 4个卡片 -->
            <div class="left-column">
                <!-- 1. 当日产量 -->
                <div class="card production-card">
                    <div class="card-left">
                        <div class="card-title">| 当日产量</div>
                        <div class="digital-display-segmented">
                            <div
                                v-for="(digit, index) in formatNumber(dashboardData.dailyProduction).split('')"
                                :key="index"
                                class="digit-panel"
                            >
                                <span class="digit-value">{{ digit }}</span>
                            </div>
                        </div>
                        <div class="info-row">
                            <div class="info-item">
                                <div class="info-label">计划产量</div>
                                <div class="info-value">{{ dashboardData.plannedProduction }}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">已完成</div>
                                <div class="info-value progress-value">{{ dashboardData.completionRate }}%</div>
                            </div>
                        </div>
                    </div>
                    <div class="card-right">
                        <div ref="dailyProductionChart" class="chart-container"></div>
                    </div>
                </div>

                <!-- 2. 累计产量 -->
                <div class="card accumulated-card">
                    <div class="card-left-accumulated">
                        <div class="card-title">| 累计产量</div>
                        <div class="digital-display-segmented accumulated-display">
                            <div
                                v-for="(digit, index) in formatNumber(dashboardData.accumulatedProduction).split('')"
                                :key="index"
                                class="digit-panel"
                            >
                                <span class="digit-value accumulated-digit">{{ digit }}</span>
                            </div>
                        </div>
                        <div ref="accumulatedChart" class="chart-container-small"></div>
                    </div>
                    <div class="card-right-product-list">
                        <div class="product-list">
                            <div
                                v-for="(item, index) in dashboardData.accumulatedProducts"
                                :key="index"
                                class="product-item"
                            >
                                <div class="product-bar" :style="{ backgroundColor: item.color, width: '60%' }"></div>
                                <span class="product-name">{{ item.name }}</span>
                                <span class="product-value">{{ item.value }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 3. 当日进出厂 -->
                <div class="card in-out-card">
                    <div class="card-title">| 当日进出厂</div>
                    <div class="in-out-grid">
                        <div class="in-out-col">
                            <div class="in-out-label">毛料进厂</div>
                            <div class="in-out-value">{{ dashboardData.rawMaterialIn }}</div>
                            <div class="in-out-monthly">月累计 {{ dashboardData.rawMaterialInMonthly }}</div>
                        </div>
                        <div class="in-out-col">
                            <div class="in-out-label">成品进厂</div>
                            <div class="in-out-value">{{ dashboardData.finishedProductIn }}</div>
                            <div class="in-out-monthly">月累计 {{ dashboardData.finishedProductInMonthly }}</div>
                        </div>
                        <div class="in-out-col">
                            <div class="in-out-label">成品出厂</div>
                            <div class="in-out-value">{{ dashboardData.finishedProductOut }}</div>
                            <div class="in-out-monthly">月累计 {{ dashboardData.finishedProductOutMonthly }}</div>
                        </div>
                    </div>
                </div>

                <!-- 4. 质量不良分布 -->
                <div class="card quality-card">
                    <div class="card-left">
                        <div class="card-title">| 质量不良分布</div>
                        <div class="defect-list">
                            <div
                                v-for="(item, index) in dashboardData.defectDistribution"
                                :key="index"
                                class="defect-item"
                            >
                                <div class="defect-dot" :style="{ backgroundColor: item.color }"></div>
                                <span class="defect-label">{{ item.level }}不良:</span>
                                <span class="defect-value">{{ item.value }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-right">
                        <div ref="defectChart" class="chart-container"></div>
                    </div>
                </div>
            </div>

            <!-- 中间列 -->
            <div class="middle-column">
                <!-- KPI指标 - 工厂图上方 -->
                <div class="kpi-section">
                    <div class="kpi-item">
                        <span class="kpi-value">{{ dashboardData.inProduction }}</span>
                        <span class="kpi-label">在生产数量</span>
                    </div>
                    <div class="kpi-item">
                        <span class="kpi-value">{{ dashboardData.unproduced }}</span>
                        <span class="kpi-label">未生产数量</span>
                    </div>
                    <div class="kpi-item">
                        <span class="kpi-value">{{ dashboardData.nonConforming }}</span>
                        <span class="kpi-label">不合格数量</span>
                    </div>
                    <div class="kpi-item">
                        <span class="kpi-value">{{ dashboardData.achievementRate }}%</span>
                        <span class="kpi-label">生产达成率</span>
                    </div>
                    <div class="kpi-item">
                        <span class="kpi-value">{{ dashboardData.qualificationRate }}%</span>
                        <span class="kpi-label">产品合格率</span>
                    </div>
                </div>

                <!-- 工厂布局图 -->
                <div class="factory-diagram">
                    <div class="factory-wireframe">
                        <!-- 3D wireframe 工厂图 -->
                        <svg width="100%" height="100%" viewBox="0 0 800 600" class="factory-svg">
                            <!-- 建筑物1 -->
                            <rect
                                x="50"
                                y="200"
                                width="150"
                                height="200"
                                fill="none"
                                stroke="#4fc3f7"
                                stroke-width="2"
                                opacity="0.6"
                            />
                            <rect
                                x="60"
                                y="210"
                                width="130"
                                height="180"
                                fill="none"
                                stroke="#4fc3f7"
                                stroke-width="1"
                                opacity="0.4"
                            />
                            <line x1="50" y1="200" x2="100" y2="150" stroke="#4fc3f7" stroke-width="2" opacity="0.6" />
                            <line x1="200" y1="200" x2="250" y2="150" stroke="#4fc3f7" stroke-width="2" opacity="0.6" />

                            <!-- 建筑物2 -->
                            <rect
                                x="250"
                                y="150"
                                width="200"
                                height="250"
                                fill="none"
                                stroke="#4fc3f7"
                                stroke-width="2"
                                opacity="0.6"
                            />
                            <rect
                                x="260"
                                y="160"
                                width="180"
                                height="230"
                                fill="none"
                                stroke="#4fc3f7"
                                stroke-width="1"
                                opacity="0.4"
                            />
                            <line x1="250" y1="150" x2="300" y2="100" stroke="#4fc3f7" stroke-width="2" opacity="0.6" />
                            <line x1="450" y1="150" x2="500" y2="100" stroke="#4fc3f7" stroke-width="2" opacity="0.6" />

                            <!-- 建筑物3 -->
                            <rect
                                x="500"
                                y="250"
                                width="180"
                                height="150"
                                fill="none"
                                stroke="#4fc3f7"
                                stroke-width="2"
                                opacity="0.6"
                            />
                            <rect
                                x="510"
                                y="260"
                                width="160"
                                height="130"
                                fill="none"
                                stroke="#4fc3f7"
                                stroke-width="1"
                                opacity="0.4"
                            />

                            <!-- 连接线 -->
                            <line x1="200" y1="300" x2="250" y2="275" stroke="#4fc3f7" stroke-width="1" opacity="0.5" />
                            <line x1="450" y1="275" x2="500" y2="325" stroke="#4fc3f7" stroke-width="1" opacity="0.5" />

                            <!-- 生产流水线 -->
                            <path
                                d="M 50 400 L 250 400 L 450 375 L 680 400"
                                fill="none"
                                stroke="#4fc3f7"
                                stroke-width="2"
                                opacity="0.6"
                                stroke-dasharray="5,5"
                            />

                            <!-- 网格背景 -->
                            <defs>
                                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                    <path
                                        d="M 40 0 L 0 0 0 40"
                                        fill="none"
                                        stroke="#4fc3f7"
                                        stroke-width="0.5"
                                        opacity="0.2"
                                    />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                    </div>
                    <div class="factory-label">工厂布局示意图</div>
                </div>

                <!-- 今日生产进度 -->
                <div class="card progress-card">
                    <div class="card-title">| 今日生产进度</div>
                    <div class="progress-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>序号</th>
                                    <th>工单编号</th>
                                    <th>产品名称</th>
                                    <th>今日产量</th>
                                    <th>订单总量</th>
                                    <th>当前进度</th>
                                    <th>截至日期</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(item, index) in dashboardData.productionProgress" :key="index">
                                    <td>{{ String(index + 1).padStart(2, '0') }}</td>
                                    <td>{{ item.orderNumber }}</td>
                                    <td>{{ item.productName }}</td>
                                    <td>{{ item.dailyProduction }}</td>
                                    <td>{{ item.totalOrder }}</td>
                                    <td>
                                        <div class="table-progress">
                                            <div
                                                class="table-progress-fill"
                                                :style="{ width: `${item.progress}%` }"
                                            ></div>
                                            <span class="table-progress-text">{{ item.progress }}%</span>
                                        </div>
                                    </td>
                                    <td>{{ item.dueDate }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- 右侧列 -->
            <div class="right-column">
                <!-- 设备运行情况 -->
                <div class="card equipment-card">
                    <div class="card-title">| 设备运行情况</div>
                    <div class="equipment-grid">
                        <div
                            v-for="(item, index) in dashboardData.equipmentStatus"
                            :key="index"
                            class="equipment-panel"
                        >
                            <div class="equipment-icon-wrapper" :class="{ 'icon-orange': index === 0 }">
                                <component :is="item.iconComponent" class="equipment-icon-svg" />
                            </div>
                            <div class="equipment-category">{{ item.name }}</div>
                            <div class="equipment-total">{{ item.total }}</div>
                            <div class="equipment-detail">
                                <span class="detail-label">在线设备</span>
                                <span class="detail-value">{{ item.online }}</span>
                            </div>
                            <div class="equipment-detail">
                                <span class="detail-label">利用率</span>
                                <span class="detail-value">{{ item.utilization }}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 仓库物料管理 -->
                <div class="card warehouse-card">
                    <div class="card-title">| 仓库物料管理</div>
                    <div class="warehouse-grid">
                        <!-- 原料损耗率 -->
                        <div class="warehouse-item">
                            <component :is="warehouseIcons.lossRate" class="warehouse-icon" />
                            <div class="warehouse-metric">原料损耗率</div>
                            <div class="warehouse-value">{{ dashboardData.rawMaterialLossRate }}%</div>
                            <div class="warehouse-progress-bar">
                                <div
                                    class="warehouse-progress-fill green"
                                    :style="{ width: `${dashboardData.rawMaterialLossRate}%` }"
                                ></div>
                            </div>
                        </div>
                        <!-- 原料库存预警 -->
                        <div class="warehouse-item">
                            <component :is="warehouseIcons.warning" class="warehouse-icon" />
                            <div class="warehouse-metric">原料库存预警</div>
                            <div class="warehouse-value red">{{ dashboardData.rawMaterialWarning }}%</div>
                            <div class="warehouse-progress-bar">
                                <div
                                    class="warehouse-progress-fill red"
                                    :style="{ width: `${dashboardData.rawMaterialWarning}%` }"
                                ></div>
                            </div>
                        </div>
                        <!-- 原料库存数量 -->
                        <div class="warehouse-item">
                            <component :is="warehouseIcons.stock" class="warehouse-icon" />
                            <div class="warehouse-metric">原料库存数量</div>
                            <div class="warehouse-value-large">{{ dashboardData.rawMaterialStock }}</div>
                            <div class="warehouse-change">环比 {{ dashboardData.rawMaterialStockChange }}%</div>
                        </div>
                        <!-- 原料入库数量 -->
                        <div class="warehouse-item">
                            <component :is="warehouseIcons.inbound" class="warehouse-icon" />
                            <div class="warehouse-metric">原料入库数量</div>
                            <div class="warehouse-value-large">{{ dashboardData.rawMaterialInbound }}</div>
                            <div class="warehouse-change">环比 {{ dashboardData.rawMaterialInboundChange }}%</div>
                        </div>
                        <!-- 成品入库数量 -->
                        <div class="warehouse-item">
                            <component :is="warehouseIcons.finishedInbound" class="warehouse-icon" />
                            <div class="warehouse-metric">成品入库数量</div>
                            <div class="warehouse-value-large">{{ dashboardData.finishedProductInbound }}</div>
                            <div class="warehouse-change">环比 {{ dashboardData.finishedProductInboundChange }}%</div>
                        </div>
                        <!-- 成品出库数量 -->
                        <div class="warehouse-item">
                            <component :is="warehouseIcons.outbound" class="warehouse-icon" />
                            <div class="warehouse-metric">成品出库数量</div>
                            <div class="warehouse-value-large">{{ dashboardData.finishedProductOutbound }}</div>
                            <div class="warehouse-change">环比 {{ dashboardData.finishedProductOutboundChange }}%</div>
                        </div>
                    </div>
                </div>

                <!-- 报警信息 -->
                <div class="card alarm-card">
                    <div class="card-title">| 报警信息</div>
                    <div class="alarm-list">
                        <div v-for="(item, index) in dashboardData.alarms" :key="index" class="alarm-item">
                            <div class="alarm-content">{{ item.message }}</div>
                            <div class="alarm-time">{{ item.time }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import * as echarts from 'echarts';
import {
    RobotOutlined,
    ToolOutlined,
    CloudOutlined,
    BoxPlotOutlined,
    ThunderboltOutlined,
    HomeOutlined,
    InboxOutlined,
    ExportOutlined,
} from '@ant-design/icons-vue';

// 实时时间
const currentTime = ref('');

// 仓库物料管理图标
const warehouseIcons = {
    lossRate: BoxPlotOutlined,
    warning: ThunderboltOutlined,
    stock: HomeOutlined,
    inbound: InboxOutlined,
    finishedInbound: InboxOutlined,
    outbound: ExportOutlined,
};

// 看板数据
const dashboardData = ref({
    dailyProduction: 688,
    plannedProduction: 860,
    completionRate: 88.9,
    dailyProductionData: [
        { name: '笔记本', value: 200, color: '#4CAF50' },
        { name: '屏幕', value: 180, color: '#1a237e' },
        { name: '主板', value: 150, color: '#2196F3' },
        { name: '键盘', value: 158, color: '#FFC107' },
    ],
    accumulatedProduction: 24039,
    accumulatedProducts: [
        { name: '笔记本电脑', value: 8236, color: '#4CAF50' },
        { name: '台式机', value: 8236, color: '#2196F3' },
        { name: '屏幕', value: 8236, color: '#1a237e' },
        { name: '主机', value: 8236, color: '#4CAF50' },
        { name: '一体机', value: 8236, color: '#81C784' },
        { name: '键盘', value: 8236, color: '#9C27B0' },
    ],
    rawMaterialIn: 786,
    rawMaterialInMonthly: 2453,
    finishedProductIn: 124,
    finishedProductInMonthly: 4322,
    finishedProductOut: 890,
    finishedProductOutMonthly: 9312,
    defectDistribution: [
        { level: '一级', value: 5, color: '#2196F3' },
        { level: '二级', value: 8, color: '#64B5F6' },
        { level: '三级', value: 15, color: '#4CAF50' },
        { level: '四级', value: 26, color: '#FFC107' },
    ],
    inProduction: 436,
    unproduced: 58,
    nonConforming: 12,
    achievementRate: 92.3,
    qualificationRate: 98.6,
    equipmentStatus: [
        { name: '关键设备', total: 24, online: 20, utilization: 88.5, iconComponent: RobotOutlined },
        { name: '加工设备', total: 63, online: 56, utilization: 93.8, iconComponent: ToolOutlined },
        { name: '环境设备', total: 24, online: 20, utilization: 88.5, iconComponent: CloudOutlined },
    ],
    rawMaterialLossRate: 30,
    rawMaterialWarning: 20,
    rawMaterialStock: 3425,
    rawMaterialStockChange: 2.2,
    rawMaterialInbound: 24521,
    rawMaterialInboundChange: 1.3,
    finishedProductInbound: 2312,
    finishedProductInboundChange: 2.5,
    finishedProductOutbound: 2123,
    finishedProductOutboundChange: 2.3,
    productionProgress: [
        {
            orderNumber: 'GDBH0000001',
            productName: '笔记本电脑',
            dailyProduction: 30,
            totalOrder: 1000,
            progress: 86.8,
            dueDate: '2025.08.26',
        },
        {
            orderNumber: 'GDBH0000001',
            productName: '笔记本电脑',
            dailyProduction: 30,
            totalOrder: 1000,
            progress: 86.8,
            dueDate: '2025.08.26',
        },
        {
            orderNumber: 'GDBH0000001',
            productName: '笔记本电脑',
            dailyProduction: 30,
            totalOrder: 1000,
            progress: 86.8,
            dueDate: '2025.08.26',
        },
        {
            orderNumber: 'GDBH0000001',
            productName: '笔记本电脑',
            dailyProduction: 30,
            totalOrder: 1000,
            progress: 86.8,
            dueDate: '2025.08.26',
        },
        {
            orderNumber: 'GDBH0000001',
            productName: '笔记本电脑',
            dailyProduction: 30,
            totalOrder: 1000,
            progress: 86.8,
            dueDate: '2025.08.26',
        },
    ],
    alarms: [
        { message: '设备H23的转速过快,温度超过70℃【预警值】', time: '06.20 12:08:23' },
        { message: '设备H23的转速过快,温度超过70℃【预警值】', time: '06.20 12:08:23' },
        { message: '设备H23的转速过快,温度超过70℃【预警值】', time: '06.20 12:08:23' },
    ],
});

// 图表引用
const dailyProductionChart = ref<HTMLElement>();
const accumulatedChart = ref<HTMLElement>();
const defectChart = ref<HTMLElement>();

let dailyChartInstance: echarts.ECharts | null = null;
let accumulatedChartInstance: echarts.ECharts | null = null;
let defectChartInstance: echarts.ECharts | null = null;

// SSE 连接
let eventSource: EventSource | null = null;

// 格式化数字（补零）
const formatNumber = (num: number): string => {
    return String(num).padStart(7, '0');
};

// 更新实时时间
const updateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[now.getDay()];
    currentTime.value = `${year}.${month}.${day} ${hours}:${minutes}:${seconds} ${weekday}`;
};

// 初始化当日产量图表 - 同心圆环图
const initDailyProductionChart = () => {
    if (dailyProductionChart.value) {
        if (dailyChartInstance) {
            dailyChartInstance.dispose();
        }
        dailyChartInstance = echarts.init(dailyProductionChart.value);
        const data = dashboardData.value.dailyProductionData;
        const maxValue = Math.max(...data.map(item => item.value));

        // 创建4个同心圆环，每个环显示一个产品的进度
        const series = data.map((item, index) => {
            const radiusStart = 35 + index * 12; // 35%, 47%, 59%, 71%
            const radiusEnd = radiusStart + 10; // 每个环宽度10%
            const percentage = (item.value / maxValue) * 100; // 计算百分比

            return {
                type: 'pie',
                radius: [radiusStart + '%', radiusEnd + '%'],
                center: ['50%', '50%'],
                startAngle: 90,
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 0,
                    borderColor: 'transparent',
                    borderWidth: 0,
                },
                label: {
                    show: false,
                },
                labelLine: {
                    show: false,
                },
                data: [
                    {
                        value: percentage,
                        name: item.name,
                        itemStyle: {
                            color: item.color,
                        },
                    },
                    {
                        value: 100 - percentage,
                        itemStyle: {
                            color: 'rgba(255, 255, 255, 0.05)',
                        },
                    },
                ],
            };
        });

        const option = {
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c} ({d}%)',
            },
            legend: {
                show: false,
            },
            series: series,
        };
        dailyChartInstance.setOption(option);
    }
};

// 初始化累计产量图表
const initAccumulatedChart = () => {
    if (accumulatedChart.value) {
        if (accumulatedChartInstance) {
            accumulatedChartInstance.dispose();
        }
        accumulatedChartInstance = echarts.init(accumulatedChart.value);
        const option = {
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c} ({d}%)',
            },
            legend: {
                show: false,
            },
            series: [
                {
                    type: 'pie',
                    radius: ['50%', '80%'],
                    center: ['50%', '50%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 0,
                        borderColor: 'transparent',
                        borderWidth: 0,
                    },
                    label: {
                        show: false,
                    },
                    labelLine: {
                        show: false,
                    },
                    data: dashboardData.value.accumulatedProducts.map(item => ({
                        value: item.value,
                        name: item.name,
                        itemStyle: {
                            color: item.color,
                        },
                    })),
                },
            ],
        };
        accumulatedChartInstance.setOption(option);
    }
};

// 初始化质量不良分布图表
const initDefectChart = () => {
    if (defectChart.value) {
        if (defectChartInstance) {
            defectChartInstance.dispose();
        }
        defectChartInstance = echarts.init(defectChart.value);
        const option = {
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c} ({d}%)',
            },
            legend: {
                show: false,
            },
            series: [
                {
                    type: 'pie',
                    radius: ['50%', '80%'],
                    center: ['50%', '50%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 0,
                        borderColor: 'transparent',
                        borderWidth: 0,
                    },
                    label: {
                        show: false,
                    },
                    labelLine: {
                        show: false,
                    },
                    data: dashboardData.value.defectDistribution.map(item => ({
                        value: item.value,
                        name: item.level + '不良',
                        itemStyle: {
                            color: item.color,
                        },
                    })),
                },
            ],
        };
        defectChartInstance.setOption(option);
    }
};

// 初始化所有图表
const initAllCharts = () => {
    nextTick(() => {
        setTimeout(() => {
            if (dailyProductionChart.value && dailyProductionChart.value.offsetWidth > 0) {
                initDailyProductionChart();
            }
            if (accumulatedChart.value && accumulatedChart.value.offsetWidth > 0) {
                initAccumulatedChart();
            }
            if (defectChart.value && defectChart.value.offsetWidth > 0) {
                initDefectChart();
            }
        }, 200);
    });
};

// 窗口大小改变时重新调整图表
const handleResize = () => {
    if (dailyChartInstance) dailyChartInstance.resize();
    if (accumulatedChartInstance) accumulatedChartInstance.resize();
    if (defectChartInstance) defectChartInstance.resize();
};

// 初始化 SSE 连接
const initSSE = () => {
    // 注意：这里需要替换为实际的 SSE 服务器地址
    // 例如：const sseUrl = 'http://localhost:3000/api/dashboard/sse';
    const sseUrl = '/api/dashboard/sse';

    try {
        eventSource = new EventSource(sseUrl);

        eventSource.onmessage = event => {
            try {
                const data = JSON.parse(event.data);
                // 更新看板数据
                if (data.dailyProduction !== undefined) {
                    dashboardData.value.dailyProduction = data.dailyProduction;
                }
                if (data.completionRate !== undefined) {
                    dashboardData.value.completionRate = data.completionRate;
                }
                if (data.dailyProductionData) {
                    dashboardData.value.dailyProductionData = data.dailyProductionData;
                    initDailyProductionChart();
                }
                if (data.accumulatedProduction !== undefined) {
                    dashboardData.value.accumulatedProduction = data.accumulatedProduction;
                }
                if (data.defectDistribution) {
                    dashboardData.value.defectDistribution = data.defectDistribution;
                    initDefectChart();
                }
                if (data.equipmentStatus) {
                    dashboardData.value.equipmentStatus = data.equipmentStatus;
                }
                if (data.alarms) {
                    dashboardData.value.alarms = data.alarms;
                }
                // 可以根据需要更新其他字段
            } catch {
                // 解析 SSE 数据失败
            }
        };

        eventSource.onerror = () => {
            // SSE 连接错误
            // 可以在这里实现重连逻辑
        };
    } catch {
        // 初始化 SSE 连接失败，如果 SSE 服务器不可用，可以继续使用静态数据
    }
};

onMounted(() => {
    updateTime();
    setInterval(updateTime, 1000); // 每秒更新一次时间

    initAllCharts();
    window.addEventListener('resize', handleResize);

    // 初始化 SSE 连接
    initSSE();
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);

    // 关闭 SSE 连接
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }

    // 销毁图表实例
    if (dailyChartInstance) {
        dailyChartInstance.dispose();
        dailyChartInstance = null;
    }
    if (accumulatedChartInstance) {
        accumulatedChartInstance.dispose();
        accumulatedChartInstance = null;
    }
    if (defectChartInstance) {
        defectChartInstance.dispose();
        defectChartInstance = null;
    }
});
</script>

<style scoped>
* {
    box-sizing: border-box;
}

.dashboard-wrapper {
    background: #0a0e27;
    min-height: 100vh;
    width: 100vw;
    padding: 16px;
    color: #ffffff;
    position: relative;
    overflow-x: hidden;
    font-family:
        -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    margin-bottom: 12px;
}

.dashboard-title {
    font-size: 36px;
    font-weight: 700;
    color: #4fc3f7;
    margin: 0;
    letter-spacing: 3px;
    flex: 1;
    text-align: center;
}

.current-time {
    font-size: 15px;
    color: #ffffff;
    font-family: 'Courier New', monospace;
    font-weight: 400;
    white-space: nowrap;
}

.dashboard-content {
    display: grid;
    grid-template-columns: 400px 1fr 400px;
    gap: 15px;
    max-width: 100%;
    margin-top: 10px;
}

.left-column,
.right-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.middle-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.card {
    background: rgba(10, 14, 39, 0.9);
    border: 1px solid rgba(79, 195, 247, 0.3);
    border-radius: 2px;
    padding: 14px;
}

.card-title {
    color: #ffffff;
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 12px;
    letter-spacing: 0.5px;
}

.production-card {
    display: flex;
    gap: 16px;
    min-width: 0;
    overflow: hidden;
}

.accumulated-card {
    display: flex;
    gap: 20px;
    min-width: 0;
    overflow: hidden;
}

.card-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
    overflow: hidden;
}

.digital-display {
    font-family: 'Courier New', 'Consolas', monospace;
    font-size: 38px;
    font-weight: 700;
    color: #4fc3f7;
    letter-spacing: 4px;
    line-height: 1.1;
    margin: 8px 0;
    word-break: break-all;
    overflow-wrap: break-word;
    max-width: 100%;
}

.digital-display-segmented {
    display: flex;
    align-items: stretch;
    gap: 0;
    margin: 8px 0;
    max-width: 100%;
    overflow: hidden;
    background: rgba(10, 20, 40, 0.8);
    border: 1px solid rgba(79, 195, 247, 0.15);
    border-radius: 3px;
    padding: 2px;
}

.digit-panel {
    flex: 1;
    min-width: 0;
    background: rgba(5, 15, 30, 0.9);
    border-right: 1px solid rgba(79, 195, 247, 0.25);
    padding: 10px 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.digit-panel:last-child {
    border-right: none;
}

.digit-value {
    font-family: 'Courier New', 'Consolas', monospace;
    font-size: 36px;
    font-weight: 700;
    color: #4fc3f7;
    line-height: 1;
    display: block;
    letter-spacing: 0;
}

.accumulated-digit {
    color: #ffc107;
}

.info-row {
    display: flex;
    gap: 30px;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.info-label {
    color: #ffffff;
    font-size: 14px;
    opacity: 0.8;
}

.info-value {
    color: #4fc3f7;
    font-size: 20px;
    font-weight: 600;
}

.progress-value {
    color: #ffc107;
}

.card-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.chart-container {
    width: 160px;
    height: 160px;
    min-width: 160px;
    min-height: 160px;
    position: relative;
}

.chart-container canvas {
    display: block !important;
}

.chart-legend {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.legend-color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
}

.legend-text {
    color: #ffffff;
    font-size: 14px;
}

.card-left-accumulated {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
    overflow: hidden;
}

.card-right-product-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
}

.chart-container-small {
    width: 140px;
    height: 140px;
    min-width: 140px;
    min-height: 140px;
    flex-shrink: 0;
    position: relative;
    align-self: flex-start;
}

.chart-container-small canvas {
    display: block !important;
}

.product-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    flex: 1;
}

.product-item {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #ffffff;
    font-size: 12px;
    padding: 3px 0;
}

.product-bar {
    height: 16px;
    border-radius: 2px;
    flex-shrink: 0;
    min-width: 40px;
}

.product-name {
    color: #ffffff;
    opacity: 0.9;
    font-size: 12px;
    min-width: 70px;
}

.product-value {
    color: #4fc3f7;
    font-weight: 600;
    font-size: 13px;
    margin-left: auto;
}

.in-out-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 8px;
}

.in-out-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 10px;
    background: rgba(79, 195, 247, 0.05);
    border-radius: 4px;
    border: 1px solid rgba(79, 195, 247, 0.15);
}

.in-out-label {
    color: #ffffff;
    font-size: 13px;
    opacity: 0.9;
}

.in-out-value {
    color: #4fc3f7;
    font-size: 28px;
    font-weight: 700;
}

.in-out-monthly {
    color: #ffffff;
    font-size: 11px;
    opacity: 0.7;
}

.defect-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.defect-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
}

.defect-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
}

.defect-label {
    color: #ffffff;
    font-size: 13px;
}

.defect-value {
    color: #ffc107;
    font-size: 16px;
    font-weight: 700;
    margin-left: auto;
}

.quality-card {
    display: flex;
    gap: 20px;
}

.kpi-section {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 50px;
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 12px 0;
    margin-bottom: 12px;
    width: 100%;
}

.kpi-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
}

.kpi-value {
    font-size: 48px;
    font-weight: 700;
    color: #4fc3f7;
    line-height: 1;
    letter-spacing: 1px;
}

.kpi-label {
    font-size: 14px;
    color: #ffffff;
    opacity: 0.9;
    font-weight: 400;
    margin-top: 4px;
}

.factory-diagram {
    background: rgba(10, 14, 39, 0.95);
    border: 1px solid rgba(79, 195, 247, 0.3);
    border-radius: 2px;
    padding: 0;
    min-height: 500px;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
}

.factory-wireframe {
    flex: 1;
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 450px;
}

.factory-svg {
    width: 100%;
    height: 100%;
}

.factory-label {
    position: absolute;
    bottom: 15px;
    left: 50%;
    transform: translateX(-50%);
    color: #ffffff;
    font-size: 14px;
    font-weight: 500;
    opacity: 0.9;
    z-index: 10;
    background: rgba(10, 14, 39, 0.8);
    padding: 4px 12px;
    border-radius: 2px;
    border: 1px solid rgba(79, 195, 247, 0.2);
}

.equipment-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}

.equipment-panel {
    background: rgba(5, 15, 30, 0.75);
    border: 1px solid rgba(79, 195, 247, 0.3);
    border-radius: 2px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

.equipment-icon-wrapper {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #4fc3f7;
}

.equipment-icon-wrapper.icon-orange {
    color: #ff9800;
}

.equipment-icon-svg {
    font-size: 32px;
}

.equipment-category {
    color: #ffffff;
    font-size: 14px;
    font-weight: 400;
}

.equipment-total {
    color: #ff9800;
    font-size: 28px;
    font-weight: 700;
}

.equipment-detail {
    display: flex;
    justify-content: space-between;
    width: 100%;
    font-size: 12px;
}

.detail-label {
    color: #ffffff;
}

.detail-value {
    color: #4fc3f7;
    font-weight: 600;
}

.warehouse-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 12px;
}

.warehouse-item {
    background: rgba(5, 15, 30, 0.75);
    border: 1px solid rgba(79, 195, 247, 0.3);
    border-radius: 2px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
}

.warehouse-icon {
    font-size: 24px;
    color: #4fc3f7;
    margin-bottom: 4px;
}

.warehouse-metric {
    color: #ffffff;
    font-size: 13px;
    font-weight: 400;
}

.warehouse-value {
    color: #ffffff;
    font-size: 18px;
    font-weight: 600;
}

.warehouse-value.red {
    color: #f44336;
}

.warehouse-value-large {
    color: #4fc3f7;
    font-size: 22px;
    font-weight: 700;
}

.warehouse-change {
    color: #ffffff;
    font-size: 11px;
    opacity: 0.8;
}

.warehouse-progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    margin-top: 4px;
}

.warehouse-progress-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
}

.warehouse-progress-fill.green {
    background: linear-gradient(90deg, #4caf50 0%, #66bb6a 100%);
}

.warehouse-progress-fill.red {
    background: linear-gradient(90deg, #f44336 0%, #ef5350 100%);
}

.progress-table {
    overflow-x: auto;
}

.progress-table table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
}

.progress-table thead {
    background: rgba(79, 195, 247, 0.15);
    border-bottom: 1px solid rgba(79, 195, 247, 0.3);
}

.progress-table th,
.progress-table td {
    padding: 8px;
    text-align: left;
    border-bottom: 1px solid rgba(79, 195, 247, 0.15);
}

.progress-table tbody tr:hover {
    background: rgba(79, 195, 247, 0.05);
}

.progress-table th {
    color: #4fc3f7;
    font-weight: 600;
    font-size: 12px;
    padding: 8px 6px;
}

.progress-table td {
    color: #ffffff;
    font-size: 12px;
    padding: 8px 6px;
    font-weight: 400;
}

.table-progress {
    position: relative;
    width: 100%;
    height: 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    overflow: hidden;
}

.table-progress-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: linear-gradient(90deg, #4caf50 0%, #66bb6a 100%);
    transition: width 0.3s ease;
    border-radius: 10px;
}

.table-progress-text {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    color: #ffffff;
    font-size: 11px;
    font-weight: 600;
    z-index: 2;
}

.alarm-list {
    max-height: 300px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.alarm-item {
    padding: 10px 12px;
    background: rgba(255, 152, 0, 0.15);
    border-left: 3px solid #ff9800;
    border-radius: 2px;
    margin-bottom: 8px;
}

.alarm-item:last-child {
    margin-bottom: 0;
}

.alarm-content {
    color: #ffffff;
    font-size: 14px;
    margin-bottom: 4px;
}

.alarm-time {
    color: #ffffff;
    font-size: 12px;
    opacity: 0.7;
}
</style>
