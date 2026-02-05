import { useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Logout() {
  useEffect(() => {
    const performLogout = async () => {
      try {
        console.log('Performing aggressive logout...')
        
        // 1. Broadcast logout to other tabs FIRST (before clearing storage)
        try {
          const bc = new BroadcastChannel('squareft_auth')
          bc.postMessage({ type: 'LOGOUT' })
          bc.close()
        } catch (e) {
          console.log('BroadcastChannel not supported')
        }
        
        // 2. Clear Supabase auth with global scope (logs out all tabs)
        await supabase.auth.signOut({ scope: 'global' })

        // 3. Clear the logout flag first, then clear all localStorage
        // (clearing localStorage triggers storage events in other tabs)
        window.localStorage.removeItem('squareft_logging_out')
        window.localStorage.clear()
        
        // 4. Clear Session Storage
        window.sessionStorage.clear()

        // 5. Clear Cookies
        document.cookie.split(';').forEach((c) => {
          document.cookie = c
            .replace(/^ +/, '')
            .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
        })

        // 6. Clear IndexedDB (used by Supabase sometimes)
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
        // 7. Hard redirect to login page to clear any React state
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
