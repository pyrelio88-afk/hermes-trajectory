/**
 * harness-progress — Hermes Desktop trajectory pane
 *
 * Session keys: gateway events use RUNTIME id; the pane title uses STORED id
 * (20260819_…). Those two must alias or the bar stays empty.
 *
 * i18n: ctx.i18n.register + nested keys (en / zh / zh-hant / ja / ar).
 * 8 colors. History stays after a turn ends. One bucket per bot + chat.
 */

import {
  atom,
  cn,
  host,
  PALETTE_AREA,
  STATUSBAR_AREAS,
  Tip,
  usePluginI18n,
  useValue
} from '@hermes/plugin-sdk'
import { useEffect, useRef, useState } from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'

const ID = 'harness-progress'
const MAX_EVENTS = 240
const LANE_H = 14
const SPAN_H = 8
const SPAN_W = 14

const store = { api: null }

const $buckets = atom({})
const $aliases = atom({})
const $viewKey = atom('')
const $selected = atom(null)

const KIND = {
  user: { lane: 0, color: 'var(--ui-accent)' },
  context: { lane: 0, color: 'var(--success, #34d399)' },
  thinking: { lane: 1, color: 'color-mix(in srgb, var(--ui-accent) 35%, #818cf8)' },
  message: { lane: 1, color: 'color-mix(in srgb, var(--ui-accent) 40%, #c084fc)' },
  tool: { lane: 2, color: 'var(--warning, #f5a524)' },
  subagent: { lane: 2, color: '#22d3ee' },
  approval: { lane: 2, color: '#facc15' },
  error: { lane: 2, color: 'var(--destructive, #f31260)' }
}

const KIND_ALIAS = {
  system: 'context',
  compacted: 'context',
  subtool: 'tool',
  result: 'tool'
}

