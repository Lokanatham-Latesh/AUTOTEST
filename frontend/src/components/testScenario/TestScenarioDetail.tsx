import React from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { DynamicTable } from '../table/DynamicTable'
import type { TableAction, TableColumn } from '../table/types'
import { useScenarioDetails } from '@/utils/queries/scenarioQueries'
import { formatDateDDMMYYYY } from '@/utils/helper'

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

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  if (!data) {
    return <div className="p-6">No data found</div>
  }

  const scenarioData = data.data || {}
  const steps = scenarioData.steps || []
  const flowStructure = scenarioData.flow_structure || null

  // Table columns
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
    { label: 'Edit Test Case', onClick: (row) => alert('Edit ' + row.title) },
    {
      label: 'Delete Test Case',
      onClick: (row) => alert('Delete ' + row.title),
      destructive: true,
    },
  ]

  return (
    <div>
      {/* SCENARIO DETAILS */}
      <div className="border border-[#E4D7D7] bg-white rounded-[6px] overflow-hidden">
        <div className="bg-[#FFF8F8] border-b border-[#E4D7D7] py-3 px-4 flex justify-between items-center">
          <h2 className="text-[15px] font-semibold text-[#322525]">Test Scenario Details</h2>
          <div className="space-x-2">
            <Button size="sm" variant="outline">
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

          {/* Steps */}
          <div>
            <p className="text-[11px] font-semibold text-[#8B6E6E] uppercase tracking-[0.08em] mb-2">
              Steps to Execute
            </p>

            {steps.length > 0 ? (
              <ol className="list-decimal list-inside space-y-2 text-sm text-[#2B1F1F] font-medium">
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

          {/* Flow Structure (Selectors equivalent) */}
          {flowStructure && (
            <div>
              <p className="text-[11px] font-semibold text-[#8B6E6E] uppercase tracking-[0.08em] mb-2">
                Flow Structure
              </p>
              <pre className="text-sm bg-gray-50 p-3 rounded overflow-auto">
                {JSON.stringify(flowStructure, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* TEST CASES */}
      <div className="mt-6 border border-[#E4D7D7] bg-white rounded-[6px] overflow-hidden">
        <div className="bg-[#FFF8F8] border-b border-[#E4D7D7] py-3 px-4 flex justify-between items-center">
          <h2 className="text-[15px] font-semibold text-[#322525]">Test Cases</h2>
          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
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
    </div>
  )
}

const DetailItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-[11px] font-semibold text-[#8B6E6E] uppercase tracking-[0.08em] mb-1.5">
      {label}
    </p>
    <p className="text-sm text-[#2B1F1F] font-medium leading-relaxed">{value}</p>
  </div>
)

export default TestScenarioDetail
