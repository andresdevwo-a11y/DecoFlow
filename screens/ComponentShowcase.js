import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import Theme from '../constants/Theme';
import Text from '../components/common/Text';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import ScreenHeader from '../components/common/ScreenHeader';
import ListItem from '../components/common/ListItem';
import Badge from '../components/common/Badge';
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

                {/* LIST ITEMS SECTION */}
                <View style={styles.section}>
                    <Text preset="h2" style={styles.sectionTitle}>List Items</Text>
                    <Card padding="none">
                        <ListItem
                            title="Simple Item"
                            showChevron
                        />
                        <ListItem
                            title="With Subtitle"
                            subtitle="Description goes here"
                            showChevron
                        />
                        <ListItem
                            title="With Icon"
                            subtitle="And subtitle"
                            leftIcon={<Feather name="box" size={20} color={Theme.COLORS.primary} />}
                            showChevron
                        />
                        <ListItem
                            title="With Right Element"
                            leftIcon={<Feather name="bell" size={20} color={Theme.COLORS.warning} />}
                            rightElement={<Badge text="New" variant="error" size="sm" />}
                        />
                    </Card>
                    <View style={{ height: 20 }} />
                    <ListItem
                        variant="card"
                        title="Card Variant"
                        subtitle="This is a list item inside its own card"
                        leftIcon={<Feather name="credit-card" size={20} color={Theme.COLORS.success} />}
                        showChevron
                    />
                </View>

                {/* BADGES SECTION */}
                <View style={styles.section}>
                    <Text preset="h2" style={styles.sectionTitle}>Badges</Text>
                    <Card>
                        <View style={[styles.row, { justifyContent: 'space-between' }]}>
                            <Badge text="Neutral" variant="neutral" />
                            <Badge text="Primary" variant="primary" />
                            <Badge text="Success" variant="success" />
                            <Badge text="Warning" variant="warning" />
                            <Badge text="Error" variant="error" />
                            <Badge text="Info" variant="info" />
                        </View>
                        <View style={[styles.row, { justifyContent: 'flex-start' }]}>
                            <Badge text="Small" size="sm" variant="success" />
                            <View style={{ width: 10 }} />
                            <Badge text="Medium" size="md" variant="primary" />
                        </View>
                    </Card>
                </View>

                {/* EMPTY STATE PREVIEW */}
                <View style={styles.section}>
                    <Text preset="h2" style={styles.sectionTitle}>Empty State</Text>
                    <Card>
                        <View style={{ height: 300 }}>
                            {/* Importing EmptyState dynamically or assuming it's available would be better, 
                                but for this showcase we might need to add import. 
                                For now, I'll skip rendering it directly to avoid import errors if not added at top.
                                Instead, just showing a placeholder text. */}
                            <Text centered>Empty State Component (See separate test)</Text>
                        </View>
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
