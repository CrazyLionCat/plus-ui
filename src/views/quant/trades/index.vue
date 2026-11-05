<template>
  <div class="p-2 app-container quant-trades-page">
    <div class="p-2 app-container quant-symbol-page">
      <div class="search-wrap">
        <el-card class="search-panel" shadow="hover">
          <template #header>
            <div class="toolbar-shell">
              <div class="table-heading">
                <span class="panel-kicker">Trade Facts</span>
                <h3>成交记录</h3>
                <p>同步时会一起拉取近 90 天订单与逐笔成交，并补齐订单来源事实；交易对留空时，按当前账户已知交易对同步。</p>
              </div>
              <el-button
                v-hasPermi="['quant:trade:sync']"
                :disabled="!credentialId || credentialId === 'ALL'"
                :loading="syncing"
                icon="Refresh"
                plain
                type="primary"
                @click="sync"
              >
                同步订单与成交
              </el-button>
            </div>
          </template>
          <el-form :inline="true" class="query-form">
            <el-form-item label="交易账户">
              <el-select v-model="credentialId" clearable placeholder="全部交易用户" @change="handleCredentialChange">
                <el-option label="全部交易用户" value="ALL" />
                <el-option v-for="item in credentials" :key="item.id" :label="item.accountName" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="交易对">
              <el-input v-model="symbol" clearable placeholder="BTCUSDT" @keyup.enter="load" />
            </el-form-item>
            <el-form-item>
              <el-button icon="Search" type="primary" @click="load">查询</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
      <el-card class="table-panel" shadow="hover">
        <el-table v-loading="loading" :data="rows" border>
          <el-table-column type="index" label="序号" width="80" align="center">
            <template #default="scope">{{ (query.pageNum - 1) * query.pageSize + scope.$index + 1 }}</template>
          </el-table-column>
          <el-table-column label="交易用户" min-width="120" show-overflow-tooltip>
            <template #default="scope">{{ scope.row.customerName || '-' }}</template>
          </el-table-column>
          <el-table-column label="成交时间" prop="tradeTime" min-width="160">
            <template #default="scope">{{ formatTime(scope.row.tradeTime) }}</template>
          </el-table-column>
          <el-table-column label="交易对" prop="symbol" min-width="160" />
          <el-table-column label="方向" prop="side" min-width="100" />
          <el-table-column label="价格" min-width="150">
            <template #default="scope">{{ formatQuantTablePrice(scope.row.symbol, scope.row.price) }}</template>
          </el-table-column>
          <el-table-column label="数量" min-width="150">
            <template #default="scope">{{ formatQuantQuantity(scope.row.symbol, scope.row.quantity) }}</template>
          </el-table-column>
          <el-table-column label="手续费" min-width="150">
            <template #default="scope">{{ displayDecimal(scope.row.commission, 8) }}</template>
          </el-table-column>
          <el-table-column label="已实现盈亏" min-width="150">
            <template #default="scope">{{ displayDecimal(scope.row.realizedPnl, 8) }}</template>
          </el-table-column>
          <el-table-column label="Trade ID" prop="exchangeTradeId" min-width="120" />
          <el-table-column label="Order ID" prop="exchangeOrderId" min-width="120" />
        </el-table>
        <pagination
          v-show="total > 0"
          v-model:limit="query.pageSize"
          v-model:page="query.pageNum"
          :total="total"
          @pagination="load"
        />
      </el-card>
    </div>
  </div>
</template>
<script lang="ts" setup>
import type { CredentialVO, TradeRecord } from '@/api/quant/types';
import { listAccessibleTrades, listCredential, syncTrades } from '@/api/quant';
import { displayDecimal } from '../components/ledger-display';
import { ensureQuantSymbolTickSizes, formatQuantQuantity, formatQuantTablePrice } from '../components/price-format';
import modal from '@/plugins/modal';

const loading = ref(false);
const syncing = ref(false);
const credentials = ref<CredentialVO[]>([]);
const rows = ref<TradeRecord[]>([]);
const total = ref(0);
const credentialId = ref<number | string>('ALL');
const symbol = ref('');
const query = reactive<PageQuery>({ pageNum: 1, pageSize: 10 });
const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23'
});
const formatTime = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : timeFormatter.format(date);
};
const loadCredentials = async () => {
  credentials.value = (await listCredential({ pageNum: 1, pageSize: 100 })).data?.rows || [];
};
const load = async () => {
  loading.value = true;
  try {
    const [result] = await Promise.all([
      listAccessibleTrades(
        credentialId.value === 'ALL' ? undefined : credentialId.value,
        symbol.value || undefined,
        query
      ),
      ensureQuantSymbolTickSizes().catch(() => undefined)
    ]);
    rows.value = result.data?.rows || [];
    total.value = result.data?.total || 0;
  } finally {
    loading.value = false;
  }
};
const handleCredentialChange = () => {
  query.pageNum = 1;
  load();
};
const sync = async () => {
  if (!credentialId.value || credentialId.value === 'ALL') return modal.msgWarning('请先选择具体交易账户');
  syncing.value = true;
  try {
    await syncTrades(credentialId.value, symbol.value.trim() || undefined);
    await load();
    modal.msgSuccess('订单与成交同步完成');
  } finally {
    syncing.value = false;
  }
};
onMounted(async () => {
  await loadCredentials();
  await load();
});
</script>
<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.table-crud-page;
</style>
