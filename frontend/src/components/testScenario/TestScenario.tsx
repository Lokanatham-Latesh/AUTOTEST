import { useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useScenariosQuery } from '@/utils/queries/scenarioQueries'
import { TestScenarioTable } from './TestScenarioTable'
import { SearchBar } from '../common/SearchBar'
// import { Button } from '../ui/button'
import { Pagination } from '../common/Pagination'
import type { SortType } from '@/types'
// import { TestScenarioSheetForm } from './TestScenarioSheetForm'

const TestScenario = () => {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()

  const isSiteRoute = location.pathname.includes('site-info')
  const isPageRoute = location.pathname.includes('page-info')

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortType>('created_desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  // const [openAdd, setOpenAdd] = useState(false)

  const { data, isLoading } = useScenariosQuery({
    page,
    limit: pageSize,
    site_id: isSiteRoute ? Number(id) : undefined,
    page_id: isPageRoute ? Number(id) : undefined,
    search,
    sort,
  })

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
        {/* {isPageRoute && (
          <>
            <Button onClick={() => setOpenAdd(true)} className="cursor-pointer">
              Add Test Scenario
            </Button>

            <TestScenarioSheetForm open={openAdd} onOpenChange={setOpenAdd} />
          </>
        )} */}
      </SearchBar>

      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      ) : (
        <>
          <TestScenarioTable data={data?.data ?? []} parentId={id!} isSiteRoute={isSiteRoute} />

          <Pagination
            currentPage={page}
            totalPages={data?.meta.totalPages ?? 1}
            itemsPerPage={pageSize}
            totalItems={data?.meta.totalItems ?? 0}
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
