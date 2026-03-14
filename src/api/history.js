const API_BASE = 'http://113.54.240.73:8080'

/**
 * 处理响应 - 与 EchoMind-feature- 保持一致
 * 后端约定：所有响应都是 HTTP 200 + Result
 * - code === 200 → 成功，返回 data
 * - code !== 200 → 失败，抛出 message
 */
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || `HTTP ${response.status}`)
  }
  
  const result = await response.json()
  
  // 检查是否是 Result 格式 { code: 200, message: '', data: ... }
  if (result && typeof result === 'object' && 'code' in result) {
    if (result.code === 200) {
      // 成功：返回 data
      return result.data
    }
    // 失败：抛出 message
    throw new Error(result.message || '请求失败')
  }
  
  // 非 Result 格式，直接返回
  return result
}

/**
 * 获取所有简历列表
 * GET /api/resumes
 */
async function getResumes() {
  const response = await fetch(`${API_BASE}/api/resumes`)
  return handleResponse(response)
}

/**
 * 获取简历详情
 * GET /api/resumes/{id}/detail
 */
async function getResumeDetail(id) {
  const response = await fetch(`${API_BASE}/api/resumes/${id}/detail`)
  return handleResponse(response)
}

/**
 * 获取面试详情
 * GET /api/interview/sessions/{sessionId}/details
 */
async function getInterviewDetail(sessionId) {
  const response = await fetch(`${API_BASE}/api/interview/sessions/${sessionId}/details`)
  return handleResponse(response)
}

/**
 * 导出简历分析报告PDF
 * GET /api/resumes/{resumeId}/export
 */
async function exportAnalysisPdf(resumeId) {
  const response = await fetch(`${API_BASE}/api/resumes/${resumeId}/export`)
  if (!response.ok) {
    throw new Error('导出失败')
  }
  return response.blob()
}

/**
 * 导出面试报告PDF
 * GET /api/interview/sessions/{sessionId}/export
 */
async function exportInterviewPdf(sessionId) {
  const response = await fetch(`${API_BASE}/api/interview/sessions/${sessionId}/export`)
  if (!response.ok) {
    throw new Error('导出失败')
  }
  return response.blob()
}

/**
 * 删除简历
 * DELETE /api/resumes/{id}
 */
async function deleteResume(id) {
  const response = await fetch(`${API_BASE}/api/resumes/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    throw new Error('删除失败')
  }
}

/**
 * 删除面试记录
 * DELETE /api/interview/sessions/{sessionId}
 */
async function deleteInterview(sessionId) {
  const response = await fetch(`${API_BASE}/api/interview/sessions/${sessionId}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    throw new Error('删除失败')
  }
}

/**
 * 获取简历统计信息
 * GET /api/resumes/statistics
 */
async function getStatistics() {
  const response = await fetch(`${API_BASE}/api/resumes/statistics`)
  return handleResponse(response)
}

/**
 * 重新分析简历
 * POST /api/resumes/{id}/reanalyze
 */
async function reanalyze(id) {
  const response = await fetch(`${API_BASE}/api/resumes/${id}/reanalyze`, {
    method: 'POST'
  })
  if (!response.ok) {
    throw new Error('重新分析失败')
  }
}

export const historyApi = {
  getResumes,
  getResumeDetail,
  getInterviewDetail,
  exportAnalysisPdf,
  exportInterviewPdf,
  deleteResume,
  deleteInterview,
  getStatistics,
  reanalyze
}
