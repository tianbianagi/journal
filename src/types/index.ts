import { Timestamp } from "firebase/firestore";

export interface Entry {
  id: string;
  title: string;
  content: string;
  plainText: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId: string;
}
