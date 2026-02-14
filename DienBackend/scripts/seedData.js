// 初始化测试数据的脚本
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const News = require('../models/News');
const Courseware = require('../models/Courseware');
const Question = require('../models/Question');
const Exam = require('../models/Exam');
const Scholarship = require('../models/Scholarship');

// 连接MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB 连接成功');
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message);
    process.exit(1);
  }
};

// 初始化新闻数据
const seedNews = async (adminUser) => {
  try {
    // 先清空现有数据
    await News.deleteMany({});
    console.log('🗑️  清空新闻数据');

    const newsData = [
      {
        title: '2024年全国青少年信息学奥林匹克竞赛报名开始',
        content: '2024年全国青少年信息学奥林匹克竞赛（NOI）报名工作已正式启动，本次竞赛将于8月在北京市举行。请各参赛单位和选手做好准备，按照要求提交报名材料。本次竞赛将全面考察选手的算法设计与编程实现能力，涵盖数据结构、动态规划、图论等核心知识点。',
        summary: 'NOI 2024报名开始，8月北京举行',
        category: 'activity',
        status: 'published',
        publishedAt: new Date('2024-06-15'),
        author: adminUser._id,
        views: 150,
        tags: ['NOI', '竞赛', '报名']
      },
      {
        title: '教育部发布新一轮人工智能教育行动计划',
        content: '教育部近日发布《人工智能教育行动计划（2024-2027）》，提出将在全国中小学推广人工智能教育，加强教师培训，完善课程体系，推动人工智能与教育深度融合。计划明确要求到2027年，在全国范围内建成1000所人工智能教育示范学校。',
        summary: '教育部推动AI教育全面普及',
        category: 'industry',
        status: 'published',
        publishedAt: new Date('2024-06-10'),
        author: adminUser._id,
        views: 230,
        tags: ['人工智能', '教育政策', 'AI教育']
      },
      {
        title: '关于举办2024年机器人竞赛的通知',
        content: '为推动青少年科技创新能力培养，我中心将于7月举办2024年机器人竞赛，比赛分为小学组、初中组和高中组，欢迎广大青少年积极参与。比赛将考察机器人设计、编程、调试等综合能力。',
        summary: '2024机器人竞赛7月举办',
        category: 'notice',
        status: 'published',
        publishedAt: new Date('2024-06-05'),
        author: adminUser._id,
        views: 180,
        tags: ['机器人', '竞赛', '通知']
      },
      {
        title: '我校学生在国际信息学奥赛中获佳绩',
        content: '在刚刚结束的第36届国际信息学奥林匹克竞赛（IOI）中，我校学生张三同学获得金牌，李四同学获得银牌，为祖国和学校争得了荣誉。两位同学在激烈的竞争中脱颖而出，充分展现了扎实的算法功底和出色的临场发挥能力。',
        summary: '我校学生IOI竞赛获金银牌',
        category: 'achievement',
        status: 'published',
        publishedAt: new Date('2024-05-28'),
        author: adminUser._id,
        views: 320,
        tags: ['IOI', '获奖', '成就']
      },
      {
        title: '2024年编程教育发展论坛成功举办',
        content: '由中国教育技术协会主办的2024年编程教育发展论坛在北京成功举办，来自全国各地的教育专家、学者和一线教师共同探讨编程教育的发展趋势和实践经验。论坛围绕编程教育课程体系建设、师资培训、教学资源开发等议题展开深入交流。',
        summary: '编程教育论坛在京举行',
        category: 'activity',
        status: 'published',
        publishedAt: new Date('2024-05-20'),
        author: adminUser._id,
        views: 145,
        tags: ['编程教育', '论坛', '交流']
      }
    ];

    const createdNews = await News.insertMany(newsData);
    console.log(`✅ 成功创建 ${createdNews.length} 条新闻`);
  } catch (error) {
    console.error('❌ 初始化新闻数据失败:', error.message);
  }
};

