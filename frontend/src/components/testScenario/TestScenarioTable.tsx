import { useNavigate } from 'react-router-dom'
import { DynamicTable } from '@/components/table/DynamicTable'
import type { TableColumn, TableAction } from '@/components/table/types'
import type { Scenario } from '@/types/scenario'

type Props = {
  data: Scenario[]
  parentId: string
  isSiteRoute: boolean
}

export function TestScenarioTable({ data, parentId, isSiteRoute }: Props) {
  const navigate = useNavigate()

  const columns: TableColumn<Scenario>[] = [
    {
      key: 'title',
      header: 'Title',
      width: 'w-[30%]',
      render: (row) => (
        <div
          className="truncate max-w-[250px]"
          title={row.title} // Tooltip
        >
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
  ]

  return (
    <DynamicTable
      data={data}
      columns={columns}
      actions={actions}
      getRowKey={(row) => row.id}
    />
  )
}
