import { useState } from 'react'
import TrainerWorkloadChart from '../components/insights/TrainerWorkloadChart'
import { WorkloadConfig, DEFAULT_WORKLOAD_CONFIG } from '../utils/workloadCalculations'

function Insights() {
  const [workloadConfig, setWorkloadConfig] = useState<WorkloadConfig>(DEFAULT_WORKLOAD_CONFIG)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink-900">Insights</h2>
        <p className="text-gray-600">Analytics and reports to help optimize trainer workload distribution</p>
      </div>
      
      <TrainerWorkloadChart 
        config={workloadConfig}
        onConfigChange={setWorkloadConfig}
      />
    </div>
  )
}

export default Insights