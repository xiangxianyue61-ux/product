# ImportExportBar 通用导入导出组件

在需要「导入 / 导出（图片 / 表格 / 文本）」的列表页中直接使用本组件，可复用逻辑、减少重复代码。

## 使用方式

1. 在模板中放入组件（通常放在操作按钮区域）：

```vue
<ImportExportBar
    :import-headers="IMPORT_HEADERS"
    :import-header-keys="[...IMPORT_HEADER_KEYS]"
    template-filename="销售订单导入模板"
    template-example-row="XSDD0000001,示例客户,示例产品,2025.10.01,100,普通,刘超,2025.04.24 14:00:00"
    export-filename-prefix="销售订单"
    :export-headers="IMPORT_HEADERS"
    :get-export-data="getExportData"
    :get-export-row-values="(row: unknown) => getExportRowValues(row as YourRowType)"
    :on-import-submit="submitImport"
/>
```

2. 在 script 中定义并传入：

- **IMPORT_HEADERS**：表头显示名数组（与 headerKeys 顺序一致）
- **IMPORT_HEADER_KEYS**：字段 key 数组，若为 `as const` 则传 `[...IMPORT_HEADER_KEYS]`
- **templateFilename**：下载的模板文件名（不含 .csv）
- **templateExampleRow**：模板中的示例数据行（CSV 一行字符串，可选）
- **exportFilenamePrefix**：导出文件名前缀（如「销售订单」→ 销售订单.csv / 销售订单.png）
- **exportHeaders**：导出列名，一般与 IMPORT_HEADERS 相同
- **getExportData**：`() => tableData.value` 或 `() => yourListRef.value`，返回当前要导出的数据数组
- **getExportRowValues**：`(row) => [row.a, row.b, ...]`，将一行转为与 exportHeaders 顺序一致的值数组
- **onImportSubmit**：`async (rows: Record<string, string>[]) => { ... }`，确认导入时调用：循环 POST、`await loadData()`、`message.success/warning`

3. 参考示例页面：

- `views/planning-management/SalesOrder.vue`
- `views/process-management/ProcessModel.vue`

底层逻辑在 `composables/useImportExport.ts`，如需在非组件场景复用（如仅用导出），可直接使用该 composable。
