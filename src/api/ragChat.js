/**
 * RAG聊天API - 基于 EchoMind-feature- 的接口封装
 */

// 后端已配置 CORS，直接使用完整 URL
const API_BASE_URL = 'http://113.54.240.73:8080';

/**
 * 统一处理响应
 */
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }
  const result = await response.json();
  if (result.code !== undefined && result.code !== 200) {
    throw new Error(result.message || '请求失败');
  }
  return result.data !== undefined ? result.data : result;
}

/**
 * 获取错误信息
 */
export function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return '未知错误';
}

/**
 * RAG聊天API
 */
export const ragChatApi = {
  /**
   * 创建新会话
   * POST /api/rag-chat/sessions
   * @param {number[]} knowledgeBaseIds
   * @param {string} title
   * @returns {Promise<RagChatSession>}
   */
  async createSession(knowledgeBaseIds, title) {
    const response = await fetch(`${API_BASE_URL}/api/rag-chat/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ knowledgeBaseIds, title }),
    });
    return handleResponse(response);
  },

  /**
   * 获取会话列表
   * GET /api/rag-chat/sessions
   * @returns {Promise<RagChatSessionListItem[]>}
   */
  async listSessions() {
    const response = await fetch(`${API_BASE_URL}/api/rag-chat/sessions`);
    return handleResponse(response);
  },

  /**
   * 获取会话详情
   * GET /api/rag-chat/sessions/{sessionId}
   * @param {number} sessionId
   * @returns {Promise<RagChatSessionDetail>}
   */
  async getSessionDetail(sessionId) {
    const response = await fetch(`${API_BASE_URL}/api/rag-chat/sessions/${sessionId}`);
    return handleResponse(response);
  },

  /**
   * 更新会话标题
   * PUT /api/rag-chat/sessions/{sessionId}/title
   * @param {number} sessionId
   * @param {string} title
   * @returns {Promise<void>}
   */
  async updateSessionTitle(sessionId, title) {
    const response = await fetch(`${API_BASE_URL}/api/rag-chat/sessions/${sessionId}/title`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    return handleResponse(response);
  },

  /**
   * 更新会话知识库
   * PUT /api/rag-chat/sessions/{sessionId}/knowledge-bases
   * @param {number} sessionId
   * @param {number[]} knowledgeBaseIds
   * @returns {Promise<void>}
   */
  async updateKnowledgeBases(sessionId, knowledgeBaseIds) {
    const response = await fetch(`${API_BASE_URL}/api/rag-chat/sessions/${sessionId}/knowledge-bases`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ knowledgeBaseIds }),
    });
    return handleResponse(response);
  },

  /**
   * 切换会话置顶状态
   * PUT /api/rag-chat/sessions/{sessionId}/pin
   * @param {number} sessionId
   * @returns {Promise<void>}
   */
  async togglePin(sessionId) {
    const response = await fetch(`${API_BASE_URL}/api/rag-chat/sessions/${sessionId}/pin`, {
      method: 'PUT',
    });
    return handleResponse(response);
  },

  /**
   * 删除会话
   * DELETE /api/rag-chat/sessions/{sessionId}
   * @param {number} sessionId
   * @returns {Promise<void>}
   */
  async deleteSession(sessionId) {
    const response = await fetch(`${API_BASE_URL}/api/rag-chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  /**
   * 发送消息（非流式）
   * POST /api/rag-chat/sessions/{sessionId}/messages
   * @param {number} sessionId
   * @param {string} question
   * @returns {Promise<RagChatMessage>}
   */
  async sendMessage(sessionId, question) {
    const response = await fetch(`${API_BASE_URL}/api/rag-chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    return handleResponse(response);
  },

  /**
   * 发送消息（流式SSE）
   * POST /api/rag-chat/sessions/{sessionId}/messages/stream
   * @param {number} sessionId
   * @param {string} question
   * @param {Function} onMessage - 收到消息回调
   * @param {Function} onComplete - 完成回调
   * @param {Function} onError - 错误回调
   * @returns {Promise<void>}
   */
  async sendMessageStream(sessionId, question, onMessage, onComplete, onError) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/rag-chat/sessions/${sessionId}/messages/stream`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question }),
        }
      );

      if (!response.ok) {
        let errorMessage = `请求失败 (${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // 忽略解析错误
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      // 从 SSE 事件中提取内容
      const extractEventContent = (event) => {
        if (!event.trim()) return null;

        const lines = event.split('\n');
        const contentParts = [];

        for (const line of lines) {
          if (line.startsWith('data:')) {
            contentParts.push(line.substring(5));
          }
        }

        if (contentParts.length === 0) return null;

        return contentParts.join('')
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r');
      };

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          if (buffer) {
            const content = extractEventContent(buffer);
            if (content !== null) {
              onMessage(content);
            }
          }
          onComplete();
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // SSE 事件以 \n\n 分隔，但也需要处理单行的情况
        let newlineIndex = buffer.indexOf('\n\n');
        if (newlineIndex === -1) {
          // 如果没有找到 \n\n，尝试处理单行 data: 格式
          const singleLineIndex = buffer.indexOf('\n');
          if (singleLineIndex !== -1 && buffer.substring(0, singleLineIndex).startsWith('data:')) {
            const line = buffer.substring(0, singleLineIndex);
            const content = extractEventContent(line);
            if (content) {
              onMessage(content);
            }
            buffer = buffer.substring(singleLineIndex + 1);
          }
          continue;
        }

        // 处理完整的事件块
        while (newlineIndex !== -1) {
          const eventBlock = buffer.substring(0, newlineIndex);
          buffer = buffer.substring(newlineIndex + 2);

          const content = extractEventContent(eventBlock);
          if (content !== null) {
            onMessage(content);
          }

          newlineIndex = buffer.indexOf('\n\n');
        }
      }
    } catch (error) {
      onError(new Error(getErrorMessage(error)));
    }
  },
};

export default ragChatApi;
