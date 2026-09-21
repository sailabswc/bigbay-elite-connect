const isNode = typeof window === 'undefined';
const TOKEN_STORAGE_KEY = 'bigbay_local_runtime_token';

const isClearAccessTokenRequested = () =>
  !isNode && new URLSearchParams(window.location.search).get('clear_access_token') === 'true';

const clearStoredAccessToken = () => {
  if (isNode) return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem('token');
};

const getAppParams = () => {
  if (isClearAccessTokenRequested()) {
    clearStoredAccessToken();
  }

  const token = !isNode ? (window.localStorage.getItem(TOKEN_STORAGE_KEY) || '') : '';

  return {
    appId: 'bigbay-local-runtime',
    token,
    functionsVersion: 'local-runtime',
    appBaseUrl: !isNode ? window.location.origin : 'http://localhost:5173',
  };
};

export const appParams = {
  ...getAppParams(),
};
