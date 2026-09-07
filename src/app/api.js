import { createApi } from '@reduxjs/toolkit/query/react';
import axios from 'axios';
import { loggedOut } from '../features/authSlice';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

// Endpoints below use both the string shorthand and the object form, so normalise, and
// report failures as { status, data } - the shape apiErrorMessage and the 401 guard read.
const axiosBaseQuery = async (args, { getState }) => {
  const { url, method = 'GET', body, params } = typeof args === 'string' ? { url: args } : args;
  const { token } = getState().auth;
  try {
    const { data, status } = await http({
      url,
      method,
      data: body,
      params,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    // A 204 hands axios an empty string; RTK Query cache entries read cleaner as null.
    return { data: status === 204 ? null : data };
  } catch (err) {
    return {
      error: {
        status: err.response?.status ?? 'FETCH_ERROR',
        data: err.response?.data ?? { error: err.message },
      },
    };
  }
};

// An expired or revoked token should drop the session rather than leave the UI
// retrying against a 401 forever.
const baseQueryWithAuthGuard = async (args, apiCtx, extraOptions) => {
  const result = await axiosBaseQuery(args, apiCtx, extraOptions);
  if (result.error?.status === 401 && apiCtx.getState().auth.token) apiCtx.dispatch(loggedOut());
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuthGuard,
  tagTypes: ['Room', 'Reservation', 'Notification', 'Stats', 'User'],
  endpoints: (build) => ({
    login: build.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    register: build.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    me: build.query({ query: () => '/auth/me' }),

    rooms: build.query({
      query: (params) => ({ url: '/rooms', params }),
      providesTags: ['Room'],
    }),
    roomFilters: build.query({ query: () => '/rooms/filters', providesTags: ['Room'] }),
    room: build.query({
      query: (id) => `/rooms/${id}`,
      providesTags: (result, error, id) => [{ type: 'Room', id }],
    }),
    createRoom: build.mutation({
      query: (body) => ({ url: '/rooms', method: 'POST', body }),
      invalidatesTags: ['Room', 'Stats'],
    }),
    updateRoom: build.mutation({
      query: ({ id, ...body }) => ({ url: `/rooms/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Room', 'Stats'],
    }),
    deleteRoom: build.mutation({
      query: (id) => ({ url: `/rooms/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Room', 'Stats', 'Reservation'],
    }),

    reservations: build.query({
      query: (params) => ({ url: '/reservations', params }),
      providesTags: ['Reservation'],
    }),
    reservation: build.query({
      query: (id) => `/reservations/${id}`,
      providesTags: (result, error, id) => [{ type: 'Reservation', id }],
    }),
    createReservation: build.mutation({
      query: (body) => ({ url: '/reservations', method: 'POST', body }),
      invalidatesTags: ['Reservation', 'Stats', 'Room'],
    }),
    updateReservation: build.mutation({
      query: ({ id, ...body }) => ({ url: `/reservations/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Reservation', 'Stats', 'Room'],
    }),
    decideReservation: build.mutation({
      query: ({ id, action, note }) => ({ url: `/reservations/${id}/${action}`, method: 'POST', body: { note } }),
      invalidatesTags: ['Reservation', 'Stats', 'Room', 'Notification'],
    }),

    notifications: build.query({ query: () => '/notifications', providesTags: ['Notification'] }),
    markNotificationRead: build.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsRead: build.mutation({
      query: () => ({ url: '/notifications/read-all', method: 'POST' }),
      invalidatesTags: ['Notification'],
    }),

    stats: build.query({ query: () => '/dashboard/stats', providesTags: ['Stats'] }),
    quote: build.query({ query: () => '/dashboard/quote' }),
    reports: build.query({ query: (days = 30) => ({ url: '/dashboard/reports', params: { days } }), providesTags: ['Stats'] }),

    users: build.query({ query: () => '/users', providesTags: ['User'] }),
    updateUserRole: build.mutation({
      query: ({ id, role }) => ({ url: `/users/${id}/role`, method: 'PATCH', body: { role } }),
      invalidatesTags: ['User', 'Room'],
    }),
  }),
});

export const {
  useLoginMutation, useRegisterMutation, useMeQuery,
  useRoomsQuery, useRoomFiltersQuery, useRoomQuery,
  useCreateRoomMutation, useUpdateRoomMutation, useDeleteRoomMutation,
  useReservationsQuery, useReservationQuery, useCreateReservationMutation,
  useUpdateReservationMutation, useDecideReservationMutation,
  useNotificationsQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation,
  useStatsQuery, useReportsQuery, useQuoteQuery,
  useUsersQuery, useUpdateUserRoleMutation,
} = api;
