import * as roleService from "../services/role.service.js";
import catchAsync from "../utils/catchAsync.js";

// @desc    Get all roles
// @route   GET /api/v1/roles
export const getAllRoles = catchAsync(async (req, res) => {
  const roles = await roleService.getAllRoles();

  res.status(200).json({
    status: "success",
    results: roles.length,
    data: roles,
  });
});

// @desc    Create a new role
// @route   POST /api/v1/roles
export const createRole = catchAsync(async (req, res) => {
  // We pass req.body directly because the Validator already cleaned it
  const newRole = await roleService.createRole(req.body);

  res.status(201).json({
    status: "success",
    data: newRole,
  });
});

// @desc    Update an existing role
// @route   PATCH /api/v1/roles/:id
export const updateRole = catchAsync(async (req, res) => {
  const updatedRole = await roleService.updateRole(req.params.id, req.body);

  res.status(200).json({
    status: "success",
    data: updatedRole,
  });
});

// @desc    Delete a role
// @route   DELETE /api/v1/roles/:id
export const deleteRole = catchAsync(async (req, res) => {
  await roleService.deleteRole(req.params.id);

  // 204 means "No Content" - the standard for successful deletion
  res.status(204).json({
    status: "success",
    data: null,
  });
});
