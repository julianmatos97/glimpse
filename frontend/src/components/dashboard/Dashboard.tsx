import { useState, useEffect } from "react";
import { Lead, LeadFilters } from "../../types/lead";
import {
  fetchLeads,
  uploadLeadsCsv,
  UploadResult,
  LeadQueryParams,
} from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import LeadTable from "./LeadTable";
import Logo from "../logo";

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LeadFilters>({ search: "" });
  const { user, logout, token } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [pagination, setPagination] = useState({ offset: 0, limit: 100 });
  const [totalLeads, setTotalLeads] = useState(0);
  // Fetch data with query params
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Convert frontend filters to API query params
        const apiParams: LeadQueryParams = {
          offset: pagination.offset,
          limit: pagination.limit,
        };

        // Only add filters that have values
        if (filters.source) apiParams.source = filters.source;
        if (filters.interestLevel) apiParams.interest = filters.interestLevel;
        if (filters.status) apiParams.status = filters.status;

        const data = await fetchLeads(apiParams);
        setLeads(data.leads);
        setTotalLeads(data.totalLeads);

        // Apply client-side text search filter only (other filters are handled by the API)
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          const textFiltered = data.leads.filter(
            (lead) =>
              lead.id.toLowerCase().includes(searchTerm) ||
              lead.name.toLowerCase().includes(searchTerm) ||
              lead.contactInfo.toLowerCase().includes(searchTerm)
          );
          setFilteredLeads(textFiltered);
        } else {
          setFilteredLeads(data.leads);
        }
      } catch (err) {
        setError("Failed to load leads data. Please try again later.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [
    filters.source,
    filters.interestLevel,
    filters.status,
    pagination,
    token,
  ]);

  // Apply text search filter when it changes (without re-fetching from API)
  useEffect(() => {
    if (leads.length === 0 || isLoading) return;

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const result = leads.filter(
        (lead) =>
          lead.id.toLowerCase().includes(searchTerm) ||
          lead.name.toLowerCase().includes(searchTerm) ||
          lead.contactInfo.toLowerCase().includes(searchTerm)
      );
      setFilteredLeads(result);
    } else {
      setFilteredLeads(leads);
    }
  }, [filters.search, leads, isLoading]);

  // Handle filter changes
  const handleFilterChange = (newFilters: LeadFilters) => {
    // Reset pagination when filters change
    if (
      newFilters.source !== filters.source ||
      newFilters.interestLevel !== filters.interestLevel ||
      newFilters.status !== filters.status
    ) {
      setPagination({ offset: 0, limit: 100 });
    }

    setFilters(newFilters);
  };

  const handleLogout = () => {
    logout();
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!token) {
      setError("Authentication token not found. Please log in again.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadResult(null);
      const result = await uploadLeadsCsv(file, token);
      setUploadResult(result);

      // Refresh leads after successful upload
      // @ts-ignore
      if (result.rowsImported > 0 || result.rowsUpdated > 0) {
        const data = await fetchLeads();
        setLeads(data.leads);
        setFilteredLeads(data.leads);
        setTotalLeads(data.totalLeads);
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Failed to upload leads data. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = "";
    }
  };

  // Handle pagination changes
  const handlePageChange = (newOffset: number, newLimit: number) => {
    setPagination({ offset: newOffset, limit: newLimit });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Logo height="70%" width="70%" />
            </div>
            <div className="flex items-center">
              {user && (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">{user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Leads Dashboard
            </h2>
            <p className="text-gray-500 mt-2">
              {isLoading
                ? "Loading leads data..."
                : error
                ? error
                : `Showing ${filteredLeads.length} of ${totalLeads} leads`}
            </p>
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
              {error}
            </div>
          ) : (
            <>
              {/* CSV Upload Section */}
              <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Import Leads
                </h3>
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                  <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload CSV File
                    </label>
                    <div className="mt-1 flex items-center">
                      <label className="block w-full">
                        <span className="sr-only">Choose CSV file</span>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-medium
                            file:bg-indigo-50 file:text-indigo-700
                            hover:file:bg-indigo-100"
                        />
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      CSV should include: Lead Name, Contact Information,
                      Source, Interest Level, Status, Assigned Salesperson
                    </p>
                  </div>
                  {isUploading && (
                    <div className="flex items-center text-sm text-indigo-600">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-indigo-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Uploading...
                    </div>
                  )}
                </div>

                {uploadResult && (
                  <div
                    className={`mt-4 p-3 rounded-md ${
                      uploadResult.errors.length
                        ? "bg-yellow-50"
                        : "bg-green-50"
                    }`}
                  >
                    <h4 className="font-medium text-sm">
                      {uploadResult.errors.length
                        ? "Upload completed with warnings"
                        : "Upload successful"}
                    </h4>
                    <p className="text-sm mt-1">
                      Processed {uploadResult.rowsProcessed} rows:
                      <span className="ml-1 font-medium text-green-700">
                        {uploadResult.rowsImported} imported
                      </span>
                      {/* @ts-ignore */}
                      {uploadResult.rowsUpdated > 0 && (
                        // @ts-ignore
                        <span className="ml-1 font-medium text-blue-700">
                          {/* @ts-ignore */}
                          {uploadResult.rowsUpdated} updated
                        </span>
                      )}
                      {/* @ts-ignore */}
                      {uploadResult.duplicatesFound > 0 && (
                        // @ts-ignore
                        <span className="ml-1 font-medium text-amber-700">
                          {/* @ts-ignore */}
                          {uploadResult.duplicatesFound} duplicates found
                        </span>
                      )}
                    </p>
                    {uploadResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Errors:</p>
                        <ul className="list-disc pl-5 text-xs mt-1 space-y-1">
                          {uploadResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <LeadTable
                leads={filteredLeads}
                isLoading={isLoading}
                filters={filters}
                onFilterChange={handleFilterChange}
                pagination={pagination}
                onPageChange={handlePageChange}
                totalLeads={totalLeads}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
