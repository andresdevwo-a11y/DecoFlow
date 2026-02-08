import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import Theme from '../constants/Theme';
import Text from '../components/common/Text';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import ScreenHeader from '../components/common/ScreenHeader';
import { Feather } from '@expo/vector-icons';

const ComponentShowcase = () => {
    return (
        <View style={styles.container}>
            <ScreenHeader title="Design System" subtitle="Component Showcase" />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* TYPOGRAPHY SECTION */}
                <View style={styles.section}>
                    <Text preset="h2" style={styles.sectionTitle}>Typography</Text>
                    <Card>
                        <Text preset="h1">Heading 1</Text>
                        <Text preset="h2">Heading 2</Text>
                        <Text preset="h3">Heading 3</Text>
                        <Text preset="h4">Heading 4</Text>
                        <Text preset="bodyLarge">Body Large - The quick brown fox jumps over the lazy dog.</Text>
                        <Text preset="bodyMedium">Body Medium - The quick brown fox jumps over the lazy dog.</Text>
                        <Text preset="bodySmall">Body Small - The quick brown fox jumps over the lazy dog.</Text>
                        <Text preset="label">Label Text</Text>
                        <Text preset="caption">Caption Text</Text>
                    </Card>
                </View>

                {/* BUTTONS SECTION */}
                <View style={styles.section}>
                    <Text preset="h2" style={styles.sectionTitle}>Buttons</Text>
                    <Card>
                        <View style={styles.row}>
                            <Button text="Primary" variant="primary" />
                        </View>
                        <View style={styles.row}>
                            <Button text="Secondary" variant="secondary" />
                        </View>
                        <View style={styles.row}>
                            <Button text="Outline" variant="outline" />
                        </View>
                        <View style={styles.row}>
                            <Button text="Ghost" variant="ghost" />
                        </View>
                        <View style={styles.row}>
                            <Button text="Danger" variant="danger" />
                        </View>
                        <View style={styles.row}>
                            <Button text="Loading" loading />
                        </View>
                        <View style={styles.row}>
                            <Button text="Disabled" disabled />
                        </View>
                        <View style={styles.row}>
                            <Button text="Small" size="sm" />
                            <View style={{ width: 10 }} />
                            <Button text="Large" size="lg" />
                        </View>
                        <View style={styles.row}>
                            <Button
                                text="With Icon"
                                icon={<Feather name="settings" size={18} color="white" />}
                            />
                        </View>
                    </Card>
                </View>

                {/* INPUTS SECTION */}
                <View style={styles.section}>
                    <Text preset="h2" style={styles.sectionTitle}>Inputs</Text>
                    <Card>
                        <Input label="Default Input" placeholder="Type here..." />
                        <Input label="With Icon" placeholder="Search..." leftIcon={<Feather name="search" size={20} color={Theme.COLORS.textTertiary} />} />
                        <Input label="Error State" placeholder="Invalid input" error="This field is required" />
                        <Input label="Disabled" placeholder="Cannot type" disabled />
                        <Input label="Multiline" placeholder="Type a long message..." multiline numberOfLines={4} />
                    </Card>
                </View>

                {/* CARDS SECTION */}
                <View style={styles.section}>
                    <Text preset="h2" style={styles.sectionTitle}>Cards</Text>
                    <Card style={{ marginBottom: 10 }}>
                        <Text>Default Card</Text>
                    </Card>
                    <Card variant="elevated" style={{ marginBottom: 10 }}>
                        <Text>Elevated Card</Text>
                    </Card>
                    <Card variant="outlined" style={{ marginBottom: 10 }}>
                        <Text>Outlined Card</Text>
                    </Card>
                </View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.COLORS.background,
    },
    scrollContent: {
        padding: Theme.SPACING.lg,
        paddingBottom: 100,
    },
    section: {
        marginBottom: Theme.SPACING['3xl'],
    },
    sectionTitle: {
        marginBottom: Theme.SPACING.md,
        marginLeft: Theme.SPACING.xs,
    },
    row: {
        marginBottom: Theme.SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
    }
});

export default ComponentShowcase;
