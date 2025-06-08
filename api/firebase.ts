import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID, // obrigatório para Analytics
};

// Inicializa o app
const app = initializeApp(firebaseConfig);

// firebase.ts
let analyticsInstance: ReturnType<typeof getAnalytics> | null = null;

export const getAnalyticsIfSupported = async () => {
  if (analyticsInstance) return analyticsInstance;

  const supported = await isSupported();
  if (supported) {
    analyticsInstance = getAnalytics(app);
    return analyticsInstance;
  }

  return null;
};
