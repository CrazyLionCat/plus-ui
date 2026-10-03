<template>
  <div class="p-2 app-container home-page">
    <el-card shadow="never" class="mb-4">
      <h1>{{ title }}</h1>
      <p class="welcome-text">欢迎使用基础管理工作台。请从菜单进入已授权的功能。</p>
    </el-card>
    <el-row :gutter="16">
      <el-col v-for="group in capabilityGroups" :key="group.title" :xs="24" :sm="12" :lg="8" class="mb-4">
        <el-card shadow="never" class="capability-card">
          <template #header>
            <h2>{{ group.title }}</h2>
          </template>
          <ul>
            <li v-for="item in group.items" :key="item">{{ item }}</li>
          </ul>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="Index" lang="ts">
const title = import.meta.env.VITE_APP_TITLE;
const capabilityGroups = [
  { title: '组织与权限', items: ['用户、部门、岗位', '角色、菜单与数据权限', '客户端管理'] },
  { title: '基础管理', items: ['字典与参数配置', '通知公告与系统消息', '文件管理与 OSS 配置'] },
  { title: '审计与个人中心', items: ['操作日志与登录日志', '在线用户与缓存管理', '个人资料、头像与密码'] }
];
</script>

<style lang="scss" scoped>
.home-page {
  h1 {
    margin: 0 0 12px;
    font-size: 24px;
    color: var(--app-text-title);
  }
  h2 {
    margin: 0;
    font-size: 16px;
  }
  .welcome-text {
    margin: 0;
    color: var(--app-text-muted);
  }
  .capability-card {
    height: 100%;
  }
  ul {
    margin: 0;
    padding-left: 20px;
    line-height: 2;
    color: var(--app-text-muted);
  }
}
</style>
