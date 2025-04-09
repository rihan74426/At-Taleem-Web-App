import admin from "firebase-admin";

import serviceAccount from "../taleembd-d570e-firebase-adminsdk-fbsvc-cbca64adc2.json";
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "taleembd-d570e.firebasestorage.app",
  });
}
export default admin;
