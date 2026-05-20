import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Async fetch
export const fetchCoursesData = createAsyncThunk(
  "courses/fetchCoursesData",
  async () => {
    const response = await fetch("/Data/Courses.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to fetch courses");
    const data = await response.json();
    return data;
  }
);

const courseSlice = createSlice({
  name: "courses",
  initialState: {
    courses: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoursesData.pending, (state) => { state.loading = true; })
      .addCase(fetchCoursesData.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload;
      })
      .addCase(fetchCoursesData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default courseSlice.reducer;
