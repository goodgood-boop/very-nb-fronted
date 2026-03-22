/**
 * 知识库API - 基于 EchoMind-feature- 的接口封装
 */

// 后端已配置 CORS，直接使用完整 URL
const API_BASE_URL = 'http://localhost:8080';

// 向量化状态
export const VectorStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

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
 * 知识库API
 */
export const knowledgeBaseApi = {
  /**
   * 上传知识库文件
   * POST /api/knowledgebase/upload
   * @param {File} file
   * @param {string} name
   * @param {string} category
   * @returns {Promise<UploadKnowledgeBaseResponse>}
   */
  async uploadKnowledgeBase(file, name, category) {
    const formData = new FormData();
    formData.append('file', file);
    if (name) {
      formData.append('name', name);
    }
    if (category) {
      formData.append('category', category);
    }
    
    const response = await fetch(`${API_BASE_URL}/api/knowledgebase/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'X-User-Id': '1' // 默认用户ID
      }
    });
    return handleResponse(response);
  },

  /**
   * 下载知识库文件
   * GET /api/knowledgebase/{id}/download
   * @param {number} id
   * @returns {Promise<Blob>}
   */
  async downloadKnowledgeBase(id) {
    const response = await fetch(`${API_BASE_URL}/api/knowledgebase/${id}/download`);
    if (!response.ok) {
      throw new Error('下载失败');
    }
    return response.blob();
  },

  /**
   * 获取所有知识库列表
   * GET /api/knowledgebase/list
   * @param {string} sortBy - 'time' | 'size' | 'access' | 'question'
   * @param {string} vectorStatus - 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
   * @returns {Promise<KnowledgeBaseItem[]>}
   */
  async getAllKnowledgeBases(sortBy, vectorStatus) {
    const params = new URLSearchParams();
    if (sortBy) {
      params.append('sortBy', sortBy);
    }
    if (vectorStatus) {
      params.append('vectorStatus', vectorStatus);
    }
    const queryString = params.toString();
    const response = await fetch(`${API_BASE_URL}/api/knowledgebase/list${queryString ? `?${queryString}` : ''}`, {
      headers: {
        'X-User-Id': '1' // 默认用户ID
      }
    });
    return handleResponse(response);
  },

  /**
   * 获取知识库详情
   * GET /api/knowledgebase/{id}
   * @param {number} id
   * @returns {Promise<KnowledgeBaseItem>}
   */
  async getKnowledgeBase(id) {
    const response = await fetch(`${API_BASE_URL}/api/knowledgebase/${id}`, {
      headers: {
        'X-User-Id': '1' // 默认用户ID
      }
    });
    return handleResponse(response);
  },

  /**
   * 删除知识库
   * DELETE /api/knowledgebase/{id}
   * @param {number} id
   * @returns {Promise<void>}
   */
  async deleteKnowledgeBase(id) {
    const response = await fetch(`${API_BASE_URL}/api/knowledgebase/${id}`, {
      method: 'DELETE',
      headers: {
        'X-User-Id': '1' // 默认用户ID
      }
    });
    return handleResponse(response);
  },

  // ========== 分类管理 ==========

  /**
   * 获取所有分类
   * GET /api/knowledgebase/categories
   * @returns {Promise<string[]>}
   */
  async getAllCategories() {
    const response = await fetch(`${API_BASE_URL}/api/knowledgebase/categories`, {
      headers: {
        'X-User-Id': '1' // 默认用户ID
      }
    });
    return handleResponse(response);
  },

  /**
   * 根据分类获取知识库
   * GET /api/knowledgebase/category/{category}
   * @param {string} category
   * @returns {Promise<KnowledgeBaseItem[]>}
   */
  async getByCategory(category) {
    const response = await fetch(`${API_BASE_URL}/api/knowledgebase/category/${encodeURIComponent(category)}`, {
      headers: {
        'X-User-Id': '1' // 默认用户ID
      }
    });
    return handleResponse(response);
  },

  /**
   * 获取未分类的知识库
   * GET /api/knowledgebase/uncategorized
   * @returns {Promise<KnowledgeBaseItem[]>}
   */
  async getUncategorized() {
    const response = await fetch(`${API_BASE_URL}/api/knowledgebase/uncategorized`, {
      headers: {
        'X-User-Id': '1' // 默认用户ID
      }
    });
    return handleResponse(response);
  },

  /**
   * 更新知识库分类
   * PUT /api/knowledgebase/{id}/category
   * @param {number} id
   * @param {string|null} category
   * @returns {Promise<void>}
   */
  async updateCategory(id, category) {
    const response = await fetch(`${API_BASE_URL}/api/knowledgebase/${id}/category`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': '1' // 默认用户ID
      },
      body: JSON.stringify({ category }),
    });
    return handleResponse(response);
  },

  // ========== 搜索 ==========

  /**
   * 搜索知识库
   * GET /api/knowledgebase/search
   * @param {string} keyword
   * @returns {Promise<KnowledgeBaseItem[]>}
   */
  async search(keyword) {
    const response = await fetch(`${API_BASE_URL}/api/knowledgebase/search?keyword=${encodeURIComponent(keyword)}`, {
      headers: {
        'X-User-Id': '1' // 默认用户ID
      }
    });
    return handleResponse(response);
  },

  // ========== 统计 ==========

  /**
   * 获取知识库统计信息
   * GET /api/knowledgebase/stats
   * @returns {Promise<KnowledgeBaseStats>}
   */
  async getStatistics() {
    const response = await fetch(`${API_BASE_URL}/api/knowledgebase/stats`, {
      headers: {
        'X-User-Id': '1' // 默认用户ID
      }
    });
    return handleResponse(response);
  },

  // ========== 向量化管理 ==========

  /**
   * 重新向量化知识库（手动重试）
   * POST /api/knowledgebase/{id}/revectorize
   * @param {number} id
   * @returns {Promise<void>}
   */
  async revectorize(id) {
    const response = await fetch(`${API_BASE_URL}/api/knowledgebase/${id}/revectorize`, {
      method: 'POST',
      headers: {
        'X-User-Id': '1' // 默认用户ID
      }
    });
    return handleResponse(response);
  },

  /**
   * 基于知识库回答问题
   * POST /api/knowledgebase/query
   * @param {QueryRequest} req
   * @returns {Promise<QueryResponse>}
   */
  async queryKnowledgeBase(req) {
    const response = await fetch(`${API_BASE_URL}/api/knowledgebase/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': '1' // 默认用户ID
      },
      body: JSON.stringify(req),
    });
    return handleResponse(response);
  },

  /**
   * 基于知识库回答问题（流式SSE）
   * POST /api/knowledgebase/query/stream
   * @param {QueryRequest} req
   * @param {Function} onMessage - 收到消息回调
   * @param {Function} onComplete - 完成回调
   * @param {Function} onError - 错误回调
   * @returns {Promise<void>}
   */
  async queryKnowledgeBaseStream(req, onMessage, onComplete, onError) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/knowledgebase/query/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': '1' // 默认用户ID
      },
      body: JSON.stringify(req),
    });

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
            if (content) {
              onMessage(content);
            }
          }
          onComplete();
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // SSE 事件以 \n\n 分隔
        let newlineIndex = buffer.indexOf('\n\n');
        if (newlineIndex === -1) {
          // 处理单行 data: 格式
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

        while (newlineIndex !== -1) {
          const event = buffer.substring(0, newlineIndex);
          buffer = buffer.substring(newlineIndex + 2);

          const content = extractEventContent(event);
          if (content) {
            onMessage(content);
          }

          newlineIndex = buffer.indexOf('\n\n');
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  },
};

export default knowledgeBaseApi;
