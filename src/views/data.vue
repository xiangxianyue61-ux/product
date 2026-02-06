<template>
    <div class="dashboard-wrapper">
        <!-- 左上角：返回首页 -->
        <a-button class="back-home-btn" type="text" @click="goHome">
            <HomeOutlined />
            返回首页
        </a-button>

        <!-- 顶部标题和时间 -->
        <div class="dashboard-header">
            <h1 class="dashboard-title">生产综合看板</h1>
            <div class="current-time">{{ currentTime }}</div>
            <div v-if="!dataBoardLoaded" class="dashboard-loading">数据加载中（来自数据库）…</div>
        </div>

        <!-- 主要内容区域 -->
        <div class="dashboard-content">
            <!-- 左侧列 - 4个卡片 -->
            <div class="left-column">
                <!-- 1. 当日产量 -->
                <div class="card production-card">
                    <div class="card-left">
                        <div class="card-title">当日产量</div>
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

                <!-- 工厂布局图：3D 线框 -->
                <div class="factory-diagram">
                    <div ref="factory3dRef" class="factory-3d-canvas" />

                    <!-- 仅在 3D 区域内部的右侧详情面板（贴在模型区域右侧） -->
                    <div v-if="workshopDrawerOpen" class="factory-side-panel" @click.stop>
                        <div class="factory-side-header">
                            <div class="factory-side-title">
                                {{ activeWorkshopKey ? workshopMap[activeWorkshopKey].name : '车间详情' }}
                            </div>
                            <button class="factory-side-close" type="button" @click="workshopDrawerOpen = false">
                                ×
                            </button>
                        </div>

                        <div v-if="activeWorkshopKey" class="factory-side-content">
                            <div
                                class="factory-side-section"
                                v-for="(t, i) in workshopMap[activeWorkshopKey].desc"
                                :key="i"
                            >
                                <div class="factory-side-label">信息</div>
                                <div class="factory-side-value">{{ t }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 今日生产进度 -->
                <div class="card progress-card">
                    <div class="card-title">今日生产进度</div>
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
import { useRouter } from 'vue-router';
import * as echarts from 'echarts';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
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
import { apiFetch } from '../utils/apiClient';

const router = useRouter();

// 设备状态图标（后端不返回组件，前端按顺序绑定）
const EQUIPMENT_ICONS = [RobotOutlined, ToolOutlined, CloudOutlined];

function applyDataBoardPayload(data: Record<string, unknown>) {
    if (data.dailyProduction !== undefined) dashboardData.value.dailyProduction = data.dailyProduction as number;
    if (data.plannedProduction !== undefined) dashboardData.value.plannedProduction = data.plannedProduction as number;
    if (data.completionRate !== undefined) dashboardData.value.completionRate = data.completionRate as number;
    if (data.dailyProductionData)
        dashboardData.value.dailyProductionData =
            data.dailyProductionData as typeof dashboardData.value.dailyProductionData;
    if (data.accumulatedProduction !== undefined)
        dashboardData.value.accumulatedProduction = data.accumulatedProduction as number;
    if (data.accumulatedProducts)
        dashboardData.value.accumulatedProducts =
            data.accumulatedProducts as typeof dashboardData.value.accumulatedProducts;
    if (data.rawMaterialIn !== undefined) dashboardData.value.rawMaterialIn = data.rawMaterialIn as number;
    if (data.rawMaterialInMonthly !== undefined)
        dashboardData.value.rawMaterialInMonthly = data.rawMaterialInMonthly as number;
    if (data.finishedProductIn !== undefined) dashboardData.value.finishedProductIn = data.finishedProductIn as number;
    if (data.finishedProductInMonthly !== undefined)
        dashboardData.value.finishedProductInMonthly = data.finishedProductInMonthly as number;
    if (data.finishedProductOut !== undefined)
        dashboardData.value.finishedProductOut = data.finishedProductOut as number;
    if (data.finishedProductOutMonthly !== undefined)
        dashboardData.value.finishedProductOutMonthly = data.finishedProductOutMonthly as number;
    if (data.defectDistribution)
        dashboardData.value.defectDistribution =
            data.defectDistribution as typeof dashboardData.value.defectDistribution;
    if (data.inProduction !== undefined) dashboardData.value.inProduction = data.inProduction as number;
    if (data.unproduced !== undefined) dashboardData.value.unproduced = data.unproduced as number;
    if (data.nonConforming !== undefined) dashboardData.value.nonConforming = data.nonConforming as number;
    if (data.achievementRate !== undefined) dashboardData.value.achievementRate = data.achievementRate as number;
    if (data.qualificationRate !== undefined) dashboardData.value.qualificationRate = data.qualificationRate as number;
    if (data.equipmentStatus && Array.isArray(data.equipmentStatus)) {
        type EquipmentItem = { name: string; total: number; online: number; utilization: number };
        dashboardData.value.equipmentStatus = (data.equipmentStatus as EquipmentItem[]).map((item, i) => ({
            ...item,
            iconComponent: EQUIPMENT_ICONS[i] ?? RobotOutlined,
        }));
    }
    if (data.rawMaterialLossRate !== undefined)
        dashboardData.value.rawMaterialLossRate = data.rawMaterialLossRate as number;
    if (data.rawMaterialWarning !== undefined)
        dashboardData.value.rawMaterialWarning = data.rawMaterialWarning as number;
    if (data.rawMaterialStock !== undefined) dashboardData.value.rawMaterialStock = data.rawMaterialStock as number;
    if (data.rawMaterialStockChange !== undefined)
        dashboardData.value.rawMaterialStockChange = data.rawMaterialStockChange as number;
    if (data.rawMaterialInbound !== undefined)
        dashboardData.value.rawMaterialInbound = data.rawMaterialInbound as number;
    if (data.rawMaterialInboundChange !== undefined)
        dashboardData.value.rawMaterialInboundChange = data.rawMaterialInboundChange as number;
    if (data.finishedProductInbound !== undefined)
        dashboardData.value.finishedProductInbound = data.finishedProductInbound as number;
    if (data.finishedProductInboundChange !== undefined)
        dashboardData.value.finishedProductInboundChange = data.finishedProductInboundChange as number;
    if (data.finishedProductOutbound !== undefined)
        dashboardData.value.finishedProductOutbound = data.finishedProductOutbound as number;
    if (data.finishedProductOutboundChange !== undefined)
        dashboardData.value.finishedProductOutboundChange = data.finishedProductOutboundChange as number;
    if (data.productionProgress)
        dashboardData.value.productionProgress =
            data.productionProgress as typeof dashboardData.value.productionProgress;
    if (data.alarms) dashboardData.value.alarms = data.alarms as typeof dashboardData.value.alarms;
    dataBoardLoaded.value = true;
}
const goHome = () => router.push('/home');

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

// 车间序号侧边详情
type WorkshopKey = 1 | 2 | 3 | 4 | 5;
const workshopDrawerOpen = ref(false);
const activeWorkshopKey = ref<WorkshopKey | null>(null);
const workshopMap: Record<WorkshopKey, { name: string; desc: string[] }> = {
    1: { name: '生产车间', desc: ['生产加工 / 工单执行', '设备状态：正常', '产线：A1 / A2'] },
    2: { name: '测试车间', desc: ['产品功能测试 / 老化测试', '设备状态：正常', '测试位：T1 / T2'] },
    3: { name: '原材料仓库', desc: ['原材料收货 / 上架 / 发料', '库存状态：正常', '库区：R1 / R2'] },
    4: { name: '质检车间', desc: ['来料 / 过程 / 出厂质检', '质检状态：正常', '检验位：Q1 / Q2'] },
    5: { name: '成品仓库', desc: ['成品入库 / 出库 / 盘点', '库存状态：正常', '库区：F1 / F2'] },
};

const openWorkshopDrawer = (key: WorkshopKey) => {
    activeWorkshopKey.value = key;
    workshopDrawerOpen.value = true;
};

// 看板数据：初始为空/0，仅展示后端数据库（Production/Abnormal/Achieve/AchievementRate/Warehouse）返回的数据
const dashboardData = ref({
    dailyProduction: 0,
    plannedProduction: 0,
    completionRate: 0,
    dailyProductionData: [] as { name: string; value: number; color: string }[],
    accumulatedProduction: 0,
    accumulatedProducts: [] as { name: string; value: number; color: string }[],
    rawMaterialIn: 0,
    rawMaterialInMonthly: 0,
    finishedProductIn: 0,
    finishedProductInMonthly: 0,
    finishedProductOut: 0,
    finishedProductOutMonthly: 0,
    defectDistribution: [] as { level: string; value: number; color: string }[],
    inProduction: 0,
    unproduced: 0,
    nonConforming: 0,
    achievementRate: 0,
    qualificationRate: 0,
    equipmentStatus: [
        { name: '关键设备', total: 0, online: 0, utilization: 0, iconComponent: RobotOutlined },
        { name: '加工设备', total: 0, online: 0, utilization: 0, iconComponent: ToolOutlined },
        { name: '环境设备', total: 0, online: 0, utilization: 0, iconComponent: CloudOutlined },
    ],
    rawMaterialLossRate: 0,
    rawMaterialWarning: 0,
    rawMaterialStock: 0,
    rawMaterialStockChange: 0,
    rawMaterialInbound: 0,
    rawMaterialInboundChange: 0,
    finishedProductInbound: 0,
    finishedProductInboundChange: 0,
    finishedProductOutbound: 0,
    finishedProductOutboundChange: 0,
    productionProgress: [] as {
        orderNumber: string;
        productName: string;
        dailyProduction: number;
        totalOrder: number;
        progress: number;
        dueDate: string;
    }[],
    alarms: [] as { message: string; time: string }[],
});

// 是否已从数据库接口拉取过看板数据（用于显示加载态）
const dataBoardLoaded = ref(false);

// 图表引用
const dailyProductionChart = ref<HTMLElement>();
const accumulatedChart = ref<HTMLElement>();
const defectChart = ref<HTMLElement>();
const factory3dRef = ref<HTMLElement>();

let dailyChartInstance: echarts.ECharts | null = null;
let accumulatedChartInstance: echarts.ECharts | null = null;
let defectChartInstance: echarts.ECharts | null = null;

// 工厂 3D
let factory3dRenderer: THREE.WebGLRenderer | null = null;
let factory3dScene: THREE.Scene | null = null;
let factory3dCamera: THREE.OrthographicCamera | null = null;
let factory3dControls: OrbitControls | null = null;
let factory3dLabelRenderer: CSS2DRenderer | null = null;
let factory3dRafId: number | null = null;

// 实时数据双轨：WebSocket 优先，失败则回退 SSE
let dashboardSocket: WebSocket | null = null;
let eventSource: EventSource | null = null;
let realtimeReconnectTimer: ReturnType<typeof setTimeout> | null = null;
let wsOpenTimeout: ReturnType<typeof setTimeout> | null = null;

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
        dailyChartInstance = echarts.init(dailyProductionChart.value, null, {
            width: 160,
            height: 160,
        });
        const data = dashboardData.value.dailyProductionData;
        const maxValue = data.length ? Math.max(...data.map(item => item.value)) : 1;

        // 创建4个同心圆环，每个环显示一个产品的进度（无数据时为空）
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
                    show: true,
                    position: 'left',
                    formatter: item.name,
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 400,
                    distance: 10,
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
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c} ({d}%)',
                backgroundColor: 'rgba(5, 15, 30, 0.95)',
                borderColor: 'rgba(79, 195, 247, 0.5)',
                borderWidth: 1,
                textStyle: {
                    color: '#ffffff',
                },
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
        accumulatedChartInstance = echarts.init(accumulatedChart.value, null, {
            width: 140,
            height: 140,
        });
        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c} ({d}%)',
                backgroundColor: 'rgba(5, 15, 30, 0.95)',
                borderColor: 'rgba(79, 195, 247, 0.5)',
                borderWidth: 1,
                textStyle: {
                    color: '#ffffff',
                },
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
        defectChartInstance = echarts.init(defectChart.value, null, {
            width: 160,
            height: 160,
        });
        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c} ({d}%)',
                backgroundColor: 'rgba(5, 15, 30, 0.95)',
                borderColor: 'rgba(79, 195, 247, 0.5)',
                borderWidth: 1,
                textStyle: {
                    color: '#ffffff',
                },
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

