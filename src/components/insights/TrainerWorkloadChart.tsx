import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  calculateTrainerWorkloads,
  DEFAULT_WORKLOAD_CONFIG,
  getStatusColor,
  TrainerWorkload,
  WorkloadConfig,
} from "../../utils/workloadCalculations";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: TrainerWorkload;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{data.trainerName}</p>
        <p className="text-sm text-gray-600">
          Students: <span className="font-medium">{data.studentCount}</span>
        </p>
        <p
          className="text-sm capitalize"
          style={{ color: getStatusColor(data.status) }}
        >
          Status: {data.status}
        </p>
      </div>
    );
  }
  return null;
}

interface TrainerWorkloadChartProps {
  config?: WorkloadConfig;
  onConfigChange?: (config: WorkloadConfig) => void;
}

export default function TrainerWorkloadChart({
  config = DEFAULT_WORKLOAD_CONFIG,
  onConfigChange,
}: TrainerWorkloadChartProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const workloads = calculateTrainerWorkloads(config);

  const handleConfigChange = (updates: Partial<WorkloadConfig>) => {
    const newConfig = { ...config, ...updates };
    onConfigChange?.(newConfig);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Trainer Workload Distribution
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Recent student assignments per trainer (last 2 weeks)
          </p>
        </div>
        <button
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Configure
        </button>
      </div>

      {isConfigOpen && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h4 className="font-medium text-gray-900">Workload Configuration</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ideal Student Count
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={config.idealStudentCount}
              onChange={(e) =>
                handleConfigChange({
                  idealStudentCount: parseInt(e.target.value) || 3,
                })
              }
              className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {workloads.slice(0, 3).map((trainer, index) => (
          <div
            key={trainer.trainerId}
            className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                    <span className="text-sm font-bold text-gray-700">
                      #{index + 1}
                    </span>
                  </div>
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getStatusColor(trainer.status) }}
                  ></div>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  {trainer.trainerName}
                </p>
                <p className="text-xs text-gray-600 capitalize">
                  {trainer.status === "ideal" && "Ideal workload"}
                  {trainer.status === "overloaded" && "Overloaded"}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="text-3xl font-bold"
                  style={{ color: getStatusColor(trainer.status) }}
                >
                  {trainer.studentCount}
                </p>
                <p className="text-xs text-gray-500 font-medium">students</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h4 className="text-lg font-semibold text-gray-900 mb-6">
          Student Count per Trainer
        </h4>
        {workloads.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No trainer data available</p>
            <p className="text-sm">
              Add trainers and sessions to see workload distribution
            </p>
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height={Math.max(300, workloads.length * 60)}
          >
            <BarChart
              data={workloads}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 120, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="trainerName" width={110} />
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
    </div>
  );
}
