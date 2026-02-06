import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    TouchableWithoutFeedback,
    Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, RADIUS, TYPOGRAPHY, SIZES } from '../../constants/Theme';

const FAB_SIZE = 56;
const ITEM_SIZE = 48;
const SUB_ITEM_SIZE = 44;

const FinanceFAB = ({
    onCreateSale,
    onCreateRental,
    onCreateDecoration,
    onCreateExpense,
    onCreateQuotation
}) => {
    const insets = useSafeAreaInsets();
    const [isOpen, setIsOpen] = useState(false);
    const [activeSubMenu, setActiveSubMenu] = useState(null); // 'income' | null

    // Animations
    const animation = useRef(new Animated.Value(0)).current;
    const subMenuAnimation = useRef(new Animated.Value(0)).current;

    const toggleOpen = () => {
        const toValue = isOpen ? 0 : 1;

        if (isOpen) {
            // Close submenu first if open
            if (activeSubMenu) {
                closeSubMenu(() => {
                    Animated.spring(animation, {
                        toValue,
                        useNativeDriver: true,
                        friction: 5
                    }).start();
                    setIsOpen(false);
                });
                return;
            }
        }

        Animated.spring(animation, {
            toValue,
            useNativeDriver: true,
            friction: 5
        }).start();

        setIsOpen(!isOpen);
    };

    const toggleSubMenu = (menu) => {
        if (activeSubMenu === menu) {
            closeSubMenu();
        } else {
            setActiveSubMenu(menu);
            Animated.spring(subMenuAnimation, {
                toValue: 1,
                useNativeDriver: true,
                friction: 6
            }).start();
        }
    };

    const closeSubMenu = (callback) => {
        Animated.timing(subMenuAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
        }).start(() => {
            setActiveSubMenu(null);
            if (callback) callback();
        });
    };

    const handleBackdropPress = () => {
        if (activeSubMenu) {
            closeSubMenu();
        } else {
            toggleOpen();
        }
    };

    const rotation = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg']
    });

    const backdropOpacity = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.4]
    });

    // Helper to render main menu items
    const renderMenuItem = (icon, label, color, index, onPress, hasSubMenu = false) => {
        const translateY = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -70 * (index + 1)]
        });

        const opacity = animation;

        // If submenu is open, hide other main items
        const subMenuOpenOpacity = subMenuAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [1, activeSubMenu && hasSubMenu ? 1 : 0]
        });

        // Scale animation to hide shadow when closed/hidden
        const scale = Animated.multiply(
            animation.interpolate({
                inputRange: [0, 0.1, 1], // Quickly scale up
                outputRange: [0, 1, 1]
            }),
            subMenuAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [1, activeSubMenu && hasSubMenu ? 1 : 0.01] // Scale to 0 if hidden by subMenu (0.01 to keep active one visible if needed, but here we want non-active to disappear)
            })
        );

        // Specific scale logic:
        // 1. Base scale comes from main opening animation (0 -> 1)
        // 2. If subMenu is opening:
        //    - If this item is the activeSubMenu host, it stays (scale 1)
        //    - If this item is NOT the activeSubMenu host, it disappears (scale -> 0)

        const mainScale = animation.interpolate({
            inputRange: [0, 0.1, 1],
            outputRange: [0, 1, 1]
        });

        const subMenuScale = subMenuAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [1, activeSubMenu && hasSubMenu ? 1 : 0]
        });

        const finalScale = Animated.multiply(mainScale, subMenuScale);

        // Determine visibility for pointer events
        const isVisible = !activeSubMenu || (activeSubMenu && hasSubMenu);

        return (
            <Animated.View
                style={[
                    styles.menuItemContainer,
                    {
                        opacity: Animated.multiply(opacity, subMenuOpenOpacity),
                        opacity: Animated.multiply(opacity, subMenuOpenOpacity),
                        transform: [{ translateY }, { scale: finalScale }],
                        zIndex: isOpen ? 1 : -1,
                    }
                ]}
                pointerEvents={isOpen && isVisible ? 'box-none' : 'none'}
            >
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                    onPress={onPress}
                    activeOpacity={0.8}
                >
                    <View style={styles.labelContainer}>
                        <Text style={styles.label}>{label}</Text>
                    </View>
                    <View style={[styles.menuItem, { backgroundColor: color }]}>
                        <Feather name={icon} size={20} color="#FFF" />
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    // Helper to render sub-menu items (Venta, Alquiler, Decoración)
    const renderSubMenuItem = (icon, label, color, index, onPress) => {
        // Calculate position relative to the "Ingresos" button
        // Ingresos is at index 0, approximately -70px up
        // Subitems should fan out or stack above it

        const translateY = subMenuAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -55 * (index + 1)]
        });

        const opacity = subMenuAnimation;

        const scale = subMenuAnimation.interpolate({
            inputRange: [0, 0.1, 1],
            outputRange: [0, 1, 1]
        });

        return (
            <Animated.View
                style={[
                    styles.subMenuItemContainer,
                    {
                        opacity,
                        opacity,
                        transform: [{ translateY }, { scale }],
                        bottom: 70 + 20, // Base position above main FAB + Ingresos offset
                    }
                ]}
                pointerEvents="box-none"
            >
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => {
                        handleBackdropPress(); // Close everything
                        onPress();
                    }}
                    activeOpacity={0.8}
                >
                    <View style={styles.labelContainer}>
                        <Text style={styles.subLabel}>{label}</Text>
                    </View>
                    <View style={[styles.subMenuItem, { backgroundColor: color }]}>
                        <Feather name={icon} size={18} color="#FFF" />
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    // Calculate FAB position ensuring it's above BottomNavBar
    // Calculate FAB position ensuring it's above BottomNavBar
    const bottomPosition = SPACING.xl;

    return (
        <>
            {/* Backdrop */}
            <TouchableWithoutFeedback onPress={handleBackdropPress}>
                <Animated.View
                    style={[
                        styles.backdrop,
                        {
                            opacity: backdropOpacity,
                            zIndex: isOpen ? 90 : -1,
                        }
                    ]}
                    pointerEvents={isOpen ? 'auto' : 'none'}
                />
            </TouchableWithoutFeedback>

            <View style={[styles.container, { bottom: bottomPosition }]} pointerEvents="box-none">

                {/* Sub Menu Items (Ingresos children) */}
                {activeSubMenu === 'income' && (
                    <>
                        {renderSubMenuItem("shopping-cart", "Venta", "#22C55E", 0, onCreateSale)}
                        {renderSubMenuItem("package", "Alquiler", "#3B82F6", 1, onCreateRental)}
                        {renderSubMenuItem("gift", "Decoración", "#F97316", 2, onCreateDecoration)}
                    </>
                )}

                {/* Main Menu Items */}
                {renderMenuItem("file-text", "Cotización", "#8B5CF6", 2, () => {
                    toggleOpen();
                    onCreateQuotation();
                })}

                {renderMenuItem("minus-circle", "Gasto", "#EF4444", 1, () => {
                    toggleOpen();
                    onCreateExpense();
                })}

                {renderMenuItem("arrow-up-circle", "Ingresos", "#10B981", 0, () => toggleSubMenu('income'), true)}

                {/* Main FAB */}
                <TouchableOpacity
                    style={[styles.fab]}
                    onPress={toggleOpen}
                    activeOpacity={0.9}
                >
                    <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                        <Feather name="plus" size={28} color="#FFF" />
                    </Animated.View>
                </TouchableOpacity>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
    },
    container: {
        position: 'absolute',
        right: SPACING.lg,
        // Increase dimensions to cover the expanded menu area for Android touch handling
        height: 500,
        width: 300,
        alignItems: 'flex-end', // Align FAB to right
        justifyContent: 'flex-end', // Align FAB to bottom
        zIndex: 100,
    },
    fab: {
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: FAB_SIZE / 2,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.fab,
        zIndex: 10,
    },
    menuItemContainer: {
        position: 'absolute',
        right: 4, // Center with FAB (56 - 48)/2 = 4
        bottom: 4, // Center vertically with FAB (56-48)/2 = 4 (Base position)
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        width: 200, // Make wide enough for labels
        paddingRight: 0,
    },
    menuItem: {
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        borderRadius: ITEM_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    labelContainer: {
        marginRight: SPACING.md,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: SPACING.md,
        paddingVertical: 6,
        borderRadius: RADIUS.md,
        ...SHADOWS.small,
    },
    label: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.text,
    },
    // Sub Menu Styles
    subMenuItemContainer: {
        position: 'absolute',
        right: 6, // Center with FAB (56 - 44)/2 = 6
        // Adjusted bottom to be relative to the container bottom (which ends at FAB)
        bottom: 74, // FAB (56) + Gap (approx 18) = 74. Original was 90?? Let's stick roughly to original relative logic but cemented.
        // Original used `bottom: 70 + 20` = 90.
        // If we anchor from bottom of container (where FAB is).
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        width: 200,
        zIndex: 5,
    },
    subMenuItem: {
        width: SUB_ITEM_SIZE,
        height: SUB_ITEM_SIZE,
        borderRadius: SUB_ITEM_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    subLabel: {
        fontSize: TYPOGRAPHY.size.xs,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.text,
    }
});

export default FinanceFAB;