const GLB_URL = '/工厂3d模型.glb';

function createWorkshopMarker(key: WorkshopKey, position: THREE.Vector3) {
    const el = document.createElement('div');
    el.className = 'factory-workshop-marker';
    el.textContent = String(key);
    el.title = workshopMap[key].name;
    // 标签 DOM 放在 2D 层上，需要允许点击，同时不影响 OrbitControls
    el.style.pointerEvents = 'auto';
    el.addEventListener('pointerdown', e => e.stopPropagation());
    el.addEventListener('click', e => {
        e.stopPropagation();
        openWorkshopDrawer(key);
    });
    const label = new CSS2DObject(el);
    label.position.copy(position);
    return label;
}

function initFactory3d() {
    const el = factory3dRef.value;
    if (!el || el.offsetWidth <= 0) return;

    const w = el.offsetWidth;
    const viewH = Math.max(el.offsetHeight, 400);
    const aspect = w / viewH;

    const camera = new THREE.OrthographicCamera(-100 * aspect, 100 * aspect, 100, -100, 0.1, 1000);
    camera.position.set(80, 60, 80);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    const scene = new THREE.Scene();
    // 让 Three.js 背景透明，由外层容器负责整体配色
    scene.background = null;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    // 正确的颜色空间 + 色调映射，让 GLB 原始颜色更接近“实物”
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // 让蓝色更“亮且干净”，贴近截图的观感
    renderer.toneMappingExposure = 1.12;
    renderer.setSize(w, viewH);
    // 限制像素比，减轻首屏 GPU 开销
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    el.innerHTML = '';
    el.appendChild(renderer.domElement);

    // 2D 标签渲染器（序号标注）
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(w, viewH);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.left = '0';
    labelRenderer.domElement.style.width = '100%';
    labelRenderer.domElement.style.height = '100%';
    // 需要支持点击序号，所以这一层必须接收事件
    labelRenderer.domElement.style.pointerEvents = 'auto';
    labelRenderer.domElement.style.zIndex = '10';
    el.appendChild(labelRenderer.domElement);

    // 添加光源（实心建筑需要充足光照）
    // 取自截图的冷色调：主体更蓝，高光更青
    const hemiLight = new THREE.HemisphereLight(0xaadfff, 0x2b2f35, 0.75);
    hemiLight.position.set(0, 80, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.05);
    keyLight.position.set(80, 90, 60);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x64d9ff, 0.55);
    fillLight.position.set(-90, 40, -80);
    scene.add(fillLight);

    // 背后加一盏“轮廓光”，让边缘更接近青色描边效果（不改模型材质）
    const rimLight = new THREE.DirectionalLight(0x46c7ff, 0.45);
    rimLight.position.set(-20, 30, 120);
    scene.add(rimLight);

    // 绑定到 2D 标签层：拖拽旋转/缩放不受 overlay 影响；marker 自己 stopPropagation
    const controls = new OrbitControls(camera, labelRenderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 30;
    controls.maxDistance = 200;
    controls.target.set(0, 0, 0);

    factory3dRenderer = renderer;
    factory3dScene = scene;
    factory3dCamera = camera;
    factory3dControls = controls;
    factory3dLabelRenderer = labelRenderer;

    const loader = new GLTFLoader();
    loader.load(
        GLB_URL,
        (gltf: { scene: THREE.Group }) => {
            const model = gltf.scene;

            // 使用模型自带材质/贴图（还原“模型本身颜色”），仅确保不透明并开启正确更新
            model.traverse((child: THREE.Object3D) => {
                const mesh = child as THREE.Mesh;
                if (mesh.isMesh && mesh.geometry && mesh.material) {
                    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                    materials.forEach((mat: THREE.Material) => {
                        // 避免上一次“线框/透明”改动导致的发黑/缺失
                        if ('opacity' in mat) (mat as THREE.Material & { opacity?: number }).opacity = 1;
                        if ('transparent' in mat)
                            (mat as THREE.Material & { transparent?: boolean }).transparent = false;
                        mat.needsUpdate = true;
                    });
                }
            });

            scene.add(model);

            const box = new THREE.Box3().setFromObject(model);
            const center = new THREE.Vector3();
            const size = new THREE.Vector3();
            box.getCenter(center);
            box.getSize(size);
            model.position.sub(center);

            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = maxDim > 0 ? 80 / maxDim : 1;
            model.scale.setScalar(scale);

            // 车间序号（1~5）：贴在模型表面（raycast 从上往下命中表面）
            const box2 = new THREE.Box3().setFromObject(model);
            const size2 = new THREE.Vector3();
            box2.getSize(size2);
            const min = box2.min;
            const max = box2.max;
            const rayStartY = max.y + size2.y * 0.2;
            const rayEpsilon = Math.max(size2.y * 0.002, 0.02);
            const raycaster = new THREE.Raycaster();
            const down = new THREE.Vector3(0, -1, 0);

            const hitTargets: THREE.Object3D[] = [];
            model.traverse(obj => {
                if ((obj as THREE.Mesh).isMesh) hitTargets.push(obj);
            });

            function placeMarkerOnSurface(key: WorkshopKey, x: number, z: number) {
                raycaster.set(new THREE.Vector3(x, rayStartY, z), down);
                const hits = raycaster.intersectObjects(hitTargets, true);
                if (hits.length > 0) {
                    const hit = hits[0];
                    if (!hit) return;
                    const p = hit.point.clone();
                    if (hit.face?.normal) {
                        const n = hit.face.normal.clone().transformDirection((hit.object as THREE.Mesh).matrixWorld);
                        p.addScaledVector(n, rayEpsilon);
                    } else {
                        p.y += rayEpsilon;
                    }
                    scene.add(createWorkshopMarker(key, p));
                    return;
                }
                scene.add(createWorkshopMarker(key, new THREE.Vector3(x, max.y + rayEpsilon, z)));
            }

            const markerPositions: Record<WorkshopKey, THREE.Vector3> = {
                1: new THREE.Vector3(min.x + size2.x * 0.28, 0, min.z + size2.z * 0.22),
                2: new THREE.Vector3(min.x + size2.x * 0.3, 0, max.z - size2.z * 0.22),
                3: new THREE.Vector3(max.x - size2.x * 0.22, 0, min.z + size2.z * 0.2),
                4: new THREE.Vector3(max.x - size2.x * 0.22, 0, min.z + size2.z * 0.55),
                5: new THREE.Vector3(max.x - size2.x * 0.22, 0, max.z - size2.z * 0.22),
            };
            (Object.keys(markerPositions) as unknown as WorkshopKey[]).forEach(k => {
                const p = markerPositions[k];
                placeMarkerOnSurface(k, p.x, p.z);
            });

            controls.target.set(0, 0, 0);
            const d = Math.max(size.x, size.z) * scale * 0.8;
            camera.position.set(d, d * 0.8, d);
            camera.lookAt(0, 0, 0);
        },
        undefined,
        () => {
            // 加载失败时保留空场景
        }
    );

    function animate() {
        factory3dRafId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
    }
    animate();
}