const LOCALES = {
  en: {
    title: 'Trajectory',
    chip: 'Trajectory',
    onlyThis: 'This chat · drag the bar',
    emptyTitle: 'No steps yet',
    emptyBody: 'Send a message. Colors stay after the turn. Switching chat or bot keeps histories apart.',
    idle: 'Idle',
    steps: (n) => `${n} steps`,
    running: (tags) => `Live ${tags}`,
    clear: 'Clear this chat',
    help: 'Help: Trajectory',
    helpBody: 'Right-hand column. Scroll the color bar. One history per chat and bot.',
    none: 'No trajectory',
    lane: { input: 'In', model: 'Model', tools: 'Tools' },
    kind: {
      user: 'YOU',
      context: 'CTX',
      thinking: 'THINK',
      message: 'OUT',
      tool: 'TOOL',
      subagent: 'AGENT',
      approval: 'ASK',
      error: 'ERR'
    },
    legend: {
      user: 'You',
      context: 'Context',
      thinking: 'Think',
      message: 'Reply',
      tool: 'Tool',
      subagent: 'Subagent',
      approval: 'Ask',
      error: 'Error'
    },
    evt: {
      round: (n) => `Turn ${n}`,
      thinking: 'Thinking',
      writing: 'Writing',
      todo: 'Update todos',
      tool: (name) => name || 'Tool',
      result: (name) => (name ? `${name} returned` : 'Tool result'),
      toolFailed: (name) => (name ? `${name} failed` : 'Tool failed'),
      subagent: (name) => name || 'Subagent',
      subtool: (name) => name || 'Subagent tool',
      clarify: 'Needs a question',
      approve: 'Waiting for approval',
      compact: 'Context compacted',
      context: 'Context update',
      error: (msg) => msg || 'Error'
    }
  },
  zh: {
    title: '轨迹',
    chip: '轨迹',
    onlyThis: '只显示这场 · 轴可横滑',
    emptyTitle: '这场还没有轨迹',
    emptyBody: '发一条消息就会按颜色留下每一步。换对话或换 bot 不会混。',
    idle: '空闲',
    steps: (n) => `${n} 步`,
    running: (tags) => `进行中 ${tags}`,
    clear: '清空本场',
    help: '轨迹说明',
    helpBody: '右边单独一列。色轴可左右滑。换会话或换 bot 各看各的。',
    none: '还没有轨迹',
    lane: { input: '输入', model: '模型', tools: '工具' },
    kind: {
      user: '你',
      context: '上下文',
      thinking: '思考',
      message: '回复',
      tool: '工具',
      subagent: '子代理',
      approval: '询问',
      error: '错误'
    },
    legend: {
      user: '你',
      context: '上下文',
      thinking: '思考',
      message: '回复',
      tool: '工具',
      subagent: '子代理',
      approval: '询问',
      error: '错误'
    },
    evt: {
      round: (n) => `第 ${n} 轮`,
      thinking: '思考',
      writing: '生成回复',
      todo: '更新任务',
      tool: (name) => name || '工具',
      result: (name) => (name ? `${name} 返回` : '工具返回'),
      toolFailed: (name) => (name ? `${name} 失败` : '工具失败'),
      subagent: (name) => name || '子代理',
      subtool: (name) => name || '子代理工具',
      clarify: '需要澄清',
      approve: '等待批准',
      compact: '压缩上下文',
      context: '上下文更新',
      error: (msg) => msg || '出错'
    }
  },
  'zh-hant': {
    title: '軌跡',
    chip: '軌跡',
    onlyThis: '只顯示這場 · 軸可橫滑',
    emptyTitle: '這場還沒有軌跡',
    emptyBody: '送出訊息後依顏色留下每一步。切對話或切 bot 不會混在一起。',
    idle: '閒置',
    steps: (n) => `${n} 步`,
    running: (tags) => `進行中 ${tags}`,
    clear: '清空本場',
    help: '軌跡說明',
    helpBody: '右邊獨立一欄。色軸可左右滑。切會話或切 bot 各自獨立。',
    none: '還沒有軌跡',
    lane: { input: '輸入', model: '模型', tools: '工具' },
    kind: {
      user: '你',
      context: '上下文',
      thinking: '思考',
      message: '回覆',
      tool: '工具',
      subagent: '子代理',
      approval: '詢問',
      error: '錯誤'
    },
    legend: {
      user: '你',
      context: '上下文',
      thinking: '思考',
      message: '回覆',
      tool: '工具',
      subagent: '子代理',
      approval: '詢問',
      error: '錯誤'
    },
    evt: {
      round: (n) => `第 ${n} 輪`,
      thinking: '思考',
      writing: '產生回覆',
      todo: '更新任務',
      tool: (name) => name || '工具',
      result: (name) => (name ? `${name} 返回` : '工具返回'),
      toolFailed: (name) => (name ? `${name} 失敗` : '工具失敗'),
      subagent: (name) => name || '子代理',
      subtool: (name) => name || '子代理工具',
      clarify: '需要澄清',
      approve: '等待核准',
      compact: '壓縮上下文',
      context: '上下文更新',
      error: (msg) => msg || '出錯'
    }
  },
  ja: {
    title: '軌跡',
    chip: '軌跡',
    onlyThis: 'この会話のみ · バーは横スクロール',
    emptyTitle: 'まだ軌跡がありません',
    emptyBody: '送信すると色で手順が残ります。会話や bot を切り替えても混ざりません。',
    idle: '待機',
    steps: (n) => `${n} ステップ`,
    running: (tags) => `実行中 ${tags}`,
    clear: 'この会話を消去',
    help: '軌跡の説明',
    helpBody: '右側の独立列。カラーバーは横に送れます。会話・bot ごとに分かれます。',
    none: '軌跡なし',
    lane: { input: '入力', model: 'モデル', tools: 'ツール' },
    kind: {
      user: 'あなた',
      context: '文脈',
      thinking: '思考',
      message: '応答',
      tool: 'ツール',
      subagent: '子',
      approval: '確認',
      error: 'エラー'
    },
    legend: {
      user: 'あなた',
      context: '文脈',
      thinking: '思考',
      message: '応答',
      tool: 'ツール',
      subagent: '子エージェント',
      approval: '確認',
      error: 'エラー'
    },
    evt: {
      round: (n) => `ターン ${n}`,
      thinking: '思考中',
      writing: '応答を生成',
      todo: 'ToDo を更新',
      tool: (name) => name || 'ツール',
      result: (name) => (name ? `${name} が返却` : 'ツール結果'),
      toolFailed: (name) => (name ? `${name} が失敗` : 'ツール失敗'),
      subagent: (name) => name || '子エージェント',
      subtool: (name) => name || '子ツール',
      clarify: '確認が必要',
      approve: '承認待ち',
      compact: '文脈を圧縮',
      context: '文脈更新',
      error: (msg) => msg || 'エラー'
    }
  },
  ar: {
    title: 'المسار',
    chip: 'المسار',
    onlyThis: 'هذه المحادثة فقط · حرّك الشريط',
    emptyTitle: 'لا مسار بعد',
    emptyBody: 'أرسل رسالة. الألوان تعلّم كل خطوة. تبديل المحادثة أو البوت لا يخلط السجلات.',
    idle: 'خامل',
    steps: (n) => `${n} خطوة`,
    running: (tags) => `جارٍ ${tags}`,
    clear: 'مسح هذه المحادثة',
    help: 'شرح المسار',
    helpBody: 'عمود مستقل على اليمين. حرّك شريط الألوان. لكل محادثة وبوت سجله.',
    none: 'لا مسار',
    lane: { input: 'دخل', model: 'نموذج', tools: 'أدوات' },
    kind: {
      user: 'أنت',
      context: 'سياق',
      thinking: 'فكر',
      message: 'رد',
      tool: 'أداة',
      subagent: 'فرع',
      approval: 'سؤال',
      error: 'خطأ'
    },
    legend: {
      user: 'أنت',
      context: 'سياق',
      thinking: 'تفكير',
      message: 'رد',
      tool: 'أداة',
      subagent: 'وكيل فرعي',
      approval: 'سؤال',
      error: 'خطأ'
    },
    evt: {
      round: (n) => `الدورة ${n}`,
      thinking: 'يفكر',
      writing: 'يكتب الرد',
      todo: 'تحديث المهام',
      tool: (name) => name || 'أداة',
      result: (name) => (name ? `${name} عاد` : 'نتيجة الأداة'),
      toolFailed: (name) => (name ? `${name} فشل` : 'فشل الأداة'),
      subagent: (name) => name || 'وكيل فرعي',
      subtool: (name) => name || 'أداة فرعية',
      clarify: 'يحتاج توضيحاً',
      approve: 'بانتظار الموافقة',
      compact: 'ضغط السياق',
      context: 'تحديث السياق',
      error: (msg) => msg || 'خطأ'
    }
  }
}

