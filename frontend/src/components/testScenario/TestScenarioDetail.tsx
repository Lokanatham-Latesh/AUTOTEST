import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { DynamicTable } from '../table/DynamicTable'
import type { TableAction, TableColumn } from '../table/types'
import { useScenarioDetails } from '@/utils/queries/scenarioQueries'
import { useDeleteTestCaseMutation } from '@/utils/queries/testCaseQueries'
import { formatDateDDMMYYYY } from '@/utils/helper'
import { TestScenarioSheetForm } from './TestScenarioSheetForm'
import { TestCaseSheetForm } from '../testcase/TestCaseSheetForm'
import { ConfirmModal } from '../common/ConfirmModal'
import { toast } from 'sonner'

interface TestCase {
  id: number
  title: string
  type: string
  is_valid: boolean
  is_valid_default: boolean
}

const TestScenarioDetail: React.FC = () => {
  const { tsid } = useParams<{ tsid: string }>()

  const { data, isLoading } = useScenarioDetails(Number(tsid))
  const deleteTestCaseMutation = useDeleteTestCaseMutation()

  const [openScenarioEdit, setOpenScenarioEdit] = useState(false)

  const [openDeleteModal, setOpenDeleteModal] = useState(false)
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<number | null>(null)

  const [openTestCaseModal, setOpenTestCaseModal] = useState(false)
  const [editTestCaseId, setEditTestCaseId] = useState<number | null>(null)

  if (isLoading) return <div className="p-6">Loading...</div>
  if (!data) return <div className="p-6">No data found</div>

  const scenarioData = data.data || {}
  const steps = scenarioData.steps || []
  const flowStructure = scenarioData.flow_structure || null

  const handleConfirmDelete = () => {
    if (!selectedTestCaseId) return

    deleteTestCaseMutation.mutate(selectedTestCaseId, {
      onSuccess: () => {
        toast.success('Test case deleted successfully')
        setOpenDeleteModal(false)
        setSelectedTestCaseId(null)
      },
      onError: () => {
        toast.error('Failed to delete test case')
      },
    })
  }

  const testCaseColumns: TableColumn<TestCase>[] = [
    { key: 'title', header: 'Title', render: (row) => row.title },
    { key: 'type', header: 'Type', render: (row) => row.type },
    {
      key: 'is_valid',
      header: 'Valid',
      render: (row) => (row.is_valid ? 'True' : 'False'),
    },
    {
      key: 'is_valid_default',
      header: 'Valid Default',
      render: (row) => (row.is_valid_default ? 'True' : 'False'),
    },
  ]

  const testCaseActions: TableAction<TestCase>[] = [
    {
      label: 'Edit Test Case',
      onClick: (row) => {
        setEditTestCaseId(row.id)
        setOpenTestCaseModal(true)
      },
    },
    {
      label: 'Delete Test Case',
      destructive: true,
      onClick: (row) => {
        setSelectedTestCaseId(row.id)
        setOpenDeleteModal(true)
      },
    },
  ]

  return (
    <div>
      {/* SCENARIO DETAILS */}
      <div className="border bg-white rounded overflow-hidden">
        <div className="bg-gray-50 border-b p-4 flex justify-between items-center">
          <h2 className="font-semibold">Test Scenario Details</h2>
          <div className="space-x-2">
            <Button size="sm" variant="outline" onClick={() => setOpenScenarioEdit(true)} className='cursor-pointer'>
              Edit
            </Button>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
              Execute
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <DetailItem label="Scenario Title" value={data.title} />
          <DetailItem label="Created On" value={formatDateDDMMYYYY(data.created_on)} />
          <DetailItem label="Scenario Type" value={data.type} />
          <DetailItem label="Scenario Category" value={data.category || '-'} />

          <div>
            <p className="font-semibold mb-2">Steps to Execute</p>
            {steps.length > 0 ? (
              <ol className="list-decimal list-inside space-y-1">
                {steps.map((step: any, index: number) => (
                  <li key={index}>
                    {step.action} → {step.target}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">No steps available</p>
            )}
          </div>

          {flowStructure && (
            <div>
              <p className="font-semibold mb-2">Flow Structure</p>
              <pre className="bg-gray-50 p-3 rounded overflow-auto text-sm">
                {JSON.stringify(flowStructure, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* TEST CASES */}
      <div className="mt-6 border bg-white rounded overflow-hidden">
        <div className="bg-gray-50 border-b p-4 flex justify-between items-center">
          <h2 className="font-semibold">Test Cases</h2>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            onClick={() => {
              setEditTestCaseId(null)
              setOpenTestCaseModal(true)
            }}
          >
            Add Test Case
          </Button>
        </div>

        <div className="p-6">
          <DynamicTable
            data={data.test_cases}
            columns={testCaseColumns}
            actions={testCaseActions}
            getRowKey={(row) => row.id}
          />
        </div>
      </div>

      <ConfirmModal
        open={openDeleteModal}
        title="Confirm Deletion"
        message="Are you sure you want to delete this test case?"
        confirmText="Delete"
        variant="danger"
        isLoading={deleteTestCaseMutation.isPending}
        onCancel={() => {
          setOpenDeleteModal(false)
          setSelectedTestCaseId(null)
        }}
        onConfirm={handleConfirmDelete}
      />

      {openTestCaseModal && (
        <TestCaseSheetForm
          open={openTestCaseModal}
          onOpenChange={(value) => {
            setOpenTestCaseModal(value)
            if (!value) setEditTestCaseId(null)
          }}
          testCaseId={editTestCaseId}
          scenarioId={Number(tsid)}
        />
      )}

      {openScenarioEdit && (
        <TestScenarioSheetForm
          open={openScenarioEdit}
          onOpenChange={setOpenScenarioEdit}
          initialData={data}
        />
      )}
    </div>
  )
}

const DetailItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
    <p className="text-sm">{value}</p>
  </div>
)

export default TestScenarioDetail