function disposeFactory3d() {
    if (factory3dRafId != null) {
        cancelAnimationFrame(factory3dRafId);
        factory3dRafId = null;
    }
    factory3dControls?.dispose();
    factory3dControls = null;
    if (factory3dLabelRenderer) {
        factory3dLabelRenderer.domElement?.remove();
        factory3dLabelRenderer = null;
    }
    factory3dScene?.traverse((obj: THREE.Object3D) => {
        const o = obj as THREE.Mesh & { material?: THREE.Material | THREE.Material[] };
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
            Array.isArray(o.material)
                ? (o.material as THREE.Material[]).forEach((m: THREE.Material) => m.dispose())
                : (o.material as THREE.Material).dispose();
        }
    });
    factory3dScene?.clear();
    factory3dScene = null;
    factory3dCamera = null;
    if (factory3dRenderer) {
        factory3dRenderer.domElement?.remove();
        factory3dRenderer.dispose();
        factory3dRenderer = null;
    }
}

// 窗口大小改变时重新调整图表
const handleResize = () => {
    if (dailyChartInstance) dailyChartInstance.resize();
    if (accumulatedChartInstance) accumulatedChartInstance.resize();
    if (defectChartInstance) defectChartInstance.resize();
    if (factory3dRef.value && factory3dRenderer && factory3dCamera) {
        const w = factory3dRef.value.offsetWidth;
        const h = Math.max(factory3dRef.value.offsetHeight, 400);
        const aspect = w / h;
        factory3dCamera.left = -100 * aspect;
        factory3dCamera.right = 100 * aspect;
        factory3dCamera.top = 100;
        factory3dCamera.bottom = -100;
        factory3dCamera.updateProjectionMatrix();
        factory3dRenderer.setSize(w, h);
        factory3dLabelRenderer?.setSize(w, h);
    }
};