function visualKind(name) {
  return KIND_ALIAS[name] || (KIND[name] ? name : 'context')
}

function kindMeta(name) {
  return KIND[visualKind(name)]
}

function colorOf(kind, error) {
  if (error || kind === 'error') return KIND.error.color
  return kindMeta(kind).color
}

function tx(t, key, fallback, ...args) {
  const got = t(key, ...args)
  if (!got || got === key) return typeof fallback === 'function' ? fallback(...args) : fallback || key
  return got
}

function eventText(t, ev) {
  if (ev.textKey) return tx(t, ev.textKey, ev.label, ...(ev.args || []))
  return ev.label || '—'
}

function profileName(event) {
  return String((event && event.profile) || host.state.profile.get() || 'default')
}

function storedSid() {
  return host.state.focusedStoredSessionId.get() || ''
}

function runtimeSid() {
  return host.state.focusedSessionId.get() || host.state.activeSessionId.get() || ''
}

function scopeKey(profile, sid) {
  return `${profile || 'default'}::${sid || 'draft'}`
}

function liveKey() {
  return scopeKey(profileName(), storedSid() || runtimeSid() || 'draft')
}

function rememberAlias(runtime, stored) {
  if (!runtime || !stored || runtime === stored) return
  const cur = $aliases.get()
  if (cur[runtime] === stored) return
  $aliases.set({ ...cur, [runtime]: stored })
  persist()
}

