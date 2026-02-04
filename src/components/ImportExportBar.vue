<template>
    <a-space>
        <input
            ref="importFileRef"
            type="file"
            accept=".csv,.xlsx,.xls"
            class="hidden"
            @change="e => onImportFileChange(e as Event, mapToPreviewRow)"
        />
        <a-dropdown>
            <a-button @click="() => {}">
                <template #icon>
                    <UploadOutlined />
                </template>
                导入
            </a-button>
            <template #overlay>
                <a-menu>
                    <a-menu-item key="template" @click="downloadImportTemplate">下载导入模板</a-menu-item>
                    <a-menu-item key="file" @click="handleImport">选择文件导入</a-menu-item>
                </a-menu>
            </template>
        </a-dropdown>
        <a-dropdown>
            <a-button @click="() => {}">
                <template #icon>
                    <DownloadOutlined />
                </template>
                导出
            </a-button>
            <template #overlay>
                <a-menu>
                    <a-menu-item key="image" @click="handleExportImage">导出为图片</a-menu-item>
                    <a-menu-item key="table" @click="handleExportTable">导出为表格</a-menu-item>
                    <a-menu-item key="text" @click="handleExportText">导出为文本</a-menu-item>
                </a-menu>
            </template>
        </a-dropdown>

        <a-modal
            v-model:open="importModalVisible"
            title="导入预览"
            width="800px"
            :footer="null"
            @cancel="importModalVisible = false"
        >
            <p class="mb-2 text-gray-600">
                共解析到
                <strong>{{ pendingImportRows.length }}</strong>
                条，将按模板格式写入。以下为前 10 条预览，确认后执行导入。
            </p>
            <a-table
                :columns="previewColumns"
                :data-source="importPreviewRows"
                :pagination="false"
                size="small"
                row-key="id"
            />
            <div class="mt-4 flex justify-end gap-2">
                <a-button @click="importModalVisible = false">取消</a-button>
                <a-button type="primary" :loading="importing" @click="confirmImport">确认导入</a-button>
            </div>
        </a-modal>
    </a-space>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons-vue';
import { useImportExport, type ImportPreviewRow, type ParsedImportRow } from '../composables/useImportExport';

const props = withDefaults(
    defineProps<{
        /** 导入表头显示名，与 headerKeys 顺序一致 */
        importHeaders: string[];
        /** 导入字段 key */
        importHeaderKeys: string[];
        /** 模板文件名（不含扩展名） */
        templateFilename?: string;
        /** 模板示例行（CSV 一行） */
        templateExampleRow?: string;
        /** 导出文件名前缀 */
        exportFilenamePrefix: string;
        /** 导出表头（列名），与 getExportRowValues 顺序一致 */
        exportHeaders: string[];
        /** 获取当前要导出的数据 */
        getExportData: () => unknown[];
        /** 将一行转为导出列值数组 */
        getExportRowValues: (row: unknown) => (string | number)[];
        /** 确认导入时提交，返回 Promise */
        onImportSubmit: (rows: ParsedImportRow[]) => Promise<void>;
        /** 可选：将解析行转为预览表格行，不传则用默认 key 对应展示 */
        mapToPreviewRow?: (row: ParsedImportRow) => ImportPreviewRow;
    }>(),
    {
        templateFilename: '导入模板',
        templateExampleRow: '',
    }
);

const mapToPreviewRow = computed(() => props.mapToPreviewRow);

const {
    importFileRef,
    importModalVisible,
    importPreviewRows,
    pendingImportRows,
    importing,
    downloadImportTemplate,
    handleImport,
    onImportFileChange,
    confirmImport,
    handleExportImage,
    handleExportTable,
    handleExportText,
    previewColumns,
} = useImportExport({
    import: {
        headers: props.importHeaders,
        headerKeys: props.importHeaderKeys,
        templateFilename: props.templateFilename,
        templateExampleRow: props.templateExampleRow,
    },
    export: {
        filenamePrefix: props.exportFilenamePrefix,
        headers: props.exportHeaders,
        getData: props.getExportData,
        getRowValues: props.getExportRowValues,
    },
    onImportSubmit: props.onImportSubmit,
});
</script>

<style scoped>
.hidden {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;
    pointer-events: none;
}
</style>
