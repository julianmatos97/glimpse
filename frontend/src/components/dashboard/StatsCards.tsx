import { Lead, LeadStatus } from "../../types/lead";

type StatsCardsProps = {
  leads: Lead[];
  isLoading: boolean;
  totalLeads: number;
};

export default function StatsCards({
  leads,
  isLoading,
  totalLeads,
}: StatsCardsProps) {
  // Skip calculations if loading or no data
  if (isLoading || leads.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white shadow-md rounded-lg p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  // Calculate stats
  const leadsByStatus = leads.reduce<Record<LeadStatus, number>>(
    (acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    },
    {} as Record<LeadStatus, number>
  );

  const leadsBySource = leads.reduce<Record<string, number>>((acc, lead) => {
    acc[lead.source] = (acc[lead.source] || 0) + 1;
    return acc;
  }, {});

  const leadsByInterest = leads.reduce<Record<string, number>>((acc, lead) => {
    acc[lead.interestLevel] = (acc[lead.interestLevel] || 0) + 1;
    return acc;
  }, {});

  // Calculate conversion rate (Closed / Total)
  const closedLeads = leadsByStatus.Closed || 0;
  const conversionRate =
    totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : "0";

  // Find top salesperson
  const leadsBySalesperson = leads.reduce<Record<string, number>>(
    (acc, lead) => {
      acc[lead.assignedSalesperson] = (acc[lead.assignedSalesperson] || 0) + 1;
      return acc;
    },
    {}
  );

  const sortedSalespersons = Object.entries(leadsBySalesperson).sort(
    (a, b) => b[1] - a[1]
  );
  const topSalesperson =
    sortedSalespersons.length > 0 ? sortedSalespersons[0] : ["None", 0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <p className="text-sm font-medium text-gray-500">Total Leads</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{totalLeads}</p>
        <div className="mt-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">New</span>
            <span className="font-medium">{leadsByStatus.New || 0}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Contacted</span>
            <span className="font-medium">{leadsByStatus.Contacted || 0}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Qualified</span>
            <span className="font-medium">{leadsByStatus.Qualified || 0}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Closed</span>
            <span className="font-medium">{leadsByStatus.Closed || 0}</span>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">
          {conversionRate}%
        </p>
        <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${Math.min(Number(conversionRate), 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {closedLeads} out of {totalLeads} leads closed
        </p>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <p className="text-sm font-medium text-gray-500">Lead Sources</p>
        <div className="mt-4">
          {Object.entries(leadsBySource).map(([source, count]) => (
            <div key={source} className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">{source}</span>
                <span className="font-medium">{count}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full"
                  style={{ width: `${(count / totalLeads) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <p className="text-sm font-medium text-gray-500">Top Performer</p>
        <p className="text-2xl font-bold text-gray-900 mt-2">
          {topSalesperson[0]}
        </p>
        <p className="text-sm text-gray-500">{topSalesperson[1]} leads</p>

        <div className="mt-4">
          <p className="text-sm font-medium text-gray-500 mb-2">
            Interest Levels
          </p>
          <div className="flex space-x-2">
            <div className="flex-1">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-gray-300 mr-2"></span>
                <span className="text-xs">Low</span>
              </div>
              <p className="font-medium mt-1">{leadsByInterest.Low || 0}</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-blue-400 mr-2"></span>
                <span className="text-xs">Medium</span>
              </div>
              <p className="font-medium mt-1">{leadsByInterest.Medium || 0}</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-green-400 mr-2"></span>
                <span className="text-xs">High</span>
              </div>
              <p className="font-medium mt-1">{leadsByInterest.High || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
