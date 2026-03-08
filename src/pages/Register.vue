<template>
  <div class="auth-container">
    <div class="auth-card">
      <!-- 右侧：注册表单/欢迎信息 -->
      <div class="auth-right">
        <!-- 注册表单 -->
        <div class="form-container">
          <h2>创 建 账 号</h2>
          <div class="social-icons">
            <div class="icon">📧</div>
            <div class="icon">📱</div>
            <div class="icon">🌐</div>
          </div>
          <p class="subtitle">选择最方便的方式快速注册</p>
          
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
                type="text" 
                v-model.trim="username" 
                placeholder="用户名" 
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
            
            <button class="btn primary" @click="onRegister">SIGN UP</button>
            
            <!-- 切换链接 -->
            <div class="toggle-link" @click="$router.push('/login')">
              已有账号？<span class="toggle-text">立即登录</span>
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
import { useRouter } from 'vue-router'
import { register } from '../lib/auth'

const router = useRouter()

const email = ref('')
const username = ref('')
const password = ref('')
const err = ref('')

function onRegister() {
  try {
    err.value = ''
    register({ email: email.value, username: username.value, password: password.value })
    router.replace('/app/home')
  } catch (e) {
    err.value = e?.message || '注册失败'
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
  justify-content: flex-end;
}

.auth-right {
  width: 50%;
  height: 100%;
  padding: 60px 40px;
  transition: all 0.6s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #fff;
  border-radius: 0 20px 20px 0;
}

/* 右侧背景装饰 */
.auth-right::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 200px;
  height: 200px;
  background: #e3f2fd;
  border-radius: 0 20px 0 50%;
  z-index: 0;
}

.auth-right::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 200px;
  height: 200px;
  background: #e3f2fd;
  border-radius: 50% 0 20px 0;
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
    justify-content: center;
  }
  
  .auth-right {
    width: 100%;
    height: auto;
    min-height: 300px;
    border-radius: 20px;
  }
}
</style>