<template>
  <div class="p-2 app-container quant-credential-page">
    <div class="search-wrap">
      <el-card class="search-panel" shadow="hover">
        <template #header>
          <div class="panel-heading">
            <div>
              <span class="panel-kicker">Search Filters</span>
              <h3>筛选条件</h3>
            </div>
          </div>
        </template>
        <el-form :inline="true" :model="query" class="query-form">
          <el-form-item label="账户名称">
            <el-input v-model="query.accountName" clearable placeholder="请输入账户名称" @keyup.enter="load" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="query.status" clearable>
              <el-option label="启用" value="0" />
              <el-option label="停用" value="1" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button icon="Search" type="primary" @click="load">搜索</el-button>
            <el-button icon="Refresh" @click="reset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
    <el-card class="table-panel" shadow="hover">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <span class="panel-kicker">Credential Dataset</span>
            <h3>凭证列表</h3>
            <p>管理 Binance 账户凭证与连接状态。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['quant:credential:add']" icon="Plus" plain type="primary" @click="openAdd">
              新增凭证
            </el-button>
            <right-toolbar :search="false" @query-table="load" />
          </div>
        </div>
      </template>
      <el-table v-loading="loading" :data="rows" border>
        <el-table-column align="center" label="序号" type="index" width="80">
          <template #default="scope">
            <span>{{ (query.pageNum - 1) * query.pageSize + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="账户名称" min-width="120" prop="accountName" />
        <el-table-column align="center" label="所属用户" min-width="100" prop="userName" />
        <el-table-column align="center" label="API Key" min-width="160" prop="maskedApiKey" />
        <el-table-column align="center" label="合约权限" min-width="120" prop="tradePermission">
          <template #default="scope">
            <dict-tag :options="quant_yes_no" :value="scope.row.tradePermission + ''" />
          </template>
        </el-table-column>
        <!--<el-table-column align="center" label="禁止提现" min-width="120" prop="withdrawalDisabled">
          <template #default="scope">
            <dict-tag :options="quant_yes_no" :value="scope.row.withdrawalDisabled + ''" />
          </template>
        </el-table-column>-->
        <el-table-column align="center" label="签名方式" min-width="120" prop="signatureType" />
        <el-table-column align="center" label="运行模式" min-width="120">
          <template #default="scope">
            <dict-tag :options="quant_run_mode" :value="scope.row.runMode" />
          </template>
        </el-table-column>
        <el-table-column align="center" label="连接状态" min-width="120">
          <template #default="scope">
            <dict-tag :options="quant_connection_status" :value="scope.row.connectionStatus" />
          </template>
        </el-table-column>
        <el-table-column align="center" label="状态" prop="status" width="80">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :disabled="scope.row.status === '1' && scope.row.connectionStatus !== 'NORMAL'"
              active-value="0"
              inactive-value="1"
              @change="handleStatusChange(scope.row as CredentialVO)"
            />
          </template>
        </el-table-column>

        <el-table-column align="center" label="最后连接时间" prop="lastConnectTime" width="160" />
        <el-table-column align="center" label="授权时间" prop="createTime" width="160" />
        <el-table-column align="center" fixed="right" label="操作" width="120">
          <template #default="scope">
            <el-tooltip content="验证凭证" placement="top">
              <el-button
                v-hasPermi="['quant:credential:test']"
                icon="Connection"
                link
                type="primary"
                @click="handleTest(scope.row.id)"
              ></el-button>
            </el-tooltip>
            <el-tooltip content="编辑" placement="top">
              <el-button
                v-hasPermi="['quant:credential:edit']"
                icon="Edit"
                link
                type="primary"
                @click="openEdit(scope.row as CredentialVO)"
              ></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button
                v-hasPermi="['quant:credential:remove']"
                icon="Delete"
                link
                type="danger"
                @click="handleDelete(scope.row.id)"
              ></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="total > 0"
        v-model:limit="query.pageSize"
        v-model:page="query.pageNum"
        :total="total"
        @pagination="load"
      />
    </el-card>
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑凭证' : '新增凭证'" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="账户名称" prop="accountName">
          <el-input v-model="form.accountName" />
        </el-form-item>
        <el-form-item label="所属用户" prop="userId">
          <el-select
            v-model="form.userId"
            clearable
            filterable
            placeholder="请选择系统用户"
          >
            <el-option
              v-for="user in users"
              :key="user.userId"
              :label="`${user.nickName}（${user.userName}）`"
              :value="user.userId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="API Key" prop="apiKey">
          <el-input v-model="form.apiKey" :placeholder="form.id ? '留空表示保持原值' : '请输入 API Key'" />
        </el-form-item>
        <el-form-item label="Secret Key" prop="secretKey">
          <el-input
            v-model="form.secretKey"
            :placeholder="form.id ? '留空表示保持原值' : '请输入 Secret Key'"
            show-password
            type="password"
          />
        </el-form-item>
        <el-form-item label="签名方式" prop="signatureType">
          <el-radio-group v-model="form.signatureType">
            <el-radio value="HMAC">HMAC</el-radio>
            <el-radio value="RSA">RSA</el-radio>
            <el-radio value="ED25519">Ed25519</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="运行模式" prop="runMode">
          <el-radio-group v-model="form.runMode">
            <el-radio v-for="dict in quant_run_mode" :key="dict.value" :value="dict.value">
              {{ dict.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-hasPermi="[form.id ? 'quant:credential:edit' : 'quant:credential:add']" type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import type { CredentialForm, CredentialQuery, CredentialVO } from '@/api/quant/types';
import type { UserQuery, UserVO } from '@/api/system/user/types';
import {
  addCredential,
  changeCredentialStatus,
  delCredential,
  listCredential,
  testCredential,
  updateCredential
} from '@/api/quant';
import userApi from '@/api/system/user';
import modal from '@/plugins/modal';
import { useDict } from '@/utils/dict';

const { quant_connection_status, quant_run_mode, quant_yes_no } = toRefs<any>(useDict('quant_connection_status', 'quant_run_mode', 'quant_yes_no'));

const loading = ref(false);
const rows = ref<CredentialVO[]>([]);
const total = ref(0);
const dialogVisible = ref(false);
const formRef = ref<ElFormInstance>();
const users = ref<UserVO[]>([]);
const query = reactive<CredentialQuery>({ pageNum: 1, pageSize: 10, accountName: '', status: '' });
const form = reactive<CredentialForm>({
  userId: undefined,
  accountName: '',
  apiKey: '',
  secretKey: '',
  signatureType: 'HMAC',
  runMode: 'PAPER'
});
const rules = computed(() => ({
  accountName: [{ required: true, message: '请输入账户名称', trigger: 'blur' }],
  userId: [{ required: true, message: '请选择所属用户', trigger: 'change' }],
  apiKey: form.id ? [] : [{ required: true, message: '请输入 API Key', trigger: 'blur' }],
  secretKey: form.id ? [] : [{ required: true, message: '请输入 Secret Key', trigger: 'blur' }],
  signatureType: [{ required: true, message: '请选择签名方式', trigger: 'change' }],
  runMode: [{ required: true, message: '请选择运行模式', trigger: 'change' }]
}));
const load = async () => {
  loading.value = true;
  try {
    const res = await listCredential(query);
    rows.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  } finally {
    loading.value = false;
  }
};
const reset = () => {
  query.pageNum = 1;
  query.accountName = '';
  query.status = '';
  load();
};
const resetForm = () => {
  Object.assign(form, {
    id: undefined,
    userId: undefined,
    accountName: '',
    apiKey: '',
    secretKey: '',
    signatureType: 'HMAC',
    runMode: 'PAPER'
  });
  nextTick(() => formRef.value?.clearValidate());
};
const openAdd = () => {
  resetForm();
  dialogVisible.value = true;
};
const openEdit = (row: CredentialVO) => {
  Object.assign(form, row, { apiKey: '', secretKey: '', userId: row.userId });
  dialogVisible.value = true;
  nextTick(() => formRef.value?.clearValidate());
};
/*const handleUsersChanged = (userIds: Array<number | string>) => {
  const ids = userIds.map(String); // 统一成字符串
  form.userIds = ids;
  form.userId = form.userIds[0];
};*/
const loadUsers = async () => {
  const query: UserQuery = { pageNum: 1, pageSize: 1000, status: '0' };
  const res = await userApi.listUser(query);
  users.value = res.data?.rows || [];
};
const submit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (form.id) await updateCredential(form);
  else await addCredential(form);
  dialogVisible.value = false;
  modal.msgSuccess('保存成功');
  await load();
};
const handleTest = async (id: string) => {
  await testCredential(id);
  modal.msgSuccess('凭证验证成功，账户可正常使用');
  await load();
};
const handleStatusChange = async (row: CredentialVO) => {
  const enabled = row.status === '0';
  try {
    await modal.confirm(`确认${enabled ? '启用' : '停用'}凭证“${row.accountName}”吗？`);
    await changeCredentialStatus(row.id, row.status);
    modal.msgSuccess(`${enabled ? '启用' : '停用'}成功`);
  } catch {
    row.status = enabled ? '1' : '0';
  }
};
const handleDelete = async (id: number) => {
  await modal.confirm('确认删除该凭证吗？');
  await delCredential(id);
  modal.msgSuccess('删除成功');
  await load();
};
onMounted(load);
onMounted(loadUsers);
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.table-crud-page;
</style>
