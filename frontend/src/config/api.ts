/**
 * API Configuration
 * Centralized API URLs for the application
 */

// Backend API URL - configured via environment variable
export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// API Endpoints
export const API_ENDPOINTS = {
  // Inventory
  inventory: `${API_BASE_URL}/api/inventory`,
  inventoryStats: `${API_BASE_URL}/api/inventory/stats`,
  inventoryLowStock: `${API_BASE_URL}/api/inventory/low-stock`,
  inventoryAnomalies: `${API_BASE_URL}/api/inventory/anomalies`,
  inventoryRestockRecommendations: `${API_BASE_URL}/api/inventory/restock-recommendations`,
  inventoryUploadCSV: `${API_BASE_URL}/api/inventory/upload-csv`,
  inventoryUsageTrends: `${API_BASE_URL}/api/inventory/usage-trends`,
  inventoryUsageByDepartment: `${API_BASE_URL}/api/inventory/usage-by-department`,
  inventoryForecast: `${API_BASE_URL}/api/inventory/forecast`,
  
  // News & AI Insights
  newsHealthAnalysis: `${API_BASE_URL}/news/health-inventory-analysis`,
  newsGenerateInsights: `${API_BASE_URL}/news/generate-insights`,
  newsImage: `${API_BASE_URL}/news/image`,
  newsChat: `${API_BASE_URL}/news/chat`,
  
  // Settings
  settingsProfile: `${API_BASE_URL}/api/settings/profile`,
  settingsHospital: `${API_BASE_URL}/api/settings/hospital`,
  
  // Reports
  reports: `${API_BASE_URL}/api/reports`,
};

/**
 * Helper function to build API URL
 */
export function buildApiUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
  if (!params) return endpoint;
  
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}

/**
 * Helper function for API requests with error handling
 */
export async function apiRequest<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText || response.statusText}`,
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
