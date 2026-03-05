export const updateLoginTimestamp = async (user) => {
  user.lastLogin = Date.now();

  await user.save({ validateBeforeSave: false });
};

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
