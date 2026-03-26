import { apiClient, handleApiCall, ApiError } from './apiClient';

export interface User {
  uid: string;
  email: string;
  display_name?: string;
  role: 'admin' | 'analyst' | 'viewer';
  created_at: string;
  last_login: string;
}

export interface UserUpdateResponse {
  status: string;
  user: User;
}

/**
 * List all users (admin only)
 */
export async function listUsers(): Promise<{ users: User[] }> {
  try {
    return await handleApiCall(
      apiClient.get('/users'),
      'Failed to list users'
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'USER_LIST_ERROR', 'Failed to list users', error);
  }
}

/**
 * Get current user info
 */
export async function getCurrentUser(): Promise<User> {
  try {
    const response = await handleApiCall(
      apiClient.get('/users/me'),
      'Failed to retrieve current user'
    );
    return response.user;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'USER_RETRIEVAL_ERROR', 'Failed to retrieve user info', error);
  }
}

/**
 * Assign a role to a user (admin only)
 */
export async function assignRole(
  uid: string,
  role: 'admin' | 'analyst' | 'viewer'
): Promise<UserUpdateResponse> {
  try {
    return await handleApiCall(
      apiClient.post(`/users/${uid}/role`, { role }),
      `Failed to assign role to user ${uid}`
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'ROLE_ASSIGNMENT_ERROR', 'Failed to assign role', error);
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<User>
): Promise<UserUpdateResponse> {
  try {
    return await handleApiCall(
      apiClient.put(`/users/${uid}`, updates),
      `Failed to update user ${uid}`
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'USER_UPDATE_ERROR', 'Failed to update user profile', error);
  }
}

/**
 * Delete a user (admin only)
 */
export async function deleteUser(uid: string): Promise<{ status: string }> {
  try {
    return await handleApiCall(
      apiClient.delete(`/users/${uid}`),
      `Failed to delete user ${uid}`
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'USER_DELETE_ERROR', 'Failed to delete user', error);
  }
}
