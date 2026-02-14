// 考试API路由
const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin, isVerified } = require('../middleware/roleMiddleware');

// GET /api/exams - 获取考试列表（公开接口，支持分页和筛选）
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      level,
      status,
      keyword,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // 构建查询条件
    const query = {};

    // 类型筛选
    if (type) {
      query.type = type;
    }

    // 级别筛选
    if (level) {
      query.level = level;
    }

    // 状态筛选
    if (status) {
      query.status = status;
    }

    // 关键词搜索（名称或描述）
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    // 计算分页
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 排序
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    // 查询考试列表
    const examList = await Exam.find(query)
      .populate('creator', 'name email')
      .populate('questions.questionId', 'name type difficulty')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // 计算总数
    const total = await Exam.countDocuments(query);

    res.json({
      success: true,
      data: examList,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取考试列表失败',
      error: error.message
    });
  }
});

// GET /api/exams/:id - 获取考试详情（公开接口）
router.get('/:id', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('creator', 'name email')
      .populate('questions.questionId', 'name type difficulty');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: '考试不存在'
      });
    }

    res.json({
      success: true,
      data: exam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取考试详情失败',
      error: error.message
    });
  }
});

// POST /api/exams - 创建考试（需要admin权限）
router.post('/', authMiddleware, isAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      level,
      questions,
      totalScore,
      passingScore,
      duration,
      examDate,
      registrationDeadline,
      status,
      maxParticipants
    } = req.body;

    // 创建考试对象
    const examData = {
      name,
      description,
      type,
      level,
      questions: typeof questions === 'string' ? JSON.parse(questions) : questions,
      totalScore,
      passingScore,
      duration,
      examDate,
      registrationDeadline,
      status: status || 'upcoming',
      creator: req.user.id
    };

    // 最大参与人数（可选）
    if (maxParticipants) {
      examData.maxParticipants = maxParticipants;
    }

    const exam = await Exam.create(examData);

    res.status(201).json({
      success: true,
      message: '考试创建成功',
      data: exam
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '考试创建失败',
      error: error.message
    });
  }
});

// PUT /api/exams/:id - 更新考试（需要admin权限）
router.put('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: '考试不存在'
      });
    }

    const {
      name,
      description,
      type,
      level,
      questions,
      totalScore,
      passingScore,
      duration,
      examDate,
      registrationDeadline,
      status,
      maxParticipants
    } = req.body;

    // 更新字段
    if (name) exam.name = name;
    if (description) exam.description = description;
    if (type) exam.type = type;
    if (level) exam.level = level;
    if (totalScore !== undefined) exam.totalScore = totalScore;
    if (passingScore !== undefined) exam.passingScore = passingScore;
    if (duration !== undefined) exam.duration = duration;
    if (examDate) exam.examDate = examDate;
    if (registrationDeadline) exam.registrationDeadline = registrationDeadline;
    if (status) exam.status = status;
    if (maxParticipants !== undefined) exam.maxParticipants = maxParticipants;

    if (questions) {
      exam.questions = typeof questions === 'string' ? JSON.parse(questions) : questions;
    }

    await exam.save();

    res.json({
      success: true,
      message: '考试更新成功',
      data: exam
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '考试更新失败',
      error: error.message
    });
  }
});

// DELETE /api/exams/:id - 删除考试（需要admin权限）
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: '考试不存在'
      });
    }

    await exam.deleteOne();

    res.json({
      success: true,
      message: '考试删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '考试删除失败',
      error: error.message
    });
  }
});

// POST /api/exams/:id/register - 报名考试（需要verified权限，增加currentParticipants）
router.post('/:id/register', authMiddleware, isVerified, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: '考试不存在'
      });
    }

    // 检查考试状态
    if (exam.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        message: '该考试不接受报名'
      });
    }

    // 检查报名截止日期
    if (new Date() > exam.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: '报名已截止'
      });
    }

    // 检查是否已满员
    if (exam.maxParticipants && exam.currentParticipants >= exam.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: '报名人数已满'
      });
    }

    // 增加参与人数
    exam.currentParticipants += 1;
    await exam.save();

    res.json({
      success: true,
      message: '报名成功',
      data: {
        examId: exam._id,
        examName: exam.name,
        examDate: exam.examDate,
        currentParticipants: exam.currentParticipants,
        maxParticipants: exam.maxParticipants
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '报名失败',
      error: error.message
    });
  }
});

// POST /api/exams/:id/submit - 提交答卷（需要verified权限）
router.post('/:id/submit', authMiddleware, isVerified, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('questions.questionId');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: '考试不存在'
      });
    }

    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: '请提供答案数组'
      });
    }

    // 计算得分
    let totalScore = 0;
    const results = [];

    for (let i = 0; i < exam.questions.length; i++) {
      const examQuestion = exam.questions[i];
      const question = examQuestion.questionId;
      const userAnswer = answers.find(a => a.questionId === question._id.toString());

      if (!userAnswer) {
        results.push({
          questionId: question._id,
          questionName: question.name,
          score: 0,
          maxScore: examQuestion.score,
          isCorrect: false
        });
        continue;
      }

      // 检查答案是否正确
      let isCorrect = false;

      if (question.type === 'multiple') {
        const correctAnswer = Array.isArray(question.answer) ? question.answer : [question.answer];
        const userAnswerArray = Array.isArray(userAnswer.answer) ? userAnswer.answer : [userAnswer.answer];
        isCorrect = JSON.stringify(correctAnswer.sort()) === JSON.stringify(userAnswerArray.sort());
      } else {
        isCorrect = String(question.answer).toLowerCase() === String(userAnswer.answer).toLowerCase();
      }

      const earnedScore = isCorrect ? examQuestion.score : 0;
      totalScore += earnedScore;

      results.push({
        questionId: question._id,
        questionName: question.name,
        score: earnedScore,
        maxScore: examQuestion.score,
        isCorrect
      });
    }

    // 判断是否及格
    const isPassed = totalScore >= exam.passingScore;

    res.json({
      success: true,
      message: '答卷提交成功',
      data: {
        examId: exam._id,
        examName: exam.name,
        totalScore,
        maxScore: exam.totalScore,
        passingScore: exam.passingScore,
        isPassed,
        results
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '提交答卷失败',
      error: error.message
    });
  }
});

module.exports = router;
