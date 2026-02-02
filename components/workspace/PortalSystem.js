import React, { createContext, useContext, useEffect, useId, useRef, useState, useCallback, useMemo } from 'react';
import { View } from 'react-native';

const PortalContext = createContext(null);

/**
 * Provider that manages portals. Wrap your Screen/Root with this.
 * Refactored to use a subscription model to avoid global re-renders.
 */
export const PortalProvider = ({ children }) => {
    // Stores subscribers (PortalHosts): { [hostName]: Set<callback> }
    const subscribers = useRef(new Map());
    // Stores content: { [hostName]: Map<id, content> }
    const contentMap = useRef(new Map());

    const subscribe = useCallback((hostName, callback) => {
        if (!subscribers.current.has(hostName)) {
            subscribers.current.set(hostName, new Set());
        }
        subscribers.current.get(hostName).add(callback);

        // Send initial content immediately upon subscription
        const currentContent = Array.from(contentMap.current.get(hostName)?.values() || []);
        callback(currentContent);

        return () => {
            const subs = subscribers.current.get(hostName);
            if (subs) {
                subs.delete(callback);
                // We keep the Set even if empty to avoid constant Map operations, or clean it up.
                if (subs.size === 0) {
                    subscribers.current.delete(hostName);
                }
            }
        };
    }, []);

    const notifySubscribers = useCallback((hostName) => {
        const subs = subscribers.current.get(hostName);
        if (subs) {
            const currentContent = Array.from(contentMap.current.get(hostName)?.values() || []);
            subs.forEach(cb => cb(currentContent));
        }
    }, []);

    // We combine add/update into one operation since our map handles "upsert" naturally
    const updatePortal = useCallback((hostName, id, content) => {
        if (!contentMap.current.has(hostName)) {
            contentMap.current.set(hostName, new Map());
        }

        contentMap.current.get(hostName).set(id, { id, content });
        notifySubscribers(hostName);
    }, [notifySubscribers]);

    const removePortal = useCallback((hostName, id) => {
        if (contentMap.current.has(hostName)) {
            const hostContent = contentMap.current.get(hostName);
            if (hostContent.has(id)) {
                hostContent.delete(id);
                notifySubscribers(hostName);
            }
        }
    }, [notifySubscribers]);

    const value = useMemo(() => ({
        subscribe,
        updatePortal,
        removePortal
    }), [subscribe, updatePortal, removePortal]);

    return (
        <PortalContext.Provider value={value}>
            {children}
        </PortalContext.Provider>
    );
};

/**
 * Destination for Portals.
 */
export const PortalHost = ({ name, style, pointerEvents }) => {
    const { subscribe } = useContext(PortalContext);
    const [content, setContent] = useState([]);

    useEffect(() => {
        // Subscribe returns the unsubscribe function
        return subscribe(name, (newContent) => {
            setContent(newContent);
        });
    }, [name, subscribe]);

    return (
        <View style={style} pointerEvents={pointerEvents}>
            {content.map(item => (
                <React.Fragment key={item.id}>
                    {item.content}
                </React.Fragment>
            ))}
        </View>
    );
};

/**
 * Source. Renders listeners into Host 'hostName'.
 */
export const Portal = ({ hostName, children }) => {
    const { updatePortal, removePortal } = useContext(PortalContext);
    const id = useId();

    // Handle updates
    useEffect(() => {
        updatePortal(hostName, id, children);
    }, [hostName, id, children, updatePortal]);

    // Handle unmount cleanup
    useEffect(() => {
        return () => removePortal(hostName, id);
    }, [hostName, id, removePortal]);

    return null;
};
