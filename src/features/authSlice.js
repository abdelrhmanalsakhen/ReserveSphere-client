import { createSlice } from '@reduxjs/toolkit';

const TOKEN_KEY = 'reservesphere.token';
const USER_KEY = 'reservesphere.user';

const read = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: localStorage.getItem(TOKEN_KEY) || null,
    user: read(USER_KEY),
  },
  reducers: {
    credentialsReceived: (state, { payload }) => {
      state.token = payload.token;
      state.user = payload.user;
      localStorage.setItem(TOKEN_KEY, payload.token);
      localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
    },
    userRefreshed: (state, { payload }) => {
      state.user = payload;
      localStorage.setItem(USER_KEY, JSON.stringify(payload));
    },
    loggedOut: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
  },
});

export const { credentialsReceived, userRefreshed, loggedOut } = authSlice.actions;
export default authSlice.reducer;

export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => Boolean(state.auth.token);
export const selectIsAdmin = (state) => ['room_admin', 'owner'].includes(state.auth.user?.role);
export const selectIsOwner = (state) => state.auth.user?.role === 'owner';
