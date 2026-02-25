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

        // 1. Find user by email
        let user = await User.findOne({ email }).populate("role");

        if (user) {
          // Link Google ID if it's the first time this manual user uses Google Login
          if (!user.googleId) {
            user.googleId = profile.id;
            user.isVerified = true;
            await user.save();
          }
          return done(null, user);
        }

        // 2. If new user, get default role
        const defaultRole = await Role.findOne({ name: "user" });

        // 3. Create user
        const newUser = await User.create({
          username: profile.displayName,
          email: email,
          googleId: profile.id,
          avatar: profile.photos[0]?.value,
          isVerified: true,
          role: defaultRole ? defaultRole._id : null,
        });

        // 4. Ensure role is populated before finishing
        const populatedUser = await User.findById(newUser._id).populate("role");

        return done(null, populatedUser);
      } catch (error) {
        console.error("💥 Google Strategy Error:", error);
        return done(error, null); // Passes error to Passport's internal handler
      }
    },
  ),
);

// Stores the user ID in the session
passport.serializeUser((user, done) => {
  done(null, user._id || user.id);
});

// Retrieves the full user from the DB based on the ID in the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).populate("role");
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    console.error("💥 Deserialize Error:", error);
    done(error, null);
  }
});

export default passport;
