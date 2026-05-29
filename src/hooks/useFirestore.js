import { useState, useEffect } from 'react'
import {
  collection, query, orderBy, limit, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp, where, getDocs
} from 'firebase/firestore'
import { db } from '../firebase/config'

export function useCollection(collectionName, orderField = 'createdAt', limitCount = 50) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const q = query(
      collection(db, collectionName),
      orderBy(orderField, 'desc'),
      limit(limitCount)
    )

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        setDocs(data)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [collectionName, orderField, limitCount])

  return { docs, loading, error }
}

export function usePublishedCollection(collectionName, limitCount = 20) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Timeout: if Firebase doesn't respond in 4s, show empty (fallback to sample)
    const timeout = setTimeout(() => setLoading(false), 1500)

    const q = query(
      collection(db, collectionName),
      where('published', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        clearTimeout(timeout)
        setDocs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      () => {
        clearTimeout(timeout)
        setLoading(false)
      }
    )

    return () => { clearTimeout(timeout); unsubscribe() }
  }, [collectionName, limitCount])

  return { docs, loading }
}

export async function addDocument(collectionName, data) {
  return addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateDocument(collectionName, id, data) {
  return updateDoc(doc(db, collectionName, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteDocument(collectionName, id) {
  return deleteDoc(doc(db, collectionName, id))
}
