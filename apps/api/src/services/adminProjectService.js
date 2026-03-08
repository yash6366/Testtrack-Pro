/**
 * ADMIN PROJECT MANAGEMENT SERVICE
 * Handles project creation, configuration, and user allocation
 */

import { getPrismaClient } from '../lib/prisma.js';
import { logAuditAction } from './auditService.js';
import { broadcastToProject } from './notificationEmitter.js';

const prisma = getPrismaClient();

/**
 * Create a new project
 * @param {Object} data - Project data
 * @param {string} data.name - Project name
 * @param {string} data.key - Project key (unique identifier)
 * @param {string} data.description - Project description
 * @param {Array} data.modules - Array of modules (ProjectModule enum values)
 * @param {number} userId - Admin user ID
 * @returns {Promise<Object>} Created project
 */
export async function createProject(data, userId) {
  const { name, key, description, modules = [] } = data;

  // Validate required fields
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Project name is required');
  }

  if (!key || typeof key !== 'string' || key.trim().length === 0) {
    throw new Error('Project key is required');
  }

  // Normalize key (uppercase, alphanumeric + dash only)
  const normalizedKey = key.toUpperCase().replace(/[^A-Z0-9-]/g, '-');
  const cleanedKey = normalizedKey.replace(/-+/g, '-').replace(/^-+|-+$/g, '');

  if (!cleanedKey || !/[A-Z0-9]/.test(cleanedKey)) {
    throw new Error('Project key must contain at least one alphanumeric character');
  }

  // Check if project name already exists
  const existingByName = await prisma.project.findFirst({
    where: { name: name.trim() },
  });

  if (existingByName) {
    throw new Error('Project name already exists');
  }

  // Check if project key already exists
  const existingByKey = await prisma.project.findUnique({
    where: { key: cleanedKey },
  });

  if (existingByKey) {
    throw new Error('Project key already exists');
  }

  // Validate modules
  const validModules = ['UI', 'BACKEND', 'API', 'DATABASE', 'MOBILE', 'AUTOMATION', 'SECURITY', 'PERFORMANCE', 'OTHER'];
  const filteredModules = modules
    .filter(m => typeof m === 'string')
    .map(m => m.toUpperCase())
    .filter(m => validModules.includes(m));

  // Create project
  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      key: cleanedKey,
      description: description?.trim() || null,
      ownerId: userId,
      status: 'ACTIVE',
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Log audit
  await logAuditAction(userId, 'PROJECT_CREATED', {
    resourceType: 'PROJECT',
    resourceId: project.id,
    resourceName: project.name,
    description: `Created new project: ${project.name}`,
    newValues: { name, key: cleanedKey, modules: filteredModules },
  });

  return {
    ...project,
    modules: filteredModules,
  };
}

/**
 * Get all projects
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} List of projects
 */
export async function getAllProjects(filters = {}) {
  const { skip = 0, take = 50, isActive = true, search = null } = filters;

  const where = {};

  if (isActive !== undefined) {
    where.status = isActive ? 'ACTIVE' : 'INACTIVE';
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { key: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            testCases: true,
            testRuns: true,
            bugs: true,
            userAllocations: true,
            environments: true,
            customFields: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: Math.max(0, Number(skip) || 0),
      take: Math.min(500, Math.max(1, Number(take) || 50)),
    }),
    prisma.project.count({ where }),
  ]);

  return {
    projects: projects.map(project => ({
      ...project,
      modules: project.modules || [],
      _count: {
        ...project._count,
        projectUserAllocations: project._count?.userAllocations || 0,
      },
    })),
    pagination: { skip: Number(skip), take: Number(take), total },
  };
}

/**
 * Get project details
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} Project details
 */
