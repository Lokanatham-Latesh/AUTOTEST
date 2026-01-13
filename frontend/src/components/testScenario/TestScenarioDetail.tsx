import React from 'react'
import { Button } from '@/components/ui/button'
import type { TableAction, TableColumn } from '../table/types'
import { DynamicTable } from '../table/DynamicTable'

interface TestCase {
  id: string
  title: string
  type: string
  valid: boolean
  validDefault: boolean
}

interface TestScenario {
  id: string
  title: string
  creation: string
  scenarioType: string
  scenarioCategory: string
  description: string
  steps: string[]
  selectors: Record<string, string>
  testCases: TestCase[]
}

// Mock data
const mockScenario: TestScenario = {
  id: '1',
  title: 'Test user login with credentials',
  creation: '09/09/2025',
  scenarioType: 'Auto-generated',
  scenarioCategory: 'functional',
  description:
    'Lorem ipsum is a dummy or placeholder text commonly used in graphic design, publishing, and web development. Its purpose is to permit a page layout to be designed, independently of the copy.',
  steps: [
    'Navigate to the login page URL: https://stage1.ourgoalplan.co.in/',
    "Enter a valid username into the 'Username' field.",
  ],
  selectors: {
    userName_field: '#userName',
    password_field: '#password',
    signIn_button: 'button[type="submit"]',
  },
  testCases: [
    {
      id: '1',
      title: 'Navigate to login page.',
      type: 'Auto-Generated',
      valid: true,
      validDefault: true,
    },
    {
      id: '2',
      title: 'Enter username and password.',
      type: 'Manual',
      valid: true,
      validDefault: false,
    },
  ],
}

// Table Columns
const testCaseColumns: TableColumn<TestCase>[] = [
  { key: 'title', header: 'Title', render: (row) => row.title },
  { key: 'type', header: 'Type', render: (row) => row.type },
  { key: 'valid', header: 'Valid', render: (row) => (row.valid ? 'True' : 'False') },
  {
    key: 'validDefault',
    header: 'Valid Default',
    render: (row) => (row.validDefault ? 'True' : 'False'),
  },
]

// Table Actions
const testCaseActions: TableAction<TestCase>[] = [
  { label: 'Edit Test Case', onClick: (row) => alert('Edit ' + row.title) },
  { label: 'Delete Test Case', onClick: (row) => alert('Delete ' + row.title), destructive: true },
  { label: 'Execution Log', onClick: (row) => alert('Execution Log ' + row.title) },
  { label: 'Add/Modify Test Data', onClick: (row) => alert('Add/Modify Test Data ' + row.title) },
]

const TestScenarioDetail: React.FC = () => {
  return (
    <div className="-auto">
      <div className="flex flex-col gap-6">
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
            <DetailItem label="Scenario Title" value={mockScenario.title} />
            <DetailItem label="Creation" value={mockScenario.creation} />
            <DetailItem label="Scenario Type" value={mockScenario.scenarioType} />
            <DetailItem label="Scenario Category" value={mockScenario.scenarioCategory} />
            <div>
              <p className="text-[11px] font-semibold text-[#8B6E6E] uppercase tracking-[0.08em] mb-1.5">
                Description
              </p>
              <p className="text-sm text-[#2B1F1F] font-medium leading-relaxed">
                {mockScenario.description}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#8B6E6E] uppercase tracking-[0.08em] mb-1.5">
                Steps to Execute
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-[#2B1F1F] font-medium">
                {mockScenario.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#8B6E6E] uppercase tracking-[0.08em] mb-1.5">
                Selectors
              </p>
              <pre className="text-sm text-[#2B1F1F] font-medium bg-gray-50 p-2 rounded">
                {JSON.stringify(mockScenario.selectors, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Test Cases */}
      <div className="mt-4 border border-[#E4D7D7] bg-white rounded-[6px] overflow-hidden">
        <div className="bg-[#FFF8F8] border-b border-[#E4D7D7] py-3 px-4 flex justify-between items-center">
          <h2 className="text-[15px] font-semibold text-[#322525]">Test Cases</h2>
          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
            Add Test Case
          </Button>
        </div>
        <div className="p-6">
          <DynamicTable
            data={mockScenario.testCases}
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
