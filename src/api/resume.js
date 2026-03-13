/**
 * 简历相关 API - 使用统一的 Axios 请求封装
 * 基于 EchoMind-feature- 的接口封装
 */

import { request, getErrorMessage } from './request.js'

/**
 * 简历API - 完全对应 EchoMind-feature- 的 historyApi 中的简历相关接口
 */
export const resumeApi = {
  /**
   * 上传简历并获取分析结果
   * @param {File} file - 简历文件
   * @returns {Promise<UploadResponse>}
   */
  async uploadAndAnalyze(file) {
    const formData = new FormData()
    formData.append('file', file)
    return request.upload('/api/resumes/upload', formData)
  },

  /**
   * 获取简历详情
   * @param {number} resumeId - 简历ID
   * @returns {Promise<ResumeDetail>}
   */
  async getResumeDetail(resumeId) {
    return request.get(`/api/resumes/${resumeId}/detail`)
  },

  /**
   * 重新分析简历
   * @param {number} resumeId - 简历ID
   * @returns {Promise<void>}
   */
  async reanalyze(resumeId) {
    return request.post(`/api/resumes/${resumeId}/reanalyze`)
  },

  /**
   * 导出简历分析报告为 PDF
   * @param {number} resumeId - 简历ID
   * @returns {Promise<Blob>}
   */
  async exportAnalysisPdf(resumeId) {
    const response = await fetch(
      `${import.meta.env.PROD ? '' : 'http://113.54.240.73:8080'}/api/resumes/${resumeId}/export/analysis`
    )
    if (!response.ok) {
      throw new Error(`导出失败: ${response.status}`)
    }
    return response.blob()
  },

  /**
   * 健康检查
   * @returns {Promise<{status: string, service: string}>}
   */
  async healthCheck() {
    return request.get('/api/resumes/health')
  }
}

export { getErrorMessage }
export default resumeApi
