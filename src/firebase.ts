import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDpv4sg_IhgAXOQgqwgHHmQed9ySzKXr-8",
  authDomain: "nyankogame-78531.firebaseapp.com",
  projectId: "nyankogame-78531",
  storageBucket: "nyankogame-78531.firebasestorage.app",
  messagingSenderId: "201166812839",
  appId: "1:201166812839:web:47b4f8c086e1c4206b4d82",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export interface ScoreEntry {
  id: string;
  nickname: string;
  score: number;
  screenshotUrl: string;
  timestamp: Date;
}

function compressScreenshot(blob: Blob): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 360;
      canvas.height = 640;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, 360, 640);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (jpegBlob) => resolve(jpegBlob ?? blob),
        'image/jpeg',
        0.7,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(blob);
    };
    img.src = url;
  });
}

export async function submitScore(nickname: string, score: number, screenshotBlob: Blob): Promise<void> {
  const compressed = await compressScreenshot(screenshotBlob);

  const docId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const storageRef = ref(storage, `screenshots/${docId}.jpg`);

  await uploadBytes(storageRef, compressed, { contentType: 'image/jpeg' });
  const screenshotUrl = await getDownloadURL(storageRef);

  await addDoc(collection(db, 'scores'), {
    nickname: nickname.trim().slice(0, 12),
    score,
    screenshotUrl,
    timestamp: serverTimestamp(),
  });
}

export async function fetchTopScores(count: number): Promise<ScoreEntry[]> {
  const q = query(
    collection(db, 'scores'),
    orderBy('score', 'desc'),
    limit(count),
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      nickname: data.nickname as string,
      score: data.score as number,
      screenshotUrl: data.screenshotUrl as string,
      timestamp: data.timestamp?.toDate?.() ?? new Date(),
    };
  });
}
