import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DynamicTable } from '@/components/table/DynamicTable'
import type { TableColumn, TableAction } from '@/components/table/types'
import type { Scenario } from '@/types/scenario'
import {
  useDeleteScenarioMutation,
  useScenarioDetails,
  useRegenerateTestCasesMutation,
} from '@/utils/queries/scenarioQueries'
import { toast } from 'sonner'
import { ConfirmModal } from '../common/ConfirmModal'
import { TestScenarioSheetForm } from './TestScenarioSheetForm'
import { ExecuteButton } from '../common/ExecuteButton'
import { ViewTestScriptSheet } from './ViewTestScriptSheet'
import { useWebSocketContext } from '@/contexts/WebSocketProvider'

type Props = {
  data: Scenario[]
  parentId: string
  isSiteRoute: boolean
}

export function TestScenarioTable({ data, parentId, isSiteRoute }: Props) {
  const navigate = useNavigate()
  const { lastMessage } = useWebSocketContext()

  /* ---------------- STATE ---------------- */

  const [openModal, setOpenModal] = useState(false)
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null)

  const [editId, setEditId] = useState<number | null>(null)
  const [openSheet, setOpenSheet] = useState(false)

  const [openScriptSheet, setOpenScriptSheet] = useState(false)
  const [scriptScenarioId, setScriptScenarioId] = useState<number | null>(null)

  // ✅ Track multiple running scenarios
  const [runningScenarioIds, setRunningScenarioIds] = useState<number[]>([])

  /* ---------------- QUERIES ---------------- */

  const deleteMutation = useDeleteScenarioMutation()
  const { data: scenarioDetail } = useScenarioDetails(editId ?? 0)

  const { mutate: regenerateTestCases } = useRegenerateTestCasesMutation()

  /* ---------------- EXECUTE ---------------- */

  const handlePlay = (scenarioId: number) => {
    if (runningScenarioIds.includes(scenarioId)) return

    // Add loader immediately
    setRunningScenarioIds((prev) => [...prev, scenarioId])

    regenerateTestCases(scenarioId, {
      onError: () => {
        toast.error('Failed to start test case generation')
        setRunningScenarioIds((prev) => prev.filter((id) => id !== scenarioId))
      },
    })
  }

  /* ---------------- WEBSOCKET ---------------- */

  useEffect(() => {
    if (!lastMessage) return
    if (lastMessage.type !== 'PAGE_STATUS_UPDATE') return

    const { scenario_id, status } = lastMessage.payload

    if (!scenario_id) return

    // If generation is ongoing → ensure loader is active
    if (status !== 'done') {
      setRunningScenarioIds((prev) => (prev.includes(scenario_id) ? prev : [...prev, scenario_id]))
    }

    // If done → remove loader
    if (status === 'done') {
      setRunningScenarioIds((prev) => prev.filter((id) => id !== scenario_id))

      toast.success(`Scenario ${scenario_id} completed`)
    }
  }, [lastMessage])


  const columns: TableColumn<Scenario>[] = [
    {
      key: 'title',
      header: 'Title',
      width: 'w-[420px]',
      render: (row) => (
        <div className="whitespace-normal wrap-break-word" title={row.title}>
          {row.title}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      width: 'w-[140px]',
      align: 'center',
      render: (row) => row.type,
    },
    {
      key: 'category',
      header: 'Category',
      width: 'w-[180px]',
      align: 'center',
      render: (row) => row.category,
    },
    {
      key: 'count',
      header: 'Test Cases',
      width: 'w-[120px]',
      align: 'center',
      render: (row) => row.test_case_count,
    },
    {
      key: 'execute',
      header: 'Execute',
      width: 'w-[120px]',
      align: 'center',
      render: (row) => (
        <div className="flex justify-center items-center">
          <ExecuteButton
            scenarioId={row.id}
            isRunning={runningScenarioIds.includes(row.id)}
            onPlay={() => handlePlay(row.id)}
          />
        </div>
      ),
    },
  ]

  /* ---------------- ACTIONS ---------------- */

  const actions: TableAction<Scenario>[] = [
    {
      label: 'View Details',
      onClick: (row) =>
        navigate(
          isSiteRoute
            ? `/site-info/${parentId}/test-scenario/${row.id}`
            : `/page-info/${parentId}/test-scenario/${row.id}`,
        ),
    },
    {
      label: 'Edit Scenario',
      onClick: (row) => {
        setEditId(row.id)
        setOpenSheet(true)
      },
    },
    {
      label: 'View Test Script',
      onClick: (row) => {
        setScriptScenarioId(row.id)
        setOpenScriptSheet(true)
      },
    },
    {
      label: 'Delete scenario',
      destructive: true,
      onClick: (row) => {
        setSelectedScenarioId(row.id)
        setOpenModal(true)
      },
    },
  ]


  const handleConfirmDelete = () => {
    if (!selectedScenarioId) return

    deleteMutation.mutate(selectedScenarioId, {
      onSuccess: () => {
        toast.success('Test scenario deleted successfully')
        setOpenModal(false)
        setSelectedScenarioId(null)
      },
      onError: () => {
        toast.error('Failed to delete test scenario')
      },
    })
  }

  /* ---------------- RENDER ---------------- */

  return (
    <>
      <DynamicTable data={data} columns={columns} actions={actions} getRowKey={(row) => row.id} />

      <ConfirmModal
        open={openModal}
        title="Confirm Deletion"
        message="Are you sure you want to delete this scenario?"
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onCancel={() => {
          setOpenModal(false)
          setSelectedScenarioId(null)
        }}
        onConfirm={handleConfirmDelete}
      />

      {openSheet && scenarioDetail && (
        <TestScenarioSheetForm
          open={openSheet}
          onOpenChange={(value) => {
            setOpenSheet(value)
            if (!value) setEditId(null)
          }}
          initialData={scenarioDetail}
        />
      )}

      <ViewTestScriptSheet
        open={openScriptSheet}
        onOpenChange={(value) => {
          setOpenScriptSheet(value)
          if (!value) setScriptScenarioId(null)
        }}
        scenarioId={scriptScenarioId}
      />
    </>
  )
}
