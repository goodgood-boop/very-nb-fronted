import { lsGet, lsSet, lsDel } from './storage'

const KEY_USERS = 'ai_users'
const KEY_SESSION = 'ai_session'

function hash(p) {
  // UI-only demo: do NOT use this in production
  let h = 0
  for (let i = 0; i < (p || '').length; i++) h = (h * 31 + p.charCodeAt(i)) | 0
  return String(h)
}

function getUsers() {
  return lsGet(KEY_USERS, [])
}

function setUsers(users) {
  lsSet(KEY_USERS, users)
}

export function currentUser() {
  const s = lsGet(KEY_SESSION, null)
  if (!s?.email) return null
  const u = getUsers().find(x => x.email === s.email) || null
  return u ? { ...u } : null
}

export function isAuthed() {
  return !!currentUser()
}

export function register({ email, username, password }) {
  email = (email || '').trim().toLowerCase()
  username = (username || '').trim()
  if (!email || !email.includes('@')) throw new Error('请输入有效邮箱')
  if (!username) throw new Error('请输入用户名')
  if (!password || password.length < 6) throw new Error('密码至少 6 位')

  const users = getUsers()
  if (users.some(u => u.email === email)) throw new Error('该邮箱已注册')

  const user = {
    email,
    username,
    passwordHash: hash(password),
    avatar: { kind: 'gradient', seed: email },
    createdAt: Date.now(),
  }
  users.unshift(user)
  setUsers(users)
  lsSet(KEY_SESSION, { email })
  return { ...user }
}

export function login({ email, password }) {
  email = (email || '').trim().toLowerCase()
  const users = getUsers()
  const u = users.find(x => x.email === email)
  if (!u) throw new Error('账号不存在')
  if (u.passwordHash !== hash(password)) throw new Error('密码错误')
  lsSet(KEY_SESSION, { email })
  return { ...u }
}

export function logout() {
  lsDel(KEY_SESSION)
}

export function updateProfile(patch) {
  const me = currentUser()
  if (!me) throw new Error('未登录')
  const users = getUsers()
  const idx = users.findIndex(u => u.email === me.email)
  if (idx < 0) throw new Error('用户不存在')

  const next = { ...users[idx] }
  if (patch.username !== undefined) {
    const u = String(patch.username || '').trim()
    if (!u) throw new Error('用户名不能为空')
    next.username = u
  }
  if (patch.avatar !== undefined) next.avatar = patch.avatar

  users[idx] = next
  setUsers(users)
  return { ...next }
}

export function changePassword({ oldPassword, newPassword }) {
  const me = currentUser()
  if (!me) throw new Error('未登录')
  if (!oldPassword) throw new Error('请输入旧密码')
  if (!newPassword || newPassword.length < 6) throw new Error('新密码至少 6 位')

  const users = getUsers()
  const idx = users.findIndex(u => u.email === me.email)
  if (idx < 0) throw new Error('用户不存在')

  if (users[idx].passwordHash !== hash(oldPassword)) throw new Error('旧密码错误')
  users[idx] = { ...users[idx], passwordHash: hash(newPassword) }
  setUsers(users)
}

export function deleteAccount({ password }) {
  const me = currentUser()
  if (!me) throw new Error('未登录')
  if (me.passwordHash !== hash(password)) throw new Error('密码错误')

  const users = getUsers().filter(u => u.email !== me.email)
  setUsers(users)
  lsDel(KEY_SESSION)
}
