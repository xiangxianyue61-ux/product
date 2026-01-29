module.exports = {
  // 常规格式规则（可根据团队调整）
  printWidth: 120, // 每行代码最大长度
  tabWidth: 4, // 缩进 4 个空格
  useTabs: false, // 使用空格而非制表符
  singleQuote: true, // 使用单引号
  semi: true, // 语句末尾加分号
  trailingComma: 'es5', // 尾逗号（ES5 规范：对象/数组最后一项加逗号）
  bracketSpacing: true, // 对象花括号两侧加空格（如 { a: 1 }）
  arrowParens: 'avoid', // 箭头函数参数单个时省略括号（如 (a) => a → a => a）
  endOfLine: 'auto', // 兼容 Windows CRLF / *nix LF
  vueIndentScriptAndStyle: false, // 不缩进 Vue 文件中的 script 和 style 标签
  htmlWhitespaceSensitivity: 'ignore' // 忽略 HTML 空格敏感度
};