// 初始化奖学金数据
const seedScholarships = async (adminUser) => {
  try {
    await Scholarship.deleteMany({});
    console.log('🗑️  清空奖学金数据');

    const scholarshipData = [
      {
        name: '信息学竞赛优秀奖学金',
        description: '面向在省级及以上信息学竞赛中获得优异成绩的学生',
        amount: 5000,
        type: 'merit',
        requirements: '省级一等奖及以上',
        quota: 10,
        currentApplications: 3,
        deadline: new Date('2024-12-31'),
        publishDate: new Date('2024-06-01'),
        status: 'available',
        creator: adminUser._id
      },
      {
        name: '科技创新特别奖学金',
        description: '奖励在科技创新方面有突出表现的学生',
        amount: 3000,
        type: 'special',
        requirements: '有科技创新项目或专利',
        quota: 15,
        currentApplications: 8,
        deadline: new Date('2024-12-31'),
        publishDate: new Date('2024-06-01'),
        status: 'available',
        creator: adminUser._id
      }
    ];

    const createdScholarships = await Scholarship.insertMany(scholarshipData);
    console.log(`✅ 成功创建 ${createdScholarships.length} 个奖学金`);
  } catch (error) {
    console.error('❌ 初始化奖学金数据失败:', error.message);
  }
};

// 初始化课件数据
const seedCourseware = async (adminUser) => {
  try {
    await Courseware.deleteMany({});
    console.log('🗑️  清空课件数据');

    const coursewareData = [
      {
        name: 'C++编程基础教程',
        description: 'C++语言入门课程，适合初学者',
        type: 'document',
        subject: 'computer',
        level: 'beginner',
        fileUrl: '/uploads/courseware/cpp-basic.pdf',
        fileSize: 2048000,
        fileType: 'application/pdf',
        uploader: adminUser._id,
        status: 'active',
        views: 520,
        downloads: 230,
        rating: 4.5,
        ratingCount: 45,
        tags: ['C++', '编程', '入门']
      },
      {
        name: '数据结构与算法',
        description: '讲解常用数据结构和算法',
        type: 'video',
        subject: 'computer',
        level: 'intermediate',
        fileUrl: '/uploads/courseware/data-structure.mp4',
        fileSize: 104857600,
        fileType: 'video/mp4',
        uploader: adminUser._id,
        status: 'active',
        views: 680,
        downloads: 340,
        rating: 4.8,
        ratingCount: 78,
        tags: ['数据结构', '算法', '进阶']
      }
    ];

    const createdCourseware = await Courseware.insertMany(coursewareData);
    console.log(`✅ 成功创建 ${createdCourseware.length} 个课件`);
  } catch (error) {
    console.error('❌ 初始化课件数据失败:', error.message);
  }
};

// 主函数
const main = async () => {
  await connectDB();

  try {
    console.log('\n🌱 开始初始化数据...\n');

    // 查找管理员用户（用于关联数据）
    let adminUser = await User.findOne({ role: 'admin' });

    if (!adminUser) {
      // 如果没有管理员，创建一个测试管理员
      console.log('📝 未找到管理员用户，创建测试管理员...');
      adminUser = await User.create({
        name: '测试管理员',
        account: 'admin@test.com',
        password: '123456',
        role: 'admin'
      });
      console.log(`✅ 创建测试管理员成功: ${adminUser.account}`);
      console.log(`   密码: 123456`);
    } else {
      console.log(`✅ 使用现有管理员: ${adminUser.account}`);
    }

    console.log('');

    // 初始化各类数据
    await seedNews(adminUser);
    await seedScholarships(adminUser);
    await seedCourseware(adminUser);

    console.log('\n🎉 数据初始化完成!\n');
    console.log('📊 数据统计:');
    console.log(`   - 新闻: ${await News.countDocuments()} 条`);
    console.log(`   - 奖学金: ${await Scholarship.countDocuments()} 个`);
    console.log(`   - 课件: ${await Courseware.countDocuments()} 个`);
    console.log('');
  } catch (error) {
    console.error('❌ 数据初始化失败:', error.message);
  }

  // 关闭连接
  await mongoose.connection.close();
  console.log('✅ 数据库连接已关闭\n');
  process.exit(0);
};

// 执行
main();
