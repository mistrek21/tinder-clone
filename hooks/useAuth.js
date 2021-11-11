import React, { createContext, useContext, useEffect, useState } from 'react'
import * as Google from 'expo-google-app-auth'
import { GoogleAuthProvider, signInWithCredential, onAuthStateChanged, signOut } from '@firebase/auth'
import { auth } from '../firebase'

const AuthContext = createContext({})

const config = {
    androidClientId: '475945304366-lk0459v0d59190de0trtm1m0bopa70d9.apps.googleusercontent.com',
    iosClientId: '475945304366-ksgr0dcab9b7nnn9s660mb8k7l5ulgqf.apps.googleusercontent.com',
    scopes: ["profile", "email"],
    permissions: ["public_profile", "email", "gender", "location"]
}

export const AuthProvider = ({ children }) => {
    const [error, setError] = useState(null)
    const [user, setUser] = useState(null)
    const [loadingInitial, setLoadingInitial] = useState(true)
    const [loading, setLoading] = useState(false)

    useEffect(() =>
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // Logged in...
                setUser(user)
            } else {
                // Not logged in
                setUser(null)
            }

            setLoadingInitial(false)
        }),
        [])

    const signInWithGoogle = async () => {
        setLoading(true)

        await Google.logInAsync(config).then(async (logInResult) => {
            if (logInResult.type === 'success') {
                // login
                const { idToken, accessToken } = logInResult
                const credential = GoogleAuthProvider.credential(idToken, accessToken)

                await signInWithCredential(auth, credential)
            }
            return Promise.reject()
        }).catch(error => setError(error))
            .finally(() => setLoading(false))
    }

    const logout = () => {
        setLoading(true)

        signOut(auth)
            .catch((error) => setError(error))
            .finally(() => setLoading(false))
    }

    return (
        <AuthContext.Provider value={{
            user: user,
            loading,
            error,
            signInWithGoogle,
            logout,
        }}
        >
            {!loadingInitial && children}
        </AuthContext.Provider>
    )
}

export default function useAuth() {
    return useContext(AuthContext)
}