export async function getProjectDetails(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      environments: {
        where: { isActive: true },
      },
      customFields: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
      userAllocations: {
        where: { isActive: true },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      _count: {
        select: {
          testCases: true,
          testRuns: true,
          bugs: true,
          userAllocations: true,
          environments: true,
          customFields: true,
        },
      },
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  return {
    ...project,
    modules: project.modules || [],
    projectUserAllocations: (project.userAllocations || []).map(allocation => ({
      ...allocation,
      role: allocation.projectRole,
    })),
    _count: {
      ...project._count,
      projectUserAllocations: project._count?.userAllocations || 0,
    },
  };
}

/**
 * Update project details
 * @param {number} projectId - Project ID
 * @param {Object} data - Update data
 * @param {number} userId - Admin user ID
 * @returns {Promise<Object>} Updated project
 */
export async function updateProject(projectId, data, userId) {
  const { name, description, modules, isActive } = data;
  let normalizedModules;

  // Validate project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  const updateData = {};

  // Update name if provided
  if (name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Project name must be a non-empty string');
    }

    // Check if new name is unique
    const existingByName = await prisma.project.findUnique({
      where: { name: name.trim() },
    });

    if (existingByName && existingByName.id !== projectId) {
      throw new Error('Project name already exists');
    }

    updateData.name = name.trim();
  }

  // Update description if provided
  if (description !== undefined) {
    updateData.description = description?.trim() || null;
  }

  // Update modules if provided
  if (modules !== undefined && Array.isArray(modules)) {
    const validModules = ['UI', 'BACKEND', 'API', 'DATABASE', 'MOBILE', 'AUTOMATION', 'SECURITY', 'PERFORMANCE', 'OTHER'];
    normalizedModules = modules
      .filter(m => typeof m === 'string')
      .map(m => m.toUpperCase())
      .filter(m => validModules.includes(m));
  }

  // Update status if provided
  if (isActive !== undefined) {
    updateData.status = (typeof isActive === 'string' ? isActive === 'true' : Boolean(isActive))
      ? 'ACTIVE'
      : 'INACTIVE';
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: updateData,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Log audit
  const auditNewValues = {
    ...updateData,
    ...(normalizedModules ? { modules: normalizedModules } : {}),
  };

  await logAuditAction(userId, 'PROJECT_UPDATED', {
    resourceType: 'PROJECT',
    resourceId: projectId,
    resourceName: updated.name,
    description: `Updated project: ${updated.name}`,
    oldValues: Object.keys(updateData).reduce((acc, key) => {
      acc[key] = project[key];
      return acc;
    }, {}),
    newValues: auditNewValues,
  });

  return {
    ...updated,
    modules: normalizedModules || updated.modules || [],
  };
}

/**
 * Add environment to project
 * @param {number} projectId - Project ID
 * @param {Object} data - Environment data
 * @param {number} userId - Admin user ID
 * @returns {Promise<Object>} Created environment
 */
export async function addProjectEnvironment(projectId, data, userId) {
  const { name, url, description } = data;

  // Validate project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Environment name is required');
  }

  // Check if environment already exists
  const existing = await prisma.projectEnvironment.findUnique({
    where: {
      projectId_name: {
        projectId,
        name: name.trim(),
      },
    },
  });

  if (existing) {
    throw new Error('Environment already exists for this project');
  }

  const environment = await prisma.projectEnvironment.create({
    data: {
      projectId,
      name: name.trim(),
      description: description?.trim() || null,
    },
  });

  // Log audit
  await logAuditAction(userId, 'CONFIG_CHANGED', {
    resourceType: 'PROJECT_ENVIRONMENT',
    resourceId: environment.id,
    description: `Added environment "${name.trim()}" to project "${project.name}"`,
    newValues: { name: name.trim(), url: url?.trim() || null },
  });

  return environment;
}

/**
 * Add custom field to project
 * @param {number} projectId - Project ID
 * @param {Object} data - Custom field data
 * @param {number} userId - Admin user ID
 * @returns {Promise<Object>} Created custom field
 */
