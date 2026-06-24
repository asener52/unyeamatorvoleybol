import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// snake_case (Supabase) → camelCase (UI)
function normalize(row) {
  if (!row) return row
  return {
    ...row,
    imageUrl: row.image_url ?? row.imageUrl ?? '',
    createdAt: row.created_at ?? row.createdAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
  }
}

// camelCase (UI) → snake_case (Supabase)
function denormalize(data) {
  const r = { ...data }
  delete r.id
  delete r.createdAt
  delete r.updatedAt
  if ('imageUrl' in r) { r.image_url = r.imageUrl; delete r.imageUrl }
  return r
}

export function useCollection(tableName, orderField = 'created_at', limitCount = 50, ascending = false) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    const { data, error: err } = await supabase
      .from(tableName)
      .select('*')
      .order(orderField, { ascending })
      .limit(limitCount)

    if (err) { setError(err.message); setLoading(false); return }
    setDocs((data || []).map(normalize))
    setLoading(false)
  }, [tableName, orderField, limitCount, ascending])

  useEffect(() => {
    fetchData()

    const channelName = `${tableName}_all_${Math.random().toString(36).slice(2)}`
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, fetchData)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tableName, fetchData])

  return { docs, loading, error }
}

// Realtime YOK — kota tasarrufu için public sayfalarda kullan (tek seferlik fetch)
export function useStaticCollection(tableName, limitCount = 20, orderField = 'created_at', ascending = false) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    supabase
      .from(tableName)
      .select('*')
      .eq('published', true)
      .order(orderField, { ascending })
      .limit(limitCount)
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) console.error(`[Supabase] ${tableName}:`, err.message)
        setDocs((data || []).map(normalize))
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [tableName, limitCount, orderField, ascending])

  return { docs, loading }
}

export function usePublishedCollection(tableName, limitCount = 20, orderField = 'created_at', ascending = false) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const { data, error: err } = await supabase
      .from(tableName)
      .select('*')
      .eq('published', true)
      .order(orderField, { ascending })
      .limit(limitCount)

    if (err) {
      console.error(`[Supabase] ${tableName} sorgu hatası:`, err.message)
      setLoading(false)
      return
    }
    setDocs((data || []).map(normalize))
    setLoading(false)
  }, [tableName, limitCount, orderField, ascending])

  useEffect(() => {
    fetchData()

    const channelName = `${tableName}_published_${Math.random().toString(36).slice(2)}`
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, fetchData)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tableName, fetchData])

  return { docs, loading }
}

export async function addDocument(tableName, data) {
  const row = { ...denormalize(data), updated_at: new Date().toISOString() }
  const { error } = await supabase.from(tableName).insert([row])
  if (error) throw error
}

export async function updateDocument(tableName, id, data) {
  const row = { ...denormalize(data), updated_at: new Date().toISOString() }
  const { error } = await supabase.from(tableName).update(row).eq('id', id)
  if (error) throw error
}

export async function deleteDocument(tableName, id) {
  const { error } = await supabase.from(tableName).delete().eq('id', id)
  if (error) throw error
}
