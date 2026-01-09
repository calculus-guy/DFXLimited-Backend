const projectService = require('../services/projectService');

/**
 * Get all published projects (public)
 */
const getAll = async (req, res, next) => {
  try {
    const { page, limit, category } = req.query;
    const result = await projectService.getPublishedProjects(
      { category },
      { page, limit }
    );

    res.status(200).json({
      success: true,
      message: 'Projects retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get project by ID (public - published only)
 */
const getById = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.id, false);

    res.status(200).json({
      success: true,
      message: 'Project retrieved successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all projects (admin - includes unpublished)
 */
const getAllAdmin = async (req, res, next) => {
  try {
    const { page, limit, category, isPublished } = req.query;
    const result = await projectService.getAllProjects(
      { category, isPublished: isPublished === 'true' ? true : isPublished === 'false' ? false : undefined },
      { page, limit }
    );

    res.status(200).json({
      success: true,
      message: 'Projects retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create project (admin)
 */
const create = async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.body, req.user.userId);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update project (admin)
 */
const update = async (req, res, next) => {
  try {
    const adminId = req.user.userId;
    const project = await projectService.updateProject(req.params.id, req.body, adminId);

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete project (admin)
 */
const remove = async (req, res, next) => {
  try {
    const adminId = req.user.userId;
    await projectService.deleteProject(req.params.id, adminId);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle publish status (admin)
 */
const togglePublish = async (req, res, next) => {
  try {
    const adminId = req.user.userId;
    const project = await projectService.togglePublishStatus(req.params.id, adminId);

    res.status(200).json({
      success: true,
      message: `Project ${project.isPublished ? 'published' : 'unpublished'} successfully`,
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category statistics (public)
 */
const getCategoryStats = async (req, res, next) => {
  try {
    const stats = await projectService.getCategoryStats(true);

    res.status(200).json({
      success: true,
      message: 'Category statistics retrieved successfully',
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  getAllAdmin,
  create,
  update,
  remove,
  togglePublish,
  getCategoryStats
};