// 在浏览器空闲时再初始化 3D，避免阻塞首屏渲染
const scheduleFactory3dInit = () => {
    const anyWindow = window as typeof window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void;
    };
    if (anyWindow.requestIdleCallback) {
        anyWindow.requestIdleCallback(
            () => {
                initFactory3d();
            },
            { timeout: 2000 }
        );
    } else {
        // 兼容不支持 requestIdleCallback 的浏览器：延后一点再初始化
        setTimeout(() => initFactory3d(), 600);
    }
};

// 刷新图表（SSE 推送后调用，数据已写入 dashboardData）
const refreshDataBoardCharts = () => {
    nextTick(() => {
        initDailyProductionChart();
        initAccumulatedChart();
        initDefectChart();
    });
};

// 应用实时推送数据并刷新图表
const applyRealtimePayload = (raw: string) => {
    try {
        const data = JSON.parse(raw);
        applyDataBoardPayload(data);
        refreshDataBoardCharts();
    } catch {
        // 解析失败忽略
    }
};

// 初始化 WebSocket（双轨优先）
const initWebSocket = () => {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = location.host;
    const path = '/dashboard-ws';
    const token = localStorage.getItem('access_token');
    const wsUrl = token
        ? `${protocol}//${host}${path}?token=${encodeURIComponent(token)}`
        : `${protocol}//${host}${path}`;
    try {
        dashboardSocket = new WebSocket(wsUrl);
        wsOpenTimeout = window.setTimeout(() => {
            wsOpenTimeout = null;
            if (dashboardSocket && dashboardSocket.readyState !== WebSocket.OPEN) {
                dashboardSocket.close();
                dashboardSocket = null;
                initSSE();
            }
        }, 2000);
        dashboardSocket.onopen = () => {
            if (wsOpenTimeout) {
                clearTimeout(wsOpenTimeout);
                wsOpenTimeout = null;
            }
        };
        dashboardSocket.onmessage = ev => applyRealtimePayload(ev.data);
        dashboardSocket.onclose = () => {
            if (wsOpenTimeout) {
                clearTimeout(wsOpenTimeout);
                wsOpenTimeout = null;
            }
            dashboardSocket = null;
            realtimeReconnectTimer = setTimeout(() => initRealtime(), 3000);
        };
        dashboardSocket.onerror = () => {
            if (dashboardSocket) {
                dashboardSocket.close();
                dashboardSocket = null;
            }
            realtimeReconnectTimer = setTimeout(() => initRealtime(), 3000);
        };
    } catch {
        initSSE();
    }
};

