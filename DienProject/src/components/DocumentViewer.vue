<template>
  <!-- 弹窗遮罩层 -->
  <div class="document-viewer-modal" @click.self="closeViewer">
    <div class="modal-content">
      <!-- 弹窗头部 -->
      <div class="modal-header">
        <h3 class="modal-title">{{ fileName || '文档预览' }}</h3>
        <button class="btn-close" @click="closeViewer">&times;</button>
      </div>

      <!-- 弹窗主体 -->
      <div class="modal-body">
        <div class="document-viewer">
          <!-- 如果没有文档 -->
          <div v-if="!documentUrl" class="no-document">
            <div class="no-document-icon">📄</div>
            <p class="no-document-text">{{ noDocumentText }}</p>
          </div>

          <!-- 有文档但加载中 -->
          <div v-else-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>加载文档中...</p>
          </div>

          <!-- 文档加载失败 -->
          <div v-else-if="error" class="error-state">
            <div class="error-icon">⚠️</div>
            <p class="error-message">{{ error }}</p>
            <button class="btn-retry" @click="retryLoad">重试</button>
          </div>

          <!-- PDF 文档预览 -->
          <div v-else-if="isPDF" class="pdf-viewer">
            <iframe
              :src="documentUrl"
              frameborder="0"
              class="document-iframe"
              @load="onDocumentLoad"
              @error="onDocumentError"
            ></iframe>
          </div>

          <!-- Office 文档预览 (Word, Excel, PPT) -->
          <div v-else-if="isOfficeDocument" class="office-viewer">
            <!-- 本地环境提示 -->
            <div v-if="isLocalEnvironment" class="local-office-notice">
              <div class="notice-icon">📄</div>
              <h3>Office 文档</h3>
              <p class="notice-text">{{ fileName }}</p>
              <p class="notice-description">
                Office 文档在线预览需要公网访问地址。<br>
                本地开发环境暂时无法预览，请部署到生产环境后使用在线预览功能。
              </p>
            </div>
            <!-- 生产环境使用 Office Online Viewer -->
            <iframe
              v-else
              :src="officeViewerUrl"
              frameborder="0"
              class="document-iframe"
              @load="onDocumentLoad"
              @error="onDocumentError"
            ></iframe>
          </div>

          <!-- 视频文件预览 -->
          <div v-else-if="isVideo" class="video-viewer">
            <video
              :src="documentUrl"
              controls
              class="video-player"
              @loadeddata="onDocumentLoad"
              @error="onDocumentError"
            >
              您的浏览器不支持视频播放
            </video>
          </div>

          <!-- 不支持的文档类型 -->
          <div v-else class="unsupported-document">
            <div class="unsupported-icon">📄</div>
            <p class="unsupported-text">暂不支持预览此类型文档</p>
            <p class="file-info">文件名: {{ fileName }}</p>
            <p class="security-notice">为保护课件安全，暂不提供下载功能</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Props {
  documentUrl?: string;
  fileName?: string;
  fileType?: string;
  noDocumentText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  documentUrl: '',
  fileName: '',
  fileType: '',
  noDocumentText: '暂无文档'
});

// 定义 emits
const emit = defineEmits<{
  close: [];
}>();

const loading = ref(false);
const error = ref('');
let loadingTimer: number | null = null;

// 关闭预览
const closeViewer = () => {
  emit('close');
};

// 检查是否是本地开发环境
const isLocalEnvironment = computed(() => {
  if (!props.documentUrl) return false;
  return props.documentUrl.includes('localhost') || props.documentUrl.includes('127.0.0.1');
});

// 检查是否是 PDF 文件
const isPDF = computed(() => {
  if (props.fileType) {
    return props.fileType.includes('pdf');
  }
  if (props.fileName) {
    return props.fileName.toLowerCase().endsWith('.pdf');
  }
  return false;
});

// 检查是否是 Office 文档
const isOfficeDocument = computed(() => {
  if (props.fileType) {
    return (
      props.fileType.includes('word') ||
      props.fileType.includes('document') ||
      props.fileType.includes('excel') ||
      props.fileType.includes('sheet') ||
      props.fileType.includes('powerpoint') ||
      props.fileType.includes('presentation')
    );
  }
  if (props.fileName) {
    const name = props.fileName.toLowerCase();
    return (
      name.endsWith('.doc') ||
      name.endsWith('.docx') ||
      name.endsWith('.xls') ||
      name.endsWith('.xlsx') ||
      name.endsWith('.ppt') ||
      name.endsWith('.pptx')
    );
  }
  return false;
});

