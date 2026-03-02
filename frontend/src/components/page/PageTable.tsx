import { useNavigate } from 'react-router-dom'
import { DynamicTable } from '@/components/table/DynamicTable'
import { StatusPill } from '@/components/table/StatusPill'
import { AnalyzeButton } from '@/components/table/AnalyzeButton'
import { formatDateDDMMYYYY } from '@/utils/helper'
import type { Page } from '@/utils/apis/pageApi'
import { useState } from 'react'
import { EditPageTitleDialog } from './EditPageTitleDialog'
import type { TableAction } from '../table/types'
import { toast } from 'sonner'
import { useRegenerateScenariosMutation } from '@/utils/queries/scenarioQueries'

type Props = {
  data: Page[]
  onDelete: (pageId: number) => void
}

export function PageTable({ data, onDelete }: Props) {
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [selectedPage, setSelectedPage] = useState<Page | null>(null)
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

  const actions: TableAction<Page>[] = [
    {
      label: 'Edit Page Title',
      onClick: (p: Page) => {
        setSelectedPage(p)
        setEditOpen(true)
      },
    },
    {
      label: 'View Page Info',
      onClick: (p: Page) => navigate(`/page-info/${p.id}`),
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

  // function handlePause(page: Page) {
  //   console.log('PAUSE ANALYSIS', page.id)
  // }

  return (
    <>
      <DynamicTable data={data} columns={columns} actions={actions} getRowKey={(p) => p.id} />

      <EditPageTitleDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) setSelectedPage(null)
        }}
        pageId={selectedPage?.id ?? null}
        currentTitle={selectedPage?.page_title}
      />
    </>
  )
}
