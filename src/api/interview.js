/**
 * 面试相关API - 使用统一的 Axios 请求封装
 * 基于 EchoMind-feature- 的 interview.ts 实现
 */

import { request } from './request.js'

/**
 * 面试API - 完全对应 EchoMind-feature- 的 interviewApi
 */
export const interviewApi = {
  /**
   * 创建面试会话
   * POST /api/interview/sessions
   * @param {Object} req - { resumeId, resumeText, jobId, questionCount }
   * @returns {Promise<InterviewSession>}
   */
  async createSession(req) {
    return request.post('/api/interview/sessions', req, {
      timeout: 180000 // 3分钟超时，AI生成问题需要时间
    })
  },

  /**
   * 获取会话信息
   * GET /api/interview/sessions/{sessionId}
   * @param {string} sessionId
   * @returns {Promise<InterviewSession>}
   */
  async getSession(sessionId) {
    return request.get(`/api/interview/sessions/${sessionId}`)
  },

  /**
   * 获取当前问题
   * GET /api/interview/sessions/{sessionId}/question
   * @param {string} sessionId
   * @returns {Promise<CurrentQuestionResponse>}
   */
  async getCurrentQuestion(sessionId) {
    return request.get(`/api/interview/sessions/${sessionId}/question`)
  },

  /**
   * 提交答案
   * POST /api/interview/sessions/{sessionId}/answers
   * @param {Object} req - { sessionId, questionIndex, answer, addQuestionIndex }
   * @returns {Promise<SubmitAnswerResponse>}
   */
  async submitAnswer(req) {
    return request.post(
      `/api/interview/sessions/${req.sessionId}/answers`,
      {
        questionIndex: req.questionIndex,
        answer: req.answer,
        addQuestionIndex: req.addQuestionIndex
      },
      {
        timeout: 180000 // 3分钟超时
      }
    )
  },

  /**
   * 暂存答案（不进入下一题）
   * PUT /api/interview/sessions/{sessionId}/answers
   * @param {Object} req - { sessionId, questionIndex, answer, addQuestionIndex }
   * @returns {Promise<void>}
   */
  async saveAnswer(req) {
    return request.put(`/api/interview/sessions/${req.sessionId}/answers`, {
      questionIndex: req.questionIndex,
      answer: req.answer,
      addQuestionIndex: req.addQuestionIndex
    })
  },

  /**
   * 获取面试报告
   * GET /api/interview/sessions/{sessionId}/report
   * @param {string} sessionId
   * @returns {Promise<InterviewReport>}
   */
  async getReport(sessionId) {
    return request.get(`/api/interview/sessions/${sessionId}/report`, {
      timeout: 180000 // 3分钟超时，AI评估需要时间
    })
  },

  /**
   * 查找未完成的面试会话
   * GET /api/interview/sessions/unfinished/{resumeId}
   * @param {number} resumeId
   * @returns {Promise<InterviewSession|null>}
   */
  async findUnfinishedSession(resumeId) {
    try {
      return await request.get(`/api/interview/sessions/unfinished/${resumeId}`)
    } catch {
      // 如果没有未完成的会话，返回null
      return null
    }
  },

  /**
   * 获取面试历史列表
   * GET /api/interview/sessions/history
   * @returns {Promise<InterviewItem[]>}
   */
  async getInterviewHistory() {
    return request.get('/api/interview/sessions/history')
  },

  /**
   * 获取面试详情
   * GET /api/interview/sessions/{sessionId}/details
   * @param {string} sessionId
   * @returns {Promise<InterviewDetail>}
   */
  async getInterviewDetail(sessionId) {
    return request.get(`/api/interview/sessions/${sessionId}/details`)
  },

  /**
   * 提前结束面试（交卷）
   * POST /api/interview/sessions/{sessionId}/complete
   * @param {string} sessionId
   * @returns {Promise<void>}
   */
  async completeInterview(sessionId) {
    return request.post(`/api/interview/sessions/${sessionId}/complete`)
  },

  /**
   * 删除面试会话
   * DELETE /api/interview/sessions/{sessionId}
   * @param {string} sessionId
   * @returns {Promise<void>}
   */
  async deleteSession(sessionId) {
    return request.delete(`/api/interview/sessions/${sessionId}`)
  },

  /**
   * 导出面试报告PDF
   * GET /api/interview/sessions/{sessionId}/export
   * @param {string} sessionId
   * @returns {Promise<Blob>}
   */
  async exportReport(sessionId) {
    return request.get(`/api/interview/sessions/${sessionId}/export`, {
      responseType: 'blob'
    })
  }
}

export default interviewApi
