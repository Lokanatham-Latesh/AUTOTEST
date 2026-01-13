import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DynamicTable } from '@/components/table/DynamicTable'
import type { TableColumn, TableAction } from '@/components/table/types'
import type { TestCase } from '@/types/testCase'
import { ExecuteButton } from '../testcase/ExecuteButton'

type Props = {
  data: TestCase[]
  onEdit: (scenario: TestCase) => void
  siteId: string
}

export function TestScenarioTable({ data, onEdit, siteId }: Props) {
  const navigate = useNavigate()
  const [rows, setRows] = useState(data)

  const columns: TableColumn<TestCase>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (row) => <span className="font-medium">{row.title}</span>,
    },
    { key: 'type', header: 'Type', render: (row) => row.type },
    { key: 'category', header: 'Category', render: (row) => row.category },
    { key: 'count', header: 'Test Cases', align: 'center', render: (row) => row.testCasesCount },
    {
      key: 'execute',
      header: 'Execute',
      align: 'center',
      render: (row) => (
        <ExecuteButton status={row.status} onExecute={() => handleExecute(row.id)} />
      ),
    },
  ]

  const actions: TableAction<TestCase>[] = [
    {
      label: 'View Details',
      onClick: (row) => navigate(`/site-info/${siteId}/test-scenario/${row.id}`),
    },
    { label: 'Edit', onClick: onEdit },
    {
      label: 'Delete',
      destructive: true,
      onClick: (row) => setRows((prev) => prev.filter((r) => r.id !== row.id)),
    },
  ]

  function handleExecute(id: string) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status: 'Running' } : row)))

    setTimeout(() => {
      setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status: 'Done' } : row)))
    }, 3000)
  }
  const handleRowClick = (row: TestCase) => {
    navigate(`/site-info/${siteId}/test-scenario/${row.id}`)
  }
  return (
    <DynamicTable
      data={rows}
      columns={columns}
      actions={actions}
      getRowKey={(row) => row.id}
      onRowClick={(row) => handleRowClick(row)}
    />
  )
}
