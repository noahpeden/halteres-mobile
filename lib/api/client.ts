import { supabase } from "@/lib/supabase/client";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "https://halteres.ai";

export class ApiClient {
  private async getAuthHeader(): Promise<HeadersInit> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("No authentication token");
    }

    return {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    };
  }

  async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeader();
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.statusText} - ${error}`);
    }

    return response.json();
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const headers = await this.getAuthHeader();
    
    console.log(`[ApiClient] POST ${API_BASE}${endpoint}`);
    console.log(`[ApiClient] Request body:`, JSON.stringify(data).substring(0, 200));
    
    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log(`[ApiClient] Response status: ${response.status}`);
      console.log(`[ApiClient] Response headers:`, response.headers);

      if (!response.ok) {
        const error = await response.text();
        console.error(`[ApiClient] Error response:`, error);
        throw new Error(`API Error: ${response.statusText} - ${error}`);
      }

      const json = await response.json();
      console.log(`[ApiClient] Response JSON:`, json);
      return json;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out after 30 seconds');
      }
      throw error;
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const headers = await this.getAuthHeader();
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.statusText} - ${error}`);
    }

    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeader();
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.statusText} - ${error}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
