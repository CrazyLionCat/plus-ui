import { EyeOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { PageContainer, ProTable, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Alert, Button, Descriptions, Drawer, Form, Input, message, Modal, Space, Tag, Typography } from 'antd';
import { useRef, useState } from 'react';
import type { EventWaitQuery, EventWaitSummary, EventWaitVO } from '@/api/workflow/timer/types';
import { getEventWait, listEventWait, summaryEventWait, triggerTimerStart } from '@/api/workflow/timer';
import { useTableScroll } from '@/hooks/useTableScroll';
import { useUserStore } from '@/stores/userStore';
import { hasPermi } from '@/utils/permission';
import { toPageQuery, toTableData } from '@/utils/ruoyi';

type TimerSearch = Omit<EventWaitQuery, 'statuses' | 'eventTypes'> & {
  statuses?: string[];
  eventTypes?: string[];
  nextTriggerAt?: [string, string];
};

const eventTypeOptions = [
  { label: '定时启动', value: 'TIMER_START' },
  { label: '定时捕获', value: 'TIMER_CATCH' },
  { label: '定时边界', value: 'TIMER_BOUNDARY' },
  { label: '消息启动', value: 'MESSAGE_START' },
  { label: '消息捕获', value: 'MESSAGE_CATCH' },
  { label: '消息边界', value: 'MESSAGE_BOUNDARY' },
  { label: '错误捕获', value: 'ERROR_CATCH' },
  { label: '错误边界', value: 'ERROR_BOUNDARY' }
];

const statusOptions = [
  { label: '待触发', value: 'WAITING' },
  { label: '重试中', value: 'RETRY' },
  { label: '执行中', value: 'RUNNING' },
  { label: '已取消', value: 'CANCELLED' },
  { label: '已死', value: 'DEAD' }
];

const triggerTypeNames: Record<string, string> = {
  AFTER: '一次性延迟',
  FIXED: '固定间隔',
  POINT_IN_TIME: '每日时点'
};

const statusColors: Record<string, string> = {
  WAITING: 'blue',
  RETRY: 'orange',
  RUNNING: 'green',
  DEAD: 'red',
  CANCELLED: 'default'
};

function formatDuration(value: string) {
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(value.trim());
  if (!match) return value;
  const parts = [
    match[1] && `${match[1]} 天`,
    match[2] && `${match[2]} 小时`,
    match[3] && `${match[3]} 分钟`,
    match[4] && `${match[4]} 秒`
  ].filter(Boolean);
  return parts.length ? parts.join(' ') : value;
}

function formatTriggerInterval(type?: string, interval?: string) {
  const raw = interval?.trim();
  if (!raw) return '-';
  if (type === 'POINT_IN_TIME') {
    try {
      const parsed: unknown = JSON.parse(raw);
      const times = Array.isArray(parsed) ? parsed : [raw];
      return times.length ? `每日 ${times.map(String).join('、')}` : raw;
    } catch {
      return raw;
    }
  }
  if (type === 'AFTER') {
    let value = raw;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) value = String(parsed[0]);
    } catch {
      // Plain ISO duration.
    }
    const duration = formatDuration(value);
    return duration === value ? raw : `${duration}后`;
  }
  if (type === 'FIXED') {
    const duration = formatDuration(raw);
    return duration === raw ? raw : `每 ${duration}`;
  }
  return raw;
}

function buildQuery(params: TimerSearch): EventWaitQuery {
  const { statuses, eventTypes, nextTriggerAt, ...rest } = toPageQuery(params);
  return {
    ...rest,
    statuses: statuses?.length ? statuses.join(',') : undefined,
    eventTypes: eventTypes?.length ? eventTypes.join(',') : undefined,
    nextTriggerAtFrom: nextTriggerAt?.[0],
    nextTriggerAtTo: nextTriggerAt?.[1]
  };
}

