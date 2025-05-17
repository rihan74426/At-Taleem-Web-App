import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: "service_account",
      project_id: "taleembd-d570e",
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      client_email:
        "firebase-adminsdk-fbsvc@taleembd-d570e.iam.gserviceaccount.com",
      client_id: "108758773224460163037",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url:
        "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40taleembd-d570e.iam.gserviceaccount.com",
      universe_domain: "googleapis.com",
    }),
    storageBucket: "taleembd-d570e.firebasestorage.app",
  });
}
export default admin;
