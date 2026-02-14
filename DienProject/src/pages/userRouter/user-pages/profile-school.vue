<template>
  <div class="profile-page">
    <div class="page-header">
      <h2>学校信息</h2>
      <p>提交和管理您的学校认证资料</p>
    </div>

    <div class="profile-content">
      <!-- 已提交学校信息显示 -->
      <div v-if="mySchool && !isEditing" class="profile-card">
        <!-- 审核状态横幅 -->
        <div :class="['status-banner', `status-${mySchool.status}`]">
          <div class="status-content">
            <div class="status-icon">
              <span v-if="mySchool.status === 'pending'">⏳</span>
              <span v-else-if="mySchool.status === 'approved'">✓</span>
              <span v-else>✗</span>
            </div>
            <div class="status-text">
              <h3>{{ getStatusText(mySchool.status) }}</h3>
              <p v-if="mySchool.status === 'pending'">您的学校信息正在审核中，请耐心等待</p>
              <p v-else-if="mySchool.status === 'approved'">您的学校信息已通过审核</p>
              <p v-else-if="mySchool.status === 'rejected'">
                审核未通过：{{ mySchool.reviewComment || '无' }}
              </p>
            </div>
          </div>
        </div>

        <!-- 学校信息显示 -->
        <div class="school-header">
          <div class="school-logo">
            <img v-if="logoUrl" :src="logoUrl" alt="学校LOGO" />
            <span v-else class="logo-icon">🏫</span>
          </div>
          <div class="school-basic-info">
            <h3>{{ mySchool.name }}</h3>
            <p class="school-code">学校代码：{{ mySchool.code || '未设置' }}</p>
            <p class="school-type">学校类型：{{ mySchool.type || '未设置' }}</p>
          </div>
        </div>

        <div class="profile-form">
          <div class="form-section">
            <h4>基本信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <label>联系人</label>
                <div>{{ mySchool.contactPerson }}</div>
              </div>
              <div class="info-item">
                <label>联系电话</label>
                <div>{{ mySchool.contactPhone }}</div>
              </div>
              <div class="info-item">
                <label>电子邮箱</label>
                <div>{{ mySchool.email || '未设置' }}</div>
              </div>
              <div class="info-item">
                <label>建校时间</label>
                <div>{{ formatDate(mySchool.establishDate) }}</div>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>地址信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <label>省份</label>
                <div>{{ mySchool.province || '未设置' }}</div>
              </div>
              <div class="info-item">
                <label>城市</label>
                <div>{{ mySchool.city || '未设置' }}</div>
              </div>
              <div class="info-item">
                <label>详细地址</label>
                <div>{{ mySchool.address || '未设置' }}</div>
              </div>
              <div class="info-item">
                <label>邮编</label>
                <div>{{ mySchool.zipCode || '未设置' }}</div>
              </div>
            </div>
          </div>

          <div v-if="mySchool.description" class="form-section">
            <h4>学校简介</h4>
            <p class="description-text">{{ mySchool.description }}</p>
          </div>

          <div v-if="mySchool.certificates && mySchool.certificates.length > 0" class="form-section">
            <h4>资质证书</h4>
            <div class="certificate-list">
              <div v-for="(cert, index) in mySchool.certificates" :key="index" class="certificate-item">
                <div class="certificate-icon">📄</div>
                <div class="certificate-info">
                  <h5>{{ cert.name }}</h5>
                  <p v-if="cert.number">证书编号：{{ cert.number }}</p>
                  <p v-if="cert.expiryDate" class="certificate-date">
                    有效期至：{{ formatDate(cert.expiryDate) }}
                  </p>
                </div>
                <a :href="getFileUrl(cert.fileId)" target="_blank" class="view-btn">
                  查看
                </a>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn btn-primary" @click="handleEdit">
              {{ mySchool.status === 'approved' ? '修改认证信息' : '重新提交' }}
            </button>
            <button class="btn btn-danger" @click="handleCancelCertification">
              取消认证
            </button>
          </div>
        </div>
      </div>

      <!-- 学校信息提交表单 -->
      <div v-else class="profile-card">
        <div class="school-header">
          <h3>{{ isEditing ? '编辑学校信息' : '提交学校认证' }}</h3>
        </div>

        <div class="profile-form">
          <div class="form-section">
            <h4>学校LOGO</h4>
            <div class="logo-upload">
              <div class="logo-preview">
                <img v-if="previewLogo" :src="previewLogo" alt="LOGO预览" />
                <span v-else class="logo-placeholder">🏫</span>
              </div>
              <input ref="logoInput" type="file" accept="image/*" style="display: none" @change="handleLogoUpload" />
              <button class="btn btn-secondary" @click="logoInput?.click()">
                {{ previewLogo ? '更换LOGO' : '上传LOGO' }}
              </button>
            </div>
          </div>

          <div class="form-section">
            <h4>基本信息</h4>
            <div class="form-grid">
              <div class="form-group">
                <label>学校名称 *</label>
                <input v-model="formData.name" type="text" placeholder="请输入学校名称" required />
              </div>
              <div class="form-group">
                <label>学校代码</label>
                <input v-model="formData.code" type="text" placeholder="请输入学校代码" />
              </div>
              <div class="form-group">
                <label>学校类型</label>
                <select v-model="formData.type">
                  <option value="">请选择</option>
                  <option value="primary">小学</option>
                  <option value="middle">中学</option>
                  <option value="high">高中</option>
                  <option value="university">大学</option>
                </select>
              </div>
              <div class="form-group">
                <label>联系人 *</label>
                <input v-model="formData.contactPerson" type="text" placeholder="请输入联系人" required />
              </div>
              <div class="form-group">
                <label>联系电话 *</label>
                <input v-model="formData.contactPhone" type="tel" placeholder="请输入联系电话" required />
              </div>
              <div class="form-group">
                <label>电子邮箱</label>
                <input v-model="formData.email" type="email" placeholder="请输入电子邮箱" />
              </div>
              <div class="form-group">
                <label>建校时间</label>
                <input v-model="formData.establishDate" type="date" />
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>地址信息</h4>
            <div class="form-grid">
              <div class="form-group">
                <label>省份</label>
                <input v-model="formData.province" type="text" placeholder="请输入省份" />
              </div>
              <div class="form-group">
                <label>城市</label>
                <input v-model="formData.city" type="text" placeholder="请输入城市" />
              </div>
              <div class="form-group">
                <label>详细地址</label>
                <input v-model="formData.address" type="text" placeholder="请输入详细地址" />
              </div>
              <div class="form-group">
                <label>邮编</label>
                <input v-model="formData.zipCode" type="text" placeholder="请输入邮编" />
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>学校简介</h4>
            <textarea v-model="formData.description" rows="4" placeholder="请输入学校简介（选填）" maxlength="1000"></textarea>
          </div>

          <div class="form-section">
            <h4>资质证书</h4>
            <div class="certificates-section">
              <div v-for="(cert, index) in formData.certificates" :key="index" class="certificate-form-item">
                <div class="cert-form-header">
                  <h5>证书 {{ index + 1 }}</h5>
                  <button class="btn-remove" @click="removeCertificate(index)">删除</button>
                </div>
                <div class="form-grid">
                  <div class="form-group">
                    <label>证书名称 *</label>
                    <input v-model="cert.name" type="text" placeholder="请输入证书名称" required />
                  </div>
                  <div class="form-group">
                    <label>证书编号</label>
                    <input v-model="cert.number" type="text" placeholder="请输入证书编号" />
                  </div>
                  <div class="form-group">
                    <label>有效期</label>
                    <input v-model="cert.expiryDate" type="date" />
                  </div>
                  <div class="form-group">
                    <label>证书文件 *</label>
                    <input type="file" accept="image/*,.pdf" @change="handleCertFileChange($event, index)" required />
                  </div>
                </div>
              </div>
              <button class="btn btn-secondary btn-add-cert" @click="addCertificate">
                + 添加证书
              </button>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn btn-primary" @click="handleSubmit">提交审核</button>
            <button v-if="mySchool" class="btn btn-secondary" @click="cancelEdit">
              取消
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 消息提示 -->
    <div v-if="message.show" :class="['message-toast', `message-${message.type}`]">
      {{ message.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { getMySchool, createSchool, updateSchool, deleteSchool } from '@/api/schoolApi'
import type { School } from '@/api/schoolApi'
import { useUserStore } from '@/stores/user'
import { getFileUrl, isValidObjectId } from '@/utils/apiConfig'

const userStore = useUserStore()

const logoInput = ref<HTMLInputElement | null>(null)
const mySchool = ref<School | null>(null)
const isEditing = ref(false)
const previewLogo = ref<string | null>(null)
const logoFile = ref<File | null>(null)

// 表单数据
const formData = reactive({
  name: '',
  code: '',
  type: '',
  contactPerson: '',
  contactPhone: '',
  email: '',
  establishDate: '',
  province: '',
  city: '',
  address: '',
  zipCode: '',
  description: '',
  certificates: [] as Array<{
    name: string
    number: string
    expiryDate: string
    file?: File
  }>
})

// 消息提示
const message = reactive({
  show: false,
  type: 'success' as 'success' | 'error',
  text: ''
})

// LOGO URL
const logoUrl = computed(() => {
  const logo = mySchool.value?.logo
  if (!logo) return null
  if (isValidObjectId(logo)) {
    return getFileUrl(logo)
  }
  return logo
})

// 显示消息
const showMessage = (type: 'success' | 'error', text: string) => {
  message.show = true
  message.type = type
  message.text = text
  setTimeout(() => {
    message.show = false
  }, 3000)
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return '审核中'
    case 'approved':
      return '审核通过'
    case 'rejected':
      return '审核未通过'
    default:
      return '未知状态'
  }
}

// 格式化日期
const formatDate = (date: any) => {
  if (!date) return '未设置'
  return new Date(date).toLocaleDateString('zh-CN')
}

// 加载学校信息
const loadSchool = async () => {
  try {
    const result = await getMySchool()
    if (result.success) {
      mySchool.value = result.data
    }
  } catch (error: any) {
    if (error.response?.status !== 404) {
      console.error('获取学校信息失败:', error)
    }
  }
}

// 处理LOGO上传
const handleLogoUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    showMessage('error', '请上传图片文件')
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    showMessage('error', '图片大小不能超过5MB')
    return
  }

  logoFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    previewLogo.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

