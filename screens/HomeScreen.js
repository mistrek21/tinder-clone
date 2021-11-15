import { useFocusEffect, useNavigation } from '@react-navigation/native'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { View, Text, Button, SafeAreaView, TouchableOpacity, Image, StyleSheet } from 'react-native'
import useAuth from '../hooks/useAuth'
import tw from 'tailwind-rn'
import { AntDesign, Entypo, Ionicons } from '@expo/vector-icons'
import Swiper from 'react-native-deck-swiper'
import { onSnapshot, doc, collection, setDoc, query, where, getDocs, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import generateId from '../lib/generateId'

const HomeScreen = () => {
    const navigation = useNavigation()
    const { logout, user } = useAuth()
    const swipeRef = useRef(null)

    const [profiles, setProfiles] = useState([])

    useLayoutEffect(() => {
        const unsub = onSnapshot(doc(db, 'users', user.uid), snapshot => {

            if (!snapshot.exists()) {
                navigation.navigate("Modal")
            }

            return unsub()
        })

    }, [])

    useEffect(() => {
        let unsub

        const fetchCards = async () => {
            const passes = await getDocs(collection(db, 'users', user.uid, 'passes'))
                .then(snapshot => snapshot.docs.map(doc => doc.id))

            const swipes = await getDocs(collection(db, 'users', user.uid, 'swipes'))
                .then(snapshot => snapshot.docs.map(doc => doc.id))

            const passedUserIds = passes.length > 0 ? passes : ['test']
            const swipedUserIds = swipes.length > 0 ? swipes : ['test']

            unsub = onSnapshot(query(collection(db, 'users'), where('id', 'not-in', [...passedUserIds, ...swipedUserIds]))
                , snapshot => {
                    setProfiles(snapshot.docs.filter(doc => doc.id !== user.uid).map(doc => ({
                        id: doc.id,
                        ...doc.data()

                    }))
                    )
                })
        }

        fetchCards()
        return unsub
    }, [db])

    const swipeRight = async (cardIndex) => {
        if (!profiles[cardIndex]) return

        const userSwiped = profiles[cardIndex]
        const loggedInProfile = await(
            await getDoc(doc(db, 'users', user.uid))
        ).data()

        // Check if the user swipped on you!
        getDoc(doc(db, 'users', userSwiped.id, 'swipes', user.uid))
            .then((documentSnapshot) => {
                if (documentSnapshot.exists()) {
                    // user has matched with you before you match with them...
                    // Create a MATCH!
                    console.log(`You MATCHED!! on ${userSwiped.displayName}`)

                    setDoc(doc(db, 'users', user.uid, 'swipes', userSwiped.id), userSwiped)

                    // Create a match!
                    setDoc(doc(db, 'matches', generateId(user.uid, userSwiped.id)), {
                        users: {
                            [user.uid]: loggedInProfile,
                            [userSwiped.id]: userSwiped
                        },
                        userMatched: [user.uid, userSwiped.id],
                        timestamp: serverTimestamp()
                    })

                    navigation.navigate("Match", {
                        loggedInProfile,
                        userSwiped,
                    })
                } else {
                    // user has swiped as 1st interaction between the two or didnt get swiped on... 
                    console.log(`You swipped on ${userSwiped.displayName}`)

                    setDoc(doc(db, 'users', user.uid, 'swipes', userSwiped.id), userSwiped)
                }
            })

    }

    const swipeLeft = (cardIndex) => {
        if (!profiles[cardIndex]) return

        const userSwiped = profiles[cardIndex]
        console.log(`You swipped Liked on ${userSwiped.displayName}`)

        setDoc(doc(db, 'users', user.uid, 'passes', userSwiped.id), userSwiped)
    }

    return (
        <SafeAreaView style={tw('flex-1')}>
            {/* Header */}
            <View style={tw('flex-row items-center justify-between px-5')}>
                <TouchableOpacity onPress={logout}>
                    <Image
                        source={{ uri: user.photoURL }}
                        style={tw('h-10 w-10 rounded-full')}
                    />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate("Modal")}>
                    <Image
                        source={require('../assets/logo.png')}
                        style={tw('h-12 w-12')}
                    />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate("Chat")}>
                    <Ionicons name="chatbubbles-sharp" size={30} color="#FF5864" />
                </TouchableOpacity>
            </View>

            {/* End of the Headers */}

            {/* Cards */}
            <View style={tw('flex-1 -mt-6')}>
                <Swiper
                    ref={swipeRef}
                    containerStyle={{ backgroundColor: "transparent" }}
                    cards={profiles}
                    stackSize={5}
                    cardIndex={0}
                    animateCardOpacity
                    verticalSwipe={false}
                    onSwipedLeft={(cardIndex) => {
                        console.log("Swipe PASS")
                        swipeLeft(cardIndex)
                    }}
                    onSwipedRight={(cardIndex) => {
                        console.log("Swipe MATCH")
                        swipeRight(cardIndex)
                    }}
                    backgroundColor={"#e9e9e9"}
                    overlayLabels={{
                        left: {
                            title: "NOPE",
                            style: {
                                label: {
                                    textAlign: "right",
                                    color: "red"
                                }
                            }
                        },
                        right: {
                            title: "MATCH",
                            style: {
                                label: {
                                    color: "#4DED30"
                                }
                            }
                        }
                    }}
                    renderCard={(card) => card ? (
                        <View
                            key={card.id}
                            style={tw('bg-white h-3/4 rounded-xl')}
                        >
                            <Image
                                style={tw('absolute top-0 h-full w-full rounded-xl')}
                                source={{ uri: card.photoURL }}
                            />

                            <View
                                style={[
                                    tw('absolute bottom-0 bg-white flex-row justify-between items-between w-full h-20 px-6 py-2 rounded-b-xl')
                                ],
                                    styles.cardShadow
                                }>
                                <View>
                                    <Text style={tw('text-xl font-bold')}>
                                        {card.firstName} {card.lastName}
                                    </Text>
                                    <Text style={tw('text-2xl font-bold')}>{card.job}</Text>
                                </View>
                                <Text>{card.age}</Text>
                            </View>
                        </View>
                    ) : (
                        <View
                            style={[tw('relative bg-white h-3/4 rounded-xl justify-center items-center'
                            ),
                            styles.cardShadow,
                            ]}
                        >
                            <Text style={tw('font-bold pb-5')}>No more profiles</Text>

                            <Image
                                style={tw('h-20 w-full')}
                                height={100}
                                width={100}
                                source={{ uri: 'https://links.papareact.com/6gb' }}
                            />
                        </View>
                    )
                    }
                />
            </View>

            <View style={tw('flex flex-row justify-evenly')}>
                <TouchableOpacity style={tw('items-center justify-center rounded-full w-16 h-16 bg-red-200')}
                    onPress={() => swipeRef.current.swipeLeft()}
                >
                    <Entypo
                        name="cross"
                        size={24}
                        color="red"
                    />
                </TouchableOpacity >

                <TouchableOpacity style={tw('items-center justify-center rounded-full w-16 h-16 bg-green-200')}
                    onPress={() => swipeRef.current.swipeRight()}
                >
                    <Entypo
                        name="cross"
                        size={24}
                        color="green"
                    />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

export default HomeScreen

const styles = StyleSheet.create({
    cardShadow: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,

        elevation: 2,

    }
})