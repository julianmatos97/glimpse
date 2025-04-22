import { useState } from "react";
import {
  Lead,
  LeadFilters,
  LeadSource,
  InterestLevel,
  LeadStatus,
} from "../../types/lead";

// Interest level badge colors
const interestLevelColors = {
  Low: "bg-gray-100 text-gray-800",
  Medium: "bg-blue-100 text-blue-800",
  High: "bg-green-100 text-green-800",
};

// Status badge colors
const statusColors = {
  New: "bg-purple-100 text-purple-800",
  Contacted: "bg-yellow-100 text-yellow-800",
  Qualified: "bg-indigo-100 text-indigo-800",
  Closed: "bg-green-100 text-green-800",
};

type PaginationProps = {
  offset: number;
  limit: number;
};

type LeadTableProps = {
  leads: Lead[];
  isLoading: boolean;
  onFilterChange: (filters: LeadFilters) => void;
  filters: LeadFilters;
  pagination: PaginationProps;
  onPageChange: (offset: number, limit: number) => void;
  totalLeads: number;
};

export default function LeadTable({
  leads,
  isLoading,
  onFilterChange,
  filters,
  pagination,
  onPageChange,
  totalLeads,
}: LeadTableProps) {
  const [sortField, setSortField] = useState<keyof Lead>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (field: keyof Lead) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedLeads = [...leads].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue === undefined || bValue === undefined) return 0;
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Filter change handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as LeadSource | "";
    onFilterChange({
      ...filters,
      source: value === "" ? undefined : (value as LeadSource),
    });
  };

  const handleInterestChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as InterestLevel | "";
    onFilterChange({
      ...filters,
      interestLevel: value === "" ? undefined : (value as InterestLevel),
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as LeadStatus | "";
    onFilterChange({
      ...filters,
      status: value === "" ? undefined : (value as LeadStatus),
    });
  };

  // Pagination handlers
  const handlePrevPage = () => {
    const newOffset = Math.max(0, pagination.offset - pagination.limit);
    onPageChange(newOffset, pagination.limit);
  };

  const handleNextPage = () => {
    const newOffset = pagination.offset + pagination.limit;
    onPageChange(newOffset, pagination.limit);
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value, 10);
    onPageChange(pagination.offset, newLimit);
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800">Leads</h2>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-3 py-2 border rounded-md"
              value={filters.search}
              onChange={handleSearchChange}
            />
          </div>

          <div>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={filters.source || ""}
              onChange={handleSourceChange}
            >
              <option value="">All Sources</option>
              <option value="Referral">Referral</option>
              <option value="Website">Website</option>
              <option value="Cold Call">Cold Call</option>
              <option value="Event">Event</option>
            </select>
          </div>

          <div>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={filters.interestLevel || ""}
              onChange={handleInterestChange}
            >
              <option value="">All Interest Levels</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={filters.status || ""}
              onChange={handleStatusChange}
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-500">Loading leads data...</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("id")}
                >
                  ID{" "}
                  {sortField === "id" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  Name{" "}
                  {sortField === "name" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("contactInfo")}
                >
                  Contact
                  {sortField === "contactInfo" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("source")}
                >
                  Source{" "}
                  {sortField === "source" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("interestLevel")}
                >
                  Interest{" "}
                  {sortField === "interestLevel" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("status")}
                >
                  Status{" "}
                  {sortField === "status" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("assignedSalesperson")}
                >
                  Assigned To{" "}
                  {sortField === "assignedSalesperson" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedLeads.length > 0 ? (
                sortedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {lead.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.contactInfo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          interestLevelColors[lead.interestLevel]
                        }`}
                      >
                        {lead.interestLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          statusColors[lead.status]
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.assignedSalesperson}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No leads found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <span className="mr-2 text-sm text-gray-600">Show</span>
          <select
            value={pagination.limit}
            onChange={handleLimitChange}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="250">250</option>
          </select>
          <span className="ml-2 text-sm text-gray-600">per page</span>
        </div>

        <div className="flex items-center">
          <span className="text-sm text-gray-600 mr-4">
            Showing {pagination.offset + 1} to{" "}
            {Math.min(
              pagination.offset + pagination.limit,
              totalLeads || 10000
            )}{" "}
            of {totalLeads} leads
          </span>

          <nav className="flex">
            <button
              onClick={handlePrevPage}
              disabled={pagination.offset === 0}
              className={`relative inline-flex items-center px-3 py-1 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                pagination.offset === 0
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={pagination.offset + pagination.limit >= totalLeads}
              className={`relative inline-flex items-center px-3 py-1 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                pagination.offset + pagination.limit >= totalLeads
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Next
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
