import { useNavigate } from 'react-router-dom'
import { DynamicTable } from '@/components/table/DynamicTable'
import { formatDateDDMMYYYY } from '@/utils/helper'
import type { Page } from '@/utils/apis/siteApi'
import { StatusPill } from '../table/StatusPill'
import { AnalyzeButton } from '../table/AnalyzeButton'
import { useState } from 'react'
import { EditPageTitleDialog } from '../page/EditPageTitleDialog'

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
      render: (p: Page) => (
        <span className="max-w-[260px] truncate font-medium">{p.page_title}</span>
      ),
    },
    {
      key: 'url',
      header: 'URL',
      width: 'w-60',
      render: (p: Page) => (
        <a
          href={p.page_url}
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {p.page_url}
        </a>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 'w-[140px]',
      render: (p: Page) => <StatusPill status={p.status} />,
    },
    {
      key: 'analyze',
      header: (
        <div className="flex flex-col items-center">
          <span>Generate</span>
          <span className="text-xs text-muted-foreground">Test Scenario</span>
        </div>
      ),
      align: 'center' as const,
      render: (p: Page) => <AnalyzeButton status={p.status} onPlay={() => handlePlay(p)} />,
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
    console.log('START ANALYSIS', page.id)
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
