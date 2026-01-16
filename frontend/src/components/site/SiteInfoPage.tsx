import React from 'react'
import { useParams } from 'react-router-dom'
import { FileText, List, Database, GitBranch, Layout, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSiteInfoQuery } from '@/utils/queries/sitesQuery'
import StatusBadge from '@/components/status/StatusBadge'
import StatusDots from '@/components/status/StatusDots'

const SiteInfoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError } = useSiteInfoQuery(id || '')

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-500">Loading site info...</div>
  }

  if (isError || !data) {
    return <div className="p-6 text-sm text-red-500">Failed to load site info</div>
  }

  const dashboardStats = [
    { label: 'Pages', value: data.stats.pages, icon: <FileText className="w-5 h-5" /> },
    { label: 'Test Scenario', value: data.stats.testScenario, icon: <List className="w-5 h-5" /> },
    { label: 'Test Cases', value: data.stats.testCases, icon: <Database className="w-5 h-5" /> },
    { label: 'Test Suite', value: data.stats.testSuite, icon: <GitBranch className="w-5 h-5" /> },
    {
      label: 'Test Environment',
      value: data.stats.testEnvironment,
      icon: <Layout className="w-5 h-5" />,
    },
    {
      label: 'Schedule Test Case',
      value: data.stats.scheduleTestCase,
      icon: <Calendar className="w-5 h-5" />,
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[6.5fr_3.5fr] gap-8 mx-auto">
      {/* LEFT COLUMN */}
      <div className="flex flex-col gap-8">
        {/* Analyze Process */}
        <div className="border border-[#E4D7D7] bg-white rounded-[6px] overflow-hidden">
          <div className="bg-[#FFF8F8] border-b border-[#E4D7D7] py-3 px-4">
            <h2 className="text-[15px] font-semibold text-[#322525]">Analyze Process</h2>
          </div>

          <div className="p-5 flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <StatusBadge status={data.analyzeStatus} />
              <StatusDots status={data.analyzeStatus} />
            </div>

            {data.analyzeStatus === 'Processing' && (
              <Button
                variant="outline"
                className="border-[#E63B3B] text-[#E63B3B] hover:bg-[#FFF0F0]"
              >
                View Logs
              </Button>
            )}
          </div>
        </div>

        {/* Site Dashboard */}
        <div className="border border-[#E4D7D7] bg-white rounded-[6px] overflow-hidden">
          <div className="bg-[#FFF8F8] border-b border-[#E4D7D7] py-3 px-4">
            <h2 className="text-[15px] font-semibold text-[#322525]">Site Dashboard</h2>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dashboardStats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center border border-[#EFE3E3] rounded-lg p-4"
              >
                <div className="bg-[#F6F0F0] p-3 rounded-lg mr-4">{stat.icon}</div>
                <div>
                  <p className="text-xs text-[#8B6E6E]">{stat.label}</p>
                  <p className="text-2xl font-bold text-[#2B1F1F]">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="border border-[#E4D7D7] bg-white rounded-[6px] h-fit">
        <div className="bg-[#FFF8F8] border-b border-[#E4D7D7] py-3 px-4">
          <h2 className="text-[15px] font-semibold text-[#322525]">Site Detail</h2>
        </div>

        <div className="p-6 space-y-6">
          <DetailItem label="Created On" value={new Date(data.createdAt).toLocaleString('en-GB')} />
          <DetailItem label="Updated On" value={new Date(data.updatedAt).toLocaleString('en-GB')} />
          <DetailItem label="Site Title" value={data.title} />

          <div>
            <p className="text-[11px] font-semibold uppercase text-[#8B6E6E] mb-1">Site URL</p>
            <a
              href={data.url}
              target="_blank"
              rel="noreferrer"
              className="text-[#2761FF] hover:underline break-all"
            >
              {data.url}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

const DetailItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase text-[#8B6E6E] mb-1">{label}</p>
    <p className="text-sm font-medium text-[#2B1F1F]">{value}</p>
  </div>
)

export default SiteInfoPage
