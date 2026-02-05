import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function Logout() {
  const router = useRouter()

  useEffect(() => {
    const performLogout = async () => {
      try {
        console.log('Performing aggressive logout...')
        
        // 1. Clear Supabase auth
        await supabase.auth.signOut()

        // 2. Clear Local Storage
        window.localStorage.clear()
        
        // 3. Clear Session Storage
        window.sessionStorage.clear()

        // 4. Clear Cookies
        document.cookie.split(';').forEach((c) => {
          document.cookie = c
            .replace(/^ +/, '')
            .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
        })

        // 5. Clear IndexedDB (used by Supabase sometimes)
        if (window.indexedDB) {
          try {
            const dbs = await window.indexedDB.databases()
            dbs.forEach((db) => {
              if (db.name) window.indexedDB.deleteDatabase(db.name)
            })
          } catch (e) {
            console.error('Error clearing IndexedDB:', e)
          }
        }

        console.log('Logout cleanup complete')
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        // 6. Hard redirect to login page to clear any React state
        window.location.href = '/auth/login'
      }
    }

    performLogout()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium">Signing out...</p>
      </div>
    </div>
  )
}