export async function addProjectCustomField(projectId, data, userId) {
  const { name, label, type, required = false, options, defaultValue, order = 0 } = data;

  // Validate project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Field name is required');
  }

  if (!type || typeof type !== 'string') {
    throw new Error('Field type is required');
  }

  const validTypes = ['TEXT', 'NUMBER', 'CHECKBOX', 'SELECT', 'MULTISELECT', 'DATE', 'EMAIL'];
  if (!validTypes.includes(type.toUpperCase())) {
    throw new Error(`Invalid field type. Must be one of: ${validTypes.join(', ')}`);
  }

  // Check if field already exists
  const existing = await prisma.customField.findUnique({
    where: {
      projectId_name: {
        projectId,
        name: name.trim(),
      },
    },
  });

  if (existing) {
    throw new Error('Custom field already exists for this project');
  }

  let optionsJson = null;
  if (options && Array.isArray(options)) {
    optionsJson = JSON.stringify(options);
  }

  const customField = await prisma.customField.create({
    data: {
      projectId,
      name: name.trim(),
      label: label?.trim() || name.trim(),
      type: type.toUpperCase(),
      required: Boolean(required),
      options: optionsJson,
      defaultValue: defaultValue?.toString() || null,
      order: Math.max(0, Number(order) || 0),
    },
  });

  // Log audit
  await logAuditAction(userId, 'CONFIG_CHANGED', {
    resourceType: 'CUSTOM_FIELD',
    resourceId: customField.id,
    description: `Added custom field "${name.trim()}" to project "${project.name}"`,
    newValues: { name: name.trim(), type: type.toUpperCase(), required },
  });

  return customField;
}

/**
 * Allocate user to project
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID to allocate
 * @param {Object} data - Allocation data
 * @param {number} adminId - Admin user ID
 * @returns {Promise<Object>} Created allocation
 */
export async function allocateUserToProject(projectId, userId, data, adminId) {
  const { role = 'QA_ENGINEER' } = data;
  const normalizedRole = String(role || '').toUpperCase();

  // Validate project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  // Validate user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Validate role
  const validRoles = ['PROJECT_MANAGER', 'LEAD_TESTER', 'DEVELOPER', 'QA_ENGINEER', 'AUTOMATION_ENGINEER'];
  if (!validRoles.includes(normalizedRole)) {
    throw new Error(`Invalid project role. Must be one of: ${validRoles.join(', ')}`);
  }

  // Use upsert to atomically handle create or update (prevents race conditions)
  // If user was previously deallocated, this reactivates them
  // If user is already active, this updates their role
  const allocation = await prisma.projectUserAllocation.upsert({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
    update: {
      projectRole: normalizedRole,
      isActive: true,
    },
    create: {
      projectId,
      userId,
      projectRole: normalizedRole,
      isActive: true,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Log audit
  await logAuditAction(adminId, 'ADMIN_ACTION', {
    resourceType: 'PROJECT_USER_ALLOCATION',
    resourceId: allocation.id,
    description: `Allocated user "${user.name}" to project "${project.name}" as ${normalizedRole}`,
    newValues: { userId, role: normalizedRole },
  });

  return {
    ...allocation,
    role: allocation.projectRole,
  };
}

/**
 * Remove user from project
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID to remove
 * @param {number} adminId - Admin user ID
 * @returns {Promise<Object>} Updated allocation
 */
export async function deallocateUserFromProject(projectId, userId, adminId) {
  // Validate allocation exists
  const allocation = await prisma.projectUserAllocation.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      project: {
        select: { id: true, name: true },
      },
    },
  });

  if (!allocation) {
    throw new Error('User has never been allocated to this project');
  }

  if (!allocation.isActive) {
    throw new Error('User has already been removed from this project');
  }

  // Deactivate allocation
  const updated = await prisma.projectUserAllocation.update({
    where: { id: allocation.id },
    data: {
      isActive: false,
    },
  });

  // Log audit
  await logAuditAction(adminId, 'ADMIN_ACTION', {
    resourceType: 'PROJECT_USER_ALLOCATION',
    resourceId: allocation.id,
    description: `Removed user "${allocation.user.name}" from project "${allocation.project.name}"`,
    oldValues: { isActive: true },
    newValues: { isActive: false },
  });

  return updated;
}

/**
 * Get project user allocations
 * @param {number} projectId - Project ID
 * @returns {Promise<Array>} List of allocations
 */