// 检查是否是视频文件
const isVideo = computed(() => {
  if (props.fileType) {
    return props.fileType.includes('video');
  }
  if (props.fileName) {
    const name = props.fileName.toLowerCase();
    return (
      name.endsWith('.mp4') ||
      name.endsWith('.avi') ||
      name.endsWith('.mov') ||
      name.endsWith('.wmv') ||
      name.endsWith('.flv') ||
      name.endsWith('.webm')
    );
  }
  return false;
});

// Microsoft Office Online Viewer URL
const officeViewerUrl = computed(() => {
  if (!props.documentUrl) return '';
  // 使用 Microsoft Office Online Viewer
  // 注意: 需要文档 URL 是公开可访问的
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(props.documentUrl)}`;
});

// 文档加载完成
const onDocumentLoad = () => {
  if (loadingTimer) {
    clearTimeout(loadingTimer);
    loadingTimer = null;
  }
  loading.value = false;
  error.value = '';
};

// 文档加载失败
const onDocumentError = () => {
  if (loadingTimer) {
    clearTimeout(loadingTimer);
    loadingTimer = null;
  }
  loading.value = false;
  error.value = '文档加载失败，请检查网络连接或稍后重试';
};

// 重试加载
const retryLoad = () => {
  error.value = '';
  loading.value = true;
  // 触发重新加载
  setTimeout(() => {
    loading.value = false;
  }, 100);
};

// 监听 documentUrl 变化
watch(
  () => props.documentUrl,
  (newUrl) => {
    // 清除之前的定时器
    if (loadingTimer) {
      clearTimeout(loadingTimer);
      loadingTimer = null;
    }

    if (newUrl) {
      // 如果是本地环境的Office文档，直接不显示loading
      if (isLocalEnvironment.value && isOfficeDocument.value) {
        loading.value = false;
        return;
      }

      loading.value = true;
      error.value = '';

      // 设置10秒超时，如果iframe没有触发load事件，自动停止loading
      // 注意：对于某些PDF，iframe可能不会触发load事件，这是正常的
      loadingTimer = setTimeout(() => {
        loading.value = false;
        loadingTimer = null;
      }, 10000);
    } else {
      loading.value = false;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/* 弹窗遮罩层 */
.document-viewer-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

/* 弹窗内容 */
.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 1200px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

/* 弹窗头部 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: calc(100% - 50px);
}

.btn-close {
  width: 36px;
  height: 36px;
  border: none;
  background: #e5e7eb;
  border-radius: 8px;
  font-size: 28px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-close:hover {
  background: #d1d5db;
  color: #374151;
}

/* 弹窗主体 */
.modal-body {
  flex: 1;
  overflow: auto;
  background: #f5f7fa;
}

.document-viewer {
  width: 100%;
  height: 100%;
  min-height: 500px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-document,
.loading-state,
.error-state,
.unsupported-document {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.no-document-icon,
.error-icon,
.unsupported-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.no-document-text,
.error-message,
.unsupported-text {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 8px;
}

.file-info {
  font-size: 14px;
  color: #9ca3af;
  margin-bottom: 16px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f4f6;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn-retry,
.btn-download,
.btn-download-primary {
  padding: 10px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.3s ease;
  display: inline-block;
}

.btn-retry:hover,
.btn-download:hover,
.btn-download-primary:hover {
  background: #5568d3;
}

.local-office-notice {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.notice-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.local-office-notice h3 {
  font-size: 20px;
  color: #1f2937;
  margin-bottom: 8px;
}

.notice-text {
  font-size: 16px;
  color: #4b5563;
  margin-bottom: 16px;
  font-weight: 500;
}

.notice-description {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 24px;
  line-height: 1.6;
}

.btn-download-primary {
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-download-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.pdf-viewer,
.office-viewer {
  width: 100%;
  height: 100%;
}

.document-iframe {
  width: 100%;
  height: 100%;
  min-height: 600px;
  border: none;
  background: white;
}
</style>
