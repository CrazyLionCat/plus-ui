<template>
  <div class="strategy-runtime-config">
    <el-divider content-position="left">策略公共设置</el-divider>
    <el-form-item label="策略账户">
      <el-select
        :model-value="credentialIds"
        multiple
        filterable
        collapse-tags
        placeholder="请选择策略账户"
        style="width: 100%"
        @update:model-value="handleCredentialChange"
      >
        <el-option
          v-for="item in credentials"
          :key="item.id"
          :label="item.userName ? `${item.userName} / ${item.accountName}` : item.accountName"
          :value="item.id"
        />
      </el-select>
    </el-form-item>
    <el-row :gutter="16" class="default-grid">
      <el-col :span="8">
        <el-form-item label="最大开仓数量"><el-input-number v-model="form.maxOpenCount" :min="1" /></el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="默认保证金模式">
          <el-select v-model="form.defaultMarginMode">
            <el-option label="逐仓" value="ISOLATED" />
            <el-option label="全仓" value="CROSSED" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="默认周期">
          <el-select v-model="form.defaultInterval">
            <el-option label="1分钟" value="1m" />
            <el-option label="5分钟" value="5m" />
            <el-option label="15分钟" value="15m" />
            <el-option label="1小时" value="1h" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="默认开仓比例">
          <el-input-number
            :model-value="Number(form.defaultOpenRatio || 0)"
            :min="0.000001"
            :max="1"
            :step="0.01"
            @update:model-value="value => (form.defaultOpenRatio = Number(value))"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="默认杠杆"><el-input-number v-model="form.defaultLeverage" :min="1" /></el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="默认止损比例">
          <el-input-number
            :model-value="Number(form.defaultStopLossRatio || 0)"
            :min="0.000001"
            :max="0.999999"
            :step="0.01"
            @update:model-value="value => (form.defaultStopLossRatio = Number(value))"
          />
        </el-form-item>
      </el-col>
    </el-row>
    <el-divider content-position="left">交易对覆盖配置</el-divider>
    <el-form-item label="交易对">
      <el-select
        :model-value="symbolIds"
        multiple
        filterable
        remote
        :remote-method="handleSymbolQuery"
        collapse-tags
        placeholder="选择后加入配置表"
        style="width: 100%"
        @update:model-value="handleSymbolChange"
      >
        <el-option v-for="item in visibleSymbols" :key="item.id" :label="symbolLabel(item)" :value="item.id">
          <span class="symbol-option">
            <span>{{ symbolLabel(item) }}</span>
            <span v-if="isSelected(item.id)" class="selected-mark">已选择</span>
          </span>
        </el-option>
      </el-select>
    </el-form-item>
    <el-table :data="rows" border max-height="285" class="symbol-config-table">
      <el-table-column label="序号" type="index" width="60" align="center" />
      <el-table-column label="交易对" min-width="110">
        <template #default="scope">
          <strong>{{ symbolName(scope.row.symbolId) }}</strong>
        </template>
      </el-table-column>
      <el-table-column label="周期" width="120">
        <template #default="scope">
          <el-select v-model="scope.row.intervalCode">
            <el-option label="1分钟" value="1m" />
            <el-option label="5分钟" value="5m" />
            <el-option label="15分钟" value="15m" />
            <el-option label="1小时" value="1h" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="开仓比例" width="140">
        <template #default="scope">
          <el-input-number v-model="scope.row.openRatio" :min="0.000001" :max="1" :step="0.01" />
        </template>
      </el-table-column>
      <el-table-column label="止损比例" width="140">
        <template #default="scope">
          <el-input-number v-model="scope.row.stopLossRatio" :min="0.000001" :max="0.999999" :step="0.01" />
        </template>
      </el-table-column>
      <el-table-column label="杠杆" width="140">
        <template #default="scope"><el-input-number v-model="scope.row.leverage" :min="1" /></template>
      </el-table-column>
      <el-table-column label="保证金模式" width="120" align="center">
        <template #default="scope">
          <el-select v-model="scope.row.marginMode">
            <el-option label="逐仓" value="ISOLATED" />
            <el-option label="全仓" value="CROSSED" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="启用" width="80" align="center">
        <template #default="scope">
          <el-switch v-model="scope.row.status" active-value="0" inactive-value="1" />
        </template>
      </el-table-column>
      <el-table-column label="策略参数" width="90" align="center">
        <template #default="scope">
          <el-button link type="primary" @click="openParams(scope.row)">
            {{ scope.row.paramsJson && scope.row.paramsJson !== '{}' ? '已配置' : '配置' }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="70" align="center">
        <template #default="scope">
          <el-button link type="danger" @click="$emit('remove-symbol', scope.row.symbolId)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import type { CredentialVO, StrategyForm, StrategySymbolBinding, SymbolVO } from '@/api/quant/types';
const props = defineProps<{
  form: StrategyForm;
  credentials: CredentialVO[];
  credentialIds: Array<number | string>;
  symbols: SymbolVO[];
  symbolIds: Array<number | string>;
  rows: StrategySymbolBinding[];
}>();
const emit = defineEmits<{
  (event: 'sync-symbols', ids: Array<number | string>): void;
  (event: 'search-symbols', keyword: string): void;
  (event: 'update-credential-ids', ids: Array<number | string>): void;
  (event: 'open-params', row: StrategySymbolBinding): void;
  (event: 'remove-symbol', id: number | string): void;
}>();
const symbolQuery = ref('');
const visibleSymbols = computed(() => {
  const keyword = symbolQuery.value.trim().toUpperCase();
  const selected = new Set(props.symbolIds.map(id => String(id)));
  const candidates = keyword
    ? props.symbols.filter(item => item.symbol.toUpperCase().includes(keyword))
    : props.symbols.filter(item => item.favorite || selected.has(String(item.id)));
  return candidates.toSorted((left, right) => {
    if (Boolean(left.favorite) !== Boolean(right.favorite)) return left.favorite ? -1 : 1;
    return left.symbol.localeCompare(right.symbol);
  });
});
const symbolName = (id: number | string) =>
  props.symbols.find(item => String(item.id) === String(id))?.symbol || String(id);
const symbolLabel = (item: SymbolVO) => `${item.favorite ? '★ ' : ''}${item.symbol}`;
const isSelected = (id: number | string) => props.symbolIds.some(item => String(item) === String(id));
const handleCredentialChange = (value: unknown) => {
  emit('update-credential-ids', Array.isArray(value) ? [...value] : []);
};
const handleSymbolChange = (value: unknown) => {
  emit('sync-symbols', Array.isArray(value) ? [...value] : []);
};
const handleSymbolQuery = (value: string) => {
  symbolQuery.value = value;
  if (value.trim()) emit('search-symbols', value.trim());
};
const openParams = (row: unknown) => emit('open-params', row as StrategySymbolBinding);
</script>

<style scoped lang="scss">
.default-grid :deep(.el-input-number),
.default-grid :deep(.el-select) {
  width: 100%;
}
.symbol-config-table :deep(.el-input-number),
.symbol-config-table :deep(.el-select) {
  width: 100%;
}
.symbol-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.selected-mark {
  color: var(--el-color-primary);
  font-size: 12px;
}
</style>
