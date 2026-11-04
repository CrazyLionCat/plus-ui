<template>
  <div class="p-2 app-container quant-market-page">
    <div class="search-wrap">
      <el-card shadow="hover" class="search-panel">
        <template #header>
          <div class="toolbar-shell">
            <div class="table-heading">
              <span class="panel-kicker">Order Ledger</span>
              <h3>订单管理</h3>
              <p>查询本地订单账本，订单与交易所成交按账户、交易对和订单 ID 关联；普通接口最多查询近 90 天，超过 3 天的无成交取消/过期订单可能已不再由交易所返回。</p>
            </div>
            <div class="toolbar-actions">
              <el-button
                v-hasPermi="['quant:order:sync']"
                :disabled="credentialId === 'ALL' || !symbol.trim()"
                :loading="syncing"
                icon="Refresh"
                plain
                type="primary"
                @click="sync"
              >同步订单</el-button>
              <el-button :loading="loading" icon="Refresh" plain @click="load">刷新</el-button>
            </div>
          </div>
        </template>
        <el-form :inline="true" class="query-form" @submit.prevent="handleQuery">
          <el-form-item label="交易账户">
            <el-select v-model="credentialId" placeholder="全部交易用户" @change="handleQuery">
              <el-option label="全部交易用户" value="ALL" />
              <el-option v-for="item in credentials" :key="item.id" :label="item.accountName" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="交易对">
            <el-input v-model="symbol" clearable placeholder="BTCUSDT" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="方向">
            <el-select v-model="side" clearable placeholder="全部方向">
              <el-option label="BUY" value="BUY" />
              <el-option label="SELL" value="SELL" />
            </el-select>
          </el-form-item>
          <el-form-item label="订单状态">
            <el-select v-model="status" clearable placeholder="全部状态">
              <el-option v-for="item in orderStatuses" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button icon="Search" type="primary" @click="handleQuery">查询</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <el-card class="table-panel" shadow="hover">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <span class="panel-kicker">Symbol Dataset</span>
            <h3>订单列表</h3>
            <p>已成交订单可查看其对应的逐笔成交记录。</p>
          </div>
          <div class="toolbar-actions">
            <right-toolbar :search="false" @query-table="load" />
          </div>
        </div>
      </template>
      <el-table v-loading="loading" :data="rows" border>
        <el-table-column type="index" label="序号" width="70" align="center">
          <template #default="scope">{{ (query.pageNum - 1) * query.pageSize + scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column label="交易账户" min-width="120" prop="customerName" show-overflow-tooltip />
        <el-table-column label="交易对" min-width="110" prop="symbol" />
        <el-table-column label="Exchange ID" min-width="125" prop="orderId" />
        <el-table-column label="ClientOrderId" min-width="180" prop="clientOrderId" show-overflow-tooltip />
        <el-table-column label="方向" width="80" prop="side" align="center" />
        <el-table-column label="持仓方向" width="100" prop="positionSide" align="center" />
        <el-table-column label="只减仓" width="85" align="center">
          <template #default="scope">{{ scope.row.reduceOnly == null ? '—' : scope.row.reduceOnly ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column label="类型" width="105" prop="type" />
        <el-table-column label="价格" min-width="120">
          <template #default="scope">{{ formatQuantTablePrice(scope.row.symbol, scope.row.price) }}</template>
        </el-table-column>
        <el-table-column label="委托数量" min-width="110" prop="originalQuantity" />
        <el-table-column label="已成交数量" min-width="120" prop="executedQuantity" />
        <el-table-column label="关联成交" width="100" align="center">
          <template #default="scope">
            <el-button link type="primary" :disabled="!scope.row.tradeCount" @click="openFills(scope.row)">
              {{ scope.row.tradeCount || 0 }} 笔
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" prop="status" />
        <el-table-column label="更新时间" min-width="165">
          <template #default="scope">{{ formatTime(scope.row.updateTime) }}</template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="90">
          <template #default="scope">
            <el-button
              v-if="['NEW', 'PARTIALLY_FILLED'].includes(scope.row.status) && scope.row.orderId"
              v-hasPermi="['quant:order:cancel']"
              link
              type="danger"
              @click="cancel(scope.row)"
            >撤单</el-button>
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

    <el-dialog v-model="fillsVisible" :title="selectedOrder ? `订单 ${selectedOrder.orderId} · 成交记录` : '关联成交记录'" width="1000px" append-to-body>
      <el-table v-loading="fillsLoading" :data="fillRows" border>
        <el-table-column label="成交时间" min-width="165">
          <template #default="scope">{{ formatTime(scope.row.tradeTime) }}</template>
        </el-table-column>
        <el-table-column label="交易对" min-width="110" prop="symbol" />
        <el-table-column label="方向" width="85" prop="side" />
        <el-table-column label="成交价格" min-width="130">
          <template #default="scope">{{ formatQuantTablePrice(scope.row.symbol, scope.row.price) }}</template>
        </el-table-column>
        <el-table-column label="成交数量" min-width="120" prop="quantity" />
        <el-table-column label="手续费" min-width="110" prop="commission" />
        <el-table-column label="已实现盈亏" min-width="120" prop="realizedPnl" />
        <el-table-column label="Trade ID" min-width="130" prop="exchangeTradeId" />
        <el-table-column label="Order ID" min-width="130" prop="exchangeOrderId" />
      </el-table>
      <pagination
        v-show="fillTotal > 0"
        v-model:limit="fillQuery.pageSize"
        v-model:page="fillQuery.pageNum"
        :total="fillTotal"
        @pagination="loadFills"
      />
    </el-dialog>
  </div>
