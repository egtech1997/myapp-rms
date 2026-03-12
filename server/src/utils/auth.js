import jwt from "jsonwebtoken";

export const sendTokenCookie = (res, user) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  const cookieOptions = {
    httpOnly: true,
    // MUST be false for http://192.168.1.173 development
    secure: process.env.NODE_ENV === "production",
    // Lax is standard for development; None requires HTTPS/Secure:true
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  res.cookie("token", token, cookieOptions);
  return token;
};
