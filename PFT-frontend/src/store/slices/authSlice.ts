import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types/domain";
import { backendApi, decodeUserFromToken } from "@/services/backendApi";
import axios from "axios";

const ACCESS_TOKEN_KEY = "pft-access-token";
const REFRESH_TOKEN_KEY = "pft-refresh-token";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string;
}

const readStoredUser = (): User | null => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) return null;
  return decodeUserFromToken(token);
};

const initialUser = readStoredUser();

const initialState: AuthState = {
  user: initialUser,
  isAuthenticated: Boolean(initialUser),
  isLoading: false,
  error: undefined
};

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | { error?: { message?: string; details?: Record<string, string[] | string> } }
      | undefined;

    const details = responseData?.error?.details;
    if (details && typeof details === "object") {
      const firstKey = Object.keys(details)[0];
      if (firstKey) {
        const firstValue = details[firstKey];
        if (Array.isArray(firstValue) && firstValue[0]) {
          return firstValue[0];
        }
        if (typeof firstValue === "string" && firstValue) {
          return firstValue;
        }
      }
    }

    const apiMessage = responseData?.error?.message;
    return apiMessage ?? error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Request failed";
};

export const loginAsync = createAsyncThunk(
  "auth/loginAsync",
  async (payload: { email: string; password: string }, thunkApi) => {
    try {
      const auth = await backendApi.login(payload);
      localStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
      const user = decodeUserFromToken(auth.accessToken);
      if (!user) {
        throw new Error("Invalid token payload from backend.");
      }
      return user;
    } catch (error) {
      return thunkApi.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const registerAsync = createAsyncThunk(
  "auth/registerAsync",
  async (payload: { fullName: string; email: string; password: string }, thunkApi) => {
    try {
      const auth = await backendApi.register(payload);
      localStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
      const decoded = decodeUserFromToken(auth.accessToken);
      if (!decoded) {
        throw new Error("Invalid token payload from backend.");
      }

      return {
        ...decoded,
        displayName: payload.fullName
      } satisfies User;
    } catch (error) {
      return thunkApi.rejectWithValue(getErrorMessage(error));
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logOut(state) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      state.user = null;
      state.isAuthenticated = false;
      state.error = undefined;
    },
    logIn(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = undefined;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string | undefined) ?? action.error.message ?? "Login failed";
      })
      .addCase(registerAsync.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(registerAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(registerAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string | undefined) ?? action.error.message ?? "Signup failed";
      });
  }
});

export const { logIn, logOut } = authSlice.actions;
export default authSlice.reducer;
