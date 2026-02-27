/**
 * Records the current time as the user's last login
 */
export const updateLoginTimestamp = async (user) => {
  user.lastLogin = Date.now();
  // validateBeforeSave: false is critical to avoid Mongoose validation
  // errors on fields not currently in memory (like password)
  await user.save({ validateBeforeSave: false });
};

/**
 * Strips sensitive data for frontend response
 */
export const formatUserResponse = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  roles: user.roles.map((r) => (typeof r === "object" ? r.name : r)),
  avatar: user.avatar,
  avatarUrl: user.avatarUrl,
  googleId: user.googleId,
  lastLogin: user.lastLogin,
});
