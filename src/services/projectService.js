const Project = require('../models/Project');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('./activityLogService');

/**
 * Create a new project
 */
const createProject = async (projectData, adminId) => {
  const project = await Project.create({
    ...projectData,
    createdBy: adminId
  });

  // Log activity
  logActivity({
    action: 'PROJECT_CREATED',
    actor: adminId,
    actorType: 'ADMIN',
    targetType: 'PROJECT',
    targetId: project._id,
    metadata: { title: project.title, category: project.category }
  });

  return project;
};

/**
 * Get project by ID
 */
const getProjectById = async (id, includeUnpublished = false) => {
  const query = { _id: id };
  
  if (!includeUnpublished) {
    query.isPublished = true;
  }

  const project = await Project.findOne(query);
  
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  
  return project;
};

/**
 * Get published projects (public)
 */
const getPublishedProjects = async (filters = {}, pagination = {}) => {
  const { category } = filters;
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const query = { isPublished: true };
  if (category) {
    query.category = category;
  }

  const [projects, total] = await Promise.all([
    Project.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Project.countDocuments(query)
  ]);

  return {
    projects,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get all projects (admin - includes unpublished)
 */
const getAllProjects = async (filters = {}, pagination = {}) => {
  const { category, isPublished } = filters;
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const query = {};
  if (category) {
    query.category = category;
  }
  if (typeof isPublished === 'boolean') {
    query.isPublished = isPublished;
  }

  const [projects, total] = await Promise.all([
    Project.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email'),
    Project.countDocuments(query)
  ]);

  return {
    projects,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Update project
 */
const updateProject = async (id, updateData, adminId = null) => {
  const project = await Project.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Log activity
  logActivity({
    action: 'PROJECT_UPDATED',
    actor: adminId,
    actorType: 'ADMIN',
    targetType: 'PROJECT',
    targetId: project._id,
    metadata: { title: project.title, updatedFields: Object.keys(updateData) }
  });

  return project;
};

/**
 * Delete project
 */
const deleteProject = async (id, adminId = null) => {
  const project = await Project.findByIdAndDelete(id);
  
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Log activity
  logActivity({
    action: 'PROJECT_DELETED',
    actor: adminId,
    actorType: 'ADMIN',
    targetType: 'PROJECT',
    targetId: project._id,
    metadata: { title: project.title }
  });

  return project;
};

/**
 * Toggle publish status
 */
const togglePublishStatus = async (id, adminId = null) => {
  const project = await Project.findById(id);
  
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  project.isPublished = !project.isPublished;
  await project.save();

  // Log activity if published
  if (project.isPublished) {
    logActivity({
      action: 'PROJECT_PUBLISHED',
      actor: adminId,
      actorType: 'ADMIN',
      targetType: 'PROJECT',
      targetId: project._id,
      metadata: { title: project.title }
    });
  }

  return project;
};

/**
 * Get project categories with counts
 */
const getCategoryStats = async (publishedOnly = true) => {
  const match = publishedOnly ? { isPublished: true } : {};
  
  const stats = await Project.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  return stats;
};

module.exports = {
  createProject,
  getProjectById,
  getPublishedProjects,
  getAllProjects,
  updateProject,
  deleteProject,
  togglePublishStatus,
  getCategoryStats
};
