import { createRouter, createWebHistory } from 'vue-router'
import { isAuthed } from '../lib/auth'

import Auth from '../pages/Auth.vue'
import AppLayout from '../layouts/AppLayout.vue'

import Home from '../pages/Home.vue'
import Interview from '../pages/Interview.vue'
import InterviewRoom from '../pages/InterviewRoom.vue'
import Records from '../pages/Records.vue'
import Analytics from '../pages/Analytics.vue'
import QuestionBank from '../pages/QuestionBank.vue'
import Checkin from '../pages/Checkin.vue'
import Profile from '../pages/Profile.vue'
import Settings from '../pages/Settings.vue'
import NotFound from '../pages/NotFound.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: () => (isAuthed() ? '/app/home' : '/login') },

    { path: '/login', component: Auth, meta: { public: true } },
    { path: '/register', component: Auth, meta: { public: true } },

    {
      path: '/app',
      component: AppLayout,
      children: [
        { path: '', redirect: '/app/home' },
        { path: 'home', component: Home, meta: { title: '工作台' } },
        { path: 'interview', component: Interview, meta: { title: '开始面试' } },
        { path: 'records', component: Records, meta: { title: '面试记录' } },
        { path: 'analytics', component: Analytics, meta: { title: '面试统计' } },
        { path: 'bank', component: QuestionBank, meta: { title: '题库练习' } },
        { path: 'checkin', component: Checkin, meta: { title: '打卡中心' } },
        { path: 'profile', component: Profile, meta: { title: '个人中心' } },
        { path: 'settings', component: Settings, meta: { title: '设置' } },
      ],
    },

    // 独立的面试房间页面
    { path: '/interview-room', component: InterviewRoom, meta: { title: '面试房间' } },

    { path: '/:pathMatch(.*)*', component: NotFound, meta: { public: true } },
  ],
})

router.beforeEach((to) => {
  if (to.meta.public) return true
  if (!to.path.startsWith('/app')) return true
  if (isAuthed()) return true
  return { path: '/login', query: { next: to.fullPath } }
})

export default router
