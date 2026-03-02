import { useNavigate } from 'react-router-dom'
import { DynamicTable } from '@/components/table/DynamicTable'
import { formatDateDDMMYYYY } from '@/utils/helper'
import type { Page } from '@/utils/apis/siteApi'
import { StatusPill } from '../table/StatusPill'
import { AnalyzeButton } from '../table/AnalyzeButton'
import { useState } from 'react'
import { EditPageTitleDialog } from '../page/EditPageTitleDialog'
import { toast } from 'sonner'
import { useRegenerateScenariosMutation } from '@/utils/queries/scenarioQueries'
export function SitePageTable({
  data,
  onDelete,
}: {
  data: Page[]
  onDelete: (pageId: number) => void
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [selectedPage, setSelectedPage] = useState<Page | null>(null)
  const navigate = useNavigate()
  const { mutate: regenerateScenarios } = useRegenerateScenariosMutation()

  const columns = [
    {
      key: 'date',
      header: 'Date',
      width: 'w-[140px]',
      render: (p: Page) => formatDateDDMMYYYY(p.created_on),
    },
    {
      key: 'title',
      header: 'Title',
      width: 'w-[260px]',
      render: (p: Page) => (
        <div className="w-full truncate font-medium" title={p.page_title}>
          {p.page_title}
        </div>
      ),
    },
    {
      key: 'url',
      header: 'URL',
      width: 'w-[260px]',
      render: (p: Page) => (
        <div className="w-full overflow-hidden">
          <a
            href={p.page_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="block truncate text-primary hover:underline"
            title={p.page_url}
          >
            {p.page_url}
          </a>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 'w-[180px]',
      render: (p: Page) => (
        <div className="">
          <StatusPill status={p.status} />
        </div>
      ),
    },
    {
      key: 'analyze',
      header: (
        <div className="flex flex-col items-center">
          <span>Re-Generate</span>
          <span className="text-xs text-muted-foreground">Test Scenario</span>
        </div>
      ),
      width: 'w-[200px]',
      align: 'center' as const,
      render: (p: Page) => (
        <div className="pl-6">
          <AnalyzeButton status={p.status} onPlay={() => handlePlay(p)} />
        </div>
      ),
    },
  ]

  const actions = [
    {
      label: 'Edit Page Title',
      onClick: (p: Page) => {
        setSelectedPage(p)
        setEditOpen(true)
      },
    },
    {
      label: 'View Page Info',
      onClick: (p: Page) => navigate(`/page-info/${p.id}?site_id=${p.site_id}`),
    },
    {
      label: 'View Test Scenario',
      onClick: (p: Page) => navigate(`/page-info/${p.id}/test-scenario`),
    },
    {
      label: 'Delete Page',
      destructive: true,
      onClick: (p: Page) => onDelete(p.id),
    },
  ]

  function handlePlay(page: Page) {
    regenerateScenarios(page.id, {
      onSuccess: () => {
        toast.success('Test scenario regeneration started')
      },
      onError: () => {
        toast.error('Failed to start regeneration')
      },
    })
  }

  return (
    <>
      <DynamicTable data={data} columns={columns} actions={actions} getRowKey={(p) => p.id} />

      <EditPageTitleDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        pageId={selectedPage?.id ?? null}
        currentTitle={selectedPage?.page_title}
      />
    </>
  )
}
