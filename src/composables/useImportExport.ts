/**
 * 通用导入导出 Composable
 * 提供：CSV 解析、下载模板、导入预览状态、导出为图片/表格/文本
 */
import { ref, type Ref } from 'vue';
import { message } from 'ant-design-vue';

/** 解析后的单行（键为 importHeaderKeys） */
export type ParsedImportRow = Record<string, string>;

/** 导入配置 */
export interface ImportConfig {
    /** 表头显示名（与 importHeaderKeys 顺序一致） */
    headers: string[];
    /** 字段 key，与 headers 一一对应 */
    headerKeys: string[];
    /** 模板文件名（不含扩展名） */
    templateFilename?: string;
    /** 模板示例行（CSV 一行字符串） */
    templateExampleRow?: string;
}

/** 导出配置 */
export interface ExportConfig {
    /** 导出文件名前缀，如 "销售订单" -> 销售订单.csv / 销售订单.png */
    filenamePrefix: string;
    /** 表头显示名（导出表格/文本的列名，导出图片也用） */
    headers: string[];
    /** 当前要导出的数据源（getter，保证拿到最新） */
    getData: () => unknown[];
    /** 将一行数据转为与 headers 顺序一致的字符串数组 */
    getRowValues: (row: unknown) => (string | number)[];
}

/** 完整配置 */
export interface UseImportExportOptions {
    import: ImportConfig;
    export: ExportConfig;
    /** 用户确认导入时调用，传入解析后的行，返回 Promise。内部会关闭弹窗、清空、可在此内 reload 列表 */
    onImportSubmit: (rows: ParsedImportRow[]) => Promise<void>;
}

/** 预览行：用于在导入预览表格中展示，任意结构 */
export type ImportPreviewRow = Record<string, unknown> & { id?: number | string };

function parseCSV(text: string): string[][] {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    return lines.map(line => {
        const row: string[] = [];
        let cur = '';
        let inQuoted = false;
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') {
                inQuoted = !inQuoted;
            } else if (inQuoted) {
                cur += c;
            } else if (c === ',') {
                row.push(cur.trim());
                cur = '';
            } else {
                cur += c;
            }
        }
        row.push(cur.trim());
        return row;
    });
}

