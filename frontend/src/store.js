import { configureStore } from "@reduxjs/toolkit"

import applicationReducer from "./features/applicationSlice"
import createGrantAppReducer from "./features/createGrantAppSlice"
import careateLeaderAppReducer from "./features/createLeaderAppSlice"
import grantAppCheckReducer from "./features/grantAppCheckSlice"
import leaderAppReducer from "./features/leaderAppSlice"
import notificationReducer from "./features/notificationSlice"
import profileDataReducer from "./features/profileSlice"
import servicesReducer from "./features/servicesSlice"
import studentApplicationReducer from "./features/studentAppSlice"
import toggleReducer from "./features/toggleSlice"
export const store = configureStore({
  reducer: {
    notification: notificationReducer,
    toglle: toggleReducer,
    profileData: profileDataReducer,
    applications: applicationReducer,
    leaderApp: leaderAppReducer,
    createLeaderApp: careateLeaderAppReducer,
    studentApplication: studentApplicationReducer,
    grantAppCheck: grantAppCheckReducer,
    createGrantApp: createGrantAppReducer,
    services: servicesReducer,
  },
})