export async function getProjectUserAllocations(projectId) {
  // Validate project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  const allocations = await prisma.projectUserAllocation.findMany({
    where: { projectId, isActive: true },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { allocatedAt: 'desc' },
  });

  return allocations.map(allocation => ({
    ...allocation,
    role: allocation.projectRole,
  }));
}

/**
 * Delete custom field
 * @param {number} fieldId - Custom field ID
 * @param {number} adminId - Admin user ID
 * @returns {Promise<void>}
 */
export async function deleteCustomField(fieldId, adminId) {
  const field = await prisma.customField.findUnique({
    where: { id: fieldId },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  });

  if (!field) {
    throw new Error('Custom field not found');
  }

  await prisma.customField.delete({
    where: { id: fieldId },
  });

  // Log audit
  await logAuditAction(adminId, 'CONFIG_CHANGED', {
    resourceType: 'CUSTOM_FIELD',
    description: `Deleted custom field "${field.name}" from project "${field.project.name}"`,
    oldValues: { name: field.name, type: field.type },
  });
}

/**
 * Delete environment
 * @param {number} envId - Environment ID
 * @param {number} adminId - Admin user ID
 * @returns {Promise<void>}
 */
export async function deleteEnvironment(envId, adminId) {
  const env = await prisma.projectEnvironment.findUnique({
    where: { id: envId },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  });

  if (!env) {
    throw new Error('Environment not found');
  }

  await prisma.projectEnvironment.delete({
    where: { id: envId },
  });

  // Log audit
  await logAuditAction(adminId, 'CONFIG_CHANGED', {
    resourceType: 'PROJECT_ENVIRONMENT',
    description: `Deleted environment "${env.name}" from project "${env.project.name}"`,
    oldValues: { name: env.name },
  });
}

/**
 * Get all environments for a project
 * @param {number} projectId - Project ID
 * @returns {Promise<Array>} List of environments
 */
export async function getProjectEnvironments(projectId) {
  // Validate project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  const environments = await prisma.projectEnvironment.findMany({
    where: { projectId },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });

  return environments;
}

/**
 * Get environment details
 * @param {number} envId - Environment ID
 * @returns {Promise<Object>} Environment details
 */
export async function getEnvironmentDetails(envId) {
  const environment = await prisma.projectEnvironment.findUnique({
    where: { id: envId },
    include: {
      project: {
        select: { id: true, name: true, key: true },
      },
    },
  });

  if (!environment) {
    throw new Error('Environment not found');
  }

  return environment;
}

/**
 * Update environment
 * @param {number} envId - Environment ID
 * @param {Object} data - Environment update data
 * @param {number} adminId - Admin user ID
 * @returns {Promise<Object>} Updated environment
 */
export async function updateEnvironment(envId, data, adminId) {
  const { name, description, isActive, order } = data;

  // Check if environment exists
  const existing = await prisma.projectEnvironment.findUnique({
    where: { id: envId },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  });

  if (!existing) {
    throw new Error('Environment not found');
  }

  // Build update data
  const updateData = {};
  const oldValues = {};
  const newValues = {};

  if (name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Environment name is required');
    }
    
    // Check if name is unique within the project
    if (name.trim() !== existing.name) {
      const duplicate = await prisma.projectEnvironment.findUnique({
        where: {
          projectId_name: {
            projectId: existing.projectId,
            name: name.trim(),
          },
        },
      });

      if (duplicate) {
        throw new Error('Environment name already exists in this project');
      }

      updateData.name = name.trim();
      oldValues.name = existing.name;
      newValues.name = name.trim();
    }
  }

  if (description !== undefined) {
    updateData.description = description ? description.trim() : null;
    oldValues.description = existing.description;
    newValues.description = updateData.description;
  }

  if (isActive !== undefined) {
    updateData.isActive = Boolean(isActive);
    oldValues.isActive = existing.isActive;
    newValues.isActive = updateData.isActive;
  }

  if (order !== undefined) {
    updateData.order = Math.max(0, Number(order) || 0);
    oldValues.order = existing.order;
    newValues.order = updateData.order;
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error('No valid fields to update');
  }

  // Update environment
  const updated = await prisma.projectEnvironment.update({
    where: { id: envId },
    data: updateData,
  });

  // Log audit
  await logAuditAction(adminId, 'CONFIG_CHANGED', {
    resourceType: 'PROJECT_ENVIRONMENT',
    resourceId: envId,
    description: `Updated environment "${existing.name}" in project "${existing.project.name}"`,
    oldValues,
    newValues,
  });

  return updated;
}

