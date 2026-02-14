// 题库API路由
const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin, isVerified } = require('../middleware/roleMiddleware');

// GET /api/questions - 获取题目列表（公开接口，支持分页和筛选）
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      difficulty,
      category,
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

    // 难度筛选
    if (difficulty) {
      query.difficulty = difficulty;
    }

    // 分类筛选
    if (category) {
      query.category = category;
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

    // 查询题目列表（不返回答案）
    const questionList = await Question.find(query)
      .select('-answer -testCases')
      .populate('creator', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // 计算总数
    const total = await Question.countDocuments(query);

    res.json({
      success: true,
      data: questionList,
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
      message: '获取题目列表失败',
      error: error.message
    });
  }
});

// GET /api/questions/:id - 获取题目详情（公开接口，不返回答案）
router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .select('-answer -testCases')
      .populate('creator', 'name email');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取题目详情失败',
      error: error.message
    });
  }
});

// POST /api/questions - 创建题目（需要admin权限）
router.post('/', authMiddleware, isAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      difficulty,
      category,
      options,
      answer,
      explanation,
      testCases,
      timeLimit,
      memoryLimit
    } = req.body;

    // 创建题目对象
    const questionData = {
      name,
      description,
      type,
      difficulty,
      category,
      answer,
      creator: req.user.id
    };

    // 选项（用于选择题）
    if (options) {
      questionData.options = typeof options === 'string' ? JSON.parse(options) : options;
    }

    // 答案解析
    if (explanation) {
      questionData.explanation = explanation;
    }

    // 测试用例（用于编程题）
    if (testCases) {
      questionData.testCases = typeof testCases === 'string' ? JSON.parse(testCases) : testCases;
    }

    // 时间和内存限制（用于编程题）
    if (timeLimit) questionData.timeLimit = timeLimit;
    if (memoryLimit) questionData.memoryLimit = memoryLimit;

    const question = await Question.create(questionData);

    res.status(201).json({
      success: true,
      message: '题目创建成功',
      data: question
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '题目创建失败',
      error: error.message
    });
  }
});

// PUT /api/questions/:id - 更新题目（需要admin权限）
router.put('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    const {
      name,
      description,
      type,
      difficulty,
      category,
      options,
      answer,
      explanation,
      testCases,
      timeLimit,
      memoryLimit
    } = req.body;

    // 更新字段
    if (name) question.name = name;
    if (description) question.description = description;
    if (type) question.type = type;
    if (difficulty) question.difficulty = difficulty;
    if (category) question.category = category;
    if (answer) question.answer = answer;
    if (explanation !== undefined) question.explanation = explanation;
    if (timeLimit !== undefined) question.timeLimit = timeLimit;
    if (memoryLimit !== undefined) question.memoryLimit = memoryLimit;

    if (options) {
      question.options = typeof options === 'string' ? JSON.parse(options) : options;
    }

    if (testCases) {
      question.testCases = typeof testCases === 'string' ? JSON.parse(testCases) : testCases;
    }

    await question.save();

    res.json({
      success: true,
      message: '题目更新成功',
      data: question
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '题目更新失败',
      error: error.message
    });
  }
});

// DELETE /api/questions/:id - 删除题目（需要admin权限）
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    await question.deleteOne();

    res.json({
      success: true,
      message: '题目删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '题目删除失败',
      error: error.message
    });
  }
});

// POST /api/questions/:id/submit - 提交答案（需要verified权限，增加attemptCount）
router.post('/:id/submit', authMiddleware, isVerified, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    const { userAnswer } = req.body;

    if (!userAnswer) {
      return res.status(400).json({
        success: false,
        message: '请提供答案'
      });
    }

    // 增加答题次数
    question.attemptCount += 1;

    // 检查答案是否正确
    let isCorrect = false;

    if (question.type === 'multiple') {
      // 多选题：比较数组
      const correctAnswer = Array.isArray(question.answer) ? question.answer : [question.answer];
      const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
      isCorrect = JSON.stringify(correctAnswer.sort()) === JSON.stringify(userAnswerArray.sort());
    } else if (question.type === 'programming') {
      // 编程题：这里需要实际运行代码并测试，暂时简化处理
      isCorrect = false; // 编程题需要专门的判题系统
    } else {
      // 单选题、判断题、填空题：直接比较
      isCorrect = String(question.answer).toLowerCase() === String(userAnswer).toLowerCase();
    }

    // 如果答对了，增加正确次数
    if (isCorrect) {
      question.correctCount += 1;
    }

    await question.save();

    res.json({
      success: true,
      message: isCorrect ? '答案正确！' : '答案错误',
      data: {
        isCorrect,
        correctAnswer: isCorrect ? null : question.answer, // 答错时返回正确答案
        explanation: question.explanation,
        correctRate: question.correctRate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '提交答案失败',
      error: error.message
    });
  }
});

module.exports = router;
