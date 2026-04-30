// src/modules/user/user.route.js
import {
  userLogin,
  getUserProfileData,
  updateUserProfileData,
} from "./user.controller.js";

export default async function userRoutes(app) {
  app.post("/user_login", userLogin);
  app.post("/get_user_profile_data", getUserProfileData);
  app.post("/update_user_profile_data", updateUserProfileData);
}
