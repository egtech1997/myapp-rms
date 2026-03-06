export const updateLoginTimestamp = async (user) => {
  user.lastLogin = Date.now();

  await user.save({ validateBeforeSave: false });
};

export const formatUserResponse = (user) => {
  let extractedPermissions = [];

  if (
    user.roles &&
    user.roles.length > 0 &&
    typeof user.roles[0] === "object"
  ) {
    const allPerms = user.roles.flatMap((role) => role.permissions || []);

    extractedPermissions = [...new Set(allPerms)];
  }

  return {
    id: user._id,
    username: user.username,
    email: user.email,
    roles: user.roles
      ? user.roles.map((r) => (typeof r === "object" ? r.name : r))
      : [],
    permissions: extractedPermissions,
    avatar: user.avatar,
    avatarUrl: user.avatarUrl,
    googleId: user.googleId,
    lastLogin: user.lastLogin,
  };
};