/**
 * Get all custom fields for a project
 * @param {number} projectId - Project ID
 * @returns {Promise<Array>} List of custom fields
 */
export async function getProjectCustomFields(projectId) {
  // Validate project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  const customFields = await prisma.customField.findMany({
    where: { projectId, isActive: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });

  return customFields;
}

/**
 * Get custom field details
 * @param {number} fieldId - Custom field ID
 * @returns {Promise<Object>} Custom field details
 */
export async function getCustomFieldDetails(fieldId) {
  const customField = await prisma.customField.findUnique({
    where: { id: fieldId },
    include: {
      project: {
        select: { id: true, name: true, key: true },
      },
    },
  });

  if (!customField) {
    throw new Error('Custom field not found');
  }

  return customField;
}

/**
 * Update custom field
 * @param {number} fieldId - Custom field ID
 * @param {Object} data - Custom field update data
 * @param {number} adminId - Admin user ID
 * @returns {Promise<Object>} Updated custom field
 */
export async function updateCustomField(fieldId, data, adminId) {
  const { name, fieldType, options, isRequired, isActive, order } = data;

  // Check if custom field exists
  const existing = await prisma.customField.findUnique({
    where: { id: fieldId },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  });

  if (!existing) {
    throw new Error('Custom field not found');
  }

  // Build update data
  const updateData = {};
  const oldValues = {};
  const newValues = {};

  if (name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Custom field name is required');
    }
    
    // Check if name is unique within the project
    if (name.trim() !== existing.name) {
      const duplicate = await prisma.customField.findUnique({
        where: {
          projectId_name: {
            projectId: existing.projectId,
            name: name.trim(),
          },
        },
      });

      if (duplicate) {
        throw new Error('Custom field name already exists in this project');
      }

      updateData.name = name.trim();
      oldValues.name = existing.name;
      newValues.name = name.trim();
    }
  }

  if (fieldType !== undefined) {
    const validTypes = ['TEXT', 'NUMBER', 'SELECT', 'DATE', 'CHECKBOX'];
    const normalizedType = String(fieldType).toUpperCase();
    
    if (!validTypes.includes(normalizedType)) {
      throw new Error(`Invalid field type. Must be one of: ${validTypes.join(', ')}`);
    }

    updateData.fieldType = normalizedType;
    oldValues.fieldType = existing.fieldType;
    newValues.fieldType = normalizedType;
  }

  if (options !== undefined) {
    if (Array.isArray(options)) {
      updateData.options = options.filter(opt => typeof opt === 'string' && opt.trim().length > 0);
    } else {
      updateData.options = [];
    }
    oldValues.options = existing.options;
    newValues.options = updateData.options;
  }

  if (isRequired !== undefined) {
    updateData.isRequired = Boolean(isRequired);
    oldValues.isRequired = existing.isRequired;
    newValues.isRequired = updateData.isRequired;
  }

  if (isActive !== undefined) {
    updateData.isActive = Boolean(isActive);
    oldValues.isActive = existing.isActive;
    newValues.isActive = updateData.isActive;
  }

  if (order !== undefined) {
    updateData.order = Math.max(0, Number(order) || 0);
    oldValues.order = existing.order;
    newValues.order = updateData.order;
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error('No valid fields to update');
  }

  // Update custom field
  const updated = await prisma.customField.update({
    where: { id: fieldId },
    data: updateData,
  });

  // Log audit
  await logAuditAction(adminId, 'CONFIG_CHANGED', {
    resourceType: 'CUSTOM_FIELD',
    resourceId: fieldId,
    description: `Updated custom field "${existing.name}" in project "${existing.project.name}"`,
    oldValues,
    newValues,
  });

  return updated;
}