// 初始化 SSE（双轨回退）
const initSSE = () => {
    const raw = localStorage.getItem('access_token');
    // 后端 query.token 会再拼成 Bearer xxx，这里只传裸 JWT，避免 401
    const token = raw ? raw.replace(/^Bearer\s+/i, '') : '';
    const sseUrl = token ? `/dashboard/data-sse?token=${encodeURIComponent(token)}` : '/dashboard/data-sse';
    try {
        eventSource = new EventSource(sseUrl);
        eventSource.onmessage = ev => applyRealtimePayload(ev.data);
        eventSource.onerror = () => {
            if (eventSource) {
                eventSource.close();
                eventSource = null;
                realtimeReconnectTimer = setTimeout(() => initRealtime(), 3000);
            }
        };
    } catch {
        // SSE 不可用时仅用已有数据
    }
};

// 双轨：优先 WebSocket，失败则 SSE
const initRealtime = () => {
    if (realtimeReconnectTimer) {
        clearTimeout(realtimeReconnectTimer);
        realtimeReconnectTimer = null;
    }
    if (dashboardSocket) {
        dashboardSocket.close();
        dashboardSocket = null;
    }
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }
    initWebSocket();
};

onMounted(async () => {
    updateTime();
    setInterval(updateTime, 1000);

    // 先拉取看板初始数据（来自数据库），再初始化图表与 SSE
    try {
        const res = await apiFetch<{ success: boolean; data: Record<string, unknown> }>('/dashboard/data');
        if (res?.success && res.data) {
            applyDataBoardPayload(res.data);
        } else {
            dataBoardLoaded.value = true;
        }
    } catch {
        // 接口失败时保持 0/空，仅标记已尝试加载
        dataBoardLoaded.value = true;
    }

    nextTick(() => {
        initAllCharts();
        scheduleFactory3dInit();
    });
    window.addEventListener('resize', handleResize);
    initRealtime();
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);

    if (realtimeReconnectTimer) {
        clearTimeout(realtimeReconnectTimer);
        realtimeReconnectTimer = null;
    }
    if (wsOpenTimeout) {
        clearTimeout(wsOpenTimeout);
        wsOpenTimeout = null;
    }
    if (dashboardSocket) {
        dashboardSocket.close();
        dashboardSocket = null;
    }
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }

    disposeFactory3d();

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
    background: radial-gradient(circle at top, #0f1b3a 0, #050814 60%, #020410 100%);
    min-height: 100vh;
    width: 100%;
    padding: 16px;
    color: #ffffff;
    position: relative;
    overflow-x: hidden;
    font-family:
        -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.back-home-btn {
    position: absolute;
    left: 16px;
    top: 14px;
    z-index: 60;
    height: 34px;
    padding: 0 12px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: rgba(230, 250, 255, 0.92);
    background: rgba(5, 15, 30, 0.65);
    border: 1px solid rgba(79, 195, 247, 0.35);
    box-shadow:
        0 0 12px rgba(79, 195, 247, 0.14),
        inset 0 0 18px rgba(79, 195, 247, 0.06);
    border-radius: 8px;
    pointer-events: auto;
}

.back-home-btn:hover {
    color: #ffffff;
    border-color: rgba(79, 195, 247, 0.65);
    background: rgba(5, 15, 30, 0.78);
    box-shadow:
        0 0 14px rgba(79, 195, 247, 0.22),
        inset 0 0 18px rgba(79, 195, 247, 0.08);
}

.back-home-btn :deep(svg) {
    font-size: 16px;
}

.dashboard-header {
    position: relative;
    padding: 12px 0;
    margin-bottom: 12px;
    text-align: center;
}

.dashboard-loading {
    position: absolute;
    left: 50%;
    bottom: -8px;
    transform: translateX(-50%);
    font-size: 12px;
    color: rgba(79, 195, 247, 0.85);
}

.dashboard-title {
    font-size: 42px;
    font-weight: 700;
    color: #4fc3f7;
    margin: 0;
    letter-spacing: 4px;
    text-align: center;
    display: inline-block;
    text-shadow:
        0 0 15px rgba(79, 195, 247, 0.8),
        0 0 30px rgba(79, 195, 247, 0.5),
        0 0 45px rgba(79, 195, 247, 0.3);
    position: relative;
}

.dashboard-title::before,
.dashboard-title::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 60px;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(79, 195, 247, 0.6), transparent);
    transform: translateY(-50%);
}

