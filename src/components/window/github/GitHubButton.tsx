// import React from 'react';
// import { useAppDispatch, useAppSelector } from '../../../hooks/useRequestFormState';
// // FIX FOR IMPORT ERROR: Make sure the path is correct (relative path one dir up)
// import { setToken } from '../../../state/githubSlice';

// const GitHubAuthButton = () => {
//   const dispatch = useAppDispatch();
//   // FIX FOR STATE REFERENCE: fallback to empty string if github state doesn't exist
//   const token = useAppSelector((state: any) => state.github?.token);

//   const handleLogin = () => {
//     // const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
//     const clientId = 'Ov23liR0F5RL7r5YcC8H';
//     // const redirectUri = import.meta.env.VITE_GITHUB_CALLBACK_URL;
//     const redirectUri = 'http://localhost:5173/callback';
//     const scope = 'repo';
//     window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
//   };

//   const handleLogout = () => {
//     dispatch(setToken(null));
//   };

//   React.useEffect(() => {
//     const params = new URLSearchParams(window.location.search);
//     const code = params.get('code');

//     if (!code) return;

//     // In the browser (non‑Electron) `window.electron` will be undefined.
//     // Guard against that so the component doesn't crash.
//     if (window.electron?.githubLogin) {
//       const result = await window.electron.githubLogin(code);
//       dispatch(setToken(result.access_token));
//     }
//     if (window.electron?.githubLogin) {
//       const result = window.electron.githubLogin(code);
//       dispatch(setToken(result.token))
//     } else {
//       console.warn("Electron githubLogin bridge is not available.");
//       // If you later want to support a pure web flow, dispatch your
//       // `exchangeCodeForToken` thunk here instead.
//       // dispatch(exchangeCodeForToken(code));
//     }
//   }, [dispatch, token]);

//   return (
//     <button onClick={token ? handleLogout : handleLogin}>
//       {token ? '🚪 Logout from GitHub' : '🔐 Login with GitHub'}
//     </button>
//   );
// };

// export default GitHubAuthButton;

import React from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks/useRequestFormState";
import { setToken } from "../../../state/githubSlice";

const GitHubAuthButton = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state: any) => state.github?.token);

  const handleLogin = () => {
    const clientId = "Ov23liR0F5RL7r5YcC8H";
    const redirectUri = "http://localhost:5173/callback";
    const scope = "repo";

    window.location.href =
      `https://github.com/login/oauth/authorize` +
      `?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`+ `&prompt=consent`;
  };

  const handleLogout = () => {
    dispatch(setToken(null));
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) return;
    if (!window.electron?.githubLogin) {
      console.warn("Electron githubLogin bridge not available");
      return;
    }

    const login = async () => {
      try {
        const token = await window.electron.githubLogin(code); 
        console.log("Token from github",token)// ✅ token is STRING
        dispatch(setToken(token));
      } catch (err) {
        console.error("GitHub login failed", err);
      }
    };

    login();
  }, [dispatch]);

  return (
    <button onClick={token ? handleLogout : handleLogin}>
      {token ? "🚪 Logout from GitHub" : "🔐 Login with GitHub"}
    </button>
  );
};

export default GitHubAuthButton;
