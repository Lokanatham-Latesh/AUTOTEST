import { useState, useEffect } from 'react'
import { SearchBar } from '@/components/common/SearchBar'
import { Pagination } from '@/components/common/Pagination'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import type { SortType } from '@/types'
import { SitePageTable } from './SitePageTable'
import { useSitePagesQuery } from '@/utils/queries/sitesQuery'
import { useParams } from 'react-router-dom'
import { useDeletePageMutation } from '@/utils/queries/pageQueries'
import { toast } from 'sonner'
import { useWebSocketContext } from '@/contexts/WebSocketProvider'
import { useQueryClient } from '@tanstack/react-query'

const SitePages = () => {
  const { id } = useParams<{ id: string }>()
  const siteId = Number(id)

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortType>('created_desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { lastMessage } = useWebSocketContext()
  const queryClient = useQueryClient()
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null)

  const { data, isLoading, isError } = useSitePagesQuery({
    siteId,
    page,
    limit: pageSize,
    search,
    sort,
  })

  const deletePageMutation = useDeletePageMutation()

  const handleDeleteClick = (pageId: number) => {
    setSelectedPageId(pageId)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!selectedPageId) return

    deletePageMutation.mutate(selectedPageId, {
      onSuccess: () => {
        toast.success('Page deleted successfully')
        setDeleteModalOpen(false)
        setSelectedPageId(null)
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.detail || 'Failed to delete page')
      },
    })
  }
 useEffect(() => {
   if (!lastMessage) return
   if (lastMessage.type !== 'PAGE_STATUS_UPDATE') return

   const { page_id, status, page_title, page_url, updated_on } = lastMessage.payload

   queryClient.setQueriesData(
     {
       queryKey: ['site-pages', siteId],
       exact: false,
     },
     (oldData: any) => {
       if (!oldData?.data) return oldData

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
 }, [lastMessage, queryClient, siteId])
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
      />

      {isLoading && (
        <div className="flex items-center justify-center h-full">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      )}

      {isError && (
        <div className="flex flex-1 items-center justify-center text-red-500">
          Failed to load pages
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <SitePageTable data={data?.data ?? []} onDelete={handleDeleteClick} />

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

      <ConfirmModal
        open={deleteModalOpen}
        title="Confirm Deletion"
        message="Are you sure you want to delete this page?"
        confirmText="Delete"
        variant="danger"
        isLoading={deletePageMutation.isPending}
        onCancel={() => {
          setDeleteModalOpen(false)
          setSelectedPageId(null)
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

export default SitePages
