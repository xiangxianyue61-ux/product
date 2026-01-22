<script setup lang="ts">
console.log('test'); // 若配置了 'no-console': 'warn'，会出现警告
const unusedVar = 'test'; // 若配置了 '@typescript-eslint/no-unused-vars': 'warn'，会出现警告
const test: any = 1;
</script>

<template></template>

<style scoped></style>
