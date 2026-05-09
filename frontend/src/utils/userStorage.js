export function getUserId() {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user._id) return user._id;
    }
  } catch {}
  return 'guest';
}

export function getUserKey(key) {
  return `${key}_${getUserId()}`;
}

export function getUserItem(key, defaultValue) {
  const val = localStorage.getItem(getUserKey(key));
  return val !== null ? val : defaultValue;
}

export function setUserItem(key, value) {
  localStorage.setItem(getUserKey(key), value);
}

export function removeUserItem(key) {
  localStorage.removeItem(getUserKey(key));
}
