import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/common/SearchBar'
import { Pagination } from '@/components/common/Pagination'
import type { SortType } from '@/types'
import { AddPageSheet } from '@/components/page/AddPageDialog'
import { PageTable } from '@/components/page/PageTable'
import { useCreatePageMutation, useUnlinkedPagesQuery } from '@/utils/queries/pageQueries'
import { useDeletePageMutation } from '@/utils/queries/pageQueries'
import { toast } from 'sonner'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { useWebSocketContext } from '@/contexts/WebSocketProvider'
import { useQueryClient } from '@tanstack/react-query'

const Pages = () => {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortType>('created_desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [openAdd, setOpenAdd] = useState(false)
  const [openDeleteModal, setOpenDeleteModal] = useState(false)
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null)
  const queryClient = useQueryClient()
  const { lastMessage } = useWebSocketContext()

  const { data, isLoading } = useUnlinkedPagesQuery({
    page,
    limit: pageSize,
    search,
    sort,
  })
  const deletePageMutation = useDeletePageMutation()
  const createPageMutation = useCreatePageMutation()
  useEffect(() => {
    if (!lastMessage) return
    if (lastMessage.type !== 'PAGE_STATUS_UPDATE') return

    const { page_id, status, page_title, page_url, updated_on } = lastMessage.payload

    queryClient.setQueriesData(
      {
        queryKey: ['unlinked-pages'],
        exact: false,
      },
      (oldData: any) => {
        if (!oldData || !Array.isArray(oldData.data)) return oldData

        return {
          ...oldData,
          data: oldData.data.map((pageItem: any) =>
            pageItem.id === page_id
              ? {
                  ...pageItem,
                  status: status ?? pageItem.status,
                  page_title: page_title ?? pageItem.page_title,
                  page_url: page_url ?? pageItem.page_url,
                  updated_on: updated_on ?? pageItem.updated_on,
                }
              : pageItem,
          ),
        }
      },
    )
  }, [lastMessage, queryClient])


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
    setSelectedPageId(pageId)
    setOpenDeleteModal(true)
  }
  const handleConfirmDelete = () => {
    if (!selectedPageId) return

    deletePageMutation.mutate(selectedPageId, {
      onSuccess: () => {
        toast.success('Page deleted successfully')
        setOpenDeleteModal(false)
        setSelectedPageId(null)
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
          <ConfirmModal
            open={openDeleteModal}
            title="Confirm Deletion"
            message="Are you sure you want to delete this page?"
            confirmText="Delete"
            variant="danger"
            isLoading={deletePageMutation.isPending}
            onCancel={() => {
              setOpenDeleteModal(false)
              setSelectedPageId(null)
            }}
            onConfirm={handleConfirmDelete}
          />
        </>
      )}
    </div>
  )
}

export default Pages
