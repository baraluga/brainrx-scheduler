import { useState } from 'react'
import TrainerWorkloadChart from '../components/insights/TrainerWorkloadChart'
import { WorkloadConfig, DEFAULT_WORKLOAD_CONFIG } from '../utils/workloadCalculations'

type InsightTab = 'workload' | 'performance' | 'utilization'

function Insights() {
  const [activeTab, setActiveTab] = useState<InsightTab>('workload')
  const [workloadConfig, setWorkloadConfig] = useState<WorkloadConfig>(DEFAULT_WORKLOAD_CONFIG)

  const tabs = [
    { id: 'workload' as const, label: 'Workload Distribution', description: 'Trainer student assignment analysis' },
    { id: 'performance' as const, label: 'Performance Metrics', description: 'Coming soon - Session completion rates and outcomes' },
    { id: 'utilization' as const, label: 'Resource Utilization', description: 'Coming soon - Schedule optimization and capacity analysis' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink-900">Insights</h2>
        <p className="text-gray-600">Analytics and reports to optimize training operations</p>
      </div>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'workload' && (
          <TrainerWorkloadChart 
            config={workloadConfig}
            onConfigChange={setWorkloadConfig}
          />
        )}
        
        {activeTab === 'performance' && (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Metrics</h3>
              <p className="text-gray-600">
                Session completion rates, student progress tracking, and outcome analysis will be available here.
              </p>
            </div>
          </div>
        )}
        
        {activeTab === 'utilization' && (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Resource Utilization</h3>
              <p className="text-gray-600">
                Schedule optimization insights, capacity analysis, and resource allocation recommendations will be shown here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Insights