// 添加证书
const addCertificate = () => {
  formData.certificates.push({
    name: '',
    number: '',
    expiryDate: '',
    file: undefined
  })
}

// 删除证书
const removeCertificate = (index: number) => {
  formData.certificates.splice(index, 1)
}

// 处理证书文件变化
const handleCertFileChange = (event: Event, index: number) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && formData.certificates[index]) {
    formData.certificates[index].file = file
  }
}

// 提交表单
const handleSubmit = async () => {
  // 验证必填字段
  if (!formData.name || !formData.contactPerson || !formData.contactPhone) {
    showMessage('error', '请填写所有必填字段')
    return
  }

  // 验证证书
  for (const cert of formData.certificates) {
    if (!cert.name || !cert.file) {
      showMessage('error', '请填写完整的证书信息并上传文件')
      return
    }
  }

  try {
    const submitData = new FormData()

    // 添加学校基本数据
    const schoolData = {
      name: formData.name,
      code: formData.code,
      type: formData.type,
      contactPerson: formData.contactPerson,
      contactPhone: formData.contactPhone,
      email: formData.email,
      establishDate: formData.establishDate,
      province: formData.province,
      city: formData.city,
      address: formData.address,
      zipCode: formData.zipCode,
      description: formData.description
    }
    submitData.append('data', JSON.stringify(schoolData))

    // 添加LOGO
    if (logoFile.value) {
      submitData.append('logo', logoFile.value)
    }

    // 添加证书数据和文件
    const certData = formData.certificates.map((cert) => ({
      name: cert.name,
      number: cert.number,
      expiryDate: cert.expiryDate
    }))
    submitData.append('certificatesData', JSON.stringify(certData))

    for (const cert of formData.certificates) {
      if (cert.file) {
        submitData.append('certificates', cert.file)
      }
    }

    let result
    if (mySchool.value) {
      // 更新已有学校信息
      result = await updateSchool(mySchool.value._id, submitData)
      showMessage('success', '学校信息已更新，等待重新审核')
    } else {
      // 创建新学校信息
      result = await createSchool(submitData)
      showMessage('success', '学校信息提交成功，请等待审核')
    }

    if (result.success) {
      await loadSchool()
      isEditing.value = false
    }
  } catch (error: any) {
    showMessage('error', error.response?.data?.message || '提交失败')
  }
}

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
  // 清空表单
  Object.assign(formData, {
    name: '',
    code: '',
    type: '',
    contactPerson: '',
    contactPhone: '',
    email: '',
    establishDate: '',
    province: '',
    city: '',
    address: '',
    zipCode: '',
    description: '',
    certificates: []
  })
  previewLogo.value = null
  logoFile.value = null
}