function downloadBlob(filename: string, blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function useImportExport(options: UseImportExportOptions) {
    const { import: importConfig, export: exportConfig, onImportSubmit } = options;

    const importFileRef = ref<HTMLInputElement>() as Ref<HTMLInputElement | undefined>;
    const importModalVisible = ref(false);
    const importPreviewRows = ref<ImportPreviewRow[]>([]);
    const pendingImportRows = ref<ParsedImportRow[]>([]);
    const importing = ref(false);

    const headers = importConfig.headers;
    const headerKeys = importConfig.headerKeys;
    const templateFilename = importConfig.templateFilename ?? '导入模板';
    const templateExampleRow = importConfig.templateExampleRow ?? '';

    /** 下载导入模板 */
    function downloadImportTemplate() {
        const BOM = '\uFEFF';
        const headerRow = headers.join(',');
        const csv = BOM + headerRow + '\n' + (templateExampleRow ? templateExampleRow + '\n' : '');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        downloadBlob(`${templateFilename}.csv`, blob);
        message.success('模板已下载');
    }

    /** 触发选择文件 */
    function handleImport() {
        importFileRef.value?.click();
    }

    /**
     * 将解析后的 rows 转为预览表格用的行（按 headerKeys 顺序，值为字符串）
     * 子组件或调用方若需要自定义预览结构，可自行再包一层
     */
    function parsedToPreviewRows(rows: ParsedImportRow[], limit = 10): ImportPreviewRow[] {
        return rows.slice(0, limit).map((p, i) => {
            const row: ImportPreviewRow = { id: i };
            headerKeys.forEach(k => {
                row[k] = p[k] ?? '-';
            });
            return row;
        });
    }

    /** 文件选择变更：解析 CSV，填充 pending 与 preview，打开弹窗 */
    function onImportFileChange(e: Event, mapToPreviewRow?: (row: ParsedImportRow) => ImportPreviewRow) {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        input.value = '';

        file.text().then(text => {
            const raw = text.replace(/^\uFEFF/, '');
            const rows = parseCSV(raw);
            if (rows.length < 2) {
                message.warning('文件至少需要表头行和一行数据');
                return;
            }
            const headerRow = (rows[0] ?? []).map((h: string) => h.trim());
            const dataRows = rows.slice(1);
            const keyIndex: number[] = [];
            for (const key of headerKeys) {
                const label = headers[headerKeys.indexOf(key)];
                const idx = headerRow.findIndex((h: string) => h === label || h === key);
                keyIndex.push(idx >= 0 ? idx : -1);
            }
            const parsed: ParsedImportRow[] = [];
            for (const row of dataRows) {
                if (row.every((cell: string) => !cell.trim())) continue;
                const obj: ParsedImportRow = {};
                headerKeys.forEach((key, i) => {
                    const idx = keyIndex[i] ?? -1;
                    obj[key] = idx >= 0 && row[idx] !== undefined ? String(row[idx]).trim() : '';
                });
                parsed.push(obj);
            }
            if (parsed.length === 0) {
                message.warning('未解析到有效数据行');
                return;
            }
            pendingImportRows.value = parsed;
            importPreviewRows.value = mapToPreviewRow
                ? parsed.slice(0, 10).map(mapToPreviewRow)
                : parsedToPreviewRows(parsed);
            importModalVisible.value = true;
        });
    }

    /** 确认导入：调用 onImportSubmit，成功后关闭并清空 */
    async function confirmImport() {
        const rows = pendingImportRows.value;
        if (rows.length === 0) return;
        importing.value = true;
        try {
            await onImportSubmit(rows);
            importModalVisible.value = false;
            pendingImportRows.value = [];
            importPreviewRows.value = [];
        } finally {
            importing.value = false;
        }
    }

    const prefix = exportConfig.filenamePrefix;
    const exportHeaders = exportConfig.headers;
    const getData = exportConfig.getData;
    const getRowValues = exportConfig.getRowValues;

    /** 导出为图片 */
    function handleExportImage() {
        const data = getData();
        const cols = exportHeaders;
        const cellW = 100;
        const cellH = 28;
        const canvas = document.createElement('canvas');
        canvas.width = cols.length * cellW;
        canvas.height = cellH * (data.length + 1) + 10;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            message.error('无法创建画布');
            return;
        }
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#d9d9d9';
        ctx.fillStyle = '#000';
        ctx.font = '14px sans-serif';
        ctx.textBaseline = 'middle';
        for (let c = 0; c < cols.length; c++) {
            ctx.strokeRect(c * cellW, 0, cellW, cellH);
            ctx.fillText(cols[c] ?? '', c * cellW + 6, cellH / 2);
        }
        for (let r = 0; r < data.length; r++) {
            const rec = data[r];
            if (rec == null) continue;
            const row = getRowValues(rec).map(String);
            for (let c = 0; c < row.length; c++) {
                ctx.strokeRect(c * cellW, (r + 1) * cellH, cellW, cellH);
                ctx.fillStyle = '#333';
                ctx.fillText(row[c] ?? '', c * cellW + 6, (r + 1) * cellH + cellH / 2);
            }
        }
        canvas.toBlob(
            blob => {
                if (blob) {
                    downloadBlob(`${prefix}.png`, blob);
                    message.success('已导出为图片');
                } else {
                    message.error('导出图片失败');
                }
            },
            'image/png',
            1
        );
    }

    /** 导出为表格（CSV） */
    function handleExportTable() {
        const BOM = '\uFEFF';
        const header = exportHeaders.join(',');
        const data = getData();
        const rows = data
            .map(r =>
                getRowValues(r)
                    .map(cell => (String(cell).includes(',') ? `"${cell}"` : cell))
                    .join(',')
            )
            .join('\n');
        const csv = BOM + header + '\n' + rows;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        downloadBlob(`${prefix}.csv`, blob);
        message.success('已导出为表格');
    }

    /** 导出为文本（制表符分隔） */
    function handleExportText() {
        const header = exportHeaders.join('\t');
        const data = getData();
        const rows = data.map(r => getRowValues(r).join('\t')).join('\n');
        const text = header + '\n' + rows;
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        downloadBlob(`${prefix}.txt`, blob);
        message.success('已导出为文本');
    }

    return {
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
        /** 供预览表格列生成：仅数据列（不含操作列） */
        previewColumns: headerKeys.map(key => ({
            title: headers[headerKeys.indexOf(key)],
            dataIndex: key,
            key,
            width: 120,
        })),
    };
}
