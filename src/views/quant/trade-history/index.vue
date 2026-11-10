<template>
  <div>
    <el-alert
      class="history-note"
      type="info"
      :closable="false"
      title="一行代表一个持仓周期；开仓名义金额按实际成交数量 × 加权开仓价计算，不等同于实际保证金。手续费按资产分别汇总，不跨资产相加。旧记录缺少事实时显示待核实；时间为北京时间。"
    />
    <el-alert
      v-if="incompleteCount"
      class="history-note"
      type="warning"
      :closable="false"
      :title="`${incompleteCount} 个账户与交易对的成交链不完整或来源不明确，相关范围已标记待核实，不计入可靠交易归集。`"
    />
    <el-alert
      v-if="inferredCount"
      class="history-note"
      type="warning"
      :closable="false"
      :title="`${inferredCount} 条记录由旧成交推断重建：按最早一笔成交时为空仓假设，结果可能与更早的实际持仓不一致。`"
    />
    <AdminLedgerTable title="开平仓记录" :columns="columns" :filters="filters" :load-page="loadPage">
      <template #column-direction="scope">
        <div class="table-dict">
          <dict-tag v-if="scope.row.direction === 'LONG' || scope.row.direction === 'SHORT'" :options="quant_position_direction" :value="scope.row.direction" />
          <el-tag v-else type="warning">方向待核实</el-tag>
          <el-tag v-if="scope.row.status === 'PARTIAL'" class="inferred-tag" type="info">部分平仓</el-tag>
          <el-tag v-else-if="scope.row.status === 'OPEN'" class="inferred-tag" type="success">持仓中</el-tag>
          <el-tag v-else-if="scope.row.status === 'RECONCILE_REQUIRED'" class="inferred-tag" type="danger">待核实</el-tag>
          <el-tag v-if="scope.row.reconstructionSource === 'INFERRED'" class="inferred-tag" type="warning">推断</el-tag>
        </div>
      </template>
    </AdminLedgerTable>
  </div>
</template>
<script lang="ts" setup>
import { listTradeHistory } from '@/api/quant/trade-history';
import AdminLedgerTable from '../components/AdminLedgerTable.vue';
import { displayCommission, displayDecimal } from '../components/ledger-display';
import { useCredentialOptions } from '../components/useCredentialOptions';
import { useDict } from '@/utils/dict';

const { credentialFilter } = useCredentialOptions();
const { quant_position_direction } = toRefs<any>(useDict('quant_position_direction'));
const incompleteCount = ref(0);
const inferredCount = ref(0);
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
const amount = (value: unknown) => (value == null ? '—' : displayDecimal(value, 8));
const time = (value: unknown) => (value ? timeFormatter.format(new Date(String(value))) : '—');
const balance = (value: unknown, checkedAt: unknown) => {
  if (value == null) return '—';
  const checked = checkedAt ? `（${time(checkedAt)}）` : '';
  return `${String(value)}${checked}`;
};
const centered = { align: 'center' as const, headerAlign: 'center' as const };
const columns = [
  { prop: 'accountName', label: '客户名称', ...centered, width: 120 },
  { prop: 'symbol', label: '交易对', ...centered, minWidth: 100 },
  /*{ prop: 'direction', label: '开仓方向', ...centered, width: 120 },*/
  { prop: 'entryPrice', label: '开仓价', ...centered, width: 100,formatter: (row: Record<string, unknown>) => amount(row.entryPrice) },
  { prop: 'openingNotional', label: '开仓名义金额(U)', ...centered, formatter: (row: Record<string, unknown>) => decimal(row.openingNotional) },
  /*{
    prop: 'leverage',
    label: '杠杆',
    width: 80,
    ...centered,
    formatter: (row: Record<string, unknown>) => (row.leverage == null ? '—' : `${row.leverage}x`)
  },*/
  /*{ prop: 'openingBalance', label: '开仓余额U（核实时间）', ...centered, width: 230, formatter: (row: Record<string, unknown>) => balance(row.openingBalance, row.openingBalanceAt) },*/
  { prop: 'openedAt', label: '开仓时间', ...centered, width: 160, formatter: (row: Record<string, unknown>) => time(row.openedAt) },
  { prop: 'closePrice', label: '平仓价', ...centered, width: 100,formatter: (row: Record<string, unknown>) => amount(row.closePrice) },
  { prop: 'realizedPnl', label: '盈亏', ...centered, width: 100,formatter: (row: Record<string, unknown>) => amount(row.realizedPnl) },
  { prop: 'commission', label: '手续费', ...centered, width: 180, formatter: (row: Record<string, unknown>) => displayCommission(row.commission) },
  { prop: 'closingEquity', label: '平仓后账户权益(U)', ...centered, width: 170, formatter: (row: Record<string, unknown>) => balance(row.closingEquity, row.closingEquityAt) },
  /*{ prop: 'closingBalance', label: '平仓余额U（核实时间）', ...centered, width: 230, formatter: (row: Record<string, unknown>) => balance(row.closingBalance, row.closingBalanceAt) },*/
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
    inferredCount.value = result.data?.inferredCount || 0;
    return result;
  } catch (error) {
    incompleteCount.value = 0;
    inferredCount.value = 0;
    // 请求封装已显示后端错误，不保留上一次筛选的行。
    return { data: { rows: [], total: 0 } };
  }
};
</script>
<style scoped>
.history-note {
  margin: 8px;
}
.inferred-tag {
  margin-left: 6px;
}
.table-dict{
  display: flex;
  align-items: flex-end;
}
</style>