// 处理编辑
const handleEdit = () => {
  if (!mySchool.value) return

  // 填充表单数据
  Object.assign(formData, {
    name: mySchool.value.name || '',
    code: mySchool.value.code || '',
    type: mySchool.value.type || '',
    contactPerson: mySchool.value.contactPerson || '',
    contactPhone: mySchool.value.contactPhone || '',
    email: mySchool.value.email || '',
    establishDate: mySchool.value.establishDate
      ? new Date(mySchool.value.establishDate).toISOString().split('T')[0]
      : '',
    province: mySchool.value.province || '',
    city: mySchool.value.city || '',
    address: mySchool.value.address || '',
    zipCode: mySchool.value.zipCode || '',
    description: mySchool.value.description || '',
    certificates: []
  })

  // 显示LOGO预览
  if (mySchool.value.logo) {
    if (isValidObjectId(mySchool.value.logo)) {
      previewLogo.value = getFileUrl(mySchool.value.logo)
    } else {
      previewLogo.value = mySchool.value.logo
    }
  }

  isEditing.value = true
}

// 处理取消认证
const handleCancelCertification = async () => {
  if (!mySchool.value) return

  if (!confirm('确定要取消认证吗？取消后将删除所有认证信息。')) {
    return
  }

  try {
    const result = await deleteSchool(mySchool.value._id)
    if (result.success) {
      showMessage('success', '认证已取消')
      mySchool.value = null
      await userStore.fetchUserInfo() // 刷新用户信息
    }
  } catch (error: any) {
    showMessage('error', error.response?.data?.message || '取消认证失败')
  }
}

