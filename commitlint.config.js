module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [
            2,
            'always',
            [
                'feature', // 新功能
                'fix', // 修复 bug
                'chore', // 构建/工具/杂项
                'docs', // 文档
                'style', // 样式（不影响功能）
                'refactor', // 重构
                'perf', // 性能优化
                'test', // 测试
            ],
        ],
        'subject-case': [0, 'never', []], // 提示但不强制大小写
    },
};
