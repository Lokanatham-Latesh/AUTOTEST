import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DynamicTable } from '@/components/table/DynamicTable'
import type { TableColumn, TableAction } from '@/components/table/types'
import type { Scenario } from '@/types/scenario'
import { useDeleteScenarioMutation, useScenarioDetails } from '@/utils/queries/scenarioQueries'
import { toast } from 'sonner'
import { ConfirmModal } from '../common/ConfirmModal'
import { TestScenarioSheetForm } from './TestScenarioSheetForm'

type Props = {
  data: Scenario[]
  parentId: string
  isSiteRoute: boolean
}

export function TestScenarioTable({ data, parentId, isSiteRoute }: Props) {
  const navigate = useNavigate()

  const [openModal, setOpenModal] = useState(false)
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null)

  const [editId, setEditId] = useState<number | null>(null)
  const [openSheet, setOpenSheet] = useState(false)

  const deleteMutation = useDeleteScenarioMutation()

  const { data: scenarioDetail } = useScenarioDetails(editId ?? 0)

  const columns: TableColumn<Scenario>[] = [
    {
      key: 'title',
      header: 'Title',
      width: 'w-[30%]',
      render: (row) => (
        <div className="truncate max-w-[250px]" title={row.title}>
          {row.title}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      width: 'w-[15%]',
      render: (row) => row.type,
    },
    {
      key: 'category',
      header: 'Category',
      width: 'w-[20%]',
      render: (row) => row.category,
    },
    {
      key: 'count',
      header: 'Test Cases',
      width: 'w-[15%]',
      align: 'center',
      render: (row) => row.test_case_count,
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
      label: 'Delete scenario',
      destructive: true,
      onClick: (row) => {
        setSelectedScenarioId(row.id)
        setOpenModal(true)
      },
    },
  ]

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
    </>
  )
}
