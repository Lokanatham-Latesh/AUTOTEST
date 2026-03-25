import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FileText, List, Database, GitBranch, Layout, Calendar, MoreVertical } from 'lucide-react'
import { useSiteInfoQuery } from '@/utils/queries/sitesQuery'
import StatusBadge from '@/components/status/StatusBadge'
import StatusDots from '@/components/status/StatusDots'
import { useWebSocketContext } from '@/contexts/WebSocketProvider'
import { useQueryClient } from '@tanstack/react-query'
import type { Attribute } from '@/types/siteAttribute'
import SiteAttributeSheet from './SiteAttributeSheet'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

const SiteInfoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError } = useSiteInfoQuery(id || '')
  const queryClient = useQueryClient()
  const { lastMessage } = useWebSocketContext()

  const [attributes, setAttributes] = useState<Attribute[]>([
    { id: 1, site_id: Number(id), attribute_key: 'env', attribute_title: 'Environment' },
    { id: 2, site_id: Number(id), attribute_key: 'region', attribute_title: 'Region' },
  ])

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editData, setEditData] = useState<Attribute | null>(null)

  useEffect(() => {
    if (!lastMessage) return
    if (lastMessage.type !== 'SITE_STATUS_UPDATE') return

    const { site_id, site_status, page_count, test_scenario_count, test_case_count } =
      lastMessage.payload

    if (String(site_id) !== id) return

    queryClient.setQueryData(['site-info', id], (oldData: any) => {
      if (!oldData) return oldData

      return {
        ...oldData,
        analyzeStatus: site_status ?? oldData.analyzeStatus,
        stats: {
          ...oldData.stats,
          pages: page_count ?? oldData.stats.pages,
          testScenario: test_scenario_count ?? oldData.stats.testScenario,
          testCases: test_case_count ?? oldData.stats.testCases,
        },
      }
    })
  }, [lastMessage, queryClient, id])

  const handleCreate = (data: Attribute[]) => {
    const newItems = data.map((d, i) => ({
      id: Date.now() + i,
      ...d,
    }))
    setAttributes((prev) => [...prev, ...newItems])
  }

  const handleUpdate = (data: Attribute[]) => {
    const updated = data[0]

    setAttributes((prev) =>
      prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
    )
  }

  const handleDelete = (id: number) => {
    setAttributes((prev) => prev.filter((item) => item.id !== id))
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-500">Loading...</div>
  }

  if (isError || !data) {
    return <div className="p-6 text-sm text-red-500">Error</div>
  }

  const dashboardStats = [
    { label: 'Pages', value: data.stats.pages, icon: <FileText /> },
    { label: 'Test Scenario', value: data.stats.testScenario, icon: <List /> },
    { label: 'Test Cases', value: data.stats.testCases, icon: <Database /> },
    { label: 'Test Suite', value: data.stats.testSuite, icon: <GitBranch /> },
    { label: 'Test Environment', value: data.stats.testEnvironment, icon: <Layout /> },
    { label: 'Schedule Test Case', value: data.stats.scheduleTestCase, icon: <Calendar /> },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[6.5fr_3.5fr] gap-8 mx-auto">
      {/* LEFT */}
      <div className="flex flex-col gap-8">
        <div className="border border-[#E4D7D7] bg-white rounded-[6px]">
          <div className="bg-[#FFF8F8] border-b px-4 py-3">
            <h2 className="text-[15px] font-semibold">Analyze Process</h2>
          </div>

          <div className="p-5 flex justify-between">
            <div>
              <StatusBadge status={data.analyzeStatus} />
              <StatusDots status={data.analyzeStatus} />
            </div>
          </div>
        </div>

        <div className="border border-[#E4D7D7] bg-white rounded-[6px]">
          <div className="bg-[#FFF8F8] border-b px-4 py-3">
            <h2 className="text-[15px] font-semibold">Site Dashboard</h2>
          </div>

          <div className="p-5 grid grid-cols-2 gap-4">
            {dashboardStats.map((stat) => (
              <div key={stat.label} className="border p-4 rounded-lg flex gap-3">
                {stat.icon}
                <div>
                  <p className="text-xs">{stat.label}</p>
                  <p className="font-bold">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex flex-col gap-6">
        {/* SITE DETAIL */}
        <div className="border border-[#E4D7D7] bg-white rounded-[6px]">
          <div className="bg-[#FFF8F8] border-b px-4 py-3">
            <h2 className="text-[15px] font-semibold">Site Detail</h2>
          </div>

          <div className="p-4 space-y-3">
            <DetailItem label="Created On" value={new Date(data.createdAt).toLocaleString()} />
            <DetailItem label="Updated On" value={new Date(data.updatedAt).toLocaleString()} />
            <DetailItem label="Site Title" value={data.title} />

            <div>
              <p className="text-[11px] text-[#8B6E6E]">Site URL</p>
              <a href={data.url} target="_blank" rel="noreferrer" className="text-blue-500">
                {data.url}
              </a>
            </div>
          </div>
        </div>

        {/* SITE ATTRIBUTES */}
        {/* SITE ATTRIBUTES */}
        <div className="border border-[#E4D7D7] bg-white rounded-[6px]">
          <div className="bg-[#FFF8F8] border-b py-3 px-4 flex justify-between items-center">
            <h2 className="text-[15px] font-semibold">Site Attributes</h2>

            <button
              onClick={() => {
                setEditData(null)
                setSheetOpen(true)
              }}
              className="text-red-500 border border-red-500 px-3 py-1 rounded text-sm cursor-pointer"
            >
              + Add Attribute
            </button>
          </div>

          <div className="p-4 max-h-[220px] overflow-y-auto hide-scrollbar">
            {attributes.length === 0 ? (
              <p className="text-sm text-gray-400">No attributes added</p>
            ) : (
              attributes.map((attr) => (
                <div key={attr.id} className="flex justify-between items-center border-b py-2">
                  <div>
                    <p className="font-medium">{attr.attribute_key}</p>
                    <p className="text-xs text-gray-500">{attr.attribute_title}</p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 hover:bg-gray-100 rounded cursor-pointer">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditData(attr)
                          setSheetOpen(true)
                        }}
                      >
                        Update
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => {
                          if (attr.id !== undefined) {
                            handleDelete(attr.id)
                          }
                        }}
                        className="text-red-500"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <SiteAttributeSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSubmit={editData ? handleUpdate : handleCreate}
        editData={editData}
        siteId={Number(id)}
      />
    </div>
  )
}

const DetailItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-[11px] text-[#8B6E6E]">{label}</p>
    <p className="text-sm font-medium">{value}</p>
  </div>
)

export default SiteInfoPage
