import React from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/useRequestFormState';
import { exchangeCodeForToken, setToken } from '../../../state/githubSlice';

const GitHubAuthButton = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.github.token);

  const handleLogin = () => {
    // const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const clientId = 'Ov23liR0F5RL7r5YcC8H';
    // const redirectUri = import.meta.env.VITE_GITHUB_CALLBACK_URL;
    const redirectUri = 'http://localhost:5173/callback';
    const scope = 'repo';
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  };

  const handleLogout = () => {
    dispatch(setToken(null));
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && !token) {
      dispatch(exchangeCodeForToken(code));
    }
  }, [dispatch, token]);

  return (
    <button onClick={token ? handleLogout : handleLogin}>
      {token ? '🚪 Logout from GitHub' : '🔐 Login with GitHub'}
    </button>
  );
};

export default GitHubAuthButton;