.dashboard-title::before {
    left: calc(50% - 200px);
}

.dashboard-title::after {
    right: calc(50% - 200px);
}

.current-time {
    font-size: 15px;
    color: #ffffff;
    font-family: 'Courier New', monospace;
    font-weight: 400;
    white-space: nowrap;
    opacity: 0.9;
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
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
    background: rgb(1, 47, 82);
    border: none;
    border-radius: 2px;
    padding: 14px;
    box-shadow:
        0 0 10px rgba(79, 195, 247, 0.1),
        inset 0 0 20px rgba(79, 195, 247, 0.05);
}

.card-title {
    color: #ffffff;
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 12px;
    letter-spacing: 0.5px;
    opacity: 0.9;
}

.progress-card .card-title {
    text-align: center;
    color: rgba(210, 245, 255, 0.95);
    font-weight: 600;
    letter-spacing: 1px;
    position: relative;
    margin-bottom: 10px;
}

.progress-card .card-title::before,
.progress-card .card-title::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 120px;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(79, 195, 247, 0.55), transparent);
    transform: translateY(-50%);
}

.progress-card .card-title::before {
    left: 18px;
}

.progress-card .card-title::after {
    right: 18px;
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
    gap: 2px;
    margin: 8px 0;
    max-width: 100%;
    overflow: hidden;
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 0;
    box-shadow: none;
}

.digit-panel {
    flex: 1;
    min-width: 0;
    background: rgba(10, 20, 40, 0.95);
    border: 1px solid rgba(79, 195, 247, 0.3);
    padding: 10px 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow:
        inset 0 0 8px rgba(0, 0, 0, 0.5),
        0 0 4px rgba(79, 195, 247, 0.2);
}

