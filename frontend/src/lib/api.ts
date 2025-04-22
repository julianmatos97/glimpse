import { Lead, LeadSource, InterestLevel, LeadStatus } from "../types/lead";
import { mockLeads } from "./mockData";

// Flag to use mock data during development
const USE_MOCK_DATA = false;

// Base API URL
const API_BASE_URL = "/api";

// Simulated API delay for mock data
const MOCK_DELAY = 800;

export interface LeadQueryParams {
  source?: LeadSource;
  interest?: InterestLevel;
  status?: LeadStatus;
  offset?: number;
  limit?: number;
}

/**
 * Fetch leads with optional filtering and pagination
 * @param params - Optional query parameters
 */
export async function fetchLeads(
  params?: LeadQueryParams
): Promise<{ leads: Lead[]; totalLeads: number }> {
  try {
    if (USE_MOCK_DATA) {
      // Return mock data with simulated delay
      await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

      // Apply filters to mock data if params are provided
      if (params) {
        let filteredLeads = [...mockLeads];

        if (params.source) {
          filteredLeads = filteredLeads.filter(
            (lead) => lead.source === params.source
          );
        }

        if (params.interest) {
          filteredLeads = filteredLeads.filter(
            (lead) => lead.interestLevel === params.interest
          );
        }

        if (params.status) {
          filteredLeads = filteredLeads.filter(
            (lead) => lead.status === params.status
          );
        }

        // Apply pagination
        const offset = params.offset || 0;
        const limit = params.limit || filteredLeads.length;

        return {
          leads: filteredLeads.slice(offset, offset + limit),
          totalLeads: filteredLeads.length,
        };
      }

      return { leads: [...mockLeads], totalLeads: mockLeads.length };
    }

    // Construct query string from params
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.source) queryParams.append("source", params.source);
      if (params.interest) queryParams.append("interest", params.interest);
      if (params.status) queryParams.append("status", params.status);
      if (params.offset !== undefined)
        queryParams.append("offset", params.offset.toString());
      if (params.limit !== undefined)
        queryParams.append("limit", params.limit.toString());
    }

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/leads${queryString ? `?${queryString}` : ""}`;

    // Real API call
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch leads: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform snake_case to camelCase in the response data
    return {
      leads: data[0].map((lead: any) => ({
        id: lead.id.toString(),
        name: lead.name,
        contactInfo: lead.contact_information,
        source: lead.source,
        interestLevel: lead.interest,
        status: lead.status,
        assignedSalesperson: lead.assigned_salesperson_name,
        salespersonId: lead.salesperson_id,
      })),
      totalLeads: data[1],
    };
  } catch (error) {
    console.error("Error fetching leads:", error);
    return { leads: [], totalLeads: 0 }; // Return empty array in case of error
  }
}

export interface UploadResult {
  filename: string;
  rowsProcessed: number;
  rowsImported: number;
  errors: string[];
}

/**
 * Upload leads CSV file
 */
export async function uploadLeadsCsv(
  file: File,
  token: string
): Promise<UploadResult> {
  try {
    if (USE_MOCK_DATA) {
      // Mock file upload with simulated delay
      await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

      return {
        filename: file.name,
        rowsProcessed: Math.floor(Math.random() * 20) + 5, // Random number between 5-25
        rowsImported: Math.floor(Math.random() * 10) + 3, // Random number between 3-13
        errors: file.name.includes("error")
          ? ["Row 3: Missing required field", "Row 7: Invalid enum value"]
          : [],
      };
    }

    // Create FormData to send the file
    const formData = new FormData();
    formData.append("file", file);

    // Real API call
    const response = await fetch(`${API_BASE_URL}/load_file`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || `Upload failed: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error uploading leads:", error);
    throw error;
  }
}