</template>
<script lang="ts" setup>
import type { CredentialVO, OrderLedgerRow, TradeRecord } from '@/api/quant/types';
import { cancelOrder, listAccessibleOrders, listAccessibleTrades, listCredential, syncOrders } from '@/api/quant';
import { ensureQuantSymbolTickSizes, formatQuantTablePrice } from '../components/price-format';
import modal from '@/plugins/modal';

const loading = ref(false);
const syncing = ref(false);
const credentials = ref<CredentialVO[]>([]);
const rows = ref<OrderLedgerRow[]>([]);
const total = ref(0);
const credentialId = ref<number | string>('ALL');
const symbol = ref('');
const side = ref('');
const status = ref('');
const orderStatuses = ['NEW', 'PARTIALLY_FILLED', 'FILLED', 'CANCELED', 'EXPIRED', 'EXPIRED_IN_MATCH', 'REJECTED'];
const query = reactive<PageQuery>({ pageNum: 1, pageSize: 10 });
const fillsVisible = ref(false);
const fillsLoading = ref(false);
const selectedOrder = ref<OrderLedgerRow>();
const fillRows = ref<TradeRecord[]>([]);
const fillTotal = ref(0);
const fillQuery = reactive<PageQuery>({ pageNum: 1, pageSize: 10 });
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
  const normalized = value.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value.replace(' ', 'T')}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? value : timeFormatter.format(date);
};
const loadCredentials = async () => {
  credentials.value = (await listCredential({ pageNum: 1, pageSize: 100 })).data?.rows || [];
};
const load = async () => {
  loading.value = true;
  try {
    const [result] = await Promise.all([
      listAccessibleOrders(credentialId.value === 'ALL' ? undefined : credentialId.value, symbol.value || undefined, {
        ...query,
        side: side.value || undefined,
        status: status.value || undefined
      }),
      ensureQuantSymbolTickSizes().catch(() => undefined)
    ]);
    rows.value = result.data?.rows || [];
    total.value = result.data?.total || 0;
  } finally {
    loading.value = false;
  }
};
const handleQuery = () => {
  query.pageNum = 1;
  load();
};
const sync = async () => {
  if (credentialId.value === 'ALL' || !symbol.value.trim()) return modal.msgWarning('请先选择具体交易账户并输入交易对');
  syncing.value = true;
  try {
    await syncOrders(credentialId.value, symbol.value.trim());
    await load();
  } finally {
    syncing.value = false;
  }
};
const cancel = async (row: OrderLedgerRow) => {
  const orderId = row.orderId;
  if (!orderId) return;
  await modal.confirm('确认撤销该订单吗？');
  await cancelOrder({
    credentialId: row.credentialId,
    symbol: row.symbol,
    orderId,
    clientOrderId: row.clientOrderId,
    idempotencyKey: crypto.randomUUID()
  });
  await load();
};
const openFills = async (row: OrderLedgerRow) => {
  selectedOrder.value = row;
  fillsVisible.value = true;
  fillQuery.pageNum = 1;
  await loadFills();
};
const loadFills = async () => {
  const order = selectedOrder.value;
  if (!order?.credentialId || !order.orderId) {
    fillRows.value = [];
    fillTotal.value = 0;
    return;
  }
  fillsLoading.value = true;
  try {
    const result = await listAccessibleTrades(order.credentialId, order.symbol, { ...fillQuery, orderId: order.orderId });
    fillRows.value = result.data?.rows || [];
    fillTotal.value = result.data?.total || 0;
  } finally {
    fillsLoading.value = false;
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
