import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import Role from "../models/Role.js";
import dotenv from "dotenv";
import { generateUniqueUsername } from "../utils/username.js";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      state: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value.toLowerCase();
        const targetRole = await Role.findOne({ name: "user" });

        let user = await User.findOne({ email }).populate("roles");

        if (user) {
          user.googleId = profile.id;
          user.isVerified = true;
          user.lastLogin = Date.now();
          if (!user.avatar) user.avatar = profile.photos[0]?.value;

          await user.save({ validateBeforeSave: false });

          const updatedUser = await User.findById(user._id).populate("roles");
          return done(null, updatedUser);
        }

        const username = await generateUniqueUsername(email);

        const newUser = new User({
          username,
          email: email,
          googleId: profile.id,
          avatar: profile.photos[0]?.value,
          isVerified: true,
          roles: targetRole ? [targetRole._id] : [],
        });

        await newUser.save({ validateBeforeSave: false });

        const populatedNewUser = await User.findById(newUser._id).populate(
          "roles",
        );
        return done(null, populatedNewUser);
      } catch (error) {
        console.error("💥 Google Strategy Error:", error);
        return done(error, null);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user._id || user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).populate("roles");
    if (!user) return done(null, false);
    done(null, user);
  } catch (error) {
    console.error("💥 Deserialize Error:", error);
    done(error, null);
  }
});

export default passport;
