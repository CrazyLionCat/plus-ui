<template>
  <div>
    <el-alert
      class="history-note"
      type="info"
      :closable="false"
      title="一行代表一个由真实订单/成交来源确认的持仓周期；开仓方向不再根据 BUY/SELL 推断。名义金额不等同于实际保证金；余额为成交后核实的账户钱包余额。来源不完整的账户与交易对会排除显示；时间为北京时间。"
    />
    <el-alert
      v-if="incompleteCount"
      class="history-note"
      type="warning"
      :closable="false"
      :title="`${incompleteCount} 个账户与交易对的成交链不完整或来源不明确，已排除，避免展示错误开平仓记录。`"
    />
    <AdminLedgerTable title="开平仓记录" :columns="columns" :filters="filters" :load-page="loadPage">
      <template #column-direction="scope">
        <dict-tag :options="quant_position_direction" :value="scope.row.direction" />
      </template>
    </AdminLedgerTable>
  </div>
</template>
<script lang="ts" setup>
import { listTradeHistory } from '@/api/quant/trade-history';
import AdminLedgerTable from '../components/AdminLedgerTable.vue';
import { displayDecimal } from '../components/ledger-display';
import { useCredentialOptions } from '../components/useCredentialOptions';
import { useDict } from '@/utils/dict';

const { credentialFilter } = useCredentialOptions();
const { quant_position_direction } = toRefs<any>(useDict('quant_position_direction'));
const incompleteCount = ref(0);
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
const decimal = (value: unknown) => (value == null ? '—' : displayDecimal(value));
const price = (value: unknown) => (value == null ? '—' : String(value));
const time = (value: unknown) => (value ? timeFormatter.format(new Date(String(value))) : '—');
const ids = (value: unknown) => (Array.isArray(value) && value.length ? value.join(', ') : '—');
const balance = (value: unknown, checkedAt: unknown) => {
  if (value == null) return '—';
  const checked = checkedAt ? `（${time(checkedAt)}）` : '';
  return `${String(value)}${checked}`;
};
const centered = { align: 'center' as const, headerAlign: 'center' as const };
const columns = [
  { prop: 'accountName', label: '客户名称', ...centered, width: 120 },
  { prop: 'symbol', label: '交易对', ...centered, minWidth: 100 },
  {
    prop: 'direction',
    label: '开仓方向',
    ...centered,
    width: 120,
  },
  { prop: 'entryPrice', label: '开仓价', ...centered, width: 100,formatter: (row: Record<string, unknown>) => price(row.entryPrice) },
  { prop: 'openingQuantity', label: '开仓数量', ...centered, formatter: (row: Record<string, unknown>) => decimal(row.openingQuantity) },
  { prop: 'closingQuantity', label: '平仓数量', ...centered, formatter: (row: Record<string, unknown>) => decimal(row.closingQuantity) },
  { prop: 'remainingQuantity', label: '剩余数量', ...centered, formatter: (row: Record<string, unknown>) => decimal(row.remainingQuantity) },
  { prop: 'openingNotional', label: '开仓名义金额(U)', ...centered, formatter: (row: Record<string, unknown>) => decimal(row.openingNotional) },
  { prop: 'openingFillCount', label: '开仓成交笔数', ...centered, width: 110 },
  { prop: 'closingFillCount', label: '平仓成交笔数', ...centered, width: 110 },
  { prop: 'leverage', label: '杠杆', width: 80, ...centered, formatter: (row: Record<string, unknown>) => (row.leverage == null ? '—' : `${row.leverage}x`) },
  { prop: 'openingBalance', label: '开仓余额U（核实时间）', ...centered, width: 230, formatter: (row: Record<string, unknown>) => balance(row.openingBalance, row.openingBalanceAt) },
  { prop: 'openedAt', label: '开仓时间', ...centered, width: 160, formatter: (row: Record<string, unknown>) => time(row.openedAt) },
  { prop: 'closePrice', label: '平仓价', ...centered, width: 100,formatter: (row: Record<string, unknown>) => price(row.closePrice) },
  { prop: 'realizedPnl', label: '盈亏', ...centered, width: 100,formatter: (row: Record<string, unknown>) => decimal(row.realizedPnl) },
  { prop: 'commission', label: '手续费', ...centered, width: 100,formatter: (row: Record<string, unknown>) => price(row.commission) },
  { prop: 'closingBalance', label: '平仓余额U（核实时间）', ...centered, width: 230, formatter: (row: Record<string, unknown>) => balance(row.closingBalance, row.closingBalanceAt) },
  { prop: 'openingOrderIds', label: '开仓订单 ID', ...centered, width: 180, formatter: (row: Record<string, unknown>) => ids(row.openingOrderIds) },
  { prop: 'closingOrderIds', label: '平仓订单 ID', ...centered, width: 180, formatter: (row: Record<string, unknown>) => ids(row.closingOrderIds) },
  { prop: 'openingTradeIds', label: '开仓成交 ID', ...centered, width: 180, formatter: (row: Record<string, unknown>) => ids(row.openingTradeIds) },
  { prop: 'closingTradeIds', label: '平仓成交 ID', ...centered, width: 180, formatter: (row: Record<string, unknown>) => ids(row.closingTradeIds) },
  { prop: 'closedAt', label: '平仓时间', ...centered, width: 160, formatter: (row: Record<string, unknown>) => time(row.closedAt) }
];
const filters = computed(() => [
  { ...credentialFilter.value, label: '客户名称', placeholder: '全部客户' },
  { key: 'symbol', label: '交易对', placeholder: '例如 BTCUSDT' },
  { key: 'from', label: '开仓开始日期', placeholder: 'yyyy-MM-dd' },
  { key: 'to', label: '开仓结束日期', placeholder: 'yyyy-MM-dd' }
]);
const loadPage = async (query: PageQuery & Record<string, string | number | undefined>) => {
  try {
    const result = await listTradeHistory({ ...query });
    incompleteCount.value = result.data?.incompleteCount || 0;
    return result;
  } catch (error) {
    incompleteCount.value = 0;
    // 请求封装已显示后端错误，不保留上一次筛选的行。
    return { data: { rows: [], total: 0 } };
  }
};
</script>
<style scoped>
.history-note {
  margin: 8px;
}
</style>
