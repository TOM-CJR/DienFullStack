<template>
  <div class="profile-page">
    <div class="page-header">
      <h2>机构信息</h2>
      <p>提交和管理您的机构认证资料</p>
    </div>

    <div class="profile-content">
      <!-- 已提交机构信息显示 -->
      <div v-if="myOrganization && !isEditing" class="profile-card">
        <!-- 审核状态横幅 -->
        <div :class="['status-banner', `status-${myOrganization.status}`]">
          <div class="status-content">
            <div class="status-icon">
              <span v-if="myOrganization.status === 'pending'">⏳</span>
              <span v-else-if="myOrganization.status === 'approved'">✓</span>
              <span v-else>✗</span>
            </div>
            <div class="status-text">
              <h3>{{ getStatusText(myOrganization.status) }}</h3>
              <p v-if="myOrganization.status === 'pending'">您的机构信息正在审核中，请耐心等待</p>
              <p v-else-if="myOrganization.status === 'approved'">您的机构信息已通过审核</p>
              <p v-else-if="myOrganization.status === 'rejected'">
                审核未通过：{{ myOrganization.reviewComment || '无' }}
              </p>
            </div>
          </div>
        </div>

        <!-- 机构信息显示 -->
        <div class="organization-header">
          <div class="org-logo">
            <img v-if="logoUrl" :src="logoUrl" alt="机构LOGO" />
            <span v-else class="logo-icon">🏢</span>
          </div>
          <div class="org-basic-info">
            <h3>{{ myOrganization.name }}</h3>
            <p class="org-code">机构代码：{{ myOrganization.code || '未设置' }}</p>
            <p class="org-type">机构类型：{{ myOrganization.type || '未设置' }}</p>
          </div>
        </div>

        <div class="profile-form">
          <div class="form-section">
            <h4>基本信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <label>联系人</label>
                <div>{{ myOrganization.contactPerson }}</div>
              </div>
              <div class="info-item">
                <label>联系电话</label>
                <div>{{ myOrganization.contactPhone }}</div>
              </div>
              <div class="info-item">
                <label>电子邮箱</label>
                <div>{{ myOrganization.email || '未设置' }}</div>
              </div>
              <div class="info-item">
                <label>成立时间</label>
                <div>{{ formatDate(myOrganization.establishDate) }}</div>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>地址信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <label>省份</label>
                <div>{{ myOrganization.province || '未设置' }}</div>
              </div>
              <div class="info-item">
                <label>城市</label>
                <div>{{ myOrganization.city || '未设置' }}</div>
              </div>
              <div class="info-item">
                <label>详细地址</label>
                <div>{{ myOrganization.address || '未设置' }}</div>
              </div>
              <div class="info-item">
                <label>邮编</label>
                <div>{{ myOrganization.zipCode || '未设置' }}</div>
              </div>
            </div>
          </div>

          <div v-if="myOrganization.description" class="form-section">
            <h4>机构简介</h4>
            <p class="description-text">{{ myOrganization.description }}</p>
          </div>

          <div v-if="myOrganization.certificates && myOrganization.certificates.length > 0" class="form-section">
            <h4>资质证书</h4>
            <div class="certificate-list">
              <div v-for="(cert, index) in myOrganization.certificates" :key="index" class="certificate-item">
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
              {{ myOrganization.status === 'approved' ? '修改认证信息' : '重新提交' }}
            </button>
            <button class="btn btn-danger" @click="handleCancelCertification">
              取消认证
            </button>
          </div>
        </div>
      </div>

      <!-- 机构信息提交表单 -->
      <div v-else class="profile-card">
        <div class="organization-header">
          <h3>{{ isEditing ? '编辑机构信息' : '提交机构认证' }}</h3>
        </div>

        <div class="profile-form">
          <div class="form-section">
            <h4>机构LOGO</h4>
            <div class="logo-upload">
              <div class="logo-preview">
                <img v-if="previewLogo" :src="previewLogo" alt="LOGO预览" />
                <span v-else class="logo-placeholder">🏢</span>
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
                <label>机构名称 *</label>
                <input v-model="formData.name" type="text" placeholder="请输入机构名称" required />
              </div>
              <div class="form-group">
                <label>机构代码</label>
                <input v-model="formData.code" type="text" placeholder="请输入机构代码" />
              </div>
              <div class="form-group">
                <label>机构类型</label>
                <input v-model="formData.type" type="text" placeholder="请输入机构类型" />
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
                <label>成立时间</label>
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
            <h4>机构简介</h4>
            <textarea v-model="formData.description" rows="4" placeholder="请输入机构简介（选填）" maxlength="1000"></textarea>
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
            <button v-if="myOrganization" class="btn btn-secondary" @click="cancelEdit">
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
import { getMyOrganization, createOrganization, updateOrganization, deleteOrganization } from '@/api/organizationApi'
import type { Organization } from '@/api/organizationApi'
import { useUserStore } from '@/stores/user'
import { getFileUrl, isValidObjectId } from '@/utils/apiConfig'

