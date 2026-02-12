import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/common/SearchBar'
import { Pagination } from '@/components/common/Pagination'
import type { SortType } from '@/types'
import { AddPageSheet } from '@/components/page/AddPageDialog'
import { PageTable } from '@/components/page/PageTable'
import { useCreatePageMutation, useUnlinkedPagesQuery } from '@/utils/queries/pageQueries'
import { useDeletePageMutation } from '@/utils/queries/pageQueries'
import { toast } from 'sonner'

const Pages = () => {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortType>('created_desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [openAdd, setOpenAdd] = useState(false)

  const { data, isLoading } = useUnlinkedPagesQuery({
    page,
    limit: pageSize,
    search,
    sort,
  })
  const deletePageMutation = useDeletePageMutation()
  const createPageMutation = useCreatePageMutation()


const handleAdd = (values: { title: string; url: string }) => {
  createPageMutation.mutate(
    {
      page_title: values.title,
      page_url: values.url,
    },
    {
      onSuccess: () => {
        toast.success('Page created successfully')
        setOpenAdd(false)
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.detail || 'Failed to create page')
      },
    },
  )
}


  const handleDeletePage = (pageId: number) => {
    if (!confirm('Are you sure you want to delete this page?')) return

    deletePageMutation.mutate(pageId, {
      onSuccess: () => {
        toast.success('Page deleted successfully')
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.detail || 'Failed to delete page')
      },
    })
  }


  return (
    <div className="flex h-full flex-col">
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
          Add New Page
        </Button>

        <AddPageSheet
          open={openAdd}
          onOpenChange={setOpenAdd}
          onSubmit={handleAdd}
          isLoading={createPageMutation.isPending}
        />
      </SearchBar>

      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      ) : (
        <>
          <PageTable data={data?.data ?? []} onDelete={handleDeletePage} />

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

export default Pages
