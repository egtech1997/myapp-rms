import User from "../models/User.js";

/**
 * Generates a unique username from an email address.
 * Takes the part before @ and checks for uniqueness in the database.
 * If not unique, appends random numbers until it is.
 * @param {string} email 
 * @returns {Promise<string>}
 */
export const generateUniqueUsername = async (email) => {
  const baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
  
  let username = baseUsername;
  let exists = await User.findOne({ username });
  
  let counter = 1;
  while (exists) {
    // Append a small random number or a counter
    const suffix = Math.floor(100 + Math.random() * 900);
    username = `${baseUsername}${suffix}`;
    exists = await User.findOne({ username });
    
    // Safety break after 10 attempts (extremely unlikely to happen)
    if (counter > 10) {
      username = `${baseUsername}${Date.now().toString().slice(-4)}`;
      break;
    }
    counter++;
  }
  
  return username;
};
