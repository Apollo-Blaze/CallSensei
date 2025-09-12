// src/store/githubSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// const clientId = 'YOUR_CLIENT_ID';
// const clientSecret = 'YOUR_CLIENT_SECRET';

export const exchangeCodeForToken = createAsyncThunk(
  'github/exchangeCode',
  async (code : string) => {
    const res = await fetch('http://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: import.meta.env.VITE_GITHUB_CLIENT_ID,
        //client_secret: import.meta.env.VITE_GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = await res.json();
    return data.access_token;
  }
);

// export const fetchModel = createAsyncThunk(
//   'github/fetchModel',
//   async ({ token, owner, repo, path }) => {
//     const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     const data = await res.json();
//     return Buffer.from(data.content, 'base64').toString('utf-8');
//   }
// );

// export const pushModel = createAsyncThunk(
//   'github/pushModel',
//   async ({ token, owner, repo, path, content, message }) => {
//     const encoded = Buffer.from(content).toString('base64');

//     await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
//       method: 'PUT',
//       headers: {
//         Authorization: `Bearer ${token}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         message,
//         content: encoded,
//       }),
//     });

//     return path;
//   }
// );

const githubSlice = createSlice({
  name: 'github',
  initialState: {
    token: null,
    modelContent: '',
    status: 'idle',
  },
  reducers: {
    setToken(state, action) {
      state.token = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(exchangeCodeForToken.fulfilled, (state, action) => {
        state.token = action.payload;
      });
    //   .addCase(fetchModel.fulfilled, (state, action) => {
    //     state.modelContent = action.payload;
    //   });
  },
});

export const { setToken } = githubSlice.actions;
export default githubSlice.reducer;
