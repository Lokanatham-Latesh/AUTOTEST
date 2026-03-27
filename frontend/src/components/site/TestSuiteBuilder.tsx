import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Connection,
  type NodeMouseHandler,
  type EdgeMouseHandler,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { X, ChevronDown, ChevronRight, Trash2, GitMerge, Flag, Plus } from 'lucide-react'
import { useGetSiteAttributes } from '@/utils/queries/siteAttributeQuery'
import { useQuery } from '@tanstack/react-query'
import { siteApi } from '@/utils/apis/siteApi'
import api from '@/utils/axios'
import type { FlowDefinition, FlowNodeData, TestSuite } from '@/types/testSuite'

// ─── Custom Node Components ──────────────────────────────────────────────────

const StartNode = ({ data }: { data: FlowNodeData }) => (
  <div className="px-5 py-2 rounded-full bg-emerald-500 text-white text-xs font-semibold shadow border-2 border-emerald-600 min-w-[80px] text-center">
    {data.label}
    <Handle type="source" position={Position.Bottom} style={{ background: '#10b981', border: '2px solid #fff' }} />
  </div>
)

const EndNode = ({ data }: { data: FlowNodeData }) => (
  <div className="px-5 py-2 rounded-full bg-[#fc0101] text-white text-xs font-semibold shadow border-2 border-red-700 min-w-[80px] text-center">
    <Handle type="target" position={Position.Top} style={{ background: '#fc0101', border: '2px solid #fff' }} />
    {data.label}
  </div>
)

const StepNode = ({ data, selected }: { data: FlowNodeData; selected?: boolean }) => {
  const tcCount = (data.test_case_ids as number[] | undefined)?.length ?? 0
  const attrs = (data.site_attributes as Array<{ key: string; value: string }> | undefined) ?? []
  return (
    <div
      className={`bg-white rounded-lg shadow border-l-4 border-l-[#fc0101] min-w-[190px] max-w-[230px] text-xs transition-all ${
        selected ? 'ring-2 ring-[#fc0101] ring-offset-1' : 'border border-[#E4D7D7]'
      }`}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#fc0101', border: '2px solid #fff' }} />
      <div className="bg-[#FFF8F8] px-3 py-1.5 rounded-tl-md rounded-tr-[6px] border-b border-[#E4D7D7]">
        <div className="flex items-start justify-between gap-1">
          <p className="font-semibold text-[#333] truncate flex-1 leading-snug">
            {data.scenario_title || data.label}
          </p>
          {attrs.length > 0 && (
            <span className="shrink-0 mt-0.5 w-2 h-2 rounded-full bg-blue-500 block" />
          )}
        </div>
      </div>
      <div className="px-3 py-1.5 flex items-center gap-1.5 flex-wrap">
        {data.category && (
          <span className="text-[9px] bg-[#f6f3f3] text-gray-500 rounded px-1.5 py-0.5 border border-[#E4D7D7]">
            {data.category}
          </span>
        )}
        {tcCount > 0 && (
          <span className="text-[9px] bg-red-50 text-[#fc0101] rounded px-1.5 py-0.5 border border-red-200 ml-auto">
            {tcCount} TC
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#fc0101', border: '2px solid #fff' }} />
    </div>
  )
}

const BranchNode = ({ data, selected }: { data: FlowNodeData; selected?: boolean }) => (
  <div
    className={`relative flex items-center justify-center w-[120px] h-[50px] rotate-45 bg-amber-100 border-2 border-amber-400 shadow transition-all ${
      selected ? 'ring-2 ring-amber-400 ring-offset-1' : ''
    }`}
  >
    {/* Handles are placed before rotation compensation so they render at correct edges */}
    <Handle type="target" position={Position.Top} style={{ background: '#f59e0b', border: '2px solid #fff', top: -6 }} />
    <span className="-rotate-45 text-[10px] font-semibold text-amber-700 text-center px-2">
      {data.label}
    </span>
    <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: '#f59e0b', border: '2px solid #fff', bottom: -6 }} />
    <Handle type="source" position={Position.Left} id="left" style={{ background: '#f59e0b', border: '2px solid #fff', left: -6 }} />
    <Handle type="source" position={Position.Right} id="right" style={{ background: '#f59e0b', border: '2px solid #fff', right: -6 }} />
  </div>
)

