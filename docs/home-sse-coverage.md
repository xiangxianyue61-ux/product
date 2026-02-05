# 首页数据与 SSE 实时渲染对照

## 一、已通过 SSE 实时渲染（来自数据库）

| 模块 | 数据源 | 说明 |
|------|--------|------|
| **KPI 卡片（5 个）** | Production / Abnormal / Achieve / AchievementRate | 在生产数量、未生产数量、不合格数量、生产达成率、合格率 |
| **工单统计饼图** | Production | 已完成 / 在生产 / 未生产 |
| **产品统计饼图** | Production | 按产品名称聚合计划数量 |
| **缺陷统计饼图** | Abnormal | 按异常类别聚合 |
| **生产进度表格** | Production | 前 10 条工单进度 |

以上由 `applyDashboardData()` 在初次请求 `/dashboard/overview` 及每次 SSE 推送时更新。

---

## 二、已改为 SSE 实时（工单产出 / 产品合格率）

| 模块 | 数据源 | 说明 |
|------|--------|------|
| **工单产出统计（柱状图）** | Production | 近一年 12 个月按 `plannedStartDate` 聚合 `producedQuantity`，SSE 推送 `workOrderOutputMonthly` |
| **产品合格率（折线图）** | 当前合格率 | 近一年 12 个月用当前合格率填充（与 SSE 一致），SSE 推送 `productQualificationMonthly` |

## 三、仍未通过 SSE 实时渲染（非数据库 / 静态）

| 模块 | 当前数据来源 | 说明 |
|------|--------------|------|
| **我的待办** | 前端写死 | `todoList` 为 ref 初始值，未接接口或 SSE |
| **我发起的** | 前端写死 | `initiatedList` 为 ref 初始值 |
| **我处理的** | 前端写死 | `handledList` 为 ref 初始值 |
| **日历** | 本地状态 | `calendarValue` 仅前端选择，无后端同步 |
| **快捷入口** | 前端写死 | `quickEntries` 为静态配置 |
| **KPI 卡片「本月较上月」** | 前端写死 | `kpi.trend`、`kpi.trendType` 为初始值 0，未随 SSE 或接口更新 |

---

## 四、小结

- **SSE 实时**：5 个 KPI、3 个饼图、1 个生产进度表、工单产出柱状图、产品合格率折线图（数据来自 Production / Abnormal / Achieve / AchievementRate）。
- **非 SSE / 非实时**：我的待办/我发起的/我处理的、日历、快捷入口、KPI 趋势文案。
