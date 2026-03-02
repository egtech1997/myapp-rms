import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import Role from "../models/Role.js";
import dotenv from "dotenv";

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
        const email = profile.emails[0].value;

        let user = await User.findOne({ email }).populate("roles");

        if (user) {
          // Update existing user
          user.lastLogin = Date.now();
          if (!user.googleId) {
            user.googleId = profile.id;
            user.isVerified = true;
          }
          // CRITICAL: validateBeforeSave: false allows saving without a password
          await user.save({ validateBeforeSave: false });
          return done(null, user);
        }

        // Create new user
        const defaultRole = await Role.findOne({ name: "user" });

        // Note: .create() runs validation. If your model requires a password,
        // this will fail. We use new User() + .save() instead for more control.
        const newUser = new User({
          username: profile.displayName,
          email: email,
          googleId: profile.id,
          avatar: profile.photos[0]?.value,
          isVerified: true,
          roles: defaultRole ? [defaultRole._id] : [],
        });

        // Skip password validation for social login
        await newUser.save({ validateBeforeSave: false });

        const populatedUser = await User.findById(newUser._id).populate(
          "roles",
        );
        return done(null, populatedUser);
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
    done(null, user || false);
  } catch (error) {
    console.error("💥 Deserialize Error:", error);
    done(error, null);
  }
});

export default passport;