const SuiteRefNode = ({ data, selected }: { data: FlowNodeData; selected?: boolean }) => {
  const attrs = (data.site_attributes as Array<{ key: string; value: string }> | undefined) ?? []
  return (
    <div
      className={`bg-blue-50 rounded-lg shadow border-l-4 border-l-blue-500 min-w-[190px] max-w-[230px] text-xs transition-all ${
        selected ? 'ring-2 ring-blue-400 ring-offset-1' : 'border border-blue-200'
      }`}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#3b82f6', border: '2px solid #fff' }} />
      <div className="bg-blue-50 px-3 py-1.5 rounded-t-md border-b border-blue-200">
        <div className="flex items-start justify-between gap-1">
          <p className="font-semibold text-blue-700 truncate flex-1">{data.label}</p>
          {attrs.length > 0 && (
            <span className="shrink-0 mt-0.5 w-2 h-2 rounded-full bg-blue-500 block" />
          )}
        </div>
      </div>
      <div className="px-3 py-1.5">
        <span className="text-[9px] bg-blue-100 text-blue-600 rounded px-1.5 py-0.5">
          Suite Reference
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#3b82f6', border: '2px solid #fff' }} />
    </div>
  )
}

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  step: StepNode,
  branch: BranchNode,
  'suite-ref': SuiteRefNode,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const START_NODE: Node = {
  id: 'node-start',
  type: 'start',
  position: { x: 300, y: 0 },
  data: { label: 'START', node_type: 'start' },
}

function buildAutoLayout(stepNodes: Node[]): Node[] {
  const X_CENTER = 300
  const Y_STEP = 160
  return stepNodes.map((n, i) => ({ ...n, position: { x: X_CENTER, y: (i + 1) * Y_STEP } }))
}

function buildSequentialEdges(nodes: Node[]): Edge[] {
  const edges: Edge[] = []
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: `edge-${nodes[i].id}-${nodes[i + 1].id}`,
      source: nodes[i].id,
      target: nodes[i + 1].id,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#E4D7D7', strokeWidth: 2 },
    })
  }
  return edges
}

// ─── Edge Condition Modal ─────────────────────────────────────────────────────

interface EdgeConditionModalProps {
  edge: Edge | null
  onSave: (edgeId: string, label: string, condition: { field: string; op: string; value: string } | null) => void
  onClose: () => void
}

