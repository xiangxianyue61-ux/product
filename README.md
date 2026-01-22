# 前端开发规范与注意事项（ESLint + Prettier）

## 一、规范目标

本项目统一使用 **ESLint Flat Config + Prettier**
进行代码质量与格式管理，目的在于：

-   统一代码风格，减少无意义 diff
-   提前发现潜在 Bug
-   提升代码可读性与团队协作效率
-   为 CI / Code Review 提供自动化保障

> 所有提交到仓库的代码 **必须通过 ESLint + Prettier 校验**。

------------------------------------------------------------------------

## 二、ESLint 规范说明

### 1. 配置方式

-   使用 `eslint.config.js`（Flat Config）
-   不再使用 `.eslintrc.*`
-   已内置常见忽略目录（`node_modules`、`dist`、`public` 等）

### 2. 通用规则

-   生产环境：
    -   `console` → warning
    -   `debugger` → error
-   开发环境：
    -   允许 `console` 和 `debugger`

### 3. TypeScript 规范

-   禁止滥用 `any`（如必须使用需说明原因）
-   未使用变量会触发 warning
-   以下划线 `_` 开头的参数允许未使用

示例：

``` ts
function fetchData(_unused: string, id: number) {
  return id;
}
```

### 4. Vue 规范

-   允许单词组件名（已关闭 multi-word 限制）
-   `script setup` 中未使用变量会被正确检测
-   推荐使用 `<script setup lang="ts">`

------------------------------------------------------------------------

## 三、Prettier 格式规范

当前 Prettier 关键规则如下：

  规则项          说明
  --------------- -------
  printWidth      120
  tabWidth        2
  singleQuote     true
  semi            true
  trailingComma   es5
  arrowParens     avoid
  endOfLine       lf

### 格式示例

``` ts
const user = {
  name: 'Tom',
  age: 18,
};
```

------------------------------------------------------------------------

## 四、Vue 开发建议

-   使用 Composition API + TypeScript
-   避免超大组件，单文件职责清晰
-   公共逻辑抽离为 `composables`
-   模板中避免复杂逻辑，优先使用 `computed`
-   props / emits 命名需语义明确

------------------------------------------------------------------------

## 五、提交代码前自检清单

-   [ ] ESLint 无 error
-   [ ] Prettier 已格式化
-   [ ] 无无用变量 / import
-   [ ] 无 console / debugger 泄漏
-   [ ] 不影响已有功能

------------------------------------------------------------------------

## 六、推荐开发工作流

1.  拉取最新主分支
2.  新建功能分支
3.  本地开发（开启 ESLint + Prettier 自动修复）
4.  提交前运行 lint
5.  提交信息遵循规范（feat / fix / chore）

------------------------------------------------------------------------

## 七、推荐工具

-   VS Code 插件：
    -   ESLint
    -   Prettier
-   Git Hooks：
    -   husky
    -   lint-staged

------------------------------------------------------------------------

> 本文档作为项目长期开发规范，请所有成员遵循。
