import { useState } from 'react'
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell 
} from 'recharts'
import { 
  calculateTrainerWorkloads, 
  getStatusColor, 
  getWorkloadSummary,
  WorkloadConfig,
  DEFAULT_WORKLOAD_CONFIG,
  TrainerWorkload 
} from '../../utils/workloadCalculations'
import { listSessions } from '../../services/sessions'
import { listTrainers } from '../../services/trainers'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload: TrainerWorkload
  }>
  label?: string
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{data.trainerName}</p>
        <p className="text-sm text-gray-600">
          Students: <span className="font-medium">{data.studentCount}</span>
        </p>
        <p className="text-sm capitalize" style={{ color: getStatusColor(data.status) }}>
          Status: {data.status === 'approaching' ? 'Approaching Limit' : data.status}
        </p>
      </div>
    )
  }
  return null
}

interface TrainerWorkloadChartProps {
  config?: WorkloadConfig
  onConfigChange?: (config: WorkloadConfig) => void
}

export default function TrainerWorkloadChart({ 
  config = DEFAULT_WORKLOAD_CONFIG,
  onConfigChange 
}: TrainerWorkloadChartProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const workloads = calculateTrainerWorkloads(config)
  const summary = getWorkloadSummary(workloads)
  
  // Debug data
  const allSessions = listSessions()
  const allTrainers = listTrainers()
  

  const handleConfigChange = (updates: Partial<WorkloadConfig>) => {
    const newConfig = { ...config, ...updates }
    onConfigChange?.(newConfig)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Trainer Workload Distribution</h3>
          <p className="text-sm text-gray-600">Current week's student assignments per trainer</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Debug
          </button>
          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Configure
          </button>
        </div>
      </div>

      {isConfigOpen && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h4 className="font-medium text-gray-900">Workload Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ideal Student Count
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={config.idealStudentCount}
                onChange={(e) => handleConfigChange({ 
                  idealStudentCount: parseInt(e.target.value) || 3 
                })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Approaching Threshold (multiplier)
              </label>
              <input
                type="number"
                min="1"
                max="3"
                step="0.1"
                value={config.approachingThreshold}
                onChange={(e) => handleConfigChange({ 
                  approachingThreshold: parseFloat(e.target.value) || 1.5 
                })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {showDebug && (
        <div className="bg-red-50 p-4 rounded-lg space-y-4">
          <h4 className="font-medium text-red-900">Debug Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Raw Data:</strong>
              <p>Total trainers: {allTrainers.length}</p>
              <p>Total sessions: {allSessions.length}</p>
              <p>Scheduled sessions: {allSessions.filter(s => s.status === 'scheduled').length}</p>
            </div>
            <div>
              <strong>Sessions with studentId:</strong>
              <p>{allSessions.filter(s => s.studentId).length} out of {allSessions.length}</p>
              <strong>Sample session dates:</strong>
              {allSessions.slice(0, 3).map((session, i) => (
                <p key={i}>{session.date} - {session.status}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {workloads.slice(0, 3).map((trainer, index) => (
          <div key={trainer.trainerId} className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-gray-700">#{index + 1}</span>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusColor(trainer.status) }}></div>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1">{trainer.trainerName}</p>
                <p className="text-xs text-gray-600 capitalize">{trainer.status === 'approaching' ? 'Approaching Limit' : trainer.status}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: getStatusColor(trainer.status) }}>
                  {trainer.studentCount}
                </p>
                <p className="text-xs text-gray-500">students</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h4 className="text-md font-medium text-gray-900 mb-4">Student Count per Trainer</h4>
        {workloads.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No trainer data available</p>
            <p className="text-sm">Add trainers and sessions to see workload distribution</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(300, workloads.length * 60)}>
              <BarChart
                data={workloads}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 120, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="trainerName" 
                  width={110}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="studentCount">
                  {workloads.map((entry) => (
                    <Cell 
                      key={`cell-${entry.trainerId}`} 
                      fill={getStatusColor(entry.status)} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }}></div>
          <span>Ideal (≤{config.idealStudentCount} students)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
          <span>Approaching Limit</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }}></div>
          <span>Overloaded (&gt;{Math.floor(config.idealStudentCount * config.approachingThreshold)} students)</span>
        </div>
      </div>
    </div>
  )
}