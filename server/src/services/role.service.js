import Role from "../models/Role.js";

export const getAllRoles = async () => {
  return await Role.find().sort({ name: 1 });
};

export const createRole = async (roleData) => {
  const existingRole = await Role.findOne({ name: roleData.name });
  if (existingRole) {
    throw new Error("A role with this name already exists.");
  }
  return await Role.create(roleData);
};

export const updateRole = async (id, updateData) => {
  const role = await Role.findById(id);
  if (!role) throw new Error("Role not found.");

  const protectedRoles = ["super_admin", "admin", "user"];
  if (
    protectedRoles.includes(role.name) &&
    updateData.name &&
    updateData.name !== role.name
  ) {
    throw new Error("System roles cannot be renamed.");
  }

  return await Role.findByIdAndUpdate(id, updateData, {
    returnDocument: 'after',
    runValidators: true,
  });
};

export const deleteRole = async (id) => {
  const role = await Role.findById(id);
  if (!role) throw new Error("Role not found.");

  const protectedRoles = ["super_admin", "admin", "user"];
  if (protectedRoles.includes(role.name)) {
    throw new Error(
      `The '${role.name}' role is a system requirement and cannot be deleted.`,
    );
  }

  return await Role.findByIdAndDelete(id);
};