onMounted(() => {
  loadSchool()
})
</script>

<style scoped>
.profile-page {
  padding: 20px;
  background: #fafafa;
  min-height: calc(100vh - 70px);
}

.page-header {
  margin-bottom: 30px;
}

.page-header h2 {
  color: #2d3748;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.page-header p {
  color: #718096;
  font-size: 16px;
}

.profile-content {
  max-width: 900px;
  margin: 0 auto;
}

.profile-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* 状态横幅 */
.status-banner {
  padding: 20px 30px;
  color: white;
}

.status-banner.status-pending {
  background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%);
}

.status-banner.status-approved {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
}

.status-banner.status-rejected {
  background: linear-gradient(135deg, #fc8181 0%, #f56565 100%);
}

.status-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.status-icon {
  font-size: 48px;
}

.status-text h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
}

.status-text p {
  margin: 0;
  opacity: 0.95;
  font-size: 14px;
}

/* 学校头部 */
.school-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px;
  display: flex;
  align-items: center;
  gap: 30px;
}

.school-header h3 {
  margin: 0;
  font-size: 24px;
}

.school-logo {
  width: 100px;
  height: 100px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.school-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-icon {
  font-size: 48px;
}

.school-basic-info h3 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.school-code,
.school-type {
  font-size: 14px;
  opacity: 0.9;
  margin: 4px 0;
}

/* 表单样式 */
.profile-form {
  padding: 30px;
}

.form-section {
  margin-bottom: 30px;
}

.form-section h4 {
  color: #2d3748;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #edf2f7;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: #4a5568;
  font-size: 14px;
  font-weight: 500;
}

.form-group input,
.form-group select,
textarea {
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #2d3748;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group select:focus,
textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

textarea {
  width: 100%;
  resize: vertical;
  font-family: inherit;
}

/* 信息展示 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item label {
  color: #4a5568;
  font-size: 14px;
  font-weight: 500;
}

.info-item div {
  color: #2d3748;
  font-size: 14px;
  padding: 12px 16px;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.description-text {
  color: #2d3748;
  line-height: 1.6;
  margin: 0;
}

/* LOGO上传 */
.logo-upload {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo-preview {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  border: 2px dashed #cbd5e0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #f7fafc;
}

.logo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-placeholder {
  font-size: 48px;
  color: #a0aec0;
}

/* 证书列表 */
.certificate-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.certificate-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.certificate-item:hover {
  background: #edf2f7;
  border-color: #cbd5e0;
  transform: translateY(-1px);
}

.certificate-icon {
  font-size: 32px;
  min-width: 40px;
}

.certificate-info {
  flex: 1;
}

.certificate-info h5 {
  color: #2d3748;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.certificate-info p {
  color: #4a5568;
  font-size: 14px;
  margin: 0 0 4px 0;
}

.certificate-date {
  color: #718096;
  font-size: 12px !important;
}

.view-btn {
  padding: 8px 16px;
  border: 1px solid #667eea;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #667eea;
  background: white;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;
}

.view-btn:hover {
  background: #667eea;
  color: white;
  transform: translateY(-1px);
}

/* 证书表单 */
.certificates-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.certificate-form-item {
  padding: 20px;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.cert-form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.cert-form-header h5 {
  margin: 0;
  color: #2d3748;
  font-size: 16px;
}

.btn-remove {
  padding: 6px 12px;
  background: #fc8181;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-remove:hover {
  background: #f56565;
}

.btn-add-cert {
  width: 100%;
}

/* 按钮 */
.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 2px solid #edf2f7;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
  border: 1px solid #cbd5e0;
}

.btn-secondary:hover {
  background: #cbd5e0;
  transform: translateY(-1px);
}

.btn-danger {
  background: #fc8181;
  color: white;
}

.btn-danger:hover {
  background: #f56565;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* 消息提示 */
.message-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  z-index: 2000;
  animation: slideIn 0.3s ease;
}

.message-success {
  background: #48bb78;
}

.message-error {
  background: #f56565;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .school-header {
    flex-direction: column;
    text-align: center;
    padding: 30px 20px;
  }

  .form-grid,
  .info-grid {
    grid-template-columns: 1fr;
  }

  .certificate-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .logo-upload {
    flex-direction: column;
  }
}
</style>