.digit-panel:last-child {
    border-right: 1px solid rgba(79, 195, 247, 0.3);
}

.digit-value {
    font-family: 'Courier New', 'Consolas', monospace;
    font-size: 36px;
    font-weight: 700;
    color: #4fc3f7;
    line-height: 1;
    display: block;
    letter-spacing: 0;
    text-shadow:
        0 0 8px rgba(79, 195, 247, 0.8),
        0 0 16px rgba(79, 195, 247, 0.4);
}

.accumulated-display .digit-panel {
    background: rgba(5, 15, 30, 0.95);
    border: 1px solid rgba(79, 195, 247, 0.2);
    box-shadow:
        inset 0 0 8px rgba(0, 0, 0, 0.6),
        0 0 4px rgba(79, 195, 247, 0.15);
}

.accumulated-digit {
    color: #ffc107;
    text-shadow:
        0 0 8px rgba(255, 193, 7, 0.8),
        0 0 16px rgba(255, 193, 7, 0.4);
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
    opacity: 0.75;
}

.info-value {
    color: #4fc3f7;
    font-size: 20px;
    font-weight: 600;
}

.progress-value {
    color: #4fc3f7;
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
    background: transparent;
    border: none;
    border-radius: 8px;
    padding: 10px;
    box-shadow: none;
    display: flex;
    align-items: center;
    justify-content: center;
}

.chart-container canvas {
    display: block !important;
    border-radius: 4px;
    width: 100% !important;
    height: 100% !important;
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
    background: transparent;
    border: none;
    border-radius: 8px;
    padding: 10px;
    box-shadow: none;
    display: flex;
    align-items: center;
    justify-content: center;
}

.chart-container-small canvas {
    display: block !important;
    border-radius: 4px;
    width: 100% !important;
    height: 100% !important;
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
    padding: 6px 8px;
    background: rgba(20, 30, 50, 0.8);
    border-radius: 3px;
    border: none;
}

.product-bar {
    height: 16px;
    border-radius: 2px;
    flex-shrink: 0;
    min-width: 40px;
}

.product-name {
    color: #ffffff;
    opacity: 0.8;
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
    background: rgba(20, 30, 50, 0.8);
    border-radius: 4px;
    border: none;
    box-shadow:
        inset 0 0 10px rgba(79, 195, 247, 0.08),
        0 0 5px rgba(79, 195, 247, 0.05);
}

.in-out-label {
    color: #ffffff;
    font-size: 13px;
    opacity: 0.8;
}

.in-out-value {
    color: #4fc3f7;
    font-size: 28px;
    font-weight: 700;
}

.in-out-monthly {
    color: #ffffff;
    font-size: 11px;
    opacity: 0.65;
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
    padding: 6px 10px;
    background: rgba(20, 30, 50, 0.8);
    border-radius: 3px;
    border: none;
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
    opacity: 0.85;
}

.defect-value {
    color: #ff9800;
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
    gap: 40px;
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 12px 0 14px;
    margin-bottom: 12px;
    width: 100%;
    box-shadow: none;
}

.kpi-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 0;
    background: transparent;
    border-radius: 0;
    border: none;
}

.kpi-value {
    font-size: 38px;
    font-weight: 700;
    color: #35d7ff;
    line-height: 1;
    letter-spacing: 1px;
    text-shadow:
        0 0 8px rgba(79, 195, 247, 0.7),
        0 0 16px rgba(79, 195, 247, 0.35);
}

.kpi-label {
    font-size: 13px;
    color: rgba(185, 235, 255, 0.9);
    opacity: 0.9;
    font-weight: 400;
    margin-top: 0;
    letter-spacing: 0.5px;
}

.factory-diagram {
    /* 与整体页面统一的深色渐变背景，由 Three.js 透明画布叠加其上 */
    background: radial-gradient(circle at center, rgba(30, 55, 110, 0.9) 0, rgba(5, 10, 28, 0.98) 70%);
    border: none;
    border-radius: 2px;
    padding: 0;
    min-height: 500px;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    box-shadow:
        0 0 15px rgba(79, 195, 247, 0.15),
        inset 0 0 30px rgba(79, 195, 247, 0.08);
}

.factory-3d-canvas {
    width: 100%;
    height: 100%;
    min-height: 500px;
    display: block;
    position: relative;
}

.factory-3d-canvas canvas {
    display: block;
}

.factory-side-panel {
    position: absolute;
    top: 12px;
    right: 12px;
    bottom: 12px;
    width: 360px;
    background: rgba(11, 22, 35, 0.92);
    border: 1px solid rgba(79, 195, 247, 0.35);
    box-shadow:
        0 0 18px rgba(79, 195, 247, 0.18),
        inset 0 0 22px rgba(79, 195, 247, 0.08);
    border-radius: 8px;
    z-index: 20;
    overflow: hidden;
    pointer-events: auto;
}

