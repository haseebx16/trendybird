/**
 * CountryPicker — modal country selector.
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList, TextInput, StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius } from '../config/theme';

export default function CountryPicker({ countries, selected, onSelect }) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const selectedCountry = countries.find((c) => c.code === selected);
  const filtered = countries.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setVisible(true)}>
        <Feather name="globe" size={16} color={colors.primary} />
        <Text style={styles.triggerText}>
          {selectedCountry?.name || selected || 'Select Country'}
        </Text>
        <Feather name="chevron-down" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Select Country</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
              <Feather name="search" size={16} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search countries..."
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
            </View>

            {/* List */}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.item, item.code === selected && styles.itemSelected]}
                  onPress={() => {
                    onSelect(item.code);
                    setVisible(false);
                    setSearch('');
                  }}
                >
                  <Text style={styles.itemCode}>{item.code}</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.code === selected && (
                    <Feather name="check" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  triggerText: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '75%',
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: fontSizes.xl,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: fontSizes.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  itemSelected: {
    backgroundColor: `${colors.primary}10`,
  },
  itemCode: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    width: 40,
  },
  itemName: {
    color: colors.text,
    fontSize: fontSizes.md,
    flex: 1,
  },
});