function eventKey(event) {
  const evSid = String(event.session_id || event.sessionId || '')
  const stored = storedSid()
  const runtime = runtimeSid()
  const prof = profileName(event)
  if (evSid && stored) rememberAlias(evSid, stored)
  if (runtime && stored) rememberAlias(runtime, stored)
  if (!evSid || evSid === stored || evSid === runtime) {
    return scopeKey(prof, stored || runtime || 'draft')
  }
  const mapped = $aliases.get()[evSid]
  return scopeKey(prof, mapped || evSid)
}

function relatedKeys(canonical) {
  const [prof, sid] = (canonical || liveKey()).split('::')
  const keys = new Set([canonical, scopeKey(prof, sid)])
  const runtime = runtimeSid()
  const stored = storedSid()
  if (runtime) keys.add(scopeKey(prof, runtime))
  if (stored) keys.add(scopeKey(prof, stored))
  for (const [rt, st] of Object.entries($aliases.get())) {
    if (st === sid || rt === sid || st === stored || rt === runtime) {
      keys.add(scopeKey(prof, rt))
      keys.add(scopeKey(prof, st))
    }
  }
  return [...keys]
}

function emptyBucket() {
  return { seq: 0, events: [] }
}

function bucketOf(key) {
  return $buckets.get()[key] || emptyBucket()
}

function persist() {
  try {
    store.api &&
      store.api.set('traj-v3', {
        buckets: $buckets.get(),
        aliases: $aliases.get()
      })
  } catch {
    /* ignore */
  }
}

function writeBucket(key, next) {
  $buckets.set({ ...$buckets.get(), [key]: next })
  persist()
}

function pushEvent(key, kind, extra) {
  const b = bucketOf(key)
  const seq = b.seq + 1
  const item = {
    id: seq,
    kind,
    at: Date.now(),
    running: false,
    error: false,
    ...extra
  }
  const events =
    b.events.length >= MAX_EVENTS ? [...b.events.slice(b.events.length - MAX_EVENTS + 1), item] : [...b.events, item]
  writeBucket(key, { seq, events })
  return item.id
}

function patchEvent(key, id, patch) {
  const b = bucketOf(key)
  writeBucket(key, {
    seq: b.seq,
    events: b.events.map((e) => (e.id === id ? { ...e, ...patch } : e))
  })
}

function lastOf(key, kind, runningOnly) {
  const list = bucketOf(key).events
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (list[i].kind !== kind) continue
    if (runningOnly && !list[i].running) continue
    return list[i]
  }
  return null
}

function mergedEvents(canonical) {
  const seen = new Set()
  const out = []
  for (const key of relatedKeys(canonical)) {
    for (const ev of bucketOf(key).events) {
      const stamp = `${ev.at}:${ev.kind}:${ev.textKey || ev.label || ''}:${ev.id}`
      if (seen.has(stamp)) continue
      seen.add(stamp)
      out.push(ev)
    }
  }
  out.sort((a, b) => a.at - b.at || a.id - b.id)
  return out
}

