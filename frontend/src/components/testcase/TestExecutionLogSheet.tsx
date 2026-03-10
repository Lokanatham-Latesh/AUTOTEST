import React, { useState } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTestExecutions } from '@/utils/queries/testExecutionQueries'

interface Props {
  open: boolean
  onOpenChange: (value: boolean) => void
  testCaseId: number | null
  title: string
}

export const TestExecutionLogSheet: React.FC<Props> = ({
  open,
  onOpenChange,
  title,
  testCaseId,
}) => {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const { data: executions = [], isLoading } = useTestExecutions(testCaseId)

  const toggle = (id: number) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Passed':
        return 'bg-yellow-100 text-yellow-900 border-yellow-300'
      case 'Partially Passed':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'Failed':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      default:
        return ''
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="!w-[40vw] !max-w-none p-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Test Execution Log</h2>
        </div>

        {/* Body */}
        <div className="p-4 space-y-6 flex-1">
          <div className="border rounded-md p-5 bg-gray-50">
            <p className="text-gray-500 text-sm mb-1">Test case name</p>
            <p className="text-base font-medium">{title}</p>
          </div>

          <div className="border rounded-md overflow-hidden">
            <div className="grid grid-cols-3 px-6 py-4 bg-gray-50 border-b text-sm font-semibold">
              <div>Date & Time</div>
              <div>Status</div>
              <div className="text-right">Logs</div>
            </div>

            {isLoading && (
              <div className="p-6 text-sm text-gray-500">Loading execution logs...</div>
            )}

            {!isLoading && executions.length === 0 && (
              <div className="p-6 text-sm text-gray-500">No execution logs available</div>
            )}

            {executions.map((item: any) => (
              <div key={item.id} className="border-b last:border-none">
                <div className="grid grid-cols-3 items-center px-6 py-4">
                  <div className="text-base">{item.executed_on}</div>

                  <div>
                    <span
                      className={`px-3 py-1 rounded-md border text-sm font-medium ${getStatusStyle(
                        item.status,
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => toggle(item.id)}
                      className="p-1 rounded hover:bg-gray-100 cursor-pointer"
                    >
                      {expandedId === item.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {expandedId === item.id && item.logs && (
                  <div className="bg-gray-50 px-6 py-5 text-sm whitespace-pre-line leading-relaxed max-h-64 overflow-y-scroll hide-scrollbar">
                    {item.logs}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end">
          <Button
            variant="outline"
            className="px-6 cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