export default function WorkflowTimerPage() {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const { tableScroll } = useTableScroll(1390);
  const userInfo = useUserStore(state => state.userInfo);
  const canTrigger = hasPermi(userInfo, ['workflow:eventWait:trigger']);
  const [summary, setSummary] = useState<EventWaitSummary>();
  const [timerDisabled, setTimerDisabled] = useState(false);
  const [detail, setDetail] = useState<EventWaitVO>();
  const [triggerRow, setTriggerRow] = useState<EventWaitVO>();
  const [businessId, setBusinessId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openDetail = async (row: EventWaitVO) => {
    const res = await getEventWait(row.id);
    setDetail(res.data || row);
  };

  const submitTrigger = async () => {
    if (!triggerRow) return;
    setSubmitting(true);
    try {
      const res = await triggerTimerStart({ waitId: triggerRow.id, businessId: businessId.trim() || undefined });
      message.success(`已发起一次实例 ${res.data}`);
      setTriggerRow(undefined);
      actionRef.current?.reload();
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ProColumns<EventWaitVO>[] = [
    { title: '流程编码', dataIndex: 'flowCode', hideInTable: true },
    { title: '节点编码', dataIndex: 'nodeCode', hideInTable: true },
    { title: '业务ID', dataIndex: 'businessId', hideInTable: true },
    {
      title: '事件类型',
      dataIndex: 'eventTypes',
      hideInTable: true,
      valueType: 'select',
      fieldProps: { mode: 'multiple', options: eventTypeOptions, placeholder: '默认只查定时类' }
    },
    {
      title: '状态',
      dataIndex: 'statuses',
      hideInTable: true,
      valueType: 'select',
      fieldProps: { mode: 'multiple', options: statusOptions, placeholder: '不限' }
    },
    { title: '下次触发', dataIndex: 'nextTriggerAt', hideInTable: true, valueType: 'dateTimeRange' },
    { title: '流程名称', dataIndex: 'flowName', search: false, width: 150, ellipsis: true },
    { title: '事件节点', dataIndex: 'nodeCode', search: false, width: 120, ellipsis: true },
    { title: '事件类型', dataIndex: 'eventTypeName', search: false, width: 110 },
    {
      title: '触发策略',
      dataIndex: 'triggerType',
      search: false,
      width: 120,
      renderText: value => triggerTypeNames[value] || value || '-'
    },
    {
      title: '间隔/时点',
      dataIndex: 'triggerInterval',
      search: false,
      width: 160,
      renderText: (_, row) => formatTriggerInterval(row.triggerType, row.triggerInterval)
    },
    { title: '下次触发时间', dataIndex: 'nextTriggerAt', search: false, width: 170 },
    {
      title: '已触发',
      dataIndex: 'repeatCount',
      search: false,
      width: 100,
      renderText: (_, row) => `${row.repeatCount ?? 0}${row.maxRepeatCount ? ` / ${row.maxRepeatCount}` : ''}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      search: false,
      width: 100,
      render: (_, row) => <Tag color={statusColors[row.status || '']}>{row.statusName || row.status || '-'}</Tag>
    },
    {
      title: '关联实例',
      dataIndex: 'instanceId',
      search: false,
      width: 150,
      renderText: (_, row) => row.businessId || row.instanceId || '定义级'
    },
    {
      title: '操作',
      valueType: 'option',
      width: 170,
      fixed: 'right',
      render: (_, row) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(row)}>
            详情
          </Button>
          {canTrigger && row.eventType === 'TIMER_START' && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => {
                setBusinessId('');
                setTriggerRow(row);
              }}
            >
              立即触发
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <PageContainer title="定时任务">
      {timerDisabled && (
        <Alert
          type="warning"
          showIcon
          title="定时引擎扫描未开启，等待记录不会被自动触发，可在此手动补发。"
          style={{ marginBottom: 12 }}
        />
      )}
      <ProTable<EventWaitVO, TimerSearch>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        scroll={tableScroll}
        search={{ labelWidth: 90 }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        request={async params => {
          const query = buildQuery(params);
          const res = await listEventWait(query);
          setTimerDisabled(!!res.data?.rows?.length && res.data.rows[0].timerEnabled === false);
          const totals = await summaryEventWait(query);
          setSummary(totals.data);
          return toTableData(res);
        }}
        toolbar={{ title: '定时任务' }}
        toolBarRender={() => [
          <Button key="refresh" icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>
            刷新
          </Button>
        ]}
        tableExtraRender={() =>
          summary && (
            <Typography.Text type="secondary">
              待触发 {summary.waiting} · 重试中 {summary.retry} · 执行中 {summary.running} · 已取消 {summary.cancelled}{' '}
              · 已死 {summary.dead}
            </Typography.Text>
          )
        }
      />
      <Drawer title="定时任务详情" width={480} open={!!detail} onClose={() => setDetail(undefined)}>
        {detail && (
          <Descriptions
            column={1}
            bordered
            size="small"
            styles={{
              label: { width: 112, minWidth: 112, whiteSpace: 'nowrap' },
              content: { overflowWrap: 'anywhere' }
            }}
            items={[
              { label: '主键', children: detail.id },
              { label: '流程名称', children: detail.flowName || '-' },
              { label: '事件节点', children: detail.nodeCode || '-' },
              { label: '事件类型', children: detail.eventTypeName || '-' },
              { label: '事件名称', children: detail.eventName || '-' },
              { label: '触发策略', children: triggerTypeNames[detail.triggerType || ''] || '-' },
              { label: '间隔/时点', children: formatTriggerInterval(detail.triggerType, detail.triggerInterval) },
              { label: '时区', children: detail.timezone || '-' },
              { label: '下次触发', children: detail.nextTriggerAt || '-' },
              { label: '状态', children: detail.statusName || detail.status || '-' },
              { label: '已触发次数', children: detail.repeatCount ?? 0 },
              { label: '重试次数', children: `${detail.retryCount ?? 0} / ${detail.maxRetryCount ?? '-'}` },
              { label: '下次重试', children: detail.retryAt || '-' },
              { label: '关联实例', children: detail.businessId || detail.instanceId || '定义级' },
              { label: '载荷', children: detail.payload || '-' },
              { label: '最近错误', children: detail.lastError || '-' },
              { label: '创建时间', children: detail.createTime || '-' },
              { label: '更新时间', children: detail.updateTime || '-' }
            ]}
          />
        )}
      </Drawer>
      <Modal
        title="立即触发一次"
        open={!!triggerRow}
        confirmLoading={submitting}
        onOk={submitTrigger}
        onCancel={() => setTriggerRow(undefined)}
        okText="确认触发"
      >
        <Form layout="vertical">
          <Form.Item label="任务">
            {triggerRow?.flowName || '-'} / {triggerRow?.nodeCode || '-'}
          </Form.Item>
          <Form.Item label="下次触发">{triggerRow?.nextTriggerAt || '-'}</Form.Item>
          <Form.Item label="业务ID">
            <Input
              value={businessId}
              onChange={event => setBusinessId(event.target.value)}
              placeholder="留空自动生成"
              allowClear
            />
          </Form.Item>
        </Form>
        <Typography.Text type="secondary">只额外发起一次实例，定时任务的下次触发时间保持不变。</Typography.Text>
      </Modal>
    </PageContainer>
  );
}
