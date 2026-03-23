"use client";

import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { Entry } from "@/types";

const ALLOWED_EMAIL = "tianbian.agi@gmail.com";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth(), (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const isAuthorized = user?.email === ALLOWED_EMAIL;

  return { user, loading, isAuthorized };
}

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db(), "entries"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Entry));
      setEntries(items);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { entries, loading };
}

export function useEntry(id: string) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db(), "entries", id), (snap) => {
      if (snap.exists()) {
        setEntry({ id: snap.id, ...snap.data() } as Entry);
      }
      setLoading(false);
    });
    return unsub;
  }, [id]);

  const save = useCallback(
    async (data: { title?: string; content?: string; plainText?: string }) => {
      await updateDoc(doc(db(), "entries", id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    [id]
  );

  return { entry, loading, save };
}

export async function createEntry(userId: string): Promise<string> {
  const ref = doc(collection(db(), "entries"));
  await setDoc(ref, {
    title: "",
    content: "",
    plainText: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    userId,
  });
  return ref.id;
}

export async function deleteEntry(id: string): Promise<void> {
  await deleteDoc(doc(db(), "entries", id));
}
