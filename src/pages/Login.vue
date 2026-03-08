<template>
  <div class="auth-container">
    <div class="auth-card">
      <!-- 左侧：登录表单/欢迎信息 -->
      <div class="auth-left">
        <!-- 登录表单 -->
        <div class="form-container">
          <h2>登 入 账 号</h2>
          <div class="social-icons">
            <div class="icon">📧</div>
            <div class="icon">📱</div>
            <div class="icon">🌐</div>
          </div>
          <p class="subtitle">选择最方便的方式快速登录</p>
          
          <div class="form-body">
            <label class="input-group">
              <input 
                type="email" 
                v-model.trim="email" 
                placeholder="邮箱" 
                class="input"
              />
            </label>
            
            <label class="input-group">
              <input 
                type="password" 
                v-model="password" 
                placeholder="密码" 
                class="input"
              />
            </label>
            
            <div class="forgot-password">忘记密码？</div>
            
            <button class="btn primary" @click="onLogin">SIGN IN</button>
            
            <!-- 切换链接 -->
            <div class="toggle-link" @click="$router.push('/register')">
              没有账号？<span class="toggle-text">立即注册</span>
            </div>
            
            <div v-if="err" class="error-message">{{ err }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login } from '../lib/auth'

const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const err = ref('')

function onLogin() {
  try {
    err.value = ''
    login({ email: email.value, password: password.value })
    router.replace(route.query.next || '/app/home')
  } catch (e) {
    err.value = e?.message || '登录失败'
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  padding: 20px;
}

.auth-card {
  width: 800px;
  height: 500px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  transition: all 0.6s ease;
  display: flex;
}

.auth-left {
  width: 50%;
  height: 100%;
  padding: 60px 40px;
  transition: all 0.6s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #fff;
  border-radius: 20px 0 0 20px;
}

/* 左侧背景装饰 */
.auth-left::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 200px;
  height: 200px;
  background: #e3f2fd;
  border-radius: 20px 0 0 50%;
  z-index: 0;
}

.auth-left::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 200px;
  height: 200px;
  background: #e3f2fd;
  border-radius: 50% 0 0 20px;
  z-index: 0;
}

.form-container {
  width: 100%;
  max-width: 280px;
  position: relative;
  z-index: 1;
}

.form-container h2 {
  font-size: 24px;
  font-weight: 900;
  margin-bottom: 20px;
  color: #333;
  text-align: center;
}

.social-icons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
}

.icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.3s ease;
}

.subtitle {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
  text-align: center;
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.input-group {
  position: relative;
}

.input {
  width: 100%;
  padding: 15px 20px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: #f9f9f9;
}

.input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.forgot-password {
  align-self: flex-end;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: color 0.3s ease;
}

.forgot-password:hover {
  color: #667eea;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-weight: 900;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn.primary {
  background: #667eea;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  background: #5a6fea;
}

.error-message {
  color: #ff6b6b;
  font-size: 12px;
  margin-top: 10px;
  text-align: center;
}

/* 切换链接样式 */
.toggle-link {
  text-align: center;
  margin-top: 15px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-text {
  color: #667eea;
  font-weight: 900;
  margin-left: 5px;
  transition: all 0.3s ease;
}

.toggle-link:hover {
  color: #333;
}

.toggle-link:hover .toggle-text {
  color: #5a6fea;
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 850px) {
  .auth-card {
    width: 90%;
    max-width: 400px;
    height: auto;
    min-height: 500px;
    flex-direction: column;
  }
  
  .auth-left {
    width: 100%;
    height: auto;
    min-height: 300px;
    border-radius: 20px;
  }
}
</style>