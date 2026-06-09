// ============================================================
//  AUTHENTICATION SERVICE
// ============================================================

export const Auth = {
  isLoggedIn() {
    return !!localStorage.getItem('bl_jwt') && !!localStorage.getItem('bl_user');
  },

  getToken() {
    return localStorage.getItem('bl_jwt');
  },

  getSession() {
    const user = localStorage.getItem('bl_user');
    if (!user) return null;
    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  },

  saveSession(token, user) {
    localStorage.setItem('bl_jwt', token);
    localStorage.setItem('bl_user', JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem('bl_jwt');
    localStorage.removeItem('bl_user');
  }
};