const EdgeConditionModal: React.FC<EdgeConditionModalProps> = ({ edge, onSave, onClose }) => {
  const [label, setLabel] = useState(edge?.label as string || '')
  const [field, setField] = useState((edge?.data as any)?.condition?.field || '')
  const [op, setOp] = useState((edge?.data as any)?.condition?.op || 'eq')
  const [value, setValue] = useState((edge?.data as any)?.condition?.value || '')

  if (!edge) return null

  const handleSave = () => {
    const condition = field ? { field, op, value } : null
    onSave(edge.id, label, condition)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-[400px]">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="font-semibold text-sm">Edge Condition</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-[11px] text-[#8B6E6E] font-medium">Label</label>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Login passed"
              className="mt-1 w-full border border-[#E4D7D7] rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#fc0101]" />
          </div>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Condition (optional)</p>
          <div className="flex gap-2">
            <input value={field} onChange={e => setField(e.target.value)} placeholder="field (e.g. _outcome)"
              className="flex-1 border border-[#E4D7D7] rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#fc0101]" />
            <select value={op} onChange={e => setOp(e.target.value)}
              className="border border-[#E4D7D7] rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#fc0101]">
              <option value="eq">eq</option>
              <option value="neq">neq</option>
              <option value="gt">gt</option>
              <option value="lt">lt</option>
              <option value="contains">contains</option>
            </select>
            <input value={value} onChange={e => setValue(e.target.value)} placeholder="value"
              className="flex-1 border border-[#E4D7D7] rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#fc0101]" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <button onClick={onClose} className="text-sm border border-gray-300 rounded px-4 py-1.5 cursor-pointer hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} className="text-sm bg-[#fc0101] text-white rounded px-4 py-1.5 cursor-pointer hover:bg-red-700">Save</button>
        </div>
      </div>
    </div>
  )
}

// ─── Node Info Panel ──────────────────────────────────────────────────────────

interface NodeInfoPanelProps {
  node: Node | null
  siteAttributes: { id: number; attribute_key: string; attribute_title: string }[]
  isAttrsLoading?: boolean
  onUpdate: (nodeId: string, changes: Partial<FlowNodeData>) => void
  onClose: () => void
}

const NodeInfoPanel: React.FC<NodeInfoPanelProps> = ({ node, siteAttributes, isAttrsLoading, onUpdate, onClose }) => {
  const data = node?.data as FlowNodeData | undefined
  const [attrs, setAttrs] = useState<Array<{ key: string; value: string }>>([])
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  useEffect(() => {
    setAttrs((data?.site_attributes as Array<{ key: string; value: string }> | undefined) ?? [])
    setNewKey('')
    setNewValue('')
  }, [node?.id])

  if (!node || !data || data.node_type === 'start' || data.node_type === 'end') return null

  const addAttr = () => {
    if (!newKey) return
    const updated = attrs.filter(a => a.key !== newKey).concat({ key: newKey, value: newValue })
    setAttrs(updated)
    onUpdate(node.id, { site_attributes: updated })
    setNewKey('')
    setNewValue('')
  }

  const removeAttr = (key: string) => {
    const updated = attrs.filter(a => a.key !== key)
    setAttrs(updated)
    onUpdate(node.id, { site_attributes: updated })
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#E4D7D7] z-10 shadow-lg rounded-b-lg">
      <div className="flex items-center justify-between bg-[#FFF8F8] border-b border-[#E4D7D7] px-4 py-2">
        <h4 className="text-xs font-semibold text-[#333] truncate max-w-[60%]">
          {data.scenario_title || data.suite_title || data.label}
        </h4>
        <div className="flex items-center gap-3">
          {data.node_reference_type === 'test_scenario' && (
            <span className="text-[10px] text-gray-400">
              {(data.test_case_ids as number[] | undefined)?.length ?? 0} test cases ·{' '}
              <span className="text-[#8B6E6E]">{data.category}</span>
            </span>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="px-4 py-3 text-xs">
        <p className="text-[10px] text-[#8B6E6E] font-medium mb-1.5">
          Site Attributes
          {attrs.length > 0 && <span className="ml-1 text-blue-500">({attrs.length})</span>}
        </p>

        {attrs.length > 0 && (
          <div className="mb-2 space-y-1">
            {attrs.map(a => (
              <div key={a.key} className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded px-2 py-1">
                <span className="text-[10px] text-blue-700 font-medium shrink-0">{a.key}</span>
                <span className="text-[10px] text-gray-400">:</span>
                <span className="text-[10px] text-gray-700 flex-1 truncate">{a.value || '—'}</span>
                <button onClick={() => removeAttr(a.key)} className="text-red-400 hover:text-red-600 cursor-pointer shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new attribute */}
        <div className="flex gap-1.5 items-center">
          <select
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            disabled={isAttrsLoading}
            className="flex-1 border border-[#E4D7D7] rounded px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-[#fc0101] min-w-0 disabled:opacity-60"
          >
            <option value="">
              {isAttrsLoading ? 'Loading attributes…' : siteAttributes.length === 0 ? 'No attributes defined' : 'Select attribute key…'}
            </option>
            {siteAttributes
              .filter(a => !attrs.some(ex => ex.key === a.attribute_key))
              .map(a => (
                <option key={a.id} value={a.attribute_key}>
                  {a.attribute_key}
                </option>
              ))}
          </select>
          <input
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addAttr()}
            placeholder="value"
            className="w-24 border border-[#E4D7D7] rounded px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-[#fc0101]"
          />
          <button
            onClick={addAttr}
            disabled={!newKey}
            className="bg-[#fc0101] text-white rounded px-2 py-1 cursor-pointer hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Builder Component ───────────────────────────────────────────────────

interface TestSuiteBuilderProps {
  siteId: number
  editSuite?: TestSuite | null
  onClose: () => void
  onSaved: () => void
  onSave: (payload: {
    title: string
    description: string
    status: string
    flow_definition: FlowDefinition
    scenario_count: number
    test_case_count: number
  }) => void
  isSaving: boolean
}

interface PageItem {
  id: number
  page_title?: string
  page_url: string
}

interface ScenarioItem {
  id: number
  title: string
  category: string
  page_id: number
}

interface TestCaseItem {
  id: number
  title: string
  type: string
  is_valid: boolean
}

const TestSuiteBuilder: React.FC<TestSuiteBuilderProps> = ({
  siteId,
  editSuite,
  onClose,
  onSave,
  isSaving,
}) => {
  // Form state
  const [title, setTitle] = useState(editSuite?.title || '')
  const [description, setDescription] = useState(editSuite?.description || '')

  // Selection tree state
  const [expandedPages, setExpandedPages] = useState<Set<number>>(new Set())
  const [expandedScenarios, setExpandedScenarios] = useState<Set<number>>(new Set())
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<number[]>([])
  const [checkedTestCases, setCheckedTestCases] = useState<Record<number, number[]>>({})
  const [scenarioTestCases, setScenarioTestCases] = useState<Record<number, TestCaseItem[]>>({})
  const [loadingTCs, setLoadingTCs] = useState<Set<number>>(new Set())

  // Suite reference picker
  const [leftTab, setLeftTab] = useState<'pages' | 'suites'>('pages')
  const [selectedSuiteRefIds, setSelectedSuiteRefIds] = useState<number[]>([])

  // Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([START_NODE])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [edgeModal, setEdgeModal] = useState<Edge | null>(null)
  const [branchLabelInput, setBranchLabelInput] = useState('')
  const [endLabelInput, setEndLabelInput] = useState('')
  const [pageSearch, setPageSearch] = useState('')

  // ── Data queries ─────────────────────────────────────────────────────────
  const { data: pagesData } = useQuery({
    queryKey: ['site-pages-all', siteId],
    queryFn: () => siteApi.getPagesBySite({ siteId, page: 1, limit: 100 }),
    enabled: !!siteId,
  })

  const { data: attrData, isLoading: isAttrsLoading } = useGetSiteAttributes(siteId)
  const siteAttributes = useMemo(() => attrData?.items ?? [], [attrData])

  // Other test suites (for reference nodes)
  const { data: suitesData } = useQuery({
    queryKey: ['test-suites', siteId],
    queryFn: () => import('@/utils/apis/testSuiteApi').then(m => m.testSuiteApi.listTestSuites(siteId)),
    enabled: !!siteId,
  })
  // Memoize to avoid new array references on every render (prevents infinite useEffect loops)
  const otherSuites = useMemo(
    () => (suitesData?.items ?? []).filter(s => s.id !== editSuite?.id),
    [suitesData, editSuite?.id],
  )
  const pages = useMemo<PageItem[]>(() => pagesData?.data ?? [], [pagesData])

  // ── Load test cases for a scenario lazily ───────────────────────────────
  // Use a ref so the callback stays stable (doesn't recreate when state changes)
  const [pageScenarios, setPageScenarios] = useState<Record<number, ScenarioItem[]>>({})
  const [loadingScenarios, setLoadingScenarios] = useState<Set<number>>(new Set())

  const pageScenariosRef = useRef(pageScenarios)
  pageScenariosRef.current = pageScenarios

  const scenarioTestCasesRef = useRef(scenarioTestCases)
  scenarioTestCasesRef.current = scenarioTestCases

  const loadTestCases = useCallback(async (scenarioId: number) => {
    if (scenarioTestCasesRef.current[scenarioId]) return
    setLoadingTCs(prev => new Set(prev).add(scenarioId))
    try {
      const { data } = await api.get('/test-cases', { params: { scenario_id: scenarioId } })
      const tcs: TestCaseItem[] = data
      setScenarioTestCases(prev => ({ ...prev, [scenarioId]: tcs }))
      setCheckedTestCases(prev => ({
        ...prev,
        [scenarioId]: prev[scenarioId] ?? tcs.map(tc => tc.id),
      }))
    } finally {
      setLoadingTCs(prev => { const s = new Set(prev); s.delete(scenarioId); return s })
    }
  }, []) // stable — uses ref instead of state directly

  // ── Load scenarios for a page lazily ────────────────────────────────────
  const loadScenarios = useCallback(async (pageId: number) => {
    if (pageScenariosRef.current[pageId]) return
    setLoadingScenarios(prev => new Set(prev).add(pageId))
    try {
      const { data } = await api.get('/scenarios', { params: { page_id: pageId, limit: 100 } })
      setPageScenarios(prev => ({ ...prev, [pageId]: data.data || [] }))
    } finally {
      setLoadingScenarios(prev => { const s = new Set(prev); s.delete(pageId); return s })
    }
  }, []) // stable — uses ref instead of state directly

  const togglePage = (pageId: number) => {
    setExpandedPages(prev => {
      const next = new Set(prev)
      if (next.has(pageId)) { next.delete(pageId) } else { next.add(pageId); loadScenarios(pageId) }
      return next
    })
  }

  const toggleScenario = (scId: number) => {
    setExpandedScenarios(prev => {
      const next = new Set(prev)
      if (next.has(scId)) { next.delete(scId) } else { next.add(scId); loadTestCases(scId) }
      return next
    })
  }

  // ── Initialize from editSuite ────────────────────────────────────────────
  useEffect(() => {
    if (!editSuite?.flow_definition) return
    const { nodes: fn, edges: fe } = editSuite.flow_definition
    if (fn?.length) {
      setNodes(fn as Node[])

      // Restore scenario selection checkboxes
      const scIds = fn
        .filter(n => n.type === 'step' && n.data.node_reference_type === 'test_scenario')
        .map(n => n.data.node_reference_id as number)
        .filter(Boolean)
      setSelectedScenarioIds(scIds)

      // Restore test case selections from node data
      const tcMap: Record<number, number[]> = {}
      fn.forEach(n => {
        if (n.type === 'step' && n.data.node_reference_type === 'test_scenario' && n.data.test_case_ids) {
          tcMap[n.data.node_reference_id as number] = n.data.test_case_ids as number[]
        }
      })
      setCheckedTestCases(tcMap)

      // Restore suite reference selections
      const suiteIds = fn
        .filter(n => n.type === 'suite-ref')
        .map(n => n.data.node_reference_id as number)
        .filter(Boolean)
      setSelectedSuiteRefIds(suiteIds)
    }
    if (fe?.length) {
      setEdges(
        fe.map(e => ({
          ...(e as unknown as Edge),
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#E4D7D7', strokeWidth: 2 },
        })),
      )
    }
  }, [editSuite])

  // ── Rebuild flow when selection changes ──────────────────────────────────
  useEffect(() => {
    if (editSuite) return // don't auto-rebuild when editing

    const stepNodes: Node[] = selectedScenarioIds.map((scId, i) => {
      const sc = Object.values(pageScenarios).flat().find(s => s.id === scId)
      const pg = pages.find(p => p.id === sc?.page_id)
      return {
        id: `node-sc-${scId}`,
        type: 'step',
        position: { x: 300, y: (i + 1) * 160 },
        data: {
          label: pg?.page_title || pg?.page_url || 'Page',
          node_type: 'step',
          node_reference_type: 'test_scenario',
          node_reference_id: scId,
          page_id: sc?.page_id,
          scenario_id: scId,
          scenario_title: sc?.title,
          category: sc?.category,
          test_case_ids: checkedTestCases[scId] || [],
        } as FlowNodeData,
      }
    })

    const suiteRefNodes: Node[] = selectedSuiteRefIds.map((sid, i) => {
      const suite = otherSuites.find(s => s.id === sid)
      return {
        id: `node-suite-${sid}`,
        type: 'suite-ref',
        position: { x: 300, y: (selectedScenarioIds.length + i + 1) * 160 },
        data: {
          label: suite?.title || 'Test Suite',
          node_type: 'step',
          node_reference_type: 'test_suite',
          node_reference_id: sid,
          suite_id: sid,
          suite_title: suite?.title,
        } as FlowNodeData,
      }
    })

    const allSteps = [...stepNodes, ...suiteRefNodes]
    const allNodes = [START_NODE, ...buildAutoLayout(allSteps)]
    const allEdges = buildSequentialEdges(allNodes)

    setNodes(allNodes)
    setEdges(allEdges)
  }, [selectedScenarioIds, selectedSuiteRefIds, checkedTestCases, pageScenarios, pages, otherSuites, editSuite])

  // ── Scenario selection ───────────────────────────────────────────────────
  // Set of scenario IDs currently present as nodes — prevents adding the same scenario twice
  const scenariosInFlow = useMemo(
    () => new Set(
      nodes
        .filter(n => n.type === 'step' && (n.data as FlowNodeData).node_reference_type === 'test_scenario')
        .map(n => (n.data as FlowNodeData).node_reference_id as number),
    ),
    [nodes],
  )

  const toggleScenarioSelection = (scId: number) => {
    // If it's already a node in the flow but NOT in our selection state (e.g. manually deleted node),
    // don't allow re-adding until removed — handled by the disabled check in the tree render.
    setSelectedScenarioIds(prev =>
      prev.includes(scId) ? prev.filter(id => id !== scId) : [...prev, scId]
    )
    loadTestCases(scId)
  }

  const toggleTestCase = (scenarioId: number, tcId: number) => {
    setCheckedTestCases(prev => {
      const curr = prev[scenarioId] || []
      return {
        ...prev,
        [scenarioId]: curr.includes(tcId) ? curr.filter(id => id !== tcId) : [...curr, tcId],
      }
    })
  }

  const toggleSuiteRef = (suiteId: number) => {
    setSelectedSuiteRefIds(prev =>
      prev.includes(suiteId) ? prev.filter(id => id !== suiteId) : [...prev, suiteId]
    )
  }

  // ── Flow interactions ────────────────────────────────────────────────────
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(eds =>
        addEdge(
          { ...connection, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#E4D7D7', strokeWidth: 2 } },
          eds,
        ),
      )
    },
    [setEdges],
  )

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNode(node)
  }, [])

  const onEdgeDoubleClick: EdgeMouseHandler = useCallback((_event, edge) => {
    setEdgeModal(edge)
  }, [])

  const onPaneClick = useCallback(() => setSelectedNode(null), [])

  const handleEdgeConditionSave = (edgeId: string, label: string, condition: { field: string; op: string; value: string } | null) => {
    setEdges(eds =>
      eds.map(e =>
        e.id === edgeId
          ? { ...e, label: label || undefined, data: { ...e.data, condition } }
          : e,
      ),
    )
    setEdgeModal(null)
  }

  const updateNodeData = (nodeId: string, changes: Partial<FlowNodeData>) => {
    setNodes(nds =>
      nds.map(n =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...changes } } : n,
      ),
    )
    setSelectedNode(prev =>
      prev?.id === nodeId ? { ...prev, data: { ...prev.data, ...changes } } : prev,
    )
  }

  const addBranchNode = () => {
    const label = branchLabelInput.trim() || 'Branch'
    const id = `node-branch-${Date.now()}`
    setNodes(prev => [
      ...prev,
      {
        id,
        type: 'branch',
        position: { x: 300, y: prev.length * 160 },
        data: { label, node_type: 'branch' } as FlowNodeData,
      },
    ])
    setBranchLabelInput('')
  }

  const addEndNode = () => {
    const label = endLabelInput.trim() || 'END'
    const id = `node-end-${Date.now()}`
    setNodes(prev => [
      ...prev,
      {
        id,
        type: 'end',
        position: { x: 300, y: prev.length * 160 },
        data: { label, node_type: 'end' } as FlowNodeData,
      },
    ])
    setEndLabelInput('')
  }

  const deleteSelectedNode = () => {
    if (!selectedNode) return
    setNodes(nds => nds.filter(n => n.id !== selectedNode.id))
    setEdges(eds => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id))
    setSelectedNode(null)
  }

  // ── Compute counts ───────────────────────────────────────────────────────
  const scenarioCount = useMemo(
    () => nodes.filter(n => n.type === 'step' || n.type === 'suite-ref').length,
    [nodes],
  )
  const testCaseCount = useMemo(
    () => Object.values(checkedTestCases).reduce((sum, arr) => sum + arr.length, 0),
    [checkedTestCases],
  )

  // ── Serialize flow ───────────────────────────────────────────────────────
  const getFlowDefinition = (): FlowDefinition => ({
    nodes: nodes.map(n => ({
      id: n.id,
      type: n.type as string,
      position: n.position,
      data: n.data as FlowNodeData,
    })),
    edges: edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: (e.label as string) || null,
      condition: (e.data as any)?.condition || null,
    })),
  })

  const handleSave = () => {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      description: description.trim(),
      status: 'ready',
      flow_definition: getFlowDefinition(),
      scenario_count: scenarioCount,
      test_case_count: testCaseCount,
    })
  }

  // ── Filter pages ─────────────────────────────────────────────────────────
  const filteredPages = pages.filter(p => {
    const q = pageSearch.toLowerCase()
    return !q || (p.page_title || p.page_url).toLowerCase().includes(q)
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[1200px] h-[92vh] flex flex-col">
        {/* ── Header ── */}
        <div className="bg-[#FFF8F8] border-b border-[#E4D7D7] px-5 py-3 flex items-center gap-4 rounded-t-xl">
          <div className="flex-1 flex gap-3 items-center">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Suite title *"
              className="font-semibold text-sm border border-[#E4D7D7] rounded px-3 py-1.5 w-56 focus:outline-none focus:ring-1 focus:ring-[#fc0101]"
            />
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description"
              className="text-sm border border-[#E4D7D7] rounded px-3 py-1.5 flex-1 focus:outline-none focus:ring-1 focus:ring-[#fc0101]"
            />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* ── Left: Selection Panel ── */}
          <div className="w-72 border-r border-[#E4D7D7] flex flex-col bg-white">
            {/* Tabs */}
            <div className="flex border-b border-[#E4D7D7]">
              {(['pages', 'suites'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setLeftTab(tab)}
                  className={`flex-1 py-2 text-xs font-medium capitalize cursor-pointer transition-colors ${
                    leftTab === tab
                      ? 'border-b-2 border-[#fc0101] text-[#fc0101]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'pages' ? 'Pages & Scenarios' : 'Test Suites'}
                </button>
              ))}
            </div>

            {leftTab === 'pages' && (
              <>
                {/* Search */}
                <div className="px-3 py-2 border-b border-[#E4D7D7]">
                  <input
                    value={pageSearch}
                    onChange={e => setPageSearch(e.target.value)}
                    placeholder="Search pages..."
                    className="w-full border border-[#E4D7D7] rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#fc0101]"
                  />
                </div>

                {/* Pages tree */}
                <div className="flex-1 overflow-y-auto hide-scrollbar">
                  {filteredPages.length === 0 ? (
                    <p className="text-xs text-gray-400 p-4 text-center">No pages found</p>
                  ) : (
                    filteredPages.map(page => {
                      const scenarios = pageScenarios[page.id] || []
                      const isExpanded = expandedPages.has(page.id)
                      const isLoading = loadingScenarios.has(page.id)
                      return (
                        <div key={page.id} className="border-b border-[#F5EDED]">
                          {/* Page row */}
                          <button
                            onClick={() => togglePage(page.id)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#FFF8F8] text-left cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            )}
                            <span className="text-xs font-medium text-[#333] truncate flex-1">
                              {page.page_title || page.page_url}
                            </span>
                          </button>

                          {/* Scenarios */}
                          {isExpanded && (
                            <div className="pl-5">
                              {isLoading ? (
                                <p className="text-[10px] text-gray-400 px-3 py-2">Loading…</p>
                              ) : scenarios.length === 0 ? (
                                <p className="text-[10px] text-gray-400 px-3 py-2">No scenarios</p>
                              ) : (
                                scenarios.map(sc => {
                                  const isScSelected = selectedScenarioIds.includes(sc.id)
                                  const isScExpanded = expandedScenarios.has(sc.id)
                                  const tcs = scenarioTestCases[sc.id] || []
                                  const isTCLoading = loadingTCs.has(sc.id)
                                  return (
                                    <div key={sc.id} className="border-l-2 border-[#F5EDED] ml-1">
                                      {/* Scenario row */}
                                      <div className={`flex items-center gap-1.5 px-2 py-2 hover:bg-[#FFF8F8] ${scenariosInFlow.has(sc.id) && !isScSelected ? 'opacity-40' : ''}`}>
                                        <input
                                          type="checkbox"
                                          checked={isScSelected}
                                          disabled={scenariosInFlow.has(sc.id) && !isScSelected}
                                          onChange={() => toggleScenarioSelection(sc.id)}
                                          className="accent-[#fc0101] cursor-pointer shrink-0 disabled:cursor-not-allowed"
                                        />
                                        <button
                                          onClick={() => toggleScenario(sc.id)}
                                          className="flex items-center gap-1 flex-1 text-left cursor-pointer"
                                        >
                                          {isScExpanded ? (
                                            <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
                                          ) : (
                                            <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
                                          )}
                                          <span className="text-[11px] text-[#444] truncate">{sc.title}</span>
                                        </button>
                                        {isScSelected && (
                                          <span className="text-[8px] bg-emerald-50 text-emerald-600 border border-emerald-200 rounded px-1 shrink-0">in flow</span>
                                        )}
                                      </div>

                                      {/* Test Cases */}
                                      {isScExpanded && (
                                        <div className="pl-6 pb-1">
                                          {isTCLoading ? (
                                            <p className="text-[10px] text-gray-400 py-1">Loading…</p>
                                          ) : tcs.length === 0 ? (
                                            <p className="text-[10px] text-gray-400 py-1">No test cases</p>
                                          ) : (
                                            tcs.map(tc => (
                                              <label key={tc.id} className="flex items-center gap-1.5 py-1 cursor-pointer hover:bg-[#FFF8F8] px-1 rounded">
                                                <input
                                                  type="checkbox"
                                                  checked={(checkedTestCases[sc.id] || []).includes(tc.id)}
                                                  onChange={() => toggleTestCase(sc.id, tc.id)}
                                                  className="accent-[#fc0101] cursor-pointer shrink-0"
                                                />
                                                <span className="text-[10px] text-gray-500 truncate">{tc.title}</span>
                                              </label>
                                            ))
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </>
            )}

            {leftTab === 'suites' && (
              <div className="flex-1 overflow-y-auto hide-scrollbar p-2">
                <p className="text-[10px] text-gray-400 px-2 py-1 mb-1">Select suites to reference as nodes</p>
                {otherSuites.length === 0 ? (
                  <p className="text-xs text-gray-400 p-3 text-center">No other suites</p>
                ) : (
                  otherSuites.map(s => (
                    <label key={s.id} className="flex items-center gap-2 px-3 py-2.5 hover:bg-[#FFF8F8] border-b border-[#F5EDED] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSuiteRefIds.includes(s.id)}
                        onChange={() => toggleSuiteRef(s.id)}
                        className="accent-[#fc0101] cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-medium text-[#333]">{s.title}</p>
                        <p className="text-[10px] text-gray-400">{s.scenario_count ?? 0} scenarios</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}

            {/* Flow toolbar */}
            <div className="border-t border-[#E4D7D7] p-2 space-y-1.5">
              <p className="text-[10px] text-gray-400 px-1 font-medium">Add Nodes</p>
              <div className="flex gap-1.5">
                <input
                  value={branchLabelInput}
                  onChange={e => setBranchLabelInput(e.target.value)}
                  placeholder="Branch label"
                  className="flex-1 border border-[#E4D7D7] rounded px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                <button
                  onClick={addBranchNode}
                  title="Add Branch"
                  className="bg-amber-100 text-amber-700 border border-amber-300 rounded px-2 py-1 cursor-pointer hover:bg-amber-200"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex gap-1.5">
                <input
                  value={endLabelInput}
                  onChange={e => setEndLabelInput(e.target.value)}
                  placeholder="End label"
                  className="flex-1 border border-[#E4D7D7] rounded px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-red-400"
                />
                <button
                  onClick={addEndNode}
                  title="Add End"
                  className="bg-red-50 text-[#fc0101] border border-red-300 rounded px-2 py-1 cursor-pointer hover:bg-red-100"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              </div>
              {selectedNode && !['start'].includes(selectedNode.data.node_type as string) && (
                <button
                  onClick={deleteSelectedNode}
                  className="w-full flex items-center justify-center gap-1.5 text-[10px] text-red-500 border border-red-200 rounded px-2 py-1 hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete selected node
                </button>
              )}
            </div>
          </div>

          {/* ── Right: Flow Canvas ── */}
          <div className="flex-1 relative bg-[#fafafa]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onEdgeDoubleClick={onEdgeDoubleClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              className="rounded-br-xl"
            >
              <Background color="#E4D7D7" gap={20} size={1} />
              <Controls className="!border-[#E4D7D7]" />
              <MiniMap
                nodeColor={n => {
                  if (n.type === 'start') return '#10b981'
                  if (n.type === 'end') return '#fc0101'
                  if (n.type === 'branch') return '#f59e0b'
                  if (n.type === 'suite-ref') return '#3b82f6'
                  return '#fff'
                }}
                className="!border-[#E4D7D7] !bg-white"
              />
            </ReactFlow>

            {/* Hint */}
            <div className="absolute top-3 right-3 bg-white border border-[#E4D7D7] rounded px-2 py-1 text-[10px] text-gray-400 shadow-sm">
              Double-click edge to set condition · Drag to reorder nodes
            </div>

            {/* Node Info Panel */}
            {selectedNode && (
              <NodeInfoPanel
                node={selectedNode}
                siteAttributes={siteAttributes}
                isAttrsLoading={isAttrsLoading}
                onUpdate={updateNodeData}
                onClose={() => setSelectedNode(null)}
              />
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-[#E4D7D7] bg-white px-5 py-3 flex items-center justify-between rounded-b-xl">
          <div className="text-xs text-gray-400 space-x-3">
            <span>{nodes.filter(n => n.type === 'step' || n.type === 'suite-ref').length} step nodes</span>
            <span>{testCaseCount} test cases</span>
            <span>{edges.length} connections</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-sm border border-[#E4D7D7] rounded px-4 py-1.5 cursor-pointer hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || isSaving}
              className="text-sm bg-[#fc0101] text-white rounded px-5 py-1.5 cursor-pointer hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving…' : editSuite ? 'Update Suite' : 'Create Suite'}
            </button>
          </div>
        </div>
      </div>

      {/* Edge condition modal */}
      {edgeModal && (
        <EdgeConditionModal
          edge={edgeModal}
          onSave={handleEdgeConditionSave}
          onClose={() => setEdgeModal(null)}
        />
      )}
    </div>
  )
}

export default TestSuiteBuilder