.factory-side-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 14px 10px;
    border-bottom: 1px solid rgba(79, 195, 247, 0.25);
}

.factory-side-title {
    color: rgba(116, 232, 255, 0.95);
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-shadow: 0 0 10px rgba(79, 195, 247, 0.35);
}

.factory-side-close {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid rgba(79, 195, 247, 0.35);
    background: rgba(0, 0, 0, 0.25);
    color: rgba(255, 255, 255, 0.85);
    cursor: pointer;
    line-height: 26px;
    text-align: center;
    padding: 0;
}

.factory-side-close:hover {
    border-color: rgba(79, 195, 247, 0.6);
    box-shadow: 0 0 10px rgba(79, 195, 247, 0.25);
}

.factory-side-content {
    padding: 12px 14px 14px;
    height: calc(100% - 54px);
    overflow: auto;
}

.factory-side-section {
    padding: 12px 10px;
    border-left: 3px solid rgba(79, 195, 247, 0.55);
    background: rgba(7, 14, 24, 0.55);
    border-radius: 6px;
    margin-bottom: 10px;
}

.factory-side-label {
    color: rgba(79, 195, 247, 0.95);
    font-weight: 700;
    font-size: 13px;
    margin-bottom: 6px;
}

.factory-side-value {
    color: rgba(230, 250, 255, 0.88);
    font-size: 13px;
    line-height: 1.6;
}

.factory-workshop-marker {
    width: 30px;
    height: 30px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.78);
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(79, 195, 247, 0.7);
    box-shadow:
        0 0 0 2px rgba(0, 0, 0, 0.15),
        0 0 12px rgba(79, 195, 247, 0.35);
    cursor: pointer;
    user-select: none;
}

.factory-workshop-marker:hover {
    transform: scale(1.06);
    box-shadow:
        0 0 0 2px rgba(0, 0, 0, 0.15),
        0 0 16px rgba(79, 195, 247, 0.55);
}

.workshop-drawer-body {
    color: rgba(255, 255, 255, 0.88);
}

.workshop-drawer-title {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 10px;
}

.workshop-drawer-list {
    padding-left: 18px;
    margin: 0;
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
    background: rgba(20, 30, 50, 0.9);
    padding: 6px 16px;
    border-radius: 4px;
    border: none;
    box-shadow:
        inset 0 0 10px rgba(79, 195, 247, 0.1),
        0 0 8px rgba(79, 195, 247, 0.15);
}

.equipment-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}

.equipment-panel {
    background: rgba(20, 30, 50, 0.9);
    border: none;
    border-radius: 2px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    box-shadow:
        inset 0 0 15px rgba(79, 195, 247, 0.1),
        0 0 8px rgba(79, 195, 247, 0.08);
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
    opacity: 0.85;
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
    opacity: 0.75;
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
    background: rgba(20, 30, 50, 0.9);
    border: none;
    border-radius: 2px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
    box-shadow:
        inset 0 0 15px rgba(79, 195, 247, 0.1),
        0 0 8px rgba(79, 195, 247, 0.08);
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
    opacity: 0.8;
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
    opacity: 0.7;
}

.warehouse-progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(20, 30, 50, 0.8);
    border: none;
    border-radius: 4px;
    overflow: hidden;
    margin-top: 4px;
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
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
    background: rgba(20, 30, 50, 0.9);
    border-bottom: none;
    box-shadow: inset 0 0 10px rgba(79, 195, 247, 0.1);
}

.progress-table th,
.progress-table td {
    padding: 8px;
    text-align: left;
    border-bottom: none;
}

.progress-table tbody tr {
    background: rgba(20, 30, 50, 0.8);
}

.progress-table tbody tr:hover {
    background: rgba(79, 195, 247, 0.1);
    box-shadow: inset 0 0 10px rgba(79, 195, 247, 0.15);
}

.progress-table th {
    color: #4fc3f7;
    font-weight: 600;
    font-size: 12px;
    padding: 8px 6px;
    opacity: 0.95;
}

.progress-table td {
    color: rgba(185, 235, 255, 0.92);
    font-size: 12px;
    padding: 8px 6px;
    font-weight: 400;
    opacity: 1;
}

.table-progress {
    position: relative;
    width: 100%;
    height: 20px;
    background: rgba(20, 30, 50, 0.8);
    border: none;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.3);
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
    background: rgba(20, 30, 50, 0.9);
    border: none;
    border-left: 3px solid #ff9800;
    border-radius: 2px;
    margin-bottom: 8px;
    box-shadow:
        inset 0 0 10px rgba(255, 152, 0, 0.15),
        0 0 8px rgba(255, 152, 0, 0.1);
}

.alarm-item:last-child {
    margin-bottom: 0;
}

.alarm-content {
    color: #ffffff;
    font-size: 14px;
    margin-bottom: 4px;
    opacity: 0.95;
}

.alarm-time {
    color: #ffffff;
    font-size: 12px;
    opacity: 0.65;
}
</style>
