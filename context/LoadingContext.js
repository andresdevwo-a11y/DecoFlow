import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import LoadingScreen from '../components/LoadingScreen';
import { useData } from './DataContext';
import { COLORS } from '../constants/Theme';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
    const { isLoading: isDataLoading } = useData();
    const [isLayoutReady, setIsLayoutReady] = useState(false);
    const [isAppReady, setIsAppReady] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(1));
    const [showLoading, setShowLoading] = useState(true);

    useEffect(() => {
        let timeout;
        if (!isDataLoading && isLayoutReady) {
            // Safety buffer
            timeout = setTimeout(() => {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 500, // Smooth fade out
                    useNativeDriver: true,
                }).start(() => {
                    setShowLoading(false);
                    setIsAppReady(true);
                });
            }, 1500);
        }
        return () => clearTimeout(timeout);
    }, [isDataLoading, isLayoutReady]);

    return (
        <LoadingContext.Provider value={{ setIsLayoutReady }}>
            <View style={{ flex: 1 }}>
                {children}
                {showLoading && (
                    <Animated.View style={[
                        StyleSheet.absoluteFill,
                        { zIndex: 9999, opacity: fadeAnim, backgroundColor: COLORS.background } // Background color ensures coverage
                    ]} pointerEvents={isAppReady ? 'none' : 'auto'}>
                        <LoadingScreen />
                    </Animated.View>
                )}
            </View>
        </LoadingContext.Provider>
    );
};

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
};
