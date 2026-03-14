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

// import React from "react";
// import { useAppDispatch, useAppSelector } from "../../../hooks/useRequestFormState";
// import { setToken } from "../../../state/githubSlice";
//
// const GitHubAuthButton = () => {
//   const dispatch = useAppDispatch();
//   const token = useAppSelector((state: any) => state.github?.token);
//
//   const handleLogin = () => {
//     const clientId = "Ov23liR0F5RL7r5YcC8H";
//     const redirectUri = "http://localhost:5173/callback";
//     const scope = "repo";
//
//     window.location.href =
//       `https://github.com/login/oauth/authorize` +
//       `?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`+ `&prompt=consent`;
//   };
//
//   const handleLogout = () => {
//     dispatch(setToken(null));
//   };
//
//   React.useEffect(() => {
//     const params = new URLSearchParams(window.location.search);
//     const code = params.get("code");
//
//     if (!code) return;
//     if (!window.electron?.githubLogin) {
//       console.warn("Electron githubLogin bridge not available");
//       return;
//     }
//
//     const login = async () => {
//       try {
//         const token = await window.electron.githubLogin(code); 
//         console.log("Token from github",token)// ✅ token is STRING
//         dispatch(setToken(token));
//       } catch (err) {
//         console.error("GitHub login failed", err);
//       }
//     };
//
//     login();
//   }, [dispatch]);
//
//   return (
//     <button onClick={token ? handleLogout : handleLogin}>
//       {token ? "🚪 Logout from GitHub" : "🔐 Login with GitHub"}
//     </button>
//   );
// };
//
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
      `?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}` +
      `&prompt=consent`;
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
        console.log("Token from github", token);
        dispatch(setToken(token));
      } catch (err) {
        console.error("GitHub login failed", err);
      }
    };
    login();
  }, [dispatch]);

  const isLoggedIn = !!token;

  return (
    <button
      onClick={isLoggedIn ? handleLogout : handleLogin}
      title={isLoggedIn ? "Disconnect GitHub" : "Connect GitHub"}
      className="flex-shrink-0 flex items-center gap-1.5 px-2.5 rounded-lg transition-all duration-200 focus:outline-none group relative overflow-hidden"
      style={{
        height: 28,
        background: isLoggedIn
          ? "rgba(34,211,238,0.06)"
          : "rgba(15,23,42,0.0)",
        border: isLoggedIn
          ? "1px solid rgba(34,211,238,0.2)"
          : "1px solid rgba(148,163,184,0.14)",
        backdropFilter: "blur(8px)",
        color: isLoggedIn ? "rgba(34,211,238,0.85)" : "rgba(148,163,184,0.7)",
        boxShadow: isLoggedIn
          ? "inset 0 1px 0 rgba(255,255,255,0.07), 0 0 10px rgba(34,211,238,0.08)"
          : "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
      onMouseEnter={(e) => {
        if (isLoggedIn) {
          e.currentTarget.style.background = "rgba(248,113,113,0.07)";
          e.currentTarget.style.borderColor = "rgba(248,113,113,0.25)";
          e.currentTarget.style.color = "#fca5a5";
          e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.25)";
        } else {
          e.currentTarget.style.background = "rgba(148,163,184,0.08)";
          e.currentTarget.style.borderColor = "rgba(148,163,184,0.28)";
          e.currentTarget.style.color = "#e2e8f0";
          e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 8px rgba(0,0,0,0.25)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isLoggedIn ? "rgba(34,211,238,0.06)" : "rgba(15,23,42,0.0)";
        e.currentTarget.style.borderColor = isLoggedIn ? "rgba(34,211,238,0.2)" : "rgba(148,163,184,0.14)";
        e.currentTarget.style.color = isLoggedIn ? "rgba(34,211,238,0.85)" : "rgba(148,163,184,0.7)";
        e.currentTarget.style.boxShadow = isLoggedIn
          ? "inset 0 1px 0 rgba(255,255,255,0.07), 0 0 10px rgba(34,211,238,0.08)"
          : "inset 0 1px 0 rgba(255,255,255,0.05)";
      }}
    >
      {/* GitHub mark */}
      <svg
        className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
        width="13" height="13" viewBox="0 0 24 24" fill="currentColor"
      >
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
      </svg>

      {/* Label */}
      <span className="text-[0.68rem] font-semibold tracking-wide leading-none">
        {isLoggedIn ? "Connected" : "GitHub"}
      </span>

      {/* Status dot */}
      <span
        className="flex-shrink-0 w-1.5 h-1.5 rounded-full transition-all duration-300"
        style={{
          background: isLoggedIn ? "#22d3ee" : "rgba(148,163,184,0.3)",
          boxShadow: isLoggedIn ? "0 0 5px #22d3ee" : "none",
        }}
      />
    </button>
  );
};

export default GitHubAuthButton;