const userStore = useUserStore()

const logoInput = ref<HTMLInputElement | null>(null)
const myOrganization = ref<Organization | null>(null)
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
  const logo = myOrganization.value?.logo
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

// 加载机构信息
const loadOrganization = async () => {
  try {
    const result = await getMyOrganization()
    if (result.success) {
      myOrganization.value = result.data
    }
  } catch (error: any) {
    if (error.response?.status !== 404) {
      console.error('获取机构信息失败:', error)
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

    // 添加机构基本数据
    const orgData = {
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
    submitData.append('data', JSON.stringify(orgData))

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
    if (myOrganization.value) {
      // 更新已有机构信息
      result = await updateOrganization(myOrganization.value._id, submitData)
      showMessage('success', '机构信息已更新，等待重新审核')
    } else {
      // 创建新机构信息
      result = await createOrganization(submitData)
      showMessage('success', '机构信息提交成功，请等待审核')
    }

    if (result.success) {
      await loadOrganization()
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
  if (!myOrganization.value) return

  // 填充表单数据
  Object.assign(formData, {
    name: myOrganization.value.name || '',
    code: myOrganization.value.code || '',
    type: myOrganization.value.type || '',
    contactPerson: myOrganization.value.contactPerson || '',
    contactPhone: myOrganization.value.contactPhone || '',
    email: myOrganization.value.email || '',
    establishDate: myOrganization.value.establishDate
      ? new Date(myOrganization.value.establishDate).toISOString().split('T')[0]
      : '',
    province: myOrganization.value.province || '',
    city: myOrganization.value.city || '',
    address: myOrganization.value.address || '',
    zipCode: myOrganization.value.zipCode || '',
    description: myOrganization.value.description || '',
    certificates: []
  })

  // 显示LOGO预览
  if (myOrganization.value.logo) {
    if (isValidObjectId(myOrganization.value.logo)) {
      previewLogo.value = getFileUrl(myOrganization.value.logo)
    } else {
      previewLogo.value = myOrganization.value.logo
    }
  }

  isEditing.value = true
}

// 处理取消认证
const handleCancelCertification = async () => {
  if (!myOrganization.value) return

  if (!confirm('确定要取消认证吗？取消后将删除所有认证信息。')) {
    return
  }

  try {
    const result = await deleteOrganization(myOrganization.value._id)
    if (result.success) {
      showMessage('success', '认证已取消')
      myOrganization.value = null
      await userStore.fetchUserInfo() // 刷新用户信息
    }
  } catch (error: any) {
    showMessage('error', error.response?.data?.message || '取消认证失败')
  }
}

onMounted(() => {
  loadOrganization()
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

/* 机构头部 */
.organization-header {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  padding: 40px;
  display: flex;
  align-items: center;
  gap: 30px;
}

.organization-header h3 {
  margin: 0;
  font-size: 24px;
}

.org-logo {
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

.org-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-icon {
  font-size: 48px;
}

.org-basic-info h3 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.org-code,
.org-type {
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
  border-color: #48bb78;
  box-shadow: 0 0 0 3px rgba(72, 187, 120, 0.1);
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
  border: 1px solid #48bb78;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #48bb78;
  background: white;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;
}

.view-btn:hover {
  background: #48bb78;
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
  background: #48bb78;
  color: white;
}

.btn-primary:hover {
  background: #38a169;
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
  .organization-header {
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
