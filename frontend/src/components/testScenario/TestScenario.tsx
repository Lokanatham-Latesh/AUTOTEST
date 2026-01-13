import { useState } from 'react'
import { testScenarioDummyData } from '@/mock/testScenarioDummy'
import { TestScenarioTable } from './TestScenarioTable'
import { SearchBar } from '../common/SearchBar'
import { Button } from '../ui/button'
import { Pagination } from '../common/Pagination'
import type { SortType } from '@/types'
import type { TestCase, TestScenarioForm } from '@/types/testCase'
import { TestScenarioSheetForm } from './TestScenarioSheetForm'
import { useParams } from 'react-router-dom'

const TestScenario = () => {
  const { id: currentSiteId } = useParams<{ id: string }>()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortType>('created_desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [openAdd, setOpenAdd] = useState(false)
  const [editScenario, setEditScenario] = useState<TestCase | null>(null)

  const [scenarios, setScenarios] = useState<TestCase[]>(testScenarioDummyData)

  const handleAddOrEdit = (values: TestScenarioForm, id?: string) => {
    if (id) {
      // Edit
      setScenarios((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, ...values, testCasesCount: values.steps.length } : item,
        ),
      )
    } else {
      // Add new
      const newScenario: TestCase = {
        id: String(Date.now()),
        title: values.title,
        type: values.type,
        category: values.category,
        description: values.description,
        testCasesCount: values.steps.length,
        status: 'Idle',
        steps: values.steps,
      }
      setScenarios((prev) => [newScenario, ...prev])
    }

    setOpenAdd(false)
    setEditScenario(null)
  }

  const handleEdit = (scenario: TestCase) => {
    setEditScenario(scenario)
    setOpenAdd(true)
  }

  const isLoading = false

  return (
    <div>
      <SearchBar
        searchQuery={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        sort={sort}
        onSortChange={(newSort) => {
          setSort(newSort)
          setPage(1)
        }}
      >
        <Button onClick={() => setOpenAdd(true)} className="cursor-pointer">
          Add Test Scenario
        </Button>

        <TestScenarioSheetForm
          open={openAdd}
          onOpenChange={(open) => {
            setOpenAdd(open)
            if (!open) setEditScenario(null)
          }}
          onSubmit={handleAddOrEdit}
          initialData={
            editScenario
              ? {
                  ...editScenario,
                  steps: editScenario.steps ?? [{ value: '' }],
                }
              : undefined
          }
        />
      </SearchBar>

      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      ) : (
        <>
          <TestScenarioTable data={scenarios} onEdit={handleEdit} siteId={currentSiteId!} />

          <Pagination
            currentPage={page}
            totalPages={Math.ceil(scenarios.length / pageSize)}
            itemsPerPage={pageSize}
            totalItems={scenarios.length}
            onPageChange={setPage}
            onItemsPerPageChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
        </>
      )}
    </div>
  )
}

export default TestScenario