function formatElapsed(ms) {
  if (!ms || ms < 0) return ''
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`
}

function useNow(active) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return undefined
    const timer = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(timer)
  }, [active])
  return now
}

function useViewEvents() {
  useValue($buckets)
  useValue($aliases)
  const key = useValue($viewKey)
  return mergedEvents(key)
}

function Timeline({ t }) {
  const events = useViewEvents()
  const selected = useValue($selected)
  const scroller = useRef(null)
  const follow = useRef(true)
  const width = Math.max(events.length * SPAN_W, 80)

  useEffect(() => {
    const el = scroller.current
    if (!el || !follow.current) return
    el.scrollLeft = el.scrollWidth
  }, [events.length, selected])

  return jsx('div', {
    style: {
      flex: 'none',
      borderBottom: '1px solid var(--ui-stroke-secondary)',
      background: 'var(--ui-bg-secondary, transparent)'
    },
    children: jsxs('div', {
      style: { display: 'grid', gridTemplateColumns: '40px minmax(0, 1fr)', height: 56 },
      children: [
        jsx('div', {
          style: {
            position: 'relative',
            borderRight: '1px solid var(--ui-stroke-secondary)',
            color: 'var(--ui-text-quaternary)',
            fontSize: 10
          },
          children: [
            ['input', 0],
            ['model', 1],
            ['tools', 2]
          ].map(([k, i]) =>
            jsx(
              'span',
              {
                style: {
                  position: 'absolute',
                  right: 4,
                  top: 8 + i * LANE_H,
                  height: SPAN_H,
                  display: 'flex',
                  alignItems: 'center'
                },
                children: tx(t, `lane.${k}`, k)
              },
              k
            )
          )
        }),
        jsx('div', {
          ref: scroller,
          onWheel: (e) => {
            const el = scroller.current
            if (!el) return
            const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
            if (!dx) return
            e.preventDefault()
            e.stopPropagation()
            el.scrollLeft += dx
            follow.current = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8
          },
          onScroll: () => {
            const el = scroller.current
            if (!el) return
            follow.current = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8
          },
          style: { position: 'relative', overflowX: 'auto', overflowY: 'hidden', cursor: 'ew-resize' },
          children: jsx('div', {
            style: { position: 'relative', width, height: 56, minWidth: '100%' },
            children:
              events.length === 0
                ? jsx('div', {
                    style: {
                      position: 'absolute',
                      inset: 0,
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--ui-text-quaternary)',
                      fontSize: 11
                    },
                    children: tx(t, 'none', '—')
                  })
                : events.map((ev, i) => {
                    const meta = kindMeta(ev.kind)
                    return jsx(
                      'button',
                      {
                        type: 'button',
                        title: `${tx(t, `kind.${visualKind(ev.kind)}`, ev.kind)} ${eventText(t, ev)}`,
                        onClick: () => $selected.set(ev.id),
                        style: {
                          position: 'absolute',
                          top: 8 + meta.lane * LANE_H,
                          left: i * SPAN_W + 1,
                          width: SPAN_W - 2,
                          height: SPAN_H,
                          border: 'none',
                          borderRadius: 1,
                          padding: 0,
                          cursor: 'pointer',
                          background: colorOf(ev.kind, ev.error),
                          opacity: selected && selected !== ev.id ? 0.22 : ev.running ? 1 : 0.88,
                          boxShadow: selected === ev.id ? '0 0 0 1px var(--ui-accent)' : 'none'
                        }
                      },
                      `${ev.at}-${ev.id}`
                    )
                  })
          })
        })
      ]
    })
  })
}

function Legend({ t }) {
  const items = ['user', 'context', 'thinking', 'message', 'tool', 'subagent', 'approval', 'error']
  return jsx('div', {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '7px 10px',
      padding: '8px 10px',
      borderBottom: '1px solid var(--ui-stroke-secondary)',
      fontSize: 11,
      color: 'var(--ui-text-tertiary)'
    },
    children: items.map((kind) =>
      jsxs(
        'span',
        {
          style: { display: 'inline-flex', alignItems: 'center', gap: 5 },
          children: [
            jsx('span', {
              style: { width: 10, height: 8, borderRadius: 1, background: colorOf(kind, kind === 'error') }
            }),
            tx(t, `legend.${kind}`, kind)
          ]
        },
        kind
      )
    )
  })
}

function EventRow({ ev, now, t }) {
  const selected = useValue($selected)
  const vk = visualKind(ev.kind)
  const dur = ev.running ? formatElapsed(now - ev.at) : ev.ms != null ? formatElapsed(ev.ms) : ''
  const c = colorOf(ev.kind, ev.error)
  return jsxs('button', {
    type: 'button',
    onClick: () => $selected.set(ev.id === selected ? null : ev.id),
    className: cn('flex w-full items-center gap-2 px-2.5 text-left'),
    style: {
      height: 36,
      border: '1px solid var(--ui-stroke-secondary)',
      borderRadius: 8,
      background: selected === ev.id ? 'color-mix(in srgb, var(--ui-accent) 10%, transparent)' : 'transparent'
    },
    children: [
      jsx('span', {
        className: 'w-7 shrink-0 tabular-nums text-[11px] text-(--ui-text-quaternary)',
        children: ev.id
      }),
      jsx('span', {
        className:
          'inline-flex h-[22px] min-w-[52px] shrink-0 items-center justify-center rounded-md px-1 text-[10px] font-medium',
        style: {
          color: c,
          background: `color-mix(in srgb, ${c} 16%, transparent)`,
          border: `1px solid color-mix(in srgb, ${c} 35%, transparent)`
        },
        children: tx(t, `kind.${vk}`, vk)
      }),
      jsx('span', {
        className: 'min-w-0 flex-1 truncate text-[12px] text-foreground',
        children: eventText(t, ev)
      }),
      dur
        ? jsx('span', {
            className: 'shrink-0 tabular-nums text-[11px] text-(--ui-text-quaternary)',
            children: ev.running ? `${dur}…` : dur
          })
        : null
    ]
  })
}

function TrajectoryPane() {
  const t = usePluginI18n(ID)
  const events = useViewEvents()
  const key = useValue($viewKey)
  const busy = useValue(host.state.busy)
  const now = useNow(busy || events.some((e) => e.running))
  const running = events.filter((e) => e.running)
  const [bot, sess] = (key || 'default::draft').split('::')
  const tags = running.map((e) => tx(t, `kind.${visualKind(e.kind)}`, e.kind)).join(' · ')

  return jsxs('div', {
    className: 'flex h-full min-h-0 flex-col',
    children: [
      jsxs('div', {
        className: 'flex items-center justify-between gap-2 border-b px-2.5 py-1.5 text-[11px]',
        style: { borderColor: 'var(--ui-stroke-secondary)', color: 'var(--ui-text-quaternary)' },
        children: [
          jsx(Tip, {
            label: key,
            children: jsx('span', { className: 'min-w-0 truncate', children: `${bot} · ${String(sess).slice(0, 10)}` })
          }),
          jsx('span', { children: tx(t, 'onlyThis', '') })
        ]
      }),
      jsx(Timeline, { t }),
      jsx(Legend, { t }),
      jsxs('div', {
        className: 'flex items-center justify-between gap-2 px-2.5 py-1.5 text-[11px] text-(--ui-text-quaternary)',
        children: [
          jsx('span', {
            children: running.length
              ? tx(t, 'running', '', tags)
              : events.length
                ? tx(t, 'steps', `${events.length}`, events.length)
                : tx(t, 'idle', '')
          }),
          events.length
            ? jsx('button', {
                type: 'button',
                className: 'text-(--ui-text-tertiary) hover:text-foreground',
                onClick: () => {
                  for (const k of relatedKeys($viewKey.get())) writeBucket(k, emptyBucket())
                  $selected.set(null)
                },
                children: tx(t, 'clear', 'Clear')
              })
            : null
        ]
      }),
      events.length === 0
        ? jsxs('div', {
            className: 'flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center',
            children: [
              jsx('div', { className: 'text-sm font-medium', children: tx(t, 'emptyTitle', '') }),
              jsx('div', {
                className: 'max-w-[230px] text-xs text-(--ui-text-tertiary)',
                children: tx(t, 'emptyBody', '')
              })
            ]
          })
        : jsx('div', {
            className: 'min-h-0 flex-1 overflow-y-auto',
            children: jsx('div', {
              className: 'flex flex-col gap-1.5 p-2',
              children: [...events].reverse().map((ev) => jsx(EventRow, { ev, now, t }, `${ev.at}-${ev.id}`))
            })
          })
    ]
  })
}

function StatusChip() {
  const t = usePluginI18n(ID)
  const events = useViewEvents()
  const last = events[events.length - 1]
  return jsx(Tip, {
    label: last ? `${tx(t, `kind.${visualKind(last.kind)}`, last.kind)} ${eventText(t, last)}` : tx(t, 'chip', 'Trajectory'),
    children: jsxs('span', {
      className: cn('inline-flex h-full items-center gap-1.5 px-1.5 text-[0.6875rem]', 'text-(--ui-text-tertiary)'),
      children: [
        jsx('span', {
          style: {
            width: 8,
            height: 6,
            borderRadius: 1,
            background: last ? colorOf(last.kind, last.error) : 'var(--ui-text-quaternary)'
          }
        }),
        jsx('span', { children: tx(t, 'chip', 'Trajectory') })
      ]
    })
  })
}

function listenSafe(target, fn) {
  try {
    if (target && typeof target.listen === 'function') return target.listen(fn)
  } catch {
    /* older desktop */
  }
  return () => {}
}

function finishOpen(key, bag) {
  for (const [mapKey, hit] of bag) {
    if (hit.key !== key) continue
    const ev = bucketOf(key).events.find((e) => e.id === hit.id)
    if (ev && ev.running) patchEvent(key, hit.id, { running: false, ms: Date.now() - hit.at })
    bag.delete(mapKey)
  }
}

export default {
  id: ID,
  name: 'Trajectory',
  defaultEnabled: true,
  register(ctx) {
    store.api = ctx.storage
    try {
      ctx.i18n.register(LOCALES)
    } catch {
      /* older desktop */
    }

    const saved = ctx.storage.get('traj-v3') || ctx.storage.get('traj-v2')
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      if (saved.buckets) {
        $buckets.set(saved.buckets)
        if (saved.aliases) $aliases.set(saved.aliases)
      } else {
        $buckets.set(saved)
      }
    }
    $viewKey.set(liveKey())

    const syncView = () => {
      const stored = storedSid()
      const runtime = runtimeSid()
      if (stored && runtime) rememberAlias(runtime, stored)
      const next = liveKey()
      if (next !== $viewKey.get()) {
        $viewKey.set(next)
        $selected.set(null)
      }
    }
    const offProfile = listenSafe(host.state.profile, syncView)
    const offFocus = listenSafe(host.state.focusedSessionId, syncView)
    const offStored = listenSafe(host.state.focusedStoredSessionId, syncView)

    const thinking = new Map()
    const writing = new Map()
    const tools = new Map()
    const agents = new Map()

    const offBusy = listenSafe(host.state.busy, (busy) => {
      const key = liveKey()
      if (busy) {
        if (!thinking.has(key) && !lastOf(key, 'thinking', true)) {
          thinking.set(key, { id: pushEvent(key, 'thinking', { textKey: 'evt.thinking', running: true }), key, at: Date.now() })
        }
      } else {
        finishOpen(key, thinking)
        finishOpen(key, writing)
      }
    })

    const off = host.onEvent('*', (event) => {
      if (!event || !event.type) return
      const key = eventKey(event)
      const type = event.type
      const payload = event.payload || {}
      const name = String(payload.name || payload.tool || payload.tool_name || payload.goal || '').trim()

      if (type === 'message.start') {
        thinking.delete(key)
        writing.delete(key)
        const rounds = bucketOf(key).events.filter((e) => e.kind === 'user').length + 1
        pushEvent(key, 'user', { textKey: 'evt.round', args: [rounds] })
        return
      }
      if (type === 'reasoning.delta' || type === 'thinking.delta' || type === 'reasoning.available') {
        if (!thinking.has(key)) {
          thinking.set(key, { id: pushEvent(key, 'thinking', { textKey: 'evt.thinking', running: true }), key, at: Date.now() })
        }
        return
      }
      if (type === 'message.delta' || type === 'message.interim') {
        if (!writing.has(key)) {
          writing.set(key, { id: pushEvent(key, 'message', { textKey: 'evt.writing', running: true }), key, at: Date.now() })
        }
        return
      }
      if (type === 'tool.start' || type === 'tool.generating') {
        const tkey = `${key}::${payload.tool_id || payload.id || name || Date.now()}`
        if (!tools.has(tkey)) {
          const kind = name === 'delegate_task' || payload.parent ? 'subtool' : 'tool'
          const textKey = name === 'todo' ? 'evt.todo' : 'evt.tool'
          tools.set(tkey, {
            id: pushEvent(key, kind, {
              textKey,
              args: name === 'todo' ? [] : [name],
              running: true,
              at: Date.now()
            }),
            at: Date.now(),
            key
          })
        }
        return
      }
      if (type === 'tool.complete') {
        const suffix = String(payload.tool_id || payload.id || name || '')
        let hit = tools.get(`${key}::${suffix}`)
        if (!hit) {
          for (const v of tools.values()) {
            if (v.key === key) hit = v
          }
        }
        if (hit) {
          const failed = Boolean(payload.is_error || payload.error)
          patchEvent(key, hit.id, { running: false, ms: Date.now() - hit.at, error: failed })
          pushEvent(key, failed ? 'error' : 'result', {
            textKey: failed ? 'evt.toolFailed' : 'evt.result',
            args: [name]
          })
          for (const [k, v] of tools) {
            if (v === hit) tools.delete(k)
          }
        }
        return
      }
      if (String(type).startsWith('subagent.')) {
        if (type === 'subagent.start' || type === 'subagent.spawn_requested') {
          if (!agents.has(key)) {
            agents.set(key, {
              id: pushEvent(key, 'subagent', { textKey: 'evt.subagent', args: [name], running: true }),
              key,
              at: Date.now()
            })
          }
        } else if (type === 'subagent.complete') {
          const hit = agents.get(key)
          if (hit) {
            patchEvent(key, hit.id, { running: false, ms: Date.now() - hit.at })
            agents.delete(key)
          }
        } else if (type === 'subagent.tool' || type === 'subagent.progress') {
          pushEvent(key, 'subtool', { textKey: 'evt.subtool', args: [name] })
        }
        return
      }
      if (
        type === 'approval.request' ||
        type === 'clarify.request' ||
        type === 'sudo.request' ||
        type === 'secret.request'
      ) {
        pushEvent(key, 'approval', { textKey: type === 'clarify.request' ? 'evt.clarify' : 'evt.approve' })
        return
      }
      if (type === 'status.update') {
        const text = String(payload.status || payload.message || payload.phase || '')
        if (/compact/i.test(text)) pushEvent(key, 'compacted', { textKey: 'evt.compact' })
        return
      }
      if (type === 'error') {
        pushEvent(key, 'error', { textKey: 'evt.error', args: [String(payload.message || payload.error || '')] })
        return
      }
      if (type === 'session.usage') {
        const last = lastOf(key, 'context', false)
        if (!last || Date.now() - last.at > 4000) pushEvent(key, 'context', { textKey: 'evt.context' })
        return
      }
      if (type === 'message.complete') {
        finishOpen(key, thinking)
        finishOpen(key, writing)
        finishOpen(key, tools)
        finishOpen(key, agents)
      }
    })

    const disposeUi = ctx.registerMany([
      {
        id: 'side',
        area: 'panes',
        title: ctx.i18n.t('title') || 'Trajectory',
        data: {
          placement: 'main',
          minWidth: '22rem',
          width: '300px',
          dock: { pane: 'workspace', pos: 'right' }
        },
        render: () => jsx(TrajectoryPane, {})
      },
      {
        id: 'chip',
        area: STATUSBAR_AREAS.right,
        order: 118,
        render: () => jsx(StatusChip, {})
      },
      {
        id: 'help',
        area: PALETTE_AREA,
        data: {
          id: 'harness-progress.help',
          label: ctx.i18n.t('help') || 'Trajectory',
          keywords: ['轨迹', '軌跡', 'trajectory', '軌跡', 'المسار', 'harness'],
          run: () =>
            host.notify({
              kind: 'info',
              title: ctx.i18n.t('title') || 'Trajectory',
              message: ctx.i18n.t('helpBody') || ''
            })
        }
      }
    ])

    return () => {
      off && off()
      offBusy && offBusy()
      offProfile && offProfile()
      offFocus && offFocus()
      offStored && offStored()
      disposeUi && disposeUi()
    }
  }
}
