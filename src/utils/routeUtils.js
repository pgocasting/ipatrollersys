// Route utility functions for better page persistence

export const VALID_PAGES = ['dashboard', 'ipatroller', 'commandcenter', 'reports', 'incidents', 'actioncenter', 'settings', 'firebase-test', 'cloudinary-demo', 'firebase-cloudinary-demo', 'photo-migration'];

export const getCurrentPageFromURL = () => {
  const path = window.location.pathname;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // If path is empty or just '/', default to dashboard
  if (!cleanPath || cleanPath === '') {
    return 'dashboard';
  }
  
  // Check if the path is a valid page
  if (VALID_PAGES.includes(cleanPath)) {
    return cleanPath;
  }
  
  // If invalid path, return dashboard
  return 'dashboard';
};

export const isValidPage = (page) => {
  return VALID_PAGES.includes(page);
};

export const updateURL = (page, replace = true) => {
  const method = replace ? 'replaceState' : 'pushState';
  window.history[method]({ page }, '', `/${page}`);
};

export const syncURLWithPage = (currentPage) => {
  const currentPath = window.location.pathname;
  const expectedPath = `/${currentPage}`;
  
  if (currentPath !== expectedPath) {
    updateURL(currentPage, true);
  }
};

export const handleBrowserNavigation = (setCurrentPage) => {
  const handlePopState = () => {
    const page = getCurrentPageFromURL();
    if (isValidPage(page)) {
      setCurrentPage(page);
    } else {
      setCurrentPage('dashboard');
      updateURL('dashboard', true);
    }
  };

  const handleUrlChange = () => {
    handlePopState();
  };

  window.addEventListener('popstate', handlePopState);
  window.addEventListener('hashchange', handleUrlChange);
  
  return () => {
    window.removeEventListener('popstate', handlePopState);
    window.removeEventListener('hashchange', handleUrlChange);
  };
};
