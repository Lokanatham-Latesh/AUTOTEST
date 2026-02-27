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
      render: (p: Page) => <span className="font-medium truncate">{p.page_title}</span>,
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
          <span>Re-Generate</span>
          <span className="text-xs text-muted-foreground">Test Scenario</span>
        </div>
      ),
      align: 'center' as const,
      render: (p: Page) => (
        <AnalyzeButton
          status={p.status}
          onPlay={() => handlePlay(p)}
          onPause={() => handlePause(p)}
        />
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

  function handlePause(page: Page) {
    console.log('PAUSE ANALYSIS', page.id)
  }

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
