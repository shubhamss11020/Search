import { apiClient } from '../shared/api_client';
import { getAuthToken, setAuthToken } from '../shared/storage';

document.addEventListener('DOMContentLoaded', async () => {
  const authView = document.getElementById('auth-view')!;
  const mainView = document.getElementById('main-view')!;
  const authForm = document.getElementById('auth-form') as HTMLFormElement;
  const tabLoginBtn = document.getElementById('tab-login-btn')!;
  const tabRegisterBtn = document.getElementById('tab-register-btn')!;
  const groupFullName = document.getElementById('group-fullname')!;
  const authSubmitBtn = document.getElementById('auth-submit-btn')!;
  const statusIndicator = document.getElementById('status-indicator')!;
  const statusText = document.getElementById('status-text')!;
  const userDisplayName = document.getElementById('user-display-name')!;
  const openDashboardBtn = document.getElementById('open-dashboard-btn')!;
  const logoutBtn = document.getElementById('logout-btn')!;

  let isRegisterMode = false;

  tabLoginBtn.addEventListener('click', () => {
    isRegisterMode = false;
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
    groupFullName.style.display = 'none';
    authSubmitBtn.textContent = 'Sign In';
  });

  tabRegisterBtn.addEventListener('click', () => {
    isRegisterMode = true;
    tabRegisterBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    groupFullName.style.display = 'block';
    authSubmitBtn.textContent = 'Create Account';
  });

  async function checkAuth() {
    const token = await getAuthToken();
    if (!token) {
      showAuth();
      return;
    }

    try {
      const user = await apiClient.getMe();
      showMain(user);
    } catch (_) {
      await setAuthToken(null);
      showAuth();
    }
  }

  function showAuth() {
    authView.style.display = 'block';
    mainView.style.display = 'none';
    statusIndicator.className = 'status-dot status-offline';
    statusText.textContent = 'Sign In Required';
  }

  function showMain(user: any) {
    authView.style.display = 'none';
    mainView.style.display = 'block';
    statusIndicator.className = 'status-dot status-online';
    statusText.textContent = 'Connected';
    userDisplayName.textContent = user.full_name || user.email;

    checkActiveTabJob();
  }

  async function checkActiveTabJob() {
    const titleEl = document.getElementById('current-job-title')!;
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        if (currentTab && currentTab.url) {
          if (currentTab.url.includes('linkedin.com') || currentTab.url.includes('naukri.com')) {
            titleEl.textContent = 'Compatible Job Page Detected';
          } else {
            titleEl.textContent = 'No Supported Job Active';
          }
        }
      });
    } else {
      titleEl.textContent = 'Active in Browser';
    }
  }

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (document.getElementById('auth-email') as HTMLInputElement).value;
    const password = (document.getElementById('auth-password') as HTMLInputElement).value;
    const fullName = (document.getElementById('auth-fullname') as HTMLInputElement).value;

    try {
      authSubmitBtn.textContent = 'Please wait...';
      let res;
      if (isRegisterMode) {
        res = await apiClient.register(email, password, fullName || 'Candidate');
      } else {
        res = await apiClient.login(email, password);
      }

      await setAuthToken(res.access_token);
      showMain(res.user);
    } catch (err: any) {
      alert(`Authentication failed: ${err.message}`);
    } finally {
      authSubmitBtn.textContent = isRegisterMode ? 'Create Account' : 'Sign In';
    }
  });

  openDashboardBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'OPEN_DASHBOARD' });
    } else {
      window.open('../dashboard/index.html', '_blank');
    }
  });

  logoutBtn.addEventListener('click', async () => {
    await setAuthToken(null);
    showAuth();
  });

  await checkAuth